import mongoose from "mongoose";

/**
 * A submission to a standalone Form Builder template — i.e. a template shared directly
 * (via /shared-template/:id or the Form Templates tool) and filled in by a user, NOT tied
 * to any opportunity/application. Super admins review these on the Templates dashboard.
 */
const templateResponseSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
      index: true,
    },
    templateName: { type: String, default: "" },
    // { fieldId: value } — value is whatever the field produced (string, array, object).
    data: { type: Object, default: {} },
    // { fieldId: "/uploads/xxx" } — stored paths for any uploaded files.
    files: { type: Object, default: {} },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TemplateResponse", templateResponseSchema);
