import express from "express";
import {
  createInternship,
  deleteInternship,
  exportInternships,
  getInternshipById,
  getInternships,
  updateInternship,
  attachForm,
  uploadOfficeMedia,
} from "../controllers/internshipOpportunityController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import logoUpload from "../middleware/logoUpload.js";
import officeMediaUpload from "../middleware/officeMediaUpload.js";

const router = express.Router();

router.get("/", getInternships);
router.get("/export", protect, requireAdmin, exportInternships);
// Declared before "/:id" so "office-media" is never read as an id.
router.post(
  "/office-media",
  protect,
  requireAdmin,
  officeMediaUpload.array("files", 20),
  uploadOfficeMedia,
);
router.get("/:id", getInternshipById);
router.post(
  "/",
  protect,
  requireAdmin,
  logoUpload.single("logoFile"),
  createInternship,
);
router.put(
  "/:id",
  protect,
  requireAdmin,
  logoUpload.single("logoFile"),
  updateInternship,
);
router.delete("/:id", protect, requireAdmin, deleteInternship);
router.put("/:id/attach-form", protect, requireAdmin, attachForm);

export default router;
