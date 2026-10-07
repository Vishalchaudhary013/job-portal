import apiClient from "./apiClient";

// Form Builder delivery API — published content only (plus signed previews).
// Used by the portal's dynamic listing/detail pages and response forms.

const toListParams = ({ q, page, limit, sort, filters } = {}) => {
  const params = {};
  if (q) params.q = q;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (sort) params.sort = sort;
  Object.entries(filters || {}).forEach(([fieldId, value]) => {
    const list = Array.isArray(value) ? value : [value];
    const clean = list.filter((item) => item !== "" && item !== undefined && item !== null);
    if (clean.length) params[`filters[${fieldId}]`] = clean.join(",");
  });
  return params;
};

export const getCmsTypes = async () => (await apiClient.get("/api/cms/public/types")).data;

export const getCmsType = async (slug) => (await apiClient.get(`/api/cms/public/types/${encodeURIComponent(slug)}`)).data;

export const getCmsEntries = async (slug, query) =>
  (await apiClient.get(`/api/cms/public/types/${encodeURIComponent(slug)}/entries`, { params: toListParams(query) })).data;

export const getCmsEntry = async (slug, entrySlug) =>
  (await apiClient.get(`/api/cms/public/types/${encodeURIComponent(slug)}/entries/${encodeURIComponent(entrySlug)}`)).data;

export const getCmsRelated = async (id, { limit = 3, matchFieldId } = {}) =>
  (await apiClient.get(`/api/cms/public/entries/${encodeURIComponent(id)}/related`, { params: { limit, ...(matchFieldId ? { matchFieldId } : {}) } })).data;

export const getCmsForm = async (slug) => (await apiClient.get(`/api/cms/public/forms/${encodeURIComponent(slug)}`)).data;

export const submitCmsForm = async (slug, { data, contentId, context }) =>
  (await apiClient.post(`/api/cms/public/forms/${encodeURIComponent(slug)}/submissions`, { data, contentId, context })).data;

export const uploadCmsFormFile = async (slug, fieldId, file, onProgress) => {
  const body = new FormData();
  body.append("file", file);
  const response = await apiClient.post(`/api/cms/public/forms/${encodeURIComponent(slug)}/uploads`, body, {
    params: { fieldId },
    onUploadProgress: (event) => onProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
  });
  return response.data;
};

export const getCmsPreview = async (token) => (await apiClient.get("/api/cms/public/preview", { params: { token } })).data;

export const getCmsDashboardStats = async () => (await apiClient.get("/api/cms/public/dashboard-stats")).data;
