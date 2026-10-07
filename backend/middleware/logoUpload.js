import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = path.join(process.cwd(), "uploads", "logos");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeBaseName = file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);
    const extension = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${Date.now()}-${safeBaseName}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ["image/jpeg", "image/png", "image/webp"];
  const lowerName = file.originalname.toLowerCase();
  const hasAllowedExt =
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".webp");

  if (allowedMime.includes(file.mimetype) || hasAllowedExt) {
    cb(null, true);
    return;
  }

  cb(new Error("Only JPG, PNG, or WEBP logo files are allowed."));
};

const logoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default logoUpload;
