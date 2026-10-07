import apiClient from "./apiClient";
import { toExportResult, toSheetSyncResult } from "./exportResponse";

export const getGlobalPrograms = async () => {
  const response = await apiClient.get("/api/global-programs");
  return response.data;
};

export const getGlobalProgramById = async (id) => {
  const response = await apiClient.get(`/api/global-programs/${id}`);
  return response.data;
};

export const createGlobalProgram = async (formData, config) => {
  const response = await apiClient.post("/api/global-programs", formData, config);
  return response.data;
};

export const updateGlobalProgram = async (id, formData, config) => {
  const response = await apiClient.put(`/api/global-programs/${id}`, formData, config);
  return response.data;
};

export const deleteGlobalProgram = async (id) => {
  const response = await apiClient.delete(`/api/global-programs/${id}`);
  return response.data;
};

// No dedicated attach-form route exists for global programs on the backend yet;
// kept here so callers can still attempt it (matches existing fallback behavior)
// and it will simply 404 until the backend adds the route.
export const attachGlobalProgramForm = async (id, formId) => {
  const response = await apiClient.put(`/api/global-programs/${id}/attach-form`, { formId });
  return response.data;
};

export const exportGlobalPrograms = async (format = "csv") => {
  const response = await apiClient.get("/api/global-programs/export", {
    params: { format },
    responseType: "blob",
  });
  return toExportResult(response);
};

export const syncGlobalProgramsToSheet = async () => {
  const response = await apiClient.get("/api/global-programs/export", {
    params: { target: "sheet" },
  });
  return toSheetSyncResult(response.data);
};
