import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { cmsConfig as env } from "../config.js";
import { badRequest } from "../utils/http.js";

// Allowed upload types. SVG is deliberately excluded (it can carry script).
export const MIME_TYPES = {
  "image/jpeg": { ext: ".jpg", kind: "image" },
  "image/png": { ext: ".png", kind: "image" },
  "image/webp": { ext: ".webp", kind: "image" },
  "image/gif": { ext: ".gif", kind: "image" },
  "video/mp4": { ext: ".mp4", kind: "video" },
  "video/webm": { ext: ".webm", kind: "video" },
  "application/pdf": { ext: ".pdf", kind: "file" },
  "application/msword": { ext: ".doc", kind: "file" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: ".docx", kind: "file" },
  "application/vnd.ms-excel": { ext: ".xls", kind: "file" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: ".xlsx", kind: "file" },
  "text/csv": { ext: ".csv", kind: "file" },
  "text/plain": { ext: ".txt", kind: "file" },
};

// Library media is publicly served (under the portal's existing /uploads static
// mount, i.e. /uploads/cms/...); submission attachments live in a private
// directory that is never statically served and are only streamed to admins.
export const PUBLIC_DIR = path.resolve(env.uploadDir);
export const PRIVATE_DIR = path.resolve(env.privateUploadDir);
export const PUBLIC_URL_PREFIX = `/${env.uploadDir.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "")}`;
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(PRIVATE_DIR, { recursive: true });

const storageFor = (dir) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    // Random, unguessable names; the extension comes from the validated MIME type,
    // never from the client-supplied filename.
    filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString("hex")}${MIME_TYPES[file.mimetype].ext}`),
  });

const fileFilter = (req, file, cb) => {
  if (!MIME_TYPES[file.mimetype]) return cb(badRequest(`Files of type ${file.mimetype || "unknown"} are not allowed.`));
  cb(null, true);
};

export const libraryUpload = multer({
  storage: storageFor(PUBLIC_DIR),
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 10 },
});

export const submissionUpload = multer({
  storage: storageFor(PRIVATE_DIR),
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 },
});

// Content sniffing: the declared MIME type must match the file's magic bytes,
// so a script renamed to .png is rejected after upload.
const SIGNATURES = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/gif", test: (b) => b.subarray(0, 4).toString("ascii") === "GIF8" },
  { mime: "image/webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
  { mime: "application/pdf", test: (b) => b.subarray(0, 5).toString("ascii") === "%PDF-" },
  { mime: "video/mp4", test: (b) => b.subarray(4, 8).toString("ascii") === "ftyp" },
  { mime: "video/webm", test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
];

export const verifyFileSignature = async (file) => {
  const rule = SIGNATURES.find((signature) => signature.mime === file.mimetype);
  if (!rule) return true; // office/text formats: no reliable short signature check
  const handle = await fs.promises.open(file.path, "r");
  try {
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    return rule.test(buffer);
  } finally {
    await handle.close();
  }
};

export const removeFile = (filePath) => fs.promises.unlink(filePath).catch(() => {});

// Checks an uploaded file against a field's own accept / size settings.
export const checkAgainstField = (file, field) => {
  const accept = String(field?.validation?.accept || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (accept.length && !accept.some((rule) => (rule.endsWith("/*") ? file.mimetype.startsWith(rule.slice(0, -1)) : rule === file.mimetype))) {
    return `This field accepts ${accept.join(", ")}.`;
  }
  const maxMb = Number(field?.validation?.maxFileSizeMB);
  if (maxMb && file.size > maxMb * 1024 * 1024) return `Files must be smaller than ${maxMb} MB.`;
  return null;
};
