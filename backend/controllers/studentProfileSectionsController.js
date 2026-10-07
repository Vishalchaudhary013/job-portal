import { computeStudentProfileCompletion } from "../utils/studentProfileCompletion.js";
import { getVisibleStepsForQualification } from "../config/qualificationLevels.js";
import { getOrCreateStudentProfile, buildStatusPayload } from "./studentProfileController.js";

// Every remaining wizard step (Skills through Social) is a single
// PATCH-able chunk of the profile document — same shape as
// updateMyPersonalInformation — so one factory handles assign + advanceStep +
// recompute-completion + save for all of them, driven by a per-section
// `assign(profile, body)` function.
const makeSectionHandler = (stepId, assign) => async (req, res, next) => {
  try {
    const profile = await getOrCreateStudentProfile(req.user._id);
    const body = req.body || {};

    assign(profile, body);

    if (body.advanceStep) {
      const visibleSteps = getVisibleStepsForQualification(req.user.latestQualification);
      const currentIndex = visibleSteps.indexOf(stepId);
      profile.currentStep = currentIndex >= 0 ? visibleSteps[currentIndex + 1] || stepId : stepId;
    }

    const { status } = computeStudentProfileCompletion(profile, req.user.latestQualification);
    profile.profileStatus = status;
    if (status === "COMPLETE" && !profile.completedAt) {
      profile.completedAt = new Date();
    }

    await profile.save();

    res.status(200).json(buildStatusPayload(profile, req.user.latestQualification));
  } catch (error) {
    next(error);
  }
};

const asArray = (value) => (Array.isArray(value) ? value : []);

export const updateMySkills = makeSectionHandler("SKILLS", (profile, body) => {
  profile.skills = asArray(body.skills);
  profile.certifications = asArray(body.certifications);
});

export const updateMyProjects = makeSectionHandler("PROJECTS", (profile, body) => {
  profile.projects = asArray(body.projects);
});

export const updateMyExperience = makeSectionHandler("EXPERIENCE", (profile, body) => {
  profile.experiences = asArray(body.experiences);
});

export const updateMyResearch = makeSectionHandler("RESEARCH", (profile, body) => {
  profile.publications = asArray(body.publications);
});

export const updateMyAchievements = makeSectionHandler("ACHIEVEMENTS", (profile, body) => {
  profile.achievements = asArray(body.achievements);
});

export const updateMyPreferences = makeSectionHandler("PREFERENCES", (profile, body) => {
  profile.preferences = {
    interests: asArray(body.preferences?.interests),
    preferredSubjects: asArray(body.preferences?.preferredSubjects),
    learningPreferences: asArray(body.preferences?.learningPreferences),
    preferredLocation: body.preferences?.preferredLocation || "",
    preferredLanguage: body.preferences?.preferredLanguage || "",
  };
});

export const updateMyCareer = makeSectionHandler("CAREER", (profile, body) => {
  profile.careerPreferences = {
    desiredCareer: body.careerPreferences?.desiredCareer || "",
    desiredIndustry: body.careerPreferences?.desiredIndustry || "",
    desiredJobRole: body.careerPreferences?.desiredJobRole || "",
    minSalary: body.careerPreferences?.minSalary ?? null,
    maxSalary: body.careerPreferences?.maxSalary ?? null,
    workPreference: body.careerPreferences?.workPreference || "",
  };
});

export const updateMyConstraints = makeSectionHandler("CONSTRAINTS", (profile, body) => {
  profile.practicalConstraints = {
    budget: body.practicalConstraints?.budget ?? null,
    studyTimePerDay: body.practicalConstraints?.studyTimePerDay || "",
    workingStatus: body.practicalConstraints?.workingStatus || "",
    learningMode: body.practicalConstraints?.learningMode || "",
    programType: body.practicalConstraints?.programType || "",
  };
});

export const updateMySocial = makeSectionHandler("SOCIAL", (profile, body) => {
  profile.socialProfiles = asArray(body.socialProfiles);
});
