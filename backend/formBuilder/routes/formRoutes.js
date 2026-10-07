import express from "express";
import upload from "../utils/multer.js";
import { attachUserIfPresent } from "../../middleware/authMiddleware.js";

import {
  createForm,
  getFormById,
  updateForm,
  deleteForm,
  publishForm,
  getPublicForm,
  submitForm,
  getFormResponses,
  getSubmissions,
  getInternshipResponsesSummary,deleteResponse
} from "../controllers/formController.js";

const router = express.Router();

// ✅ CREATE / UPDATE
router.post("/", upload.any(), createForm);
router.put("/:id", upload.any(), updateForm);

// ✅ STATIC ROUTES FIRST
router.get("/responses-summary", getInternshipResponsesSummary);
router.delete("/response/:id", deleteResponse);

// ✅ PUBLIC ROUTES
router.get("/public/:id", getPublicForm);
router.post("/public/:id/submit", attachUserIfPresent, upload.any(), submitForm);

// ✅ NESTED ROUTES
router.get("/:id/responses", getFormResponses);
router.get("/:id/submissions", getSubmissions);

// ✅ ACTION ROUTES
router.post("/:id/publish", publishForm);

// ✅ DYNAMIC ID ROUTES LAST
router.get("/:id", getFormById);
router.delete("/:id", deleteForm);

export default router;