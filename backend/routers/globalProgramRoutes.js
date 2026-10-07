import express from "express";
import {
  createGlobalProgram,
  deleteGlobalProgram,
  exportGlobalPrograms,
  getGlobalProgramById,
  getGlobalPrograms,
  updateGlobalProgram,
} from "../controllers/globalProgramOpportunityController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getGlobalPrograms);
router.get("/export", protect, requireAdmin, exportGlobalPrograms);
router.get("/:id", getGlobalProgramById);
router.post("/", protect, requireAdmin, createGlobalProgram);
router.put("/:id", protect, requireAdmin, updateGlobalProgram);
router.delete("/:id", protect, requireAdmin, deleteGlobalProgram);

export default router;
