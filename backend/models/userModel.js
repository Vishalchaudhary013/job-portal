import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      enum: ["student", "employer", "user", "admin", "super_admin", "mentor"],
      default: "student",
      trim: true,
    },
    firstName: {
      type: String,
      default: "",
      trim: true,
      required: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCodeHash: {
      type: String,
      default: "",
      select: false,
    },
    emailVerificationCodeExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    password: {
      type: String,
      required: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: true,
    },
    phoneVerificationCodeHash: {
      type: String,
      default: "",
      select: false,
    },
    phoneVerificationCodeExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetCodeHash: {
      type: String,
      default: "",
      select: false,
    },
    passwordResetCodeExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    latestQualification: {
      type: String,
      default: "",
      trim: true,
    },
    yearOfPassing: {
      type: String,
      default: "",
      trim: true,
    },
    semester: {
      type: String,
      default: "",
      trim: true,
    },
    collegeName: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
    whatsappNumber: {
      type: String,
      default: "",
      trim: true,
    },
    resumeFileName: {
      type: String,
      default: "",
      trim: true,
    },
    resumeFilePath: {
      type: String,
      default: "",
      trim: true,
    },
    organizationName: {
      type: String,
      default: "",
      trim: true,
    },
    organizationType: {
      type: String,
      default: "",
      trim: true,
    },
    username: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    agreeToWhatsAppUpdates: {
      type: Boolean,
      default: false,
    },
    agreeToTerms: {
      type: Boolean,
      default: false,
    },
    experiencedDomain: {
      type: String,
      default: "",
      trim: true,
    },
    companiesWorkedAt: {
      type: String,
      default: "",
      trim: true,
    },
    yearsOfExperience: {
      type: String,
      default: "",
      trim: true,
    },
    teachingExperience: {
      type: String,
      default: "",
      trim: true,
    },
    engagementType: {
      type: [String],
      default: [],
    },
    topicsToTeach: {
      type: String,
      default: "",
      trim: true,
    },
    motivationForTeaching: {
      type: [String],
      default: [],
    },
    socialMediaFollowers: {
      type: String,
      default: "",
      trim: true,
    },
    linkedinProfile: {
      type: String,
      default: "",
      trim: true,
    },
    twitterProfile: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin", "mentor"],
      default: "user",
    },
    adminApprovalStatus: {
      type: String,
      enum: ["pending", "approved"],
      default: "approved",
    },
    adminApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminApprovedAt: {
      type: Date,
      default: null,
    },
    encryptedPassword: {
      type: String,
      default: "",
      select: false,
    },
    // Google Spreadsheet this account's dashboard exports are mirrored into.
    // Auto-created and shared with the account's email on the first export;
    // reused for every export afterwards (one tab per data type).
    exportSpreadsheetId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
