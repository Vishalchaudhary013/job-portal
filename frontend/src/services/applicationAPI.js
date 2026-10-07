import apiClient from "./apiClient";
import { toExportResult, toSheetSyncResult } from "./exportResponse";

export const getApplications = async () => {
  const response = await apiClient.get("/api/applications");
  return response.data;
};

export const submitApplication = async (formData) => {
  const response = await apiClient.post("/api/applications", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateApplicationStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/applications/${id}/status`, { status });
  return response.data;
};

export const exportApplications = async (format = "csv") => {
  const response = await apiClient.get("/api/applications/export", {
    params: { format },
    responseType: "blob",
  });
  return toExportResult(response);
};

export const syncApplicationsToSheet = async () => {
  const response = await apiClient.get("/api/applications/export", {
    params: { target: "sheet" },
  });
  return toSheetSyncResult(response.data);
};
