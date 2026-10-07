import express from "express";

import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  submitTemplateResponse,
  getTemplateResponses,
  getTemplateResponseCounts,
  deleteTemplateResponse,
} from "../controllers/templateController.js";
import { protect, requireSuperAdmin, attachUserIfPresent } from "../../middleware/authMiddleware.js";
import upload from "../utils/multer.js";

const router = express.Router();

// --- Template responses (standalone shared forms) --------------------
// Static / specific paths first so they aren't swallowed by "/:id".
router.get("/response-counts", protect, requireSuperAdmin, getTemplateResponseCounts);
router.delete("/responses/:responseId", protect, requireSuperAdmin, deleteTemplateResponse);
router.post("/:id/responses", attachUserIfPresent, upload.any(), submitTemplateResponse); // public — a user filling the form
router.get("/:id/responses", protect, requireSuperAdmin, getTemplateResponses);

// --- Templates ------------------------------------------------------
router.get("/", getTemplates);
router.post("/", createTemplate);
router.get("/:id", getTemplateById);
router.put("/:id", updateTemplate);
router.patch("/:id/status", toggleTemplateStatus);
router.delete("/:id", deleteTemplate);

export default router;
