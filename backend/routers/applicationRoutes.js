import express from "express";
import resumeUpload from "../middleware/resumeUpload.js";
import {
  exportApplications,
  getApplications,
  submitApplication,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { protect, requireAdmin, attachUserIfPresent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, requireAdmin, getApplications);
router.get("/export", protect, requireAdmin, exportApplications);
router.post("/", attachUserIfPresent, resumeUpload.single("resume"), submitApplication);
router.patch("/:id/status", protect, requireAdmin, updateApplicationStatus);

export default router;
