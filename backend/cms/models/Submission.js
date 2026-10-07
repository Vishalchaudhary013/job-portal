import mongoose from "mongoose";
import { actorSchema } from "./common.js";

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 4000 },
    author: { type: actorSchema, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // created | status | note | updated
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    by: { type: actorSchema, default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

// A response to a published form. Origin context (who, from which entry,
// from where) is stored alongside the data so admins always know where a
// submission came from.
const submissionSchema = new mongoose.Schema(
  {
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "CmsForm", required: true, index: true },
    formSlug: { type: String, default: "" },
    formVersion: { type: Number, default: 0 },
    contentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "CmsContentType", default: null, index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: "CmsContent", default: null, index: true },
    contentTitle: { type: String, default: "" },

    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    searchText: { type: String, default: "" }, // flattened values for search

    userId: { type: String, default: null, index: true },
    userEmail: { type: String, default: "" },
    userName: { type: String, default: "" },
    source: { type: String, default: "edeco", maxlength: 60 },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: { type: String, default: "new", index: true },
    notes: { type: [noteSchema], default: [] },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, minimize: false },
);

submissionSchema.index({ formId: 1, createdAt: -1 });
submissionSchema.index({ formId: 1, contentId: 1, userId: 1 });

export default mongoose.model("CmsSubmission", submissionSchema, "cms_submissions");
