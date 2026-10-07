import apiClient from "./apiClient";

export const getBranches = async () => {
  const response = await apiClient.get("/api/branch");
  return response.data;
};

export const getBranchById = async (id) => {
  const response = await apiClient.get(`/api/branch/${id}`);
  return response.data;
};

export const createBranch = async (payload) => {
  const response = await apiClient.post("/api/branch/create", payload);
  return response.data;
};

export const updateBranch = async (id, payload) => {
  const response = await apiClient.put(`/api/branch/${id}`, payload);
  return response.data;
};

export const deleteBranch = async (id) => {
  const response = await apiClient.delete(`/api/branch/${id}`);
  return response.data;
};
