import express from "express";
import {
  getMyStudentProfile,
  updateMyPersonalInformation,
  advanceProfileStep,
} from "../controllers/studentProfileController.js";
import {
  updateMySkills,
  updateMyProjects,
  updateMyExperience,
  updateMyResearch,
  updateMyAchievements,
  updateMyPreferences,
  updateMyCareer,
  updateMyConstraints,
  updateMySocial,
} from "../controllers/studentProfileSectionsController.js";
import { protect, requireStudent } from "../middleware/authMiddleware.js";
import profilePhotoUpload from "../middleware/profilePhotoUpload.js";

const router = express.Router();

router.get("/", protect, requireStudent, getMyStudentProfile);
router.patch(
  "/personal",
  protect,
  requireStudent,
  profilePhotoUpload.single("photo"),
  updateMyPersonalInformation,
);
router.patch("/advance-step", protect, requireStudent, advanceProfileStep);

router.patch("/skills", protect, requireStudent, updateMySkills);
router.patch("/projects", protect, requireStudent, updateMyProjects);
router.patch("/experience", protect, requireStudent, updateMyExperience);
router.patch("/research", protect, requireStudent, updateMyResearch);
router.patch("/achievements", protect, requireStudent, updateMyAchievements);
router.patch("/preferences", protect, requireStudent, updateMyPreferences);
router.patch("/career", protect, requireStudent, updateMyCareer);
router.patch("/constraints", protect, requireStudent, updateMyConstraints);
router.patch("/social", protect, requireStudent, updateMySocial);

export default router;
