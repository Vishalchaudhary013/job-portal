import apiClient from "./apiClient";

export const getForm = async (formId) => {
  const response = await apiClient.get(`/api/forms/${formId}`);
  return response.data;
};

export const createForm = async (formData) => {
  const response = await apiClient.post("/api/forms", formData);
  return response.data;
};

export const updateForm = async (formId, formData) => {
  const response = await apiClient.put(`/api/forms/${formId}`, formData);
  return response.data;
};

export const publishForm = async (formId) => {
  const response = await apiClient.post(`/api/forms/${formId}/publish`);
  return response.data;
};

export const getPublicForm = async (formId) => {
  const response = await apiClient.get(`/api/forms/public/${formId}`);
  return response.data;
};

export const submitPublicForm = async (formId, formData) => {
  const response = await apiClient.post(`/api/forms/public/${formId}/submit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
