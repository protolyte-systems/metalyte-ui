import axiosClient from "./axiosClient";
export const getOrganizationTypes = () => axiosClient.get("/organizations/types");
export const getCurrentOrganization = () => axiosClient.get("/organizations/me");
export const getEmbeddedSignupConfig = () => axiosClient.get("/organizations/me/whatsapp/embedded-signup-config");
export const completeEmbeddedSignup = (code) => axiosClient.post("/organizations/me/whatsapp/embedded-signup/callback", { code });
export const disconnectWhatsapp = () => axiosClient.delete("/organizations/me/whatsapp");
export const getWhatsappTemplates = () => axiosClient.get("/templates");
export const updateOrganization = (payload) => axiosClient.put("/organizations/me", payload);
export const updateProfile = (payload) => axiosClient.put("/organizations/me/profile", payload);
