import apiClient from "./apiClient";
import { toExportResult, toSheetSyncResult } from "./exportResponse";

export const getInternships = async () => {
  const response = await apiClient.get("/api/internships");
  return response.data;
};

// Listing-page search. Passing any filter parameter switches the endpoint to
// its paginated shape: { data, pagination, facets }. Calling getInternships()
// with no parameters still returns the plain array other callers rely on.
export const searchOpportunities = async (params, config = {}) => {
  const response = await apiClient.get("/api/internships", { params, ...config });
  return response.data;
};

export const getInternshipById = async (id) => {
  const response = await apiClient.get(`/api/internships/${id}`);
  return response.data;
};

export const createInternship = async (formData, config) => {
  const response = await apiClient.post("/api/internships", formData, config);
  return response.data;
};

export const updateInternship = async (id, formData, config) => {
  const response = await apiClient.put(`/api/internships/${id}`, formData, config);
  return response.data;
};

export const deleteInternship = async (id) => {
  const response = await apiClient.delete(`/api/internships/${id}`);
  return response.data;
};

// Uploads files picked from the admin's machine for the Office Photos /
// Videos fields and returns their paths (`{ urls: [...] }`). Independent of
// saving the opportunity, so the URLs can be appended to the form before the
// record itself exists.
export const uploadOfficeMedia = async (files) => {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => formData.append("files", file));
  const response = await apiClient.post("/api/internships/office-media", formData);
  return response.data;
};

export const attachInternshipForm = async (id, formId) => {
  const response = await apiClient.put(`/api/internships/${id}/attach-form`, { formId });
  return response.data;
};

// `kind` = "Internship" | "Jobs" | "Apprenticeships" — narrows the export (and
// its Google Sheet tab) to that one; omit for all three combined.
export const exportInternships = async (format = "csv", kind) => {
  const response = await apiClient.get("/api/internships/export", {
    params: { format, ...(kind ? { kind } : {}) },
    responseType: "blob",
  });
  return toExportResult(response);
};

export const syncInternshipsToSheet = async (kind) => {
  const response = await apiClient.get("/api/internships/export", {
    params: { target: "sheet", ...(kind ? { kind } : {}) },
  });
  return toSheetSyncResult(response.data);
};
