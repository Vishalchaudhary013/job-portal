import express from "express";
import upload from "../utils/multer.js";
import {
  submitForm,
  getSubmissions,
} from "../controllers/submissionController.js";

const router = express.Router();

router.post("/:id/submit", upload.any(), submitForm);
router.get("/:id/submissions", getSubmissions);

export default router;