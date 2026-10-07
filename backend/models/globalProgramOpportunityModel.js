import mongoose from "mongoose";

const globalProgramOpportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,

      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    stipend: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "Global Program",
      enum: ["Global Program"],
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    deadline: {
      type: Date,
      required: true,
    },
    logo: {
      type: String,
      default: "",
      trim: true,
    },
    programType: {
      type: String,
      default: "",
      trim: true,
    },
    eligibility: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      default: null,
    },
    submissionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
  },
  {
    timestamps: true,
    collection: "opportunities",
  },
);

const GlobalProgramOpportunity = mongoose.model(
  "GlobalProgramOpportunity",
  globalProgramOpportunitySchema,
);

export default GlobalProgramOpportunity;
