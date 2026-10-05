import axiosClient from "./axiosClient";
export const listInboxConversations = (params = {}) => axiosClient.get("/conversations", { params });
export const updateInboxConversation = (id, payload) => axiosClient.patch(`/conversations/${id}`, payload);
