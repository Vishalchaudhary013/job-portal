import express from "express";
import {
  listMyAcademicRecords,
  createAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord,
} from "../controllers/academicRecordController.js";
import { protect, requireStudent } from "../middleware/authMiddleware.js";
import academicDocumentUpload from "../middleware/academicDocumentUpload.js";

const router = express.Router();

router.get("/", protect, requireStudent, listMyAcademicRecords);
router.post("/", protect, requireStudent, academicDocumentUpload.single("document"), createAcademicRecord);
router.patch("/:id", protect, requireStudent, academicDocumentUpload.single("document"), updateAcademicRecord);
router.delete("/:id", protect, requireStudent, deleteAcademicRecord);

export default router;
