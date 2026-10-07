import apiClient from "./apiClient";

export const getCustomCategories = async (opportunityType) =>
  apiClient.get("/api/custom-categories", { params: { opportunityType } });

export const createCustomCategory = async ({ title, opportunityType }) =>
  apiClient.post("/api/custom-categories/create-category", { title, opportunityType });
