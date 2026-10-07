import mongoose from "mongoose";

export const PROFILE_STATUS = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"];

// Ordered to match the setup wizard. Which of these a given student actually
// sees is filtered at request time by qualification (see
// config/qualificationLevels.js) — this is the full superset.
export const PROFILE_STEPS = [
  "PERSONAL",
  "ACADEMIC",
  "SKILLS",
  "PROJECTS",
  "EXPERIENCE",
  "RESEARCH",
  "ACHIEVEMENTS",
  "PREFERENCES",
  "CAREER",
  "CONSTRAINTS",
  "SOCIAL",
  "REVIEW",
];

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, default: "", trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    district: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    country: { type: String, default: "India", trim: true },
    pinCode: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    profileStatus: {
      type: String,
      enum: PROFILE_STATUS,
      default: "NOT_STARTED",
    },
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
    currentStep: {
      type: String,
      enum: PROFILE_STEPS,
      default: "PERSONAL",
    },
    // Denormalized so the (synchronous) completion engine can score the
    // ACADEMIC section without an extra query; kept in sync by
    // academicRecordController on create/delete.
    academicRecordsCount: { type: Number, default: 0, min: 0 },

    personalInformation: {
      fullName: { type: String, default: "", trim: true },
      fatherName: { type: String, default: "", trim: true },
      photoUrl: { type: String, default: "", trim: true },
      gender: { type: String, default: "", trim: true },
      dateOfBirth: { type: Date, default: null },
      nationality: { type: String, default: "", trim: true },
      category: { type: String, default: "", trim: true },
      bloodGroup: { type: String, default: "", trim: true },
    },

    // Aadhaar/Passport handled separately from the rest of the profile:
    // only an AES-encrypted value + last4 are ever persisted/returned, never
    // the full number, and `encryptedValue` is excluded from default reads.
    sensitiveInfo: {
      documentType: { type: String, enum: ["Aadhaar", "Passport", ""], default: "" },
      encryptedValue: { type: String, default: "", select: false },
      last4: { type: String, default: "" },
    },

    contactInformation: {
      mobileNumber: { type: String, default: "", trim: true },
      isWhatsApp: { type: Boolean, default: true },
      alternateMobile: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      alternateEmail: { type: String, default: "", trim: true },
    },

    currentAddress: { type: addressSchema, default: () => ({}) },
    permanentAddress: { type: addressSchema, default: () => ({}) },
    permanentSameAsCurrent: { type: Boolean, default: false },

    skills: [
      {
        _id: false,
        skill: { type: String, default: "", trim: true },
        category: { type: String, default: "", trim: true },
        proficiency: { type: String, default: "", trim: true },
        yearsOfExperience: { type: Number, default: null },
      },
    ],
    certifications: [
      {
        _id: false,
        name: { type: String, default: "", trim: true },
        issuingOrganization: { type: String, default: "", trim: true },
        issueDate: { type: Date, default: null },
        expiryDate: { type: Date, default: null },
        credentialId: { type: String, default: "", trim: true },
        credentialUrl: { type: String, default: "", trim: true },
      },
    ],

    projects: [
      {
        _id: false,
        name: { type: String, default: "", trim: true },
        description: { type: String, default: "", trim: true },
        role: { type: String, default: "", trim: true },
        technologies: { type: String, default: "", trim: true },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        projectType: { type: String, default: "", trim: true },
        githubUrl: { type: String, default: "", trim: true },
        liveUrl: { type: String, default: "", trim: true },
      },
    ],

    experiences: [
      {
        _id: false,
        company: { type: String, default: "", trim: true },
        role: { type: String, default: "", trim: true },
        employmentType: { type: String, default: "", trim: true },
        location: { type: String, default: "", trim: true },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        isCurrent: { type: Boolean, default: false },
        description: { type: String, default: "", trim: true },
        skillsUsed: { type: String, default: "", trim: true },
      },
    ],

    publications: [
      {
        _id: false,
        title: { type: String, default: "", trim: true },
        publicationType: { type: String, default: "", trim: true },
        authors: { type: String, default: "", trim: true },
        journalOrConference: { type: String, default: "", trim: true },
        publicationDate: { type: Date, default: null },
        doi: { type: String, default: "", trim: true },
        url: { type: String, default: "", trim: true },
        abstract: { type: String, default: "", trim: true },
      },
    ],

    achievements: [
      {
        _id: false,
        title: { type: String, default: "", trim: true },
        category: { type: String, default: "", trim: true },
        organization: { type: String, default: "", trim: true },
        position: { type: String, default: "", trim: true },
        date: { type: Date, default: null },
        description: { type: String, default: "", trim: true },
      },
    ],

    preferences: {
      interests: { type: [String], default: [] },
      preferredSubjects: { type: [String], default: [] },
      learningPreferences: { type: [String], default: [] },
      preferredLocation: { type: String, default: "", trim: true },
      preferredLanguage: { type: String, default: "", trim: true },
    },

    careerPreferences: {
      desiredCareer: { type: String, default: "", trim: true },
      desiredIndustry: { type: String, default: "", trim: true },
      desiredJobRole: { type: String, default: "", trim: true },
      minSalary: { type: Number, default: null },
      maxSalary: { type: Number, default: null },
      workPreference: { type: String, default: "", trim: true },
    },

    practicalConstraints: {
      budget: { type: Number, default: null },
      studyTimePerDay: { type: String, default: "", trim: true },
      workingStatus: { type: String, default: "", trim: true },
      learningMode: { type: String, default: "", trim: true },
      programType: { type: String, default: "", trim: true },
    },

    socialProfiles: [
      {
        _id: false,
        platform: { type: String, default: "", trim: true },
        url: { type: String, default: "", trim: true },
        username: { type: String, default: "", trim: true },
      },
    ],

    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;
