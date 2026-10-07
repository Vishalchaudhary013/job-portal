import apiClient from "./apiClient";

// Form Builder admin API (/api/cms/admin). Uses the same signed-in Edeco
// session as the rest of the dashboard — no separate login.

const base = "/api/cms/admin";
const get = async (path, params) => (await apiClient.get(`${base}${path}`, { params })).data;
const post = async (path, body) => (await apiClient.post(`${base}${path}`, body)).data;
const put = async (path, body) => (await apiClient.put(`${base}${path}`, body)).data;
const patch = async (path, body) => (await apiClient.patch(`${base}${path}`, body)).data;
const del = async (path, params) => (await apiClient.delete(`${base}${path}`, { params })).data;

export const cmsAdmin = {
  me: () => get("/me"),
  dashboard: () => get("/dashboard"),
  analytics: (days) => get("/analytics", { days }),

  // Content types
  listTypes: (params) => get("/content-types", params),
  createType: (body) => post("/content-types", body),
  getType: (id) => get(`/content-types/${id}`),
  updateTypeMeta: (id, body) => patch(`/content-types/${id}`, body),
  saveTypeDraft: (id, body) => put(`/content-types/${id}/draft`, body),
  publishImpact: (id) => get(`/content-types/${id}/publish-impact`),
  publishType: (id, kinds, note) => post(`/content-types/${id}/publish`, { kinds, note }),
  typeVersions: (id, kind) => get(`/content-types/${id}/versions`, { kind }),
  typeVersion: (id, kind, version) => get(`/content-types/${id}/versions/${kind}/${version}`),
  restoreTypeVersion: (id, kind, version) => post(`/content-types/${id}/versions/${kind}/${version}/restore`),
  duplicateType: (id) => post(`/content-types/${id}/duplicate`),
  archiveType: (id, archived = true) => post(`/content-types/${id}/archive`, { archived }),
  deleteType: (id) => del(`/content-types/${id}`),
  previewLink: (id, body) => post(`/content-types/${id}/preview`, body),
  newEntryContext: (typeId) => get(`/content-types/${typeId}/new-entry`),

  // Content
  listContents: (params) => get("/contents", params),
  createContent: (body) => post("/contents", body),
  getContent: (id) => get(`/contents/${id}`),
  saveContent: (id, body) => put(`/contents/${id}`, body),
  contentAction: (id, action, note) => post(`/contents/${id}/actions/${action}`, { note }),
  contentVersions: (id) => get(`/contents/${id}/versions`),
  contentVersion: (id, version) => get(`/contents/${id}/versions/${version}`),
  restoreContentVersion: (id, version) => post(`/contents/${id}/versions/${version}/restore`),
  duplicateContent: (id) => post(`/contents/${id}/duplicate`),
  deleteContent: (id) => del(`/contents/${id}`),

  // Response forms
  listForms: (params) => get("/forms", params),
  createForm: (body) => post("/forms", body),
  getForm: (id) => get(`/forms/${id}`),
  updateFormMeta: (id, body) => patch(`/forms/${id}`, body),
  saveFormDraft: (id, body) => put(`/forms/${id}/draft`, body),
  formPublishImpact: (id) => get(`/forms/${id}/publish-impact`),
  publishForm: (id, note) => post(`/forms/${id}/publish`, { note }),
  unpublishForm: (id) => post(`/forms/${id}/unpublish`),
  formVersions: (id) => get(`/forms/${id}/versions`),
  restoreFormVersion: (id, version) => post(`/forms/${id}/versions/${version}/restore`),
  archiveForm: (id, archived = true) => post(`/forms/${id}/archive`, { archived }),
  deleteForm: (id) => del(`/forms/${id}`),

  // Templates
  listTemplates: (params) => get("/templates", params),
  getTemplate: (id) => get(`/templates/${id}`),
  createTemplate: (body) => post("/templates", body),
  updateTemplate: (id, body) => patch(`/templates/${id}`, body),
  deleteTemplate: (id) => del(`/templates/${id}`),

  // Submissions
  listSubmissions: (params) => get("/submissions", params),
  getSubmission: (id) => get(`/submissions/${id}`),
  setSubmissionStatus: (id, status) => patch(`/submissions/${id}/status`, { status }),
  bulkSubmissionStatus: (ids, status) => post("/submissions/bulk-status", { ids, status }),
  addSubmissionNote: (id, text) => post(`/submissions/${id}/notes`, { text }),
  deleteSubmission: (id) => del(`/submissions/${id}`),
  exportSubmissions: async (params) => {
    const response = await apiClient.get(`${base}/submissions/export`, { params, responseType: "blob" });
    const name = /filename="([^"]+)"/.exec(response.headers["content-disposition"] || "")?.[1] || "responses.csv";
    return { blob: response.data, name };
  },

  // Media
  listMedia: (params) => get("/media", params),
  uploadMedia: async (files, onProgress) => {
    const body = new FormData();
    [...files].forEach((file) => body.append("files", file));
    const response = await apiClient.post(`${base}/media`, body, {
      onUploadProgress: (event) => onProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
    });
    return response.data;
  },
  updateMedia: (id, body) => patch(`/media/${id}`, body),
  deleteMedia: (id, force = false) => del(`/media/${id}`, force ? { force: 1 } : undefined),
  downloadMedia: async (id) => (await apiClient.get(`${base}/media/${id}/file`, { responseType: "blob" })).data,

  // Administration
  permissions: () => get("/permissions"),
  listAdmins: () => get("/admins"),
  updateAdminAccess: (userId, body) => put(`/admins/${userId}/access`, body),
  auditLogs: (params) => get("/audit-logs", params),
  settings: () => get("/settings"),
  updateSettings: (body) => put("/settings", body),
  listApiKeys: () => get("/api-keys"),
  createApiKey: (body) => post("/api-keys", body),
  revokeApiKey: (id) => post(`/api-keys/${id}/revoke`),
  listWebhooks: () => get("/webhooks"),
  createWebhook: (body) => post("/webhooks", body),
  updateWebhook: (id, body) => patch(`/webhooks/${id}`, body),
  deleteWebhook: (id) => del(`/webhooks/${id}`),
  testWebhook: (id) => post(`/webhooks/${id}/test`),
  webhookDeliveries: (id, params) => get(`/webhooks/${id}/deliveries`, params),
  redeliverWebhook: (id, deliveryId) => post(`/webhooks/${id}/deliveries/${deliveryId}/redeliver`),
};

export const cmsError = (error, fallback = "Something went wrong.") => {
  const data = error?.response?.data;
  return {
    message: data?.message || (error?.message === "Network Error" ? "Can't reach the server. Check your connection." : fallback),
    fieldErrors: data?.details?.fieldErrors || null,
    problems: data?.details?.problems || null,
    status: error?.response?.status || 0,
    details: data?.details || null,
  };
};
