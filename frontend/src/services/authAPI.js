import apiClient from "./apiClient";
import { toExportResult, toSheetSyncResult } from "./exportResponse";

export const socialAuthURL = {
  google: "/api/auth/google",
  linkedin: "/api/auth/linkedin",
  facebook: "/api/auth/facebook",
  instagram: "/api/auth/instagram",
};

export const sendSignupOtps = async (payload) => {
  const response = await apiClient.post("/api/auth/send-signup-otps", payload);
  return response.data;
};

export const signup = async (payload) => {
  const response = await apiClient.post("/api/auth/signup", payload);
  return response.data;
};

export const userSignup = async (payload) => {
  const response = await apiClient.post("/api/auth/user-signup", payload);
  return response.data;
};

// Simplified signup used by a Test's public link (/t/:slug) — name, email,
// phone, college, semester, password, email OTP only (no WhatsApp OTP step).
export const studentSignup = async (payload) => {
  const response = await apiClient.post("/api/auth/student-signup", payload);
  return response.data;
};

export const adminSignup = async (payload) => {
  const response = await apiClient.post("/api/auth/admin-signup", payload);
  return response.data;
};

export const superAdminSignup = async (payload) => {
  const response = await apiClient.post("/api/auth/super-admin-signup", payload);
  return response.data;
};

export const login = async ({ email, password }) => {
  const response = await apiClient.post("/api/auth/login", { email, password });
  return response.data;
};

export const userLogin = async ({ email, password }) => {
  const response = await apiClient.post("/api/auth/user-login", { email, password });
  return response.data;
};

export const adminLogin = async ({ email, password }) => {
  const response = await apiClient.post("/api/auth/admin-login", { email, password });
  return response.data;
};

export const requestEmailVerification = async ({ email }) => {
  const response = await apiClient.post("/api/auth/request-email-verification", { email });
  return response.data;
};

export const verifyEmailCode = async ({ email, code }) => {
  const response = await apiClient.post("/api/auth/verify-email", { email, code });
  return response.data;
};

export const requestPhoneVerification = async ({ email }) => {
  const response = await apiClient.post("/api/auth/request-phone-verification", { email });
  return response.data;
};

export const verifyPhoneCode = async ({ email, code }) => {
  const response = await apiClient.post("/api/auth/verify-phone", { email, code });
  return response.data;
};

export const forgotPassword = async ({ email }) => {
  const response = await apiClient.post("/api/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async ({ email, code, newPassword }) => {
  const response = await apiClient.post("/api/auth/reset-password", { email, code, newPassword });
  return response.data;
};

export const me = async () => {
  const response = await apiClient.get("/api/auth/me");
  return response.data;
};

export const updateMe = async (payload) => {
  const response = await apiClient.patch("/api/auth/me", payload);
  return response.data;
};

export const getUserDirectory = async () => {
  const response = await apiClient.get("/api/auth/directory");
  return response.data;
};

// Downloads a stakeholder list (users | admins | mentors | super-admins) as an
// .xlsx blob. The backend also pushes the same table to that type's own Google
// Sheet and reports the outcome in response headers.
export const exportStakeholders = async (type) => {
  const response = await apiClient.get("/api/auth/stakeholders/export", {
    params: { type },
    responseType: "blob",
  });
  return toExportResult(response);
};

export const syncStakeholdersToSheet = async (type) => {
  const response = await apiClient.get("/api/auth/stakeholders/export", {
    params: { type, target: "sheet" },
  });
  return toSheetSyncResult(response.data);
};

export const getExportSheet = async () => {
  const response = await apiClient.get("/api/auth/export-sheet");
  return response.data; // { spreadsheetId, spreadsheetUrl, serviceAccountEmail }
};

export const setExportSheet = async (spreadsheet) => {
  const response = await apiClient.put("/api/auth/export-sheet", { spreadsheet });
  return response.data; // { spreadsheetId, spreadsheetUrl }
};

export const getWhatsAppStatus = async () => {
  const response = await apiClient.get("/api/auth/whatsapp-status");
  return response.data;
};

export const impersonateAdmin = async ({ adminId }) => {
  const response = await apiClient.post("/api/auth/impersonate-admin", { adminId });
  return response.data;
};

export const deleteUserAccount = async ({ userId }) => {
  const response = await apiClient.delete(`/api/auth/users/${userId}`);
  return response.data;
};

export const changeAdminPassword = async ({ adminId, newPassword, notifyAdmin = false }) => {
  const response = await apiClient.patch(`/api/auth/admins/${adminId}/password`, { newPassword, notifyAdmin });
  return response.data;
};

export const approveAdminAccess = async ({ adminId }) => {
  const response = await apiClient.patch(`/api/auth/admins/${adminId}/approve-access`);
  return response.data;
};

export const checkUsername = async () => ({
  available: true,
  message: "Username availability checks are not configured.",
});

export const checkEmail = async (payload) => {
  const response = await apiClient.post("/api/auth/check-email", payload);
  return response.data;
};

export const getDecryptedAdminPassword = async (adminId) => {
  const response = await apiClient.get(`/api/auth/admins/${adminId}/decrypted-password`);
  return response.data;
};
