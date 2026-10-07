import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    formSchema: {
      fields: {
        type: Array,
        default: [],
      },
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    publishedUrl: {
      type: String,
      default: "",
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      default: null,
    },

    templateVersion: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Form", formSchema);