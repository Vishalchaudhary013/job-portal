import mongoose from "mongoose";
import { actorSchema } from "./common.js";

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // "/uploads/<file>" — made absolute when served
    filename: { type: String, required: true },
    originalName: { type: String, default: "" },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    kind: { type: String, enum: ["image", "video", "file"], required: true, index: true },
    alt: { type: String, default: "", maxlength: 300 },
    title: { type: String, default: "", maxlength: 300 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    // "library" = uploaded by an admin; "submission" = attached to a response.
    source: { type: String, enum: ["library", "submission"], default: "library", index: true },
    uploadedBy: { type: actorSchema, default: null },
  },
  { timestamps: true, minimize: false },
);

mediaSchema.index({ originalName: "text", title: "text", alt: "text" });

export default mongoose.model("CmsMedia", mediaSchema, "cms_media");
