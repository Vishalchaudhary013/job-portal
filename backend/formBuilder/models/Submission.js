import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
    },
    data: Object, //  key-value pair
    files: Object, //  store file paths
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);