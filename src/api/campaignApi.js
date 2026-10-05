import axiosClient from "./axiosClient";

export const listTemplates = () => axiosClient.get("/templates");
export const listCampaigns = (params = {}) => axiosClient.get("/campaigns", { params });
export const createCampaign = (payload) => axiosClient.post("/campaigns", payload);
export const launchCampaign = (id) => axiosClient.post(`/campaigns/${id}/launch`);
export const cancelCampaign = (id) => axiosClient.post(`/campaigns/${id}/cancel`);
export const getCampaignRecipients = (id, params = {}) => axiosClient.get(`/campaigns/${id}/recipients`, { params });
export const sendCampaignTest = (payload) => axiosClient.post("/campaigns/test", payload);
