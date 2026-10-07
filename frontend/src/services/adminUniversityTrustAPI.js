import apiClient from "./apiClient";

export const getAdminTrustScore = async (universityId) => {
  const response = await apiClient.get(`/api/universities/admin/${universityId}/trust-score`);
  return response.data;
};

export const addEvidence = async (universityId, payload) => {
  const response = await apiClient.post(`/api/universities/admin/${universityId}/trust-score/evidence`, payload);
  return response.data;
};

export const updateEvidence = async (universityId, evidenceId, payload) => {
  const response = await apiClient.patch(`/api/universities/admin/${universityId}/trust-score/evidence/${evidenceId}`, payload);
  return response.data;
};

export const deleteEvidence = async (universityId, evidenceId) => {
  const response = await apiClient.delete(`/api/universities/admin/${universityId}/trust-score/evidence/${evidenceId}`);
  return response.data;
};

export const recalculateTrustScore = async (universityId) => {
  const response = await apiClient.post(`/api/universities/admin/${universityId}/trust-score/recalculate`);
  return response.data;
};
