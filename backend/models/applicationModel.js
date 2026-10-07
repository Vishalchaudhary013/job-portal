import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
    },
    opportunityTitle: {
      type: String,
      required: true,
      trim: true,
    },
    opportunityType: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    degree: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    year: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    skills: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    experience: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    portfolio: {
      type: String,
      default: "",
      trim: true,
    },
    linkedin: {
      type: String,
      default: "",
      trim: true,
    },
    whySelectYou: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    resume: {
      fileName: {
        type: String,
        required: false,
      },
      filePath: {
        type: String,
        required: false,
      },
      mimeType: {
        type: String,
        required: false,
      },
      size: {
        type: Number,
        required: false,
      },
    },
    status: {
      type: String,
      enum: ["New", "Shortlisted", "Rejected", "Approved", "Not Approved"],
      default: "New",
    },
    formResponse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormResponse",
      default: null,
    },
    formData: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
