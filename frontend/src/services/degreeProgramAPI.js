import apiClient from "./apiClient";
import { toExportResult, toSheetSyncResult } from "./exportResponse";

export const getDegreePrograms = async (params = {}) => {
  const response = await apiClient.get("/api/degree-programs", { params });
  return response.data;
};

export const getDegreeProgramById = async (id) => {
  const response = await apiClient.get(`/api/degree-programs/${id}`);
  return response.data;
};

export const createDegreeProgram = async (formData, config) => {
  const response = await apiClient.post("/api/degree-programs", formData, config);
  return response.data;
};

export const updateDegreeProgram = async (id, formData, config) => {
  const response = await apiClient.put(`/api/degree-programs/${id}`, formData, config);
  return response.data;
};

export const deleteDegreeProgram = async (id) => {
  const response = await apiClient.delete(`/api/degree-programs/${id}`);
  return response.data;
};

export const bulkDeleteDegreePrograms = async (ids) => {
  const response = await apiClient.delete("/api/degree-programs/bulk", { data: { ids } });
  return response.data;
};

export const attachDegreeProgramForm = async (id, formId) => {
  const response = await apiClient.put(`/api/degree-programs/${id}/attach-form`, { formId });
  return response.data;
};

export const exportDegreePrograms = async (format = "csv") => {
  const response = await apiClient.get("/api/degree-programs/export", {
    params: { format },
    responseType: "blob",
  });
  return toExportResult(response);
};

export const syncDegreeProgramsToSheet = async () => {
  const response = await apiClient.get("/api/degree-programs/export", {
    params: { target: "sheet" },
  });
  return toSheetSyncResult(response.data);
};

export const publishDegreeProgram = async (id) => {
  const response = await apiClient.post(`/api/degree-programs/${id}/publish`);
  return response.data;
};

export const unpublishDegreeProgram = async (id) => {
  const response = await apiClient.post(`/api/degree-programs/${id}/unpublish`);
  return response.data;
};

export const duplicateDegreeProgram = async (id) => {
  const response = await apiClient.post(`/api/degree-programs/${id}/duplicate`);
  return response.data;
};

export const archiveDegreeProgram = async (id) => {
  const response = await apiClient.post(`/api/degree-programs/${id}/archive`);
  return response.data;
};
