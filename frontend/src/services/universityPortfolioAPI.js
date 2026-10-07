import apiClient from "./apiClient";

export const getUniversityPortfolios = async (params = {}) => {
  const response = await apiClient.get("/api/university-portfolios", { params });
  return response.data;
};

export const getUniversityPortfolioById = async (id) => {
  const response = await apiClient.get(`/api/university-portfolios/${id}`);
  return response.data;
};

export const createUniversityPortfolio = async (formData) => {
  const response = await apiClient.post("/api/university-portfolios", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateUniversityPortfolio = async (id, formData) => {
  const response = await apiClient.put(`/api/university-portfolios/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteUniversityPortfolio = async (id) => {
  const response = await apiClient.delete(`/api/university-portfolios/${id}`);
  return response.data;
};

export const searchProgramsForPortfolio = async (search = "") => {
  const response = await apiClient.get("/api/university-portfolios/programs/search", {
    params: { search },
  });
  return response.data;
};
