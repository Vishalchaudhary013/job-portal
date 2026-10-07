import mongoose from "mongoose";
import { actorSchema } from "./common.js";

export const CONTENT_STATUSES = ["draft", "review", "published", "unpublished", "archived"];

const publishedSnapshotSchema = new mongoose.Schema(
  {
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    slug: { type: String, default: "" },
    title: { type: String, default: "" },
    formVersion: { type: Number, default: 0 }, // form schema version the data was validated against
    version: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: actorSchema, default: null },
  },
  { _id: false, minimize: false },
);

// One entry of a content type. `draft` is the working copy admins edit;
// `published` is the snapshot Edeco serves. Editing a published entry only
// touches the draft until it is published again.
const contentSchema = new mongoose.Schema(
  {
    contentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "CmsContentType", required: true, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    // Set by hand (vs. generated from the title). Generated slugs follow the
    // title until the first publish; after that a slug only changes on purpose.
    slugCustom: { type: Boolean, default: false },
    title: { type: String, default: "", trim: true, maxlength: 300 },
    status: { type: String, enum: CONTENT_STATUSES, default: "draft", index: true },

    draft: {
      data: { type: mongoose.Schema.Types.Mixed, default: {} },
      formRevision: { type: Number, default: 0 }, // content type revision the editor was on
    },
    published: { type: publishedSnapshotSchema, default: null },
    hasUnpublishedChanges: { type: Boolean, default: true },

    version: { type: Number, default: 0 }, // last published version number
    revision: { type: Number, default: 0 }, // optimistic-concurrency counter for the draft
    reviewNote: { type: String, default: "", maxlength: 1000 },
    mediaIds: { type: [String], default: [] },

    createdBy: { type: actorSchema, default: null },
    updatedBy: { type: actorSchema, default: null },
  },
  { timestamps: true, minimize: false },
);

contentSchema.index({ contentTypeId: 1, slug: 1 }, { unique: true });
contentSchema.index({ contentTypeId: 1, status: 1, "published.publishedAt": -1 });
contentSchema.index({ title: "text", slug: "text" });

export default mongoose.model("CmsContent", contentSchema, "cms_contents");
