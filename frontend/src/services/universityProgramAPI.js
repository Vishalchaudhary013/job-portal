import apiClient from "./apiClient";

export const getUniversityPrograms = async (params = {}) => {
  const response = await apiClient.get("/api/university-programs", { params });
  return response.data;
};

export const getUniversityProgramById = async (id) => {
  const response = await apiClient.get(`/api/university-programs/${id}`);
  return response.data;
};

export const createUniversityProgram = async (formData) => {
  const response = await apiClient.post("/api/university-programs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateUniversityProgram = async (id, formData) => {
  const response = await apiClient.put(`/api/university-programs/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteUniversityProgram = async (id) => {
  const response = await apiClient.delete(`/api/university-programs/${id}`);
  return response.data;
};

export const bulkDeleteUniversityPrograms = async (ids) => {
  const response = await apiClient.delete("/api/university-programs/bulk", { data: { ids } });
  return response.data;
};

export const attachUniversityProgramForm = async (id, formId) => {
  const response = await apiClient.put(`/api/university-programs/${id}/attach-form`, { formId });
  return response.data;
};
