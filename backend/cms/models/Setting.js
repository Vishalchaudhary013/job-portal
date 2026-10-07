import mongoose from "mongoose";

// Key/value system settings (one document per key).
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

export default mongoose.model("CmsSetting", settingSchema, "cms_settings");
