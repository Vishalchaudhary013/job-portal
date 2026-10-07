import path from "path";
import Content from "../../models/Content.js";
import Media from "../../models/Media.js";
import { toActor } from "../../models/common.js";
import { MIME_TYPES, PRIVATE_DIR, PUBLIC_DIR, PUBLIC_URL_PREFIX, removeFile, verifyFileSignature } from "../../middleware/upload.js";
import { audit } from "../../services/audit.js";
import { HttpError, badRequest, escapeRegex, notFound, paginated, parsePagination } from "../../utils/http.js";

const serialize = (media) => ({ ...media, id: String(media._id) });

export const uploadMedia = async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw badRequest("Choose at least one file.");

  const created = [];
  const rejected = [];
  for (const file of files) {
    if (!(await verifyFileSignature(file))) {
      await removeFile(file.path);
      rejected.push({ name: file.originalname, reason: "The file's contents don't match its type." });
      continue;
    }
    const media = await Media.create({
      url: `${PUBLIC_URL_PREFIX}/${file.filename}`,
      filename: file.filename,
      originalName: String(file.originalname || "").slice(0, 255),
      mime: file.mimetype,
      size: file.size,
      kind: MIME_TYPES[file.mimetype].kind,
      alt: String(req.body?.alt || "").slice(0, 300),
      source: "library",
      uploadedBy: toActor(req.cmsUser),
    });
    created.push(serialize(media.toObject()));
  }
  if (created.length) await audit(req, { action: "media.uploaded", entityType: "media", details: { count: created.length, ids: created.map((item) => item.id) } });
  res.status(created.length ? 201 : 400).json({ items: created, rejected, ...(created.length ? {} : { message: rejected[0]?.reason || "Upload failed." }) });
};

export const listMedia = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 30, maxLimit: 100 });
  const filter = { source: req.query.source === "submission" ? "submission" : "library" };
  if (["image", "video", "file"].includes(req.query.kind)) filter.kind = req.query.kind;
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), "i");
    filter.$or = [{ originalName: regex }, { title: regex }, { alt: regex }];
  }
  const [items, total] = await Promise.all([Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Media.countDocuments(filter)]);
  res.json(paginated(items.map(serialize), total, { page, limit }));
};

export const updateMedia = async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw notFound("Media");
  if (req.body?.alt !== undefined) media.alt = String(req.body.alt).slice(0, 300);
  if (req.body?.title !== undefined) media.title = String(req.body.title).slice(0, 300);
  await media.save();
  res.json({ media: serialize(media.toObject()) });
};

export const deleteMedia = async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw notFound("Media");
  const usedBy = await Content.countDocuments({ mediaIds: String(media._id) });
  if (usedBy && req.query.force !== "1") {
    throw new HttpError(409, `This file is used by ${usedBy} entr${usedBy === 1 ? "y" : "ies"}. Remove it there first, or delete anyway.`, { usedBy });
  }
  await removeFile(path.join(media.source === "submission" ? PRIVATE_DIR : PUBLIC_DIR, media.filename));
  await Media.deleteOne({ _id: media._id });
  await audit(req, { action: "media.deleted", entityType: "media", entityId: media._id, entityLabel: media.originalName, details: { usedBy } });
  res.json({ ok: true });
};

// Streams a file to an authenticated admin. Submission attachments are never
// publicly served, so this is the only way to read them.
export const downloadMedia = async (req, res) => {
  const media = await Media.findById(req.params.id).lean();
  if (!media) throw notFound("Media");
  const dir = media.source === "submission" ? PRIVATE_DIR : PUBLIC_DIR;
  const filePath = path.join(dir, path.basename(media.filename));
  res.setHeader("Content-Type", media.mime);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(media.originalName || media.filename)}"`);
  res.sendFile(filePath, (error) => {
    if (error && !res.headersSent) res.status(404).json({ message: "File is missing on disk." });
  });
};
