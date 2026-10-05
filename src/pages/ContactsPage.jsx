import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Anchor, App, Card, Descriptions, Drawer, Empty, Form, Input, Space, Switch, Tag, Typography } from "antd";
import { AppstoreOutlined, BlockOutlined, ContactsOutlined, DeleteOutlined, DownloadOutlined, PlusOutlined, TagsOutlined, TeamOutlined } from "@ant-design/icons";

import MarqButton from "../components/common/MarqButton";
import ContactList from "../components/contacts/ContactList";
import ContactListFilters, { DATE_RANGE_OPTIONS } from "../components/contacts/ContactListFilters";
import CreateContactModal from "../components/contacts/CreateContactModal";
import { createContact, getContactSegments, getContactTags, listContacts, normalizeContactPage, updateContact } from "../api/contactApi";
import { parseTimestamp } from "../utils/time";
import { tokens } from "../theme/tokens";

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_SORT = "createdAt,desc";

function withinLastDays(iso, days) {
    const ts = parseTimestamp(iso);
    if (!ts) return false;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return ts.getTime() >= cutoff;
}

function buildServerQuery({ search, dateRange }) {
    const range = DATE_RANGE_OPTIONS.find((option) => option.value === dateRange);
    return {
        search: search.trim(),
        createdAfter: range?.days
            ? new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString()
            : null
    };
}

function applyClientFilters(contacts, { search, dateRange }) {
    const trimmed = search.trim().toLowerCase();
    const range = DATE_RANGE_OPTIONS.find((option) => option.value === dateRange);
    return contacts.filter((contact) => {
        if (trimmed) {
            const haystack = [contact.name, contact.phoneNumber, contact.email, contact.notes]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            if (!haystack.includes(trimmed)) return false;
        }
        if (range?.days) {
            const ts = contact.createdAt || contact.updatedAt || contact.lastContactedAt;
            if (!withinLastDays(ts, range.days)) return false;
        }
        return true;
    });
}

function clientSort(contacts, sort) {
    const [field, dir] = sort.split(",");
    const factor = dir === "asc" ? 1 : -1;
    return [...contacts].sort((a, b) => {
        const av = a?.[field];
        const bv = b?.[field];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
        const at = parseTimestamp(av)?.getTime();
        const bt = parseTimestamp(bv)?.getTime();
        if (at && bt) return (at - bt) * factor;
        return String(av).localeCompare(String(bv)) * factor;
    });
}

function dedupeById(list) {
    const seen = new Set();
    const out = [];
    for (const item of list) {
        const key = item.id || item.contactId || item.phoneNumber;
        if (!key) {
            out.push(item);
            continue;
        }
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

export default function ContactsPage() {
    const { message } = App.useApp();
    const [contacts, setContacts] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState(DEFAULT_SORT);
    const [dateRange, setDateRange] = useState("all");
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [selectedContactKeys, setSelectedContactKeys] = useState([]);
    const [profileForm] = Form.useForm();
    const [profileSaving, setProfileSaving] = useState(false);
    const [activeSection, setActiveSection] = useState("all");
    const [sectionData, setSectionData] = useState([]);
    const dataSections = ["all", "leads", "customers", "blocked"];

    useEffect(() => {
        if (activeSection !== "tags" && activeSection !== "segments") {
            setSectionData([]);
            return;
        }
        const request = activeSection === "tags" ? getContactTags() : getContactSegments();
        request.then((response) => setSectionData(response.data?.data ?? [])).catch(() => setSectionData([]));
    }, [activeSection]);
    const contactSections = [{ key: "all", label: "All Contacts", icon: <ContactsOutlined /> }, { key: "leads", label: "Leads", icon: <TeamOutlined /> }, { key: "customers", label: "Customers", icon: <TeamOutlined /> }, { key: "segments", label: "Segments", icon: <AppstoreOutlined /> }, { key: "tags", label: "Tags", icon: <TagsOutlined /> }, { key: "import-export", label: "Import / Export", icon: <DownloadOutlined /> }, { key: "blocked", label: "Blocked Contacts", icon: <BlockOutlined /> }];

    const inFlightRef = useRef(false);
    const sentinelRef = useRef(null);

    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(() => {
            setLoading(true);
            setError("");
            setContacts([]);
            setHasMore(false);
            setPage(0);
            inFlightRef.current = false;

            listContacts({ page: 0, size: pageSize, sort, section: activeSection, ...buildServerQuery({ search, dateRange }) })
                .then((response) => {
                    if (!active) return;
                    const pageData = normalizeContactPage(response);
                    setContacts(dedupeById(pageData.items));
                    setTotalElements(pageData.totalElements);
                    setHasMore(pageData.hasMore);
                    setPage(0);
                })
                .catch((err) => {
                    console.error(err);
                    if (active) setError(err?.response?.data?.message || err?.message || "Failed to load contacts");
                })
                .finally(() => {
                    if (active) {
                        setLoading(false);
                        inFlightRef.current = false;
                    }
                });
        }, 0);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [search, dateRange, sort, pageSize, activeSection]);

    const loadPage = useCallback(async (nextPage) => {
        if (inFlightRef.current || !hasMore) return;
        inFlightRef.current = true;
        setLoadingMore(true);
        setError("");

        try {
            const response = await listContacts({
                page: nextPage,
                size: pageSize,
                sort,
                section: activeSection,
                ...buildServerQuery({ search, dateRange })
            });
            const pageData = normalizeContactPage(response);
            setContacts((prev) => dedupeById([...prev, ...pageData.items]));
            setTotalElements(pageData.totalElements);
            setHasMore(pageData.hasMore);
            setPage(nextPage);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || err?.message || "Failed to load more contacts");
        } finally {
            setLoadingMore(false);
            inFlightRef.current = false;
        }
    }, [hasMore, pageSize, search, dateRange, sort, activeSection]);

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return undefined;
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (!entry?.isIntersecting || loading || loadingMore || !hasMore) return;
            loadPage(page + 1);
        }, { rootMargin: "200px 0px" });
        observer.observe(node);
        return () => observer.disconnect();
    }, [loadPage, loading, loadingMore, hasMore, page]);

    const filteredContacts = useMemo(
        () => clientSort(applyClientFilters(contacts, { search, dateRange }), sort),
        [contacts, search, dateRange, sort]
    );

    const handleCreate = async (payload) => {
        const response = await createContact(payload);
        const created = response.data?.data ?? {
            id: response.data?.id || `local-${Date.now()}`,
            ...payload,
            createdAt: new Date().toISOString()
        };
        setContacts((prev) => dedupeById([created, ...prev]));
        setTotalElements((value) => value + 1);
        setCreateOpen(false);
        message.success(`Saved "${payload.name}"`);
    };

    const openContact = (contact) => { setSelectedContact(contact); profileForm.setFieldsValue({ name: contact.name, phoneNumber: contact.phoneNumber, email: contact.email || "", notes: contact.notes || "", tags: (contact.tags || []).join(", "), optedOut: contact.optedOut }); };
    const saveContactProfile = async (values) => { if (!selectedContact) return; try { setProfileSaving(true); const response = await updateContact(selectedContact.id, { ...values, tags: values.tags ? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [], optedOut: Boolean(values.optedOut) }); const updated = response.data?.data ?? response.data; setSelectedContact(updated); setContacts((items) => items.map((item) => item.id === updated.id ? updated : item)); message.success("Contact saved"); } catch (error) { message.error(error?.response?.data?.message || "Unable to save contact"); } finally { setProfileSaving(false); } };

    const showingLabel =
        contacts.length === totalElements || !totalElements
            ? `${totalElements || contacts.length} contact${totalElements === 1 ? "" : "s"}`
            : `${contacts.length} of ${totalElements} contacts`;

    return (
        <div className="contacts-page contacts-crm-layout"><aside className="contacts-context-nav"><Card className="contacts-context-card" bordered={false}><Anchor className="contacts-context-anchor" affix={false} items={contactSections.map((item) => ({ key: item.key, href: `#contacts-${item.key}`, title: <span className={`contacts-anchor-title ${activeSection === item.key ? "is-active" : ""}`}>{item.icon}<span>{item.label}</span></span> }))} onClick={(event, item) => { event.preventDefault(); const key = item?.href?.replace("#contacts-", "") || "all"; setActiveSection(key); }} /></Card></aside><main className="contacts-module-content">
            {!dataSections.includes(activeSection) && <CardPlaceholder section={contactSections.find((item) => item.key === activeSection)?.label} items={sectionData} />}
            <div className={dataSections.includes(activeSection) ? "" : "contacts-all-hidden"}>
            <div className="page-header-row">
                <div>
                    <Typography.Text className="page-eyebrow">Contacts</Typography.Text>
                    <Typography.Title level={1} className="page-title">
                        Your contact book
                    </Typography.Title>
                    <Typography.Text type="secondary">Manage and organize your contacts and customer relationships.</Typography.Text>
                </div>
                <MarqButton variant="contained" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                    Add contact
                </MarqButton>
            </div>

            <ContactListFilters
                search={search}
                onSearchChange={setSearch}
                sort={sort}
                onSortChange={setSort}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                totalCount={totalElements}
                filteredCount={filteredContacts.length}
            />

            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

            <div className="contacts-list-region">
                {selectedContactKeys.length > 0 && <div className="contacts-bulk-toolbar"><Typography.Text strong>{selectedContactKeys.length} contacts selected</Typography.Text><Space><MarqButton variant="outlined" icon={<TagsOutlined />}>Add tag</MarqButton><MarqButton variant="outlined" icon={<DeleteOutlined />}>Delete</MarqButton></Space></div>}
                <ContactList
                    contacts={filteredContacts}
                    loading={loading}
                    onCreateClick={() => setCreateOpen(true)}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    sentinelRef={sentinelRef}
                    onOpen={openContact}
                    selectedRowKeys={selectedContactKeys}
                    onSelectionChange={setSelectedContactKeys}
                />
            </div>

            <Space className="contacts-footer" style={{ color: tokens.colors.textSecondary }}>
                <span>{showingLabel}</span>
                {hasMore && !loading && <span>Scroll to load more</span>}
            </Space>
            </div>

            <CreateContactModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreate={handleCreate}
            />
            <Drawer title="Customer profile" open={Boolean(selectedContact)} onClose={() => setSelectedContact(null)} width={420} extra={<MarqButton variant="contained" loading={profileSaving} onClick={() => profileForm.submit()}>Save</MarqButton>}>
                {selectedContact && <Form form={profileForm} layout="vertical" onFinish={saveContactProfile}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="Phone number" name="phoneNumber"><Input disabled /></Form.Item><Form.Item label="Email" name="email"><Input /></Form.Item><Form.Item label="Tags" name="tags" help="Separate tags with commas"><Input placeholder="lead, vip" /></Form.Item><Form.Item label="Notes" name="notes"><Input.TextArea rows={4} /></Form.Item><Form.Item label="Block contact" name="optedOut" valuePropName="checked"><Switch /></Form.Item><Descriptions column={1} bordered size="small"><Descriptions.Item label="Created">{parseTimestamp(selectedContact.createdAt)?.toLocaleDateString() || "-"}</Descriptions.Item></Descriptions></Form>}
            </Drawer>
        </main></div>
    );
}

function CardPlaceholder({ section = "Contacts", items = [] }) { return <div className="contacts-placeholder"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<><Typography.Text strong>{section}</Typography.Text><br /><Typography.Text type="secondary">{items.length ? items.join(" · ") : `This CRM workspace is ready for your ${section.toLowerCase()} workflow.`}</Typography.Text></>}><MarqButton variant="contained" icon={<PlusOutlined />}>Add contact</MarqButton></Empty></div>; }
