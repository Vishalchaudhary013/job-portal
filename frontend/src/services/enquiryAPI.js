import apiClient from "./apiClient";

export const submitEnquiry = async ({ name, email, phone, query, programId }) => {
  const response = await apiClient.post("/api/enquiries", { name, email, phone, query, programId });
  return response.data;
};

export const getEnquiries = async (params = {}) => {
  const response = await apiClient.get("/api/enquiries", { params });
  return response.data;
};

export const getEnquiryById = async (id) => {
  const response = await apiClient.get(`/api/enquiries/${id}`);
  return response.data;
};

export const updateEnquiryStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/enquiries/${id}/status`, { status });
  return response.data;
};

export const updateAdmissionFlags = async (id, flags) => {
  const response = await apiClient.patch(`/api/enquiries/${id}/admission-flags`, flags);
  return response.data;
};

export const sendCounsellingPackage = async (id, payload) => {
  const response = await apiClient.post(`/api/enquiries/${id}/counselling-package`, payload);
  return response.data;
};

export const sendPostAdmissionMessage = async (id, type, payload) => {
  const response = await apiClient.post(`/api/enquiries/${id}/post-admission`, { type, payload });
  return response.data;
};

export const getEnquiryMessages = async (id) => {
  const response = await apiClient.get(`/api/enquiries/${id}/messages`);
  return response.data;
};
