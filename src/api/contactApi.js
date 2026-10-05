import axiosClient from "./axiosClient";

// Spring Pageable-style query params.
// sort is comma-joined "field,direction" (e.g. "createdAt,desc"). Repeatable.
function buildListParams({
    page = 0,
    size = 50,
    sort = "createdAt,desc",
    search = "",
    createdAfter = null,
    section = ""
} = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (Array.isArray(sort)) {
        sort.forEach((entry) => params.append("sort", entry));
    } else if (sort) {
        params.set("sort", sort);
    }
    if (search) params.set("search", search.trim());
    if (createdAfter) params.set("createdAfter", createdAfter);
    if (section) params.set("section", section);
    return params;
}

export function listContacts(params = {}) {
    const qs = buildListParams(params);
    return axiosClient.get(`/contacts?${qs.toString()}`);
}

// Normalize a Spring Pageable response into a uniform shape. Accepts:
//   { content, totalElements, totalPages, number, size, last }   (Spring)
//   { items, totalCount, page, hasMore }                       (custom)
//   [ ...items ]                                                 (plain array)
//   { data: <any of the above> }                                 (ApiResponse wrapper)
export function normalizeContactPage(response) {
    const body = response.data?.data ?? response.data ?? {};
    if (Array.isArray(body)) {
        return {
            items: body,
            page: 0,
            totalElements: body.length,
            hasMore: false
        };
    }
    const items =
        body.content ??
        body.items ??
        body.results ??
        body.data ??
        [];
    const totalElements =
        body.totalElements ??
        body.total ??
        body.totalCount ??
        items.length;
    const hasMore =
        typeof body.last === "boolean"
            ? !body.last
            : typeof body.hasMore === "boolean"
                ? body.hasMore
                : items.length < totalElements;
    return {
        items: Array.isArray(items) ? items : [],
        page: body.number ?? body.page ?? 0,
        totalElements: Number(totalElements) || items.length,
        hasMore
    };
}

export function getContact(id) {
    return axiosClient.get(`/contacts/${id}`);
}

export function createContact(payload) {
    return axiosClient.post("/contacts", payload);
}

export function updateContact(id, payload) {
    return axiosClient.put(`/contacts/${id}`, payload);
}

export function deleteContact(id) {
    return axiosClient.delete(`/contacts/${id}`);
}

export function getContactTags() {
    return axiosClient.get("/contacts/tags");
}

export function getContactSegments() {
    return axiosClient.get("/contacts/segments");
}
