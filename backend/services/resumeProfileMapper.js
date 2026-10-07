// Maps STUDENT-CONFIRMED resume data (already reviewed/edited/conflict-
// resolved in the frontend Review screen — see resumeController.applyResume)
// onto a StudentProfile document. Never called with raw parser output.
//
// Personal/contact fields are single values the student explicitly chose
// (either the resume value or their existing value) — assigned as-is.
// Repeatable sections are appended to whatever the student already has,
// deduplicated, never replaced — resume autofill accelerates, it doesn't erase.

const dedupeBy = (existing, incoming, keyFn) => {
  const seen = new Set((existing || []).map(keyFn));
  const additions = (incoming || []).filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...(existing || []), ...additions];
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

export const applyResumeDataToProfile = (profile, payload) => {
  if (payload.personalInformation) {
    Object.assign(profile.personalInformation, payload.personalInformation);
  }
  if (payload.contactInformation) {
    Object.assign(profile.contactInformation, payload.contactInformation);
  }

  if (Array.isArray(payload.skills)) {
    profile.skills = dedupeBy(profile.skills, payload.skills, (item) => normalizeKey(item.skill));
  }
  if (Array.isArray(payload.certifications)) {
    profile.certifications = dedupeBy(profile.certifications, payload.certifications, (item) => normalizeKey(item.name));
  }
  if (Array.isArray(payload.projects)) {
    profile.projects = dedupeBy(profile.projects, payload.projects, (item) => normalizeKey(item.name));
  }
  if (Array.isArray(payload.experiences)) {
    profile.experiences = dedupeBy(profile.experiences, payload.experiences, (item) => `${normalizeKey(item.company)}|${normalizeKey(item.role)}`);
  }
  if (Array.isArray(payload.publications)) {
    profile.publications = dedupeBy(profile.publications, payload.publications, (item) => normalizeKey(item.title));
  }
  if (Array.isArray(payload.achievements)) {
    profile.achievements = dedupeBy(profile.achievements, payload.achievements, (item) => normalizeKey(item.title));
  }
  if (Array.isArray(payload.socialProfiles)) {
    profile.socialProfiles = dedupeBy(profile.socialProfiles, payload.socialProfiles, (item) => `${normalizeKey(item.platform)}|${normalizeKey(item.url)}`);
  }

  return profile;
};
