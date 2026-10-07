import express from "express";
import resumeUpload from "../middleware/resumeUpload.js";
import {
  approveAdminAccess,
  adminLogin,
  adminSignup,
  changeAdminPassword,
  deleteUserAccount,
  forgotPassword,
  getMe,
  getUserDirectory,
  getWhatsAppStatus,
  impersonateAdmin,
  login,
  requestEmailVerification,
  requestPhoneVerification,
  resetPassword,
  signup,
  sendSignupOtps,
  studentSignup,
  updateMe,
  userLogin,
  userSignup,
  verifyEmailCode,
  verifyPhoneCode,
} from "../controllers/authController.js";
import {
  exportStakeholders,
  getMyExportSheet,
  setMyExportSheet,
} from "../controllers/stakeholderExportController.js";
import { protect, requireSuperAdmin, requireAdmin } from "../middleware/authMiddleware.js";
import {
  signupLimiter,
  otpLimiter,
  loginLimiter,
  stakeholderExportLimiter,
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/send-signup-otps", otpLimiter, sendSignupOtps);
router.post("/signup", signupLimiter, resumeUpload.single("resume"), signup);
router.post("/user-signup", signupLimiter, userSignup);
router.post("/admin-signup", signupLimiter, adminSignup);
// Used by a Test's public link (/t/:slug) — simplified signup, email OTP only.
router.post("/student-signup", signupLimiter, studentSignup);
// router.post("/super-admin-signup", superAdminSignup);
router.post("/login", loginLimiter, login);
router.post("/user-login", loginLimiter, userLogin);
router.post("/admin-login", loginLimiter, adminLogin);
router.post("/request-email-verification", otpLimiter, requestEmailVerification);
router.post("/verify-email", verifyEmailCode);
router.post("/request-phone-verification", otpLimiter, requestPhoneVerification);
router.post("/verify-phone", verifyPhoneCode);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/impersonate-admin", protect, requireSuperAdmin, impersonateAdmin);
router.delete("/users/:id", protect, requireSuperAdmin, deleteUserAccount);
router.patch(
  "/admins/:id/password",
  protect,
  requireSuperAdmin,
  changeAdminPassword,
);
router.patch(
  "/admins/:id/approve-access",
  protect,
  requireSuperAdmin,
  approveAdminAccess,
);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.get("/whatsapp-status", protect, getWhatsAppStatus);
router.get("/directory", protect, requireSuperAdmin, getUserDirectory);
router.get(
  "/stakeholders/export",
  protect,
  requireSuperAdmin,
  stakeholderExportLimiter,
  exportStakeholders,
);
router.get("/export-sheet", protect, requireAdmin, getMyExportSheet);
router.put("/export-sheet", protect, requireAdmin, setMyExportSheet);


import { getDecryptedAdminPassword, checkEmail } from "../controllers/authController.js";
router.get(
  "/admins/:id/decrypted-password",
  protect,
  requireSuperAdmin,
  getDecryptedAdminPassword,
);

router.post("/check-email", checkEmail);

export default router;
