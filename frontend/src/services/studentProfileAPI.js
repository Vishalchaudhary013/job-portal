import apiClient from "./apiClient";

export const getMyStudentProfile = async () => {
  const response = await apiClient.get("/api/student-profile");
  return response.data;
};

// payload: { personalInformation, contactInformation, currentAddress,
// permanentAddress, permanentSameAsCurrent, documentType, documentValue,
// advanceStep, photoFile }. Sent as multipart when photoFile is present,
// otherwise as plain JSON.
export const updateMyPersonalInformation = async (payload) => {
  const { photoFile, ...fields } = payload;

  if (photoFile) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined) return;
      formData.append(key, typeof value === "object" ? JSON.stringify(value) : value);
    });
    formData.append("photo", photoFile);
    const response = await apiClient.patch("/api/student-profile/personal", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  const response = await apiClient.patch("/api/student-profile/personal", fields);
  return response.data;
};

export const advanceProfileStep = async (step) => {
  const response = await apiClient.patch("/api/student-profile/advance-step", { step });
  return response.data;
};

export const getAcademicRecords = async () => {
  const response = await apiClient.get("/api/student-profile/academic-records");
  return response.data.records;
};

// payload: { recordType, institutionName, boardOrUniversity, passingYear,
// isCurrent, percentage, cgpa, subjects, semesters, details, documentFile }.
// Sent as multipart when documentFile is present, otherwise plain JSON.
const buildAcademicRecordRequest = (payload) => {
  const { documentFile, ...fields } = payload;
  if (!documentFile) return { body: fields, isMultipart: false };

  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    formData.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  });
  formData.append("document", documentFile);
  return { body: formData, isMultipart: true };
};

export const createAcademicRecord = async (payload) => {
  const { body, isMultipart } = buildAcademicRecordRequest(payload);
  const response = await apiClient.post("/api/student-profile/academic-records", body, {
    headers: isMultipart ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return response.data.record;
};

export const updateAcademicRecord = async (id, payload) => {
  const { body, isMultipart } = buildAcademicRecordRequest(payload);
  const response = await apiClient.patch(`/api/student-profile/academic-records/${id}`, body, {
    headers: isMultipart ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return response.data.record;
};

export const deleteAcademicRecord = async (id) => {
  const response = await apiClient.delete(`/api/student-profile/academic-records/${id}`);
  return response.data;
};

const patchSection = async (path, payload) => {
  const response = await apiClient.patch(`/api/student-profile/${path}`, payload);
  return response.data;
};

export const updateMySkills = (payload) => patchSection("skills", payload);
export const updateMyProjects = (payload) => patchSection("projects", payload);
export const updateMyExperience = (payload) => patchSection("experience", payload);
export const updateMyResearch = (payload) => patchSection("research", payload);
export const updateMyAchievements = (payload) => patchSection("achievements", payload);
export const updateMyPreferences = (payload) => patchSection("preferences", payload);
export const updateMyCareer = (payload) => patchSection("career", payload);
export const updateMyConstraints = (payload) => patchSection("constraints", payload);
export const updateMySocial = (payload) => patchSection("social", payload);
