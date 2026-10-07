import apiClient from "./apiClient";

export const getTemplates = async (params = {}) => {
  const response = await apiClient.get("/api/templates", { params });
  return response.data?.data || [];
};

export const getTemplate = async (templateId) => {
  const response = await apiClient.get(`/api/templates/${templateId}`);
  return response.data?.data;
};

export const createTemplate = async (payload) => {
  const response = await apiClient.post("/api/templates", payload);
  return response.data?.data;
};

export const updateTemplate = async (templateId, payload) => {
  const response = await apiClient.put(`/api/templates/${templateId}`, payload);
  return response.data?.data;
};

export const toggleTemplateStatus = async (templateId, isActive) => {
  const response = await apiClient.patch(`/api/templates/${templateId}/status`, { isActive });
  return response.data?.data;
};

export const deleteTemplate = async (templateId) => {
  const response = await apiClient.delete(`/api/templates/${templateId}`);
  return response.data;
};

/* --- Responses to standalone shared templates (not opportunity forms) --- */

// Public — a user submitting a shared template. `formData` is a FormData keyed by fieldId
// (files included). Content-Type is left unset so axios/the browser add the multipart
// boundary automatically.
export const submitTemplateResponse = async (templateId, formData) => {
  const response = await apiClient.post(`/api/templates/${templateId}/responses`, formData);
  return response.data;
};

// Super admin — { template: { _id, name, fields }, responses: [], total }
export const getTemplateResponses = async (templateId) => {
  const response = await apiClient.get(`/api/templates/${templateId}/responses`);
  return response.data?.data;
};

// Super admin — { [templateId]: count }
export const getTemplateResponseCounts = async () => {
  const response = await apiClient.get("/api/templates/response-counts");
  return response.data?.data || {};
};

export const deleteTemplateResponse = async (responseId) => {
  const response = await apiClient.delete(`/api/templates/responses/${responseId}`);
  return response.data;
};
