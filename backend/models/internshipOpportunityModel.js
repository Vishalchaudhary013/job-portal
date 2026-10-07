import mongoose from "mongoose";

const internshipOpportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    departmentCategory: { type: String, default: "", trim: true },
    openings: { type: Number, default: null },
    cityState: { type: String, default: "", trim: true },
    googleLocationLink: { type: String, default: "", trim: true },
    workMode: { type: String, enum: ["Remote", "Hybrid", "In Office", "On-site"], default: "In Office", trim: true },
    // Not required at the schema level — Jobs postings (type: "Jobs") don't collect a duration.
    duration: { type: String, default: "", trim: true },
    internshipType: { type: String, default: "", trim: true },
    workingHours: { type: String, enum: ["Full-time", "Part-time", ""], default: "", trim: true },

    applicationsOpenDate: { type: Date, default: null },
    deadline: { type: Date, required: true }, 
    selectionAnnouncementDate: { type: Date, default: null },
    startDate: { type: Date, default: null },

    stipendType: { type: String, enum: ["Fixed", "Performance-based", "Unpaid", "Paid"], default: "Fixed", trim: true },
    stipend: { type: String, default: "", trim: true }, 
    stipendCurrency: { type: String, default: "INR", trim: true },
    incentivesBonuses: { type: String, default: "", trim: true },
    perks: { type: [String], default: [] }, 

    targetEducation: { type: [String], default: [] },
    batchEligibility: { type: [String], default: [] },
    minimumCGPA: { type: Number, default: null },
    requiredSkills: { type: [String], default: [] },
    experienceLevel: { type: String, default: "", trim: true },

    minimumRequirements: { type: String, default: "", trim: true }, 
    preferredQualifications: { type: String, default: "", trim: true }, 

    aboutProgram: { type: String, default: "", trim: true },
    description: { type: String, required: true, trim: true }, 
    whatYouWillLearn: { type: String, default: "", trim: true },

    selectionRounds: { type: [String], default: [] },
    assignmentLink: { type: String, default: "", trim: true },
    customScreeningQuestion: { type: String, default: "", trim: true },

    company: { type: String, required: true, trim: true },
    website: { type: String, default: "", trim: true },
    industry: { type: String, default: "", trim: true },
    headquarters: { type: String, default: "", trim: true },
    foundedYear: { type: String, default: "", trim: true },
    companySize: { type: String, default: "", trim: true }, 
    companyClassification: { type: String, default: "", trim: true },
    logo: { type: String, default: "", trim: true },
    featuredListing: { type: Boolean, default: false },
    hiringManager: { type: String, default: "", trim: true },
    showHiringManager: { type: Boolean, default: true },
    socialProofLinks: {
      linkedin: { type: String, default: "", trim: true },
      twitter: { type: String, default: "", trim: true },
      instagram: { type: String, default: "", trim: true },
    },
    cultureVideos: { type: [String], default: [] },
    officePhotos: { type: [String], default: [] },
    virtualTour: { type: String, default: "", trim: true },
    companyOverview: { type: String, default: "", trim: true },
    specialties: { type: String, default: "", trim: true },

    
    location: { type: String, trim: true }, 
    type: { type: String, enum: ["Internship", "Global Program", "Jobs", "Apprenticeships", "Bootcamps", "Masterclasses", "Degree Programs", "PG Programs"], required: true },
    skills: { type: [String], default: [] }, 
    cardTags: { type: [String], default: [] },
    frontendTags: { type: [String], default: [] },
    department: { type: String, default: "", trim: true }, 
    functionalRole: { type: String, default: "", trim: true }, 
    companyType: { type: String, default: "", trim: true }, 
    whoCanApply: { type: [String], default: [] }, 
    benefits: { type: [String], default: [] }, 
    stipendDetails: { 
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: "INR", trim: true },
      period: { type: String, default: "per month", trim: true },
    },
    listing: { type: String, default: "", trim: true },
    programType: { type: String, default: "", trim: true },
    eligibility: { type: String, default: "", trim: true },

    // Listing-page filter facets. Graduation year reuses `batchEligibility`
    // and job role reuses `functionalRole` rather than duplicating them.
    educationLevel: { type: [String], default: [] },
    degree: { type: [String], default: [] },
    fieldOfStudy: { type: [String], default: [] },
    yearOfStudy: { type: [String], default: [] },
    hiringPreference: { type: [String], default: [] },
    noticePeriod: { type: String, default: "", trim: true },
    relocation: { type: String, default: "", trim: true },
    ppoStatus: { type: String, default: "", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", default: null },
    submissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
    // Job type shown on cards and used by the /jobs "Job Type" filter.
    jobType: { type: String, default: "", trim: true },
    // Records published from the Form Builder are kept in sync by
    // services/formBuilderOpportunitySync.js; cmsContentId links back to the entry.
    source: { type: String, default: "admin", trim: true },
    cmsContentId: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
    collection: "opportunities",
  }
);

// Indexes for the listing-page filters. `type` leads the compound indexes
// because every listing query is scoped to one opportunity type first.
internshipOpportunitySchema.index({ type: 1, createdAt: -1 });
internshipOpportunitySchema.index({ type: 1, deadline: 1 });
internshipOpportunitySchema.index({ type: 1, workMode: 1 });
internshipOpportunitySchema.index({ type: 1, workingHours: 1 });
internshipOpportunitySchema.index({ type: 1, stipendType: 1 });
internshipOpportunitySchema.index({ type: 1, "stipendDetails.max": 1 });
internshipOpportunitySchema.index({ type: 1, location: 1 });
internshipOpportunitySchema.index({ type: 1, skills: 1 });
internshipOpportunitySchema.index({ type: 1, industry: 1 });
internshipOpportunitySchema.index({ type: 1, companyType: 1 });
internshipOpportunitySchema.index({ title: "text", company: "text", description: "text", skills: "text" });

const InternshipOpportunity = mongoose.model("InternshipOpportunity", internshipOpportunitySchema);
export default InternshipOpportunity;
