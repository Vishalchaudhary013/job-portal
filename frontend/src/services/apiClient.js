import axios from "axios";

const isBrowser = typeof window !== "undefined";
const isLocalHost =
  isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const fallbackBaseURL = isLocalHost
  ? "http://localhost:3001"
  : "https://career-services-85ue.onrender.com";

export const API_BASE_URL =
  import.meta.env.VITE_API_CAREER_SERVICES || fallbackBaseURL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

if (isBrowser) {
  const token = localStorage.getItem("auth_token_v1");
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const getErrorMessage = (error, fallback = "Something went wrong.") => {
  return error?.response?.data?.message || fallback;
};

export const resolveAssetUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};

export default apiClient;
