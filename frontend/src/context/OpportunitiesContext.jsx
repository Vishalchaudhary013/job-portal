import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  API_BASE_URL,
  getErrorMessage,
  setAuthToken,
} from "../services/apiClient";
import * as authAPI from "../services/authAPI";
import * as internshipAPI from "../services/internshipAPI";
import * as globalProgramAPI from "../services/globalProgramAPI";
import * as masterclassAPI from "../services/masterclassAPI";
import * as bootcampAPI from "../services/bootcampAPI";
import * as degreeProgramAPI from "../services/degreeProgramAPI";
import * as applicationAPI from "../services/applicationAPI";

// Each opportunity `type` maps to its own dedicated API module (one file per entity —
// see src/api/internshipAPI.js, globalProgramAPI.js, etc). This table is orchestration
// logic (which module to call for a given type), not an API wrapper itself.
// NOTE: "University" is intentionally NOT here, and "Degree Programs" only exposes
// export/syncSheet — both use the richer card+detail Program CMS schema (paginated
// {data, pagination} responses, not a plain array), so they're fetched/managed
// directly by OpportunitiesTable.jsx instead of through this generic opportunities flow.
// Degree Programs still route their dashboard export + Google Sheet sync through here.
const OPPORTUNITY_TYPE_REGISTRY = {
  Internship: {
    getAll: internshipAPI.getInternships,
    create: internshipAPI.createInternship,
    update: internshipAPI.updateInternship,
    remove: internshipAPI.deleteInternship,
    export: internshipAPI.exportInternships,
    syncSheet: internshipAPI.syncInternshipsToSheet,
  },
  // Jobs and Apprenticeships are stored in the same InternshipOpportunity collection
  // (distinguished by `type`), not a separate schema — they share the "Internship"
  // backend, just their own admin form UI.
  Jobs: {
    getAll: internshipAPI.getInternships,
    create: internshipAPI.createInternship,
    update: internshipAPI.updateInternship,
    remove: internshipAPI.deleteInternship,
    export: internshipAPI.exportInternships,
    syncSheet: internshipAPI.syncInternshipsToSheet,
  },
  Apprenticeships: {
    getAll: internshipAPI.getInternships,
    create: internshipAPI.createInternship,
    update: internshipAPI.updateInternship,
    remove: internshipAPI.deleteInternship,
    export: internshipAPI.exportInternships,
    syncSheet: internshipAPI.syncInternshipsToSheet,
  },
  "Global Program": {
    getAll: globalProgramAPI.getGlobalPrograms,
    create: globalProgramAPI.createGlobalProgram,
    update: globalProgramAPI.updateGlobalProgram,
    remove: globalProgramAPI.deleteGlobalProgram,
    export: globalProgramAPI.exportGlobalPrograms,
    syncSheet: globalProgramAPI.syncGlobalProgramsToSheet,
  },
  Masterclasses: {
    getAll: masterclassAPI.getMasterclasses,
    create: masterclassAPI.createMasterclass,
    update: masterclassAPI.updateMasterclass,
    remove: masterclassAPI.deleteMasterclass,
    export: null, // backend has no export route for masterclasses
  },
  Bootcamps: {
    getAll: bootcampAPI.getBootcamps,
    create: bootcampAPI.createBootcamp,
    update: bootcampAPI.updateBootcamp,
    remove: bootcampAPI.deleteBootcamp,
    export: bootcampAPI.exportBootcamps,
    syncSheet: bootcampAPI.syncBootcampsToSheet,
  },
  // CRUD lives in OpportunitiesTable.jsx (Program CMS schema); only the dashboard
  // export + Google Sheet sync are wired through the generic flow.
  "Degree Programs": {
    export: degreeProgramAPI.exportDegreePrograms,
    syncSheet: degreeProgramAPI.syncDegreeProgramsToSheet,
  },
};

const AUTH_TOKEN_KEY = "auth_token_v1";
const IMPERSONATOR_TOKEN_KEY = "impersonator_token_v1";
const SAVED_INTERNSHIPS_KEY = "saved_internship_ids_v1";

const OpportunitiesContext = createContext(null);

const normalizeOpportunityPayload = (payload) => {
  const { logoFile, ...rest } = payload || {};
  const parsedSkills = Array.isArray(rest.skills)
    ? rest.skills
    : String(rest.skills || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

  return {
    ...rest,
    skills: parsedSkills,
    logo: rest.logo || "",
  };
};

const resolveLogoUrl = (logo) => {
  const raw = String(logo || "").trim();

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `${API_BASE_URL}${raw}`;
  }

  return raw;
};

// Exported so the Form Builder preview can shape a draft job exactly like
// the jobs this context loads.
export const mapOpportunityFromApi = (item) => ({
  ...item,
  id: item._id || item.id,
  createdBy: item.createdBy || item.mentorId,
  type: item.type || (item.mentorName ? "Masterclasses" : item.type),
  logo: resolveLogoUrl(item.logo),
  skills: Array.isArray(item.skills) ? item.skills : [],
  requiredSkills: Array.isArray(item.requiredSkills)
    ? item.requiredSkills
    : String(item.requiredSkills || "")
        .split(/\r?\n|,/) 
        .map((entry) => entry.trim())
        .filter(Boolean),
  whoCanApply: Array.isArray(item.whoCanApply)
    ? item.whoCanApply
    : String(item.whoCanApply || "")
        .split(/\r?\n|,/) 
        .map((entry) => entry.trim())
        .filter(Boolean),
  benefits: Array.isArray(item.benefits)
    ? item.benefits
    : String(item.benefits || "")
        .split(/\r?\n|,/) 
        .map((entry) => entry.trim())
        .filter(Boolean),
  cardTags: Array.isArray(item.cardTags)
    ? item.cardTags
    : String(item.cardTags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
  stipendDetails:
    item.stipendDetails && typeof item.stipendDetails === "object"
      ? item.stipendDetails
      : {
          min: null,
          max: null,
          currency: "INR",
          period: "per month",
        },
  formId: item.formId || null,
});

const buildOpportunityRequest = (body, originalPayload) => {
  const logoFile = originalPayload?.logoFile;
  const bannerImage = originalPayload?.bannerImage;
  const videoFile = originalPayload?.videoFile;
  const mentorImage = originalPayload?.mentorImage;
  const universityLogo = originalPayload?.universityLogo;
  const thumbnail = originalPayload?.thumbnail;
  const providerLogo = originalPayload?.providerLogo;
  const needsMultipart =
    ((body.type === "Internship" || body.type === "Jobs" || body.type === "Apprenticeships") && logoFile instanceof File) ||
    (body.type === "Masterclasses" && (bannerImage instanceof File || videoFile instanceof File || mentorImage instanceof File)) ||
    (body.type === "Degree Programs" && (universityLogo instanceof File || thumbnail instanceof File)) ||
    (body.type === "Bootcamps" && (providerLogo instanceof File || thumbnail instanceof File));

  if (!needsMultipart) {
    return { data: body, config: undefined };
  }

  const formData = new FormData();

  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (key === "universityLogo" || key === "thumbnail" || key === "providerLogo") {
      return;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  if (logoFile) formData.append("logoFile", logoFile);
  if (bannerImage) formData.append("bannerImage", bannerImage);
  if (videoFile) formData.append("videoFile", videoFile);
  if (mentorImage) formData.append("mentorImage", mentorImage);
  if (universityLogo instanceof File) formData.append("universityLogo", universityLogo);
  if (thumbnail instanceof File) formData.append("thumbnail", thumbnail);
  if (providerLogo instanceof File) formData.append("providerLogo", providerLogo);

  return {
    data: formData,
    config: {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  };
};

const mapApplicationFromApi = (item) => ({
  ...item,
  id: item._id || item.id,
  appliedAt: item.createdAt || item.appliedAt,
  resumeFileName: item?.resume?.fileName || item.resumeFileName || "",
  resumeFilePath: item?.resume?.filePath || item.resumeFilePath || "",
});

export const OpportunitiesProvider = ({ children }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [authToken, setAuthTokenState] = useState(
    localStorage.getItem(AUTH_TOKEN_KEY) || "",
  );
  const [impersonatorToken, setImpersonatorToken] = useState(
    localStorage.getItem(IMPERSONATOR_TOKEN_KEY) || "",
  );
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [savedInternshipIds, setSavedInternshipIds] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_INTERNSHIPS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item) => String(item));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setAuthToken(authToken);
  }, [authToken]);

  useEffect(() => {
    localStorage.setItem(
      SAVED_INTERNSHIPS_KEY,
      JSON.stringify(savedInternshipIds),
    );
  }, [savedInternshipIds]);

  const saveSession = (token, currentUser) => {
    setAuthTokenState(token);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthToken(token);
    setUser(currentUser);
  };

  const clearImpersonation = () => {
    setImpersonatorToken("");
    localStorage.removeItem(IMPERSONATOR_TOKEN_KEY);
  };

  const clearSession = () => {
    clearImpersonation();
    setAuthTokenState("");
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthToken("");
    setUser(null);
    setApplications([]);
  };

  const loadOpportunities = async () => {
    const [internships, globalPrograms, masterclasses, bootcamps] = await Promise.all([
      internshipAPI.getInternships(),
      globalProgramAPI.getGlobalPrograms(),
      masterclassAPI.getMasterclasses({ includeHidden: true }).catch(() => []),
      bootcampAPI.getBootcamps().catch(() => []),
    ]);

    const merged = [
      ...(internships || []),
      ...(globalPrograms || []),
      ...(masterclasses || []).map(mc => ({...mc, type: "Masterclasses"})),
      ...(bootcamps || []),
    ];

    setOpportunities(merged.map(mapOpportunityFromApi));
  };

  const loadApplications = async () => {
    const applications = await applicationAPI.getApplications();
    setApplications((applications || []).map(mapApplicationFromApi));
  };

  const bootstrap = async () => {
    try {
      if (authToken) {
        setAuthToken(authToken);
        const me = await authAPI.me();
        setUser(me?.user || null);
      }
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearSession();
      }
    } finally {
      try {
        await loadOpportunities();
      } catch (error) {
        setOpportunities([]);
      }
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const signup = async (payload) => {
    clearImpersonation();
    const response = await authAPI.signup(payload);
    return response;
  };

  const adminSignup = async (payload) => {
    clearImpersonation();
    const response = await authAPI.adminSignup(payload);
    return response;
  };

  const superAdminSignup = async (payload) => {
    clearImpersonation();
    const response = await authAPI.superAdminSignup(payload);
    return response;
  };

  const login = async ({ email, password }) => {
    clearImpersonation();
    const response = await authAPI.login({
      email,
      password,
    });
    saveSession(response.token, response.user);
    return response;
  };

  const userLogin = async ({ email, password }) => {
    clearImpersonation();
    const response = await authAPI.userLogin({
      email,
      password,
    });
    saveSession(response.token, response.user);
    return response;
  };

  const adminLogin = async ({ email, password }) => {
    clearImpersonation();
    const response = await authAPI.adminLogin({
      email,
      password,
    });
    saveSession(response.token, response.user);
    return response;
  };

  const requestEmailVerification = async ({ email }) => {
    const response = await authAPI.requestEmailVerification({ email });
    return response;
  };

  const verifyEmailCode = async ({ email, code }) => {
    const response = await authAPI.verifyEmailCode({ email, code });
    return response;
  };

  const requestPhoneVerification = async ({ email }) => {
    const response = await authAPI.requestPhoneVerification({ email });
    return response;
  };

  const verifyPhoneCode = async ({ email, code }) => {
    const response = await authAPI.verifyPhoneCode({ email, code });
    return response;
  };

  const forgotPassword = async ({ email }) => {
    const response = await authAPI.forgotPassword({ email });
    return response;
  };

  const resetPassword = async ({ email, code, newPassword }) => {
    const response = await authAPI.resetPassword({ email, code, newPassword });
    return response;
  };

  const updateMyProfile = async (payload) => {
    const response = await authAPI.updateMe(payload || {});
    const nextUser = response?.user || null;

    if (nextUser) {
      setUser(nextUser);
    }

    return response;
  };

  const impersonateAdmin = async (adminId) => {
    if (!impersonatorToken && authToken) {
      setImpersonatorToken(authToken);
      localStorage.setItem(IMPERSONATOR_TOKEN_KEY, authToken);
    }

    const response = await authAPI.impersonateAdmin({
      adminId,
    });

    saveSession(response.token, response.user);
    return response;
  };

  const stopImpersonation = async () => {
    if (!impersonatorToken) {
      return null;
    }

    setAuthTokenState(impersonatorToken);
    localStorage.setItem(AUTH_TOKEN_KEY, impersonatorToken);
    setAuthToken(impersonatorToken);

    clearImpersonation();

    const me = await authAPI.me();
    setUser(me?.user || null);
    return me?.user || null;
  };

  const getUserDirectory = async () => {
    const response = await authAPI.getUserDirectory();
    return response;
  };

  const getWhatsAppStatus = async () => {
    const response = await authAPI.getWhatsAppStatus();
    return response;
  };

  const deleteUserAccount = async (userId) => {
    const response = await authAPI.deleteUserAccount({ userId });
    return response;
  };

  const changeAdminPassword = async (
    adminId,
    newPassword,
    notifyAdmin = false,
  ) => {
    const response = await authAPI.changeAdminPassword({
      adminId,
      newPassword,
      notifyAdmin,
    });
    return response;
  };

  const approveAdminAccess = async (adminId) => {
    const response = await authAPI.approveAdminAccess({ adminId });
    return response;
  };

  const getDecryptedAdminPassword = async (adminId) => {
    const response = await authAPI.getDecryptedAdminPassword(adminId);
    return response;
  };

  const logout = () => {
    clearSession();
  };

  const saveInternship = (id) => {
    const normalizedId = String(id || "").trim();

    if (!normalizedId) {
      return;
    }

    setSavedInternshipIds((prev) => {
      if (prev.includes(normalizedId)) {
        return prev;
      }

      return [...prev, normalizedId];
    });
  };

  const unsaveInternship = (id) => {
    const normalizedId = String(id || "").trim();

    if (!normalizedId) {
      return;
    }

    setSavedInternshipIds((prev) =>
      prev.filter((itemId) => itemId !== normalizedId),
    );
  };

  const toggleSavedInternship = (id) => {
    const normalizedId = String(id || "").trim();

    if (!normalizedId) {
      return false;
    }

    let nextSavedState = false;
    setSavedInternshipIds((prev) => {
      if (prev.includes(normalizedId)) {
        nextSavedState = false;
        return prev.filter((itemId) => itemId !== normalizedId);
      }

      nextSavedState = true;
      return [...prev, normalizedId];
    });

    return nextSavedState;
  };

  const isInternshipSaved = (id) => {
    const normalizedId = String(id || " ").trim();
    return savedInternshipIds.includes(normalizedId);
  };

  const addOpportunity = async (payload) => {
    const body = normalizeOpportunityPayload(payload);
    const entry = OPPORTUNITY_TYPE_REGISTRY[body.type];

    if (!entry) {
      throw new Error("Opportunity type is required.");
    }

    const request = buildOpportunityRequest(body, payload);
    const created = await entry.create(request.data, request.config);
    setOpportunities((prev) => [mapOpportunityFromApi(created), ...prev]);
    return created;
  };

  const updateOpportunity = async (id, payload) => {
    const body = normalizeOpportunityPayload(payload);
    const current = opportunities.find((item) => item.id === id);
    const entry = OPPORTUNITY_TYPE_REGISTRY[body.type || current?.type];

    if (!entry) {
      throw new Error("Unable to resolve opportunity type for update.");
    }

    const request = buildOpportunityRequest(body, payload);
    const updatedRaw = await entry.update(id, request.data, request.config);
    const updated = mapOpportunityFromApi(updatedRaw);
    setOpportunities((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
    return updatedRaw;
  };

  const deleteOpportunity = async (id) => {
    const current = opportunities.find((item) => item.id === id);
    const entry = OPPORTUNITY_TYPE_REGISTRY[current?.type];

    if (!entry) {
      throw new Error("Unable to resolve opportunity type for delete.");
    }

    await entry.remove(id);
    setOpportunities((prev) => prev.filter((item) => item.id !== id));
  };

  const submitApplication = async (payload) => {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("email", payload.email);
    formData.append("phone", payload.phone);
    formData.append("college", payload.college);
    formData.append("degree", payload.degree);
    formData.append("year", payload.year);
    formData.append("skills", payload.skills);
    formData.append("experience", payload.experience);
    formData.append("portfolio", payload.portfolio || "");
    formData.append("linkedin", payload.linkedin || "");
    formData.append("whySelectYou", payload.whySelectYou);
    formData.append("opportunityTitle", payload.opportunityTitle);
    formData.append("opportunityType", payload.opportunityType);
    formData.append("company", payload.company || "");
    if (payload.opportunityId) {
      formData.append("opportunityId", payload.opportunityId);
    }
    // formData.append("resume", payload.resumeFile);
    // Resume is optional; appending null would send the text "null".
    if (payload.resumeFile) {
      formData.append("resume", payload.resumeFile);
    }

    return applicationAPI.submitApplication(formData);
  };

  const updateApplicationStatus = async (id, status) => {
    const updatedRaw = await applicationAPI.updateApplicationStatus(id, status);

    const updated = mapApplicationFromApi(updatedRaw);
    setApplications((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
    return updatedRaw;
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportOpportunities = async (format = "csv", type) => {
    const entry = OPPORTUNITY_TYPE_REGISTRY[type];

    if (!entry?.export) {
      throw new Error("Opportunity type is required for export.");
    }

    // Internship/Jobs/Apprenticeships share one endpoint; pass the section name
    // as `kind` so each gets its own file + Sheet tab. Other types ignore it.
    const { blob } = await entry.export(format, type);

    const suffix = format === "xlsx" ? "xlsx" : "csv";
    const label = type ? type.toLowerCase().replace(/\s+/g, "-") : "all";
    downloadBlob(blob, `opportunities-${label}.${suffix}`);
  };

  const exportApplications = async (format = "csv") => {
    const { blob } = await applicationAPI.exportApplications(format);
    const suffix = format === "xlsx" ? "xlsx" : "csv";
    downloadBlob(blob, `applications.${suffix}`);
  };

  // Downloads the .xlsx for a stakeholder list. `type` is one of
  // "users" | "admins" | "mentors" | "super-admins".
  const exportStakeholders = async (type) => {
    const { blob, count } = await authAPI.exportStakeholders(type);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `${type}-${stamp}.xlsx`);
    return { count };
  };

  // "Update Google Sheet" — pushes the same data to the caller's own sheet
  // WITHOUT downloading a file. Returns { sheetStatus, sheetUrl, sheetError }.
  const syncOpportunitiesToSheet = async (type) => {
    const entry = OPPORTUNITY_TYPE_REGISTRY[type];
    if (!entry?.syncSheet) {
      throw new Error("This section can't be synced to Google Sheets.");
    }
    return entry.syncSheet(type);
  };

  const syncApplicationsToSheet = async () =>
    applicationAPI.syncApplicationsToSheet();

  const syncStakeholdersToSheet = async (type) =>
    authAPI.syncStakeholdersToSheet(type);

  const getApiErrorMessage = (error, fallback) =>
    getErrorMessage(error, fallback);

  const value = useMemo(
    () => ({
      opportunities,
      applications,
      user,
      authToken,
      isImpersonating: Boolean(impersonatorToken),
      isBootstrapping,
      savedInternshipIds,
      isAdmin: ["admin", "super_admin", "mentor"].includes(user?.role),
      isSuperAdmin: user?.role === "super_admin",
      login,
      userLogin,
      adminLogin,
      signup,
      adminSignup,
      superAdminSignup,
      requestEmailVerification,
      verifyEmailCode,
      requestPhoneVerification,
      verifyPhoneCode,
      forgotPassword,
      resetPassword,
      updateMyProfile,
      getUserDirectory,
      deleteUserAccount,
      changeAdminPassword,
      approveAdminAccess,
      getWhatsAppStatus,
      getDecryptedAdminPassword,
      impersonateAdmin,
      stopImpersonation,
      logout,
      saveInternship,
      unsaveInternship,
      toggleSavedInternship,
      isInternshipSaved,
      saveJob: saveInternship,
      unsaveJob: unsaveInternship,
      toggleSavedJob: toggleSavedInternship,
      isJobSaved: isInternshipSaved,
      saveApprenticeship: saveInternship,
      unsaveApprenticeship: unsaveInternship,
      toggleSavedApprenticeship: toggleSavedInternship,
      isApprenticeshipSaved: isInternshipSaved,
      loadOpportunities,
      loadApplications,
      addOpportunity,
      updateOpportunity,
      deleteOpportunity,
      submitApplication,
      updateApplicationStatus,
      exportOpportunities,
      exportApplications,
      exportStakeholders,
      syncOpportunitiesToSheet,
      syncApplicationsToSheet,
      syncStakeholdersToSheet,
      getApiErrorMessage,
    }),
    [
      opportunities,
      applications,
      user,
      authToken,
      impersonatorToken,
      isBootstrapping,
      savedInternshipIds,
    ],
  );

  return (
    <OpportunitiesContext.Provider value={value}>
      {children}
    </OpportunitiesContext.Provider>
  );
};

export const useOpportunities = () => {
  const ctx = useContext(OpportunitiesContext);
  if (!ctx) {
    throw new Error(
      "useOpportunities must be used inside OpportunitiesProvider",
    );
  }
  return ctx;
};
