import mongoose, { Schema } from "mongoose";

const customCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    opportunityType: {
      type: String,
      required: true,
      trim: true,
    },
    colors: {
      bg: {
        type: String,
        default: "#EEF2FF",
      },
      mid: {
        type: String,
        default: "#818CF8",
      },
      dark: {
        type: String,
        default: "#4F46E5",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Seeded from constants/jobCategories.js rather than created by an admin.
    // Deleting one deactivates it instead of removing the document, so the
    // seeder can't resurrect it on the next boot.
    isDefault: {
      type: Boolean,
      default: false,
    },
    // displayOrder: {
    //   type: Number,
    //   default: 100,
    // },
  },
  { timestamps: true },
);

const customCategory = mongoose.model("CustomCategory", customCategorySchema);

export default customCategory;
