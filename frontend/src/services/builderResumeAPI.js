import apiClient from "./apiClient";

const BASE = "/api/student/builder-resume";

// The student's most-recently-edited builder resume (draft or saved), or null.
export const getCurrentBuilderResume = async () => {
  const response = await apiClient.get(`${BASE}/current`);
  return response.data.resume;
};

export const listMyBuilderResumes = async () => {
  const response = await apiClient.get(BASE);
  return response.data.resumes;
};

// payload: { resumeData, template, font, sectionOrder, title }
export const createBuilderResume = async (payload = {}) => {
  const response = await apiClient.post(BASE, payload);
  return response.data.resume;
};

export const updateBuilderResume = async (id, payload = {}) => {
  const response = await apiClient.patch(`${BASE}/${id}`, payload);
  return response.data.resume;
};

// Uploads the client-rendered PDF and flips the record to SAVED. When
// syncToProfile is true the common fields are also merged into the student profile.
export const finalizeBuilderResume = async (id, pdfBlob, { syncToProfile = true, fileName, resumeData, template, font, sectionOrder } = {}) => {
  const formData = new FormData();
  formData.append("resume", pdfBlob, fileName || "resume.pdf");
  formData.append("syncToProfile", String(Boolean(syncToProfile)));
  if (resumeData !== undefined) formData.append("resumeData", JSON.stringify(resumeData));
  if (template !== undefined) formData.append("template", template);
  if (font !== undefined) formData.append("font", font);
  if (sectionOrder !== undefined) formData.append("sectionOrder", JSON.stringify(sectionOrder));

  const response = await apiClient.post(`${BASE}/${id}/finalize`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Super admin.
export const adminListBuilderResumes = async (limit) => {
  const response = await apiClient.get(`${BASE}/admin/all`, { params: limit ? { limit } : {} });
  return response.data;
};
