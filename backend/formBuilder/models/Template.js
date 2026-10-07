import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    templateKey: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: ["10th", "12th", "iti", "diploma", "bachelors", "masters", "phd", "job-application", "custom"],
      required: true,
    },

    icon: {
      type: String,
      default: "FiFileText",
    },

    fields: {
      type: Array,
      default: [],
    },

    version: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Template", templateSchema);
