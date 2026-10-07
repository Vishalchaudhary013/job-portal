import apiClient from "./apiClient";

export const getMethodology = async () => {
  const response = await apiClient.get("/api/universities/trust-score/methodology");
  return response.data;
};

export const getTrustScore = async (universityId) => {
  const response = await apiClient.get(`/api/universities/${universityId}/trust-score`);
  return response.data;
};

export const getTrustScoreBreakdown = async (universityId) => {
  const response = await apiClient.get(`/api/universities/${universityId}/trust-score/breakdown`);
  return response.data;
};
