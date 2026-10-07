import fs from "fs";
import path from "path";
import multer from "multer";

// Uploads for the "Office Photos" / "Office Videos" fields on an opportunity.
// Modelled on logoUpload, but it accepts several files at once and allows
// video types alongside images, since the detail-page gallery renders both.

const uploadDir = path.join(process.cwd(), "uploads", "office-media");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeBaseName = file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    // Date.now() alone collides when a multi-file upload lands in the same
    // millisecond, which silently overwrites the earlier file.
    const suffix = Math.random().toString(36).slice(2, 8);
    cb(null, `${Date.now()}-${suffix}-${safeBaseName}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isImageOrVideo = /^(image|video)\//i.test(file.mimetype || "");
  const lowerName = String(file.originalname || "").toLowerCase();
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (isImageOrVideo && hasAllowedExt) {
    cb(null, true);
    return;
  }

  cb(
    new Error(
      `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    ),
  );
};

const officeMediaUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // videos are the reason this is larger than logos
    files: 20,
  },
});

export default officeMediaUpload;
