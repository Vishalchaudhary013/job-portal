import apiClient from "./apiClient";

export const getMasterclasses = async (params = {}) => {
  const response = await apiClient.get("/api/masterclasses", { params });
  return response.data;
};

export const getMasterclassById = async (id) => {
  const response = await apiClient.get(`/api/masterclasses/${id}`);
  return response.data;
};

export const createMasterclass = async (formData, config) => {
  const response = await apiClient.post("/api/masterclasses", formData, config);
  return response.data;
};

export const updateMasterclass = async (id, formData, config) => {
  const response = await apiClient.put(`/api/masterclasses/${id}`, formData, config);
  return response.data;
};

export const updateMasterclassVisibility = async (id, payload) => {
  const response = await apiClient.patch(`/api/masterclasses/${id}/visibility`, payload);
  return response.data;
};

export const deleteMasterclass = async (id) => {
  const response = await apiClient.delete(`/api/masterclasses/${id}`);
  return response.data;
};

export const attachMasterclassForm = async (id, formId) => {
  const response = await apiClient.put(`/api/masterclasses/${id}/attach-form`, { formId });
  return response.data;
};

export const notifyUpcomingMasterclass = async (id, payload) => {
  const response = await apiClient.post(`/api/masterclasses/${id}/notify`, payload);
  return response.data;
};
