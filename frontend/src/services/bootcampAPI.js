import apiClient from "./apiClient";
import { toExportResult, toSheetSyncResult } from "./exportResponse";

export const getBootcamps = async () => {
  const response = await apiClient.get("/api/bootcamps");
  return response.data;
};

export const getBootcampById = async (id) => {
  const response = await apiClient.get(`/api/bootcamps/${id}`);
  return response.data;
};

export const createBootcamp = async (formData, config) => {
  const response = await apiClient.post("/api/bootcamps", formData, config);
  return response.data;
};

export const updateBootcamp = async (id, formData, config) => {
  const response = await apiClient.put(`/api/bootcamps/${id}`, formData, config);
  return response.data;
};

export const deleteBootcamp = async (id) => {
  const response = await apiClient.delete(`/api/bootcamps/${id}`);
  return response.data;
};

export const bulkDeleteBootcamps = async (ids) => {
  const response = await apiClient.delete("/api/bootcamps/bulk", { data: { ids } });
  return response.data;
};

export const attachBootcampForm = async (id, formId) => {
  const response = await apiClient.put(`/api/bootcamps/${id}/attach-form`, { formId });
  return response.data;
};

export const exportBootcamps = async (format = "csv") => {
  const response = await apiClient.get("/api/bootcamps/export", {
    params: { format },
    responseType: "blob",
  });
  return toExportResult(response);
};

export const syncBootcampsToSheet = async () => {
  const response = await apiClient.get("/api/bootcamps/export", {
    params: { target: "sheet" },
  });
  return toSheetSyncResult(response.data);
};
