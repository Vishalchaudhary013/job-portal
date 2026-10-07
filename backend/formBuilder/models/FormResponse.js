import mongoose from "mongoose";

const formResponseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true
    },
    data: {
      type: Object,
      required: true
    },
    files: {
      type: Object
    }
  },
  { timestamps: true }
);

export default mongoose.model("FormResponse", formResponseSchema);