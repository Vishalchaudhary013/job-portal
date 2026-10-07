import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import { API_BASE_URL } from "../../../services/apiClient";

const AdminContext = createContext(null);

export const useAdminContext = () => useContext(AdminContext);

const initialForm = {
  title: "",
  departmentCategory: "",
  openings: "",
  cityState: "",
  googleLocationLink: "",
  workMode: "In Office",
  duration: "",
  durationUnit: "Months",
  internshipType: "",
  workingHours: "",
  university: "",
  category: "",
  mode: "",
  universityLogo: "",
  thumbnail: "",
  annualFeesAmount: "",
  annualFeesCurrency: "INR",
  cardBadge: "",
  approvalBadge: "",

  provider: "",
  providerLogo: "",
  rating: "",
  level: "",
  studyMode: "",
  language: "",
  price: "",
  discountPrice: "",
  currency: "INR",
  certificateIncluded: false,
  placementAssistance: false,
  studentsEnrolled: "",
  nextBatchDate: "",
  badge: "",
  featured: false,

  applicationsOpenDate: "",
  deadline: "",
  selectionAnnouncementDate: "",
  startDate: "",

   
  stipendType: "Fixed",
  stipend: "",
  isUnpaid: false,
  stipendCurrency: "INR",
  incentivesBonuses: "",
  perks: [],

  
  targetEducation: [],
  batchEligibility: [],
  minimumCGPA: "",
  requiredSkills: "",
  experienceLevel: "",
  isShortVideo: false,

  
  minimumRequirements: "",
  preferredQualifications: "",

  
  aboutProgram: "",
  description: "",
  whatYouWillLearn: "",

  
  selectionRounds: [],
  assignmentLink: "",
  customScreeningQuestion: "",

  
  company: "",
  website: "",
  industry: "",
  headquarters: "",
  foundedYear: "",
  companySize: "",
  companyClassification: "",
  logo: "",
  featuredListing: false,
  hiringManager: "",
  socialProofLinks: {
    linkedin: "",
    twitter: "",
    instagram: "",
  },
  cultureVideos: [],
  officePhotos: [],
  virtualTour: "",
  companyOverview: "",
  specialties: "",

  
  location: "",
  mentorImage: "",
  goLiveDate: "",
  type: "Internship",
  skills: "",
  cardTags: "",
  frontendTags: "",
  department: "",
  functionalRole: "",
  companyType: "",
  whoCanApply: "",
  benefits: "",
  programType: "",
  eligibility: "",
  showHiringManager: true,
  formId: null,
  showInFrontend: true,
  level: "",
  highlights: [
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" }
  ],
  faqs: [
    { question: "", answer: "" }
  ],
};

const resolveOwnerId = (opportunity) => {
  const owner = opportunity?.createdBy;
  if (!owner) return "";
  if (typeof owner === "string") return owner;
  return owner._id || owner.id || "";
};

const resolveResumeUrl = (application) => {
  const filePath = application?.resumeFilePath || application?.resume?.filePath;
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${API_BASE_URL}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
};

const toMultiline = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  return String(value || "");
};

const isOpportunityClosed = (opportunity) => {
  const deadline = opportunity?.deadline;
  if (!deadline) return false;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

export const AdminProvider = ({ children, dashboardType = "admin" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperDashboard = dashboardType === "super";
  const {
    opportunities,
    applications,
    user,
    logout,
    isAdmin,
    isSuperAdmin,
    isBootstrapping,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    loadApplications,
    getUserDirectory,
    deleteUserAccount,
    changeAdminPassword,
    approveAdminAccess,
    getWhatsAppStatus,
    getDecryptedAdminPassword,
    impersonateAdmin,
    stopImpersonation,
    isImpersonating,
    updateApplicationStatus,
    exportOpportunities,
    exportApplications,
    exportStakeholders,
    syncOpportunitiesToSheet,
    syncApplicationsToSheet,
    syncStakeholdersToSheet,
    getApiErrorMessage,
  } = useOpportunities();

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [requiredSkillInputs, setRequiredSkillInputs] = useState(["", "", ""]);
  const [benefitInputs, setBenefitInputs] = useState(["", "", "", ""]);
  const [activeSection, setActiveSection] = useState(
    dashboardType === "mentor"
      ? "Masterclasses"
      : dashboardType === "super"
        ? "Overview"
        : "Internship",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [closedApplicationView, setClosedApplicationView] = useState("Internship");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [applicationsLoaded, setApplicationsLoaded] = useState(false);
  const [openingAdminId, setOpeningAdminId] = useState("");
  const [directory, setDirectory] = useState({
    admins: [],
    users: [],
    superAdmins: [],
    mentors: [],
    counts: { admins: 0, users: 0, superAdmins: 0, mentors: 0, total: 0 },
  });
  const [directoryLoaded, setDirectoryLoaded] = useState(false);
  // Which stakeholder list is mid-export ("" when idle), plus a transient status
  // line describing the last Excel + Google Sheets export (shared by every
  // dashboard export — stakeholders, applications, opportunities).
  const [stakeholderExportBusy, setStakeholderExportBusy] = useState("");
  const [exportSheetMessage, setExportSheetMessage] = useState("");
  const [exportSheetUrl, setExportSheetUrl] = useState("");
  // True while a "Update Google Sheet" (sheet-only, no file) request is running.
  const [sheetSyncBusy, setSheetSyncBusy] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState(null);
  const [whatsAppStatusLoading, setWhatsAppStatusLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState("");
  const [passwordEditorAdminId, setPasswordEditorAdminId] = useState("");
  const [adminPasswordForm, setAdminPasswordForm] = useState({ newPassword: "", confirmPassword: "", notifyAdmin: false });
  const [showAdminPassword, setShowAdminPassword] = useState({ newPassword: false, confirmPassword: false });
  const [changingPasswordAdminId, setChangingPasswordAdminId] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
  const [adminApprovalMessage, setAdminApprovalMessage] = useState("");
  const [approvingAdminId, setApprovingAdminId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [filterOpportunityId, setFilterOpportunityId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState("");
  const [statusChangeMessage, setStatusChangeMessage] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const fetchDecryptedPassword = async (adminId) => {
    try {
      setVisiblePasswords((prev) => ({ ...prev, [adminId]: "loading" }));
      const data = await getDecryptedAdminPassword(adminId);
      setVisiblePasswords((prev) => ({ ...prev, [adminId]: data.password }));
    } catch (apiError) {
      const message = getApiErrorMessage(apiError);
      if (message === "Password not available for decryption") {
        setVisiblePasswords((prev) => ({ ...prev, [adminId]: "N/A" }));
      } else {
        setVisiblePasswords((prev) => ({ ...prev, [adminId]: "error" }));
      }
    }
  };

  useEffect(() => {
    if (location.state?.editId && opportunities.length > 0) {
      const item = opportunities.find((o) => (o.id || o._id) === location.state.editId);
      if (item) handleEdit(item);
      navigate(location.pathname, { replace: true, state: { ...location.state, editId: null } });
    }
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
      navigate(location.pathname, { replace: true, state: { ...location.state, activeSection: null } });
    }
  }, [location.state, opportunities, navigate, location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const impersonateId = params.get("impersonate");
    
    if (impersonateId && user?.role === "super_admin" && !openingAdminId) {
      const doImpersonate = async () => {
        try {
          setOpeningAdminId(impersonateId);
          await impersonateAdmin(impersonateId);
          setActiveSection(dashboardType === "mentor" ? "Masterclasses" : "Internship");
          
          navigate(location.pathname, { replace: true });
        } catch (apiError) {
          setError(getApiErrorMessage(apiError, "Failed to impersonate admin"));
        } finally {
          setOpeningAdminId("");
        }
      };
      doImpersonate();
    }
  }, [location.search, user?.role, openingAdminId, navigate, location.pathname]);

  const title = editingId ? `Edit ${form.type}` : `Create ${form.type}`;

  const sorted = useMemo(() => {
    const userId = String(user?.id || user?._id || "");
    const opportunityTypes = ["Internship", "Apprenticeships", "Jobs", "Masterclasses", "Bootcamps", "Certificate Programs", "Post Graduate Programs", "Degree Programs", "Global Program"];
    return [...opportunities]
      .filter((item) => resolveOwnerId(item) === userId && opportunityTypes.includes(item.type))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime());
  }, [opportunities, user?.id]);

  // Inactive (deadline-passed) opportunities used to be filtered out of every type tab entirely
  // — the only way to see one was the Internship/Global-Program-only "Closed Application" tab.
  // Now every tab shows both, distinguished by the Active/Inactive badge in the table.
  const allSystemOpportunities = useMemo(() => {
    const opportunityTypes = ["Internship", "Apprenticeships", "Jobs", "Masterclasses", "Bootcamps", "Certificate Programs", "Post Graduate Programs", "Degree Programs", "Global Program"];
    return [...opportunities]
      .filter((item) => opportunityTypes.includes(item.type))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime());
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    if (activeSection === "All Application") {
      return allSystemOpportunities;
    }
    const opportunityTypes = ["Internship", "Apprenticeships", "Jobs", "Masterclasses", "Bootcamps", "Certificate Programs", "Post Graduate Programs", "Degree Programs", "Global Program"];
    if (opportunityTypes.includes(activeSection)) {
      return sorted.filter((item) => item.type === activeSection);
    }
    if (activeSection === "Closed Application") {
      return sorted.filter((item) => isOpportunityClosed(item));
    }
    return sorted;
  }, [sorted, activeSection, allSystemOpportunities]);

  const isAllApplicationPanel = activeSection === "All Application";

  const isInternshipPanel = activeSection === "Internship";
  const isGlobalProgramPanel = activeSection === "Global Program";
  const isJobsPanel = activeSection === "Jobs";
  const isBootcampsPanel = activeSection === "Bootcamps";
  const isMasterclassesPanel = activeSection === "Masterclasses";
  const isDegreeProgramsPanel = activeSection === "Degree Programs";
  const isPGProgramsPanel = activeSection === "PG Programs";
  const isClosedApplicationPanel = activeSection === "Closed Application";
  const isSuperStatsSection = isSuperDashboard && activeSection === "Overview";
  const isSuperPostSection = isSuperDashboard && activeSection === "Post Opportunity";
  const isSuperAdminsSection = activeSection === "Admins";
  const isSuperUsersSection = activeSection === "Users";
  const isSuperMentorsSection = activeSection === "Mentors";
  const isSuperApprovedRequestsSection = activeSection === "Approved Requests";
  const isAnySuperDirectorySection = isSuperUsersSection || isSuperAdminsSection || isSuperMentorsSection || isSuperApprovedRequestsSection;

  const closedInternships = sorted.filter((item) => item.type === "Internship" && isOpportunityClosed(item) && item.title && item.company);
  const closedGlobalPrograms = sorted.filter((item) => item.type === "Global Program" && isOpportunityClosed(item) && item.title && item.company);
  const closedApplicationItems = closedApplicationView === "Internship" ? closedInternships : closedGlobalPrograms;
  const closedApplicationTitle = closedApplicationView === "Internship" ? "Closed Internship" : "Closed Global Program";

  const ownedOpportunityIds = useMemo(
    () => new Set(sorted.map((item) => String(item.id || "").trim()).filter(Boolean)),
    [sorted],
  );

  const scopedApplications = useMemo(
    () =>
      applications.filter((application) => {
        const directOpportunityId = String(
          application.opportunityId || application.opportunity || application?.opportunity?._id || application?.opportunity?.id || "",
        ).trim();
        const matchesOwnership = directOpportunityId && ownedOpportunityIds.has(directOpportunityId);
        if (filterOpportunityId) {
          return matchesOwnership && directOpportunityId === filterOpportunityId;
        }
        return matchesOwnership;
      }),
    [applications, ownedOpportunityIds, filterOpportunityId],
  );

  const totalPages = Math.ceil(scopedApplications.length / itemsPerPage);
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return scopedApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [scopedApplications, currentPage, itemsPerPage]);

  const totalClosedPages = Math.ceil(closedApplicationItems.length / itemsPerPage);
  const paginatedClosedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return closedApplicationItems.slice(startIndex, startIndex + itemsPerPage);
  }, [closedApplicationItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, filterOpportunityId, closedApplicationView]);

  const userCount = directory.counts?.users || 0;
  const adminCount = directory.counts?.admins || 0;
  const superAdminCount = directory.counts?.superAdmins || 0;
  const totalAccountCount = directory.counts?.total || userCount + adminCount + superAdminCount;
  const toPercent = (value) => totalAccountCount > 0 ? Math.round((Number(value || 0) / totalAccountCount) * 100) : 0;
  const userPercent = toPercent(userCount);
  const adminPercent = toPercent(adminCount);
  const superAdminPercent = toPercent(superAdminCount);

  const ownerNameById = useMemo(() => {
    const entries = [...(directory.admins || []), ...(directory.superAdmins || []), ...(directory.users || [])];
    const map = new Map();
    entries.forEach((entry) => {
      const id = String(entry?._id || entry?.id || "").trim();
      if (!id) return;
      map.set(id, entry.fullName || entry.email || "Unknown admin");
    });
    const currentUserId = String(user?.id || user?._id || "").trim();
    if (currentUserId && !map.has(currentUserId)) {
      map.set(currentUserId, user?.fullName || user?.email || "Unknown admin");
    }
    return map;
  }, [directory.admins, directory.superAdmins, directory.users, directory.mentors, user]);

  const resolveOwnerName = (opportunity) => {
    const owner = opportunity?.createdBy;
    if (!owner) return "Unknown admin";
    if (typeof owner === "object") return owner.fullName || owner.email || "Unknown admin";
    const ownerId = String(owner).trim();
    if (!ownerId) return "Unknown admin";
    const currentUserId = String(user?.id || user?._id || "").trim();
    if (ownerId && currentUserId && ownerId === currentUserId) return user?.fullName || user?.email || "You";
    return ownerNameById.get(ownerId) || "Unknown admin";
  };

  const recentApplications = useMemo(() => {
    const sectionApplications = activeSection === "Applications"
      ? scopedApplications
      : scopedApplications.filter((item) => item.opportunityType === activeSection);
    return [...sectionApplications]
      .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime())
      .slice(0, 5);
  }, [scopedApplications, activeSection]);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!user) { navigate("/login"); return; }
    if (!isAdmin) { navigate("/"); return; }
    if (isSuperDashboard && !isSuperAdmin) { navigate("/admin-dashboard"); }
  }, [isBootstrapping, user, isAdmin, isSuperAdmin, isSuperDashboard, navigate]);

  useEffect(() => {
    if (!isAdmin || applicationsLoaded) return;
    const run = async () => {
      try {
        setError("");
        await loadApplications();
        setApplicationsLoaded(true);
      } catch (apiError) {
        setError(getApiErrorMessage(apiError, "Failed to load applications."));
      }
    };
    run();
  }, [isAdmin, applicationsLoaded]);

  useEffect(() => {
    // Load the directory for the directory sections and for the Overview stat
    // cards (total users/admins, Resume Builder count, ...).
    if (!isSuperDashboard || !isSuperAdmin || directoryLoaded || !(isAnySuperDirectorySection || isSuperStatsSection)) return;
    const run = async () => {
      try {
        setError("");
        const result = await getUserDirectory();
        setDirectory(result);
        setDirectoryLoaded(true);
      } catch (apiError) {
        setError(getApiErrorMessage(apiError, "Failed to load users directory."));
      }
    };
    run();
  }, [isSuperDashboard, isSuperAdmin, directoryLoaded, isAnySuperDirectorySection, isSuperStatsSection, getUserDirectory, getApiErrorMessage]);

  useEffect(() => {
    if (!isAdmin) return;
    const run = async () => {
      try {
        setWhatsAppStatusLoading(true);
        const status = await getWhatsAppStatus();
        setWhatsAppStatus(status);
      } catch (apiError) {
        setWhatsAppStatus({ connected: false, message: getApiErrorMessage(apiError, "Failed to fetch WhatsApp status.") });
      } finally {
        setWhatsAppStatusLoading(false);
      }
    };
    run();
  }, [isAdmin, getWhatsAppStatus, getApiErrorMessage]);

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    if (type === "file") {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setForm((prev) => ({ ...prev, logo: reader.result })); };
      reader.readAsDataURL(file);
    }
  };

  const handleRequiredSkillChange = (index, value) => {
    setRequiredSkillInputs((prev) => prev.map((item, currentIndex) => (currentIndex === index ? value : item)));
  };

  const addRequiredSkillInput = () => { setRequiredSkillInputs((prev) => [...prev, ""]); };
  const removeRequiredSkillInput = (index) => { setRequiredSkillInputs((prev) => prev.filter((_, i) => i !== index)); };

  const handleBenefitChange = (index, value) => {
    setBenefitInputs((prev) => prev.map((item, currentIndex) => (currentIndex === index ? value : item)));
  };

  const addBenefitInput = () => { setBenefitInputs((prev) => [...prev, ""]); };

  const resetForm = () => {
    setForm({ ...initialForm, type: activeSection === "Global Program" ? "Global Program" : "Internship" });
    setEditingId(null);
    setShowOpportunityForm(false);
    setRequiredSkillInputs(["", "", ""]);
    setBenefitInputs(["", "", "", ""]);
  };

  const handleOpenCreateForm = () => {
    const typeMap = {
      "Global Program": "Global Program",
      Jobs: "Jobs",
      Apprenticeships: "Apprenticeships",
      Masterclasses: "Masterclasses",
      Bootcamps: "Bootcamps",
      "Certificate Programs": "Certificate Programs",
      "Post Graduate Programs": "Post Graduate Programs",
      "Degree Programs": "Degree Programs"
    };
    const nextType = typeMap[activeSection] || "Internship";
    setForm({ ...initialForm, type: nextType });
    setEditingId(null);
    setCurrentStep(1);
    setShowOpportunityForm(true);
  };

  const handleOpenCreateShortVideo = () => {
    setForm({ ...initialForm, type: "Masterclasses", category: "Short Video", isShortVideo: true });
    setEditingId(null);
    setCurrentStep(1);
    setShowOpportunityForm(true);
  };

  const handleSuperCreateInternship = () => {
    setForm({ ...initialForm, type: "Internship" });
    setEditingId(null);
    setCurrentStep(1);
    setShowOpportunityForm(true);
  };

  const handleSuperCreateGlobalProgram = () => {
    setForm({ ...initialForm, type: "Global Program" });
    setEditingId(null);
    setCurrentStep(1);
    setShowOpportunityForm(true);
  };

  const handleSuperCreateJob = () => {
    setForm({ ...initialForm, type: "Jobs" });
    setEditingId(null);
    setCurrentStep(1);
    setShowOpportunityForm(true);
  };

  const handleSuperCreateApprenticeship = () => {
    setForm({ ...initialForm, type: "Apprenticeships" });
    setEditingId(null);
    setCurrentStep(1);
    setShowOpportunityForm(true);
  };

  const handleSuperCreateMasterclass = () => {
    setForm({ ...initialForm, type: "Masterclasses" });
    setEditingId(null);
    setCurrentStep(1);
    setShowOpportunityForm(true);
  };

  const handleSubmit = (event) => { event.preventDefault(); setShowPreviewModal(true); };

  const handleConfirmSubmit = async () => {
    setError("");
    setBusy(true);
    const shouldIncludeInternshipCardFields = form.type === "Internship";
    const stipendCurrencySymbol = form.stipendCurrency === "USD" ? "$" : "₹";
    const payload = {
      ...form,
      duration: form.duration ? `${form.duration} ${form.durationUnit || 'Months'}` : form.duration,
      experienceLevel: form.experienceLevel ? `${form.experienceLevel} ${form.experienceUnit || 'Years'}` : form.experienceLevel,
      skills: form.skills,
      requiredSkills: form.requiredSkills,
      benefits: form.benefits,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      goLiveDate: form.goLiveDate ? new Date(form.goLiveDate).toISOString() : null,
      applicationsOpenDate: form.applicationsOpenDate ? new Date(form.applicationsOpenDate).toISOString() : null,
      selectionAnnouncementDate: form.selectionAnnouncementDate ? new Date(form.selectionAnnouncementDate).toISOString() : null,
      stipend: form.stipend ? `${stipendCurrencySymbol}${String(form.stipend).trim()}` : "",
      ...(shouldIncludeInternshipCardFields ? { workMode: form.workMode, cardTags: form.cardTags, frontendTags: form.frontendTags } : {}),
      ...(form.type === "Degree Programs" ? { annualFees: { amount: form.annualFeesAmount ? Number(form.annualFeesAmount) : null, currency: form.annualFeesCurrency || "INR" } } : {}),
      location: form.cityState || form.location || "Remote",
      masterclassType: form.isShortVideo ? "Short Video" : "Masterclass",
    };
    try {
      let res;
      if (editingId) {
        res = await updateOpportunity(editingId, payload);
        setShowPreviewModal(false);
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          if (form.isShortVideo) {
            setShowOpportunityForm(false);
            resetForm();
          } else {
            const path = isSuperDashboard 
              ? `/super-admin-dashboard/build-form/${editingId}` 
              : dashboardType === "mentor" 
                ? `/mentor-dashboard/build-form/${editingId}` 
                : `/admin-dashboard/build-form/${editingId}`;
            navigate(path);
          }
        }, 3000);
        return;
      }
      res = await addOpportunity(payload);
      setShowPreviewModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        const createdId = res.id || res._id;
        if (form.isShortVideo) {
          setShowOpportunityForm(false);
          resetForm();
        } else {
          const path = isSuperDashboard 
            ? `/super-admin-dashboard/build-form/${createdId}` 
            : dashboardType === "mentor" 
              ? `/mentor-dashboard/build-form/${createdId}` 
              : `/admin-dashboard/build-form/${createdId}`;
          navigate(path);
        }
      }, 3000);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to save opportunity."));
      setShowPreviewModal(false);
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (item) => {
    const formattedForm = {
      ...initialForm,
      ...item,
      isShortVideo: item.isShortVideo || item.category === "Short Video",
      goLiveDate: item.goLiveDate ? new Date(item.goLiveDate).toISOString().slice(0, 16) : "",
      deadline: item.deadline ? new Date(item.deadline).toISOString().split("T")[0] : "",
      startDate: item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : "",
      applicationsOpenDate: item.applicationsOpenDate ? new Date(item.applicationsOpenDate).toISOString().split("T")[0] : "",
      selectionAnnouncementDate: item.selectionAnnouncementDate ? new Date(item.selectionAnnouncementDate).toISOString().split("T")[0] : "",
      stipend: String(item.stipend || "").replace(/[₹$]/g, "").trim(),
      stipendCurrency: String(item.stipend || "").includes("$") ? "USD" : "INR",
      isUnpaid: String(item.stipend || "").toLowerCase().includes("unpaid") || item.stipend === "0" || !item.stipend,
      duration: item.duration ? String(item.duration).split(" ")[0] : "",
      durationUnit: item.duration && String(item.duration).split(" ").length > 1 ? String(item.duration).split(" ").slice(1).join(" ") : "Months",
      experienceLevel: item.experienceLevel ? String(item.experienceLevel).split(" ")[0] : "",
      experienceUnit: item.experienceLevel && String(item.experienceLevel).split(" ").length > 1 ? String(item.experienceLevel).split(" ").slice(1).join(" ") : "Years",
      hasOpenings: item.openings != null && String(item.openings).trim() !== "",
      requiredSkills: Array.isArray(item.requiredSkills) ? item.requiredSkills.join(", ") : item.requiredSkills || "",
      frontendTags: Array.isArray(item.frontendTags) ? item.frontendTags.join(", ") : item.frontendTags || "",
      showHiringManager: item.showHiringManager !== false,
      annualFeesAmount: item.annualFees?.amount != null ? String(item.annualFees.amount) : "",
      annualFeesCurrency: item.annualFees?.currency || "INR",
      nextBatchDate: item.nextBatchDate ? new Date(item.nextBatchDate).toISOString().split("T")[0] : "",
    };
    const skillsArray = Array.isArray(item.requiredSkills) ? item.requiredSkills : String(item.requiredSkills || "").split(/,|\n/).map((s) => s.trim()).filter(Boolean);
    setRequiredSkillInputs(skillsArray.length > 0 ? skillsArray : ["", "", ""]);
    const benefitsArray = Array.isArray(item.benefits) ? item.benefits : String(item.benefits || "").split(/,|\n/).map((b) => b.trim()).filter(Boolean);
    setBenefitInputs(benefitsArray.length > 0 ? benefitsArray : ["", "", "", ""]);
    setForm({ ...formattedForm, formId: item && item.formId && typeof item.formId === "object" ? item.formId._id : item.formId });
    setEditingId(item.id || item._id);
    setCurrentStep(1);
    setShowOpportunityForm(true);
    if (isSuperDashboard) setActiveSection("Post Opportunity");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewResponses = (id) => {
    setFilterOpportunityId(id);
    setActiveSection("Applications");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this opportunity?");
    if (!confirmed) return;
    try {
      setError("");
      await deleteOpportunity(id);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to delete opportunity."));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} selected opportunities?`);
    if (!confirmed) return;
    setBusy(true);
    try {
      setError("");
      await Promise.all(selectedIds.map((id) => deleteOpportunity(id)));
      setSelectedIds([]);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to delete some opportunities."));
    } finally {
      setBusy(false);
    }
  };

  const handleSelectAll = (items) => {
    if (selectedIds.length === items.length) { setSelectedIds([]); } else { setSelectedIds(items.map((item) => item.id)); }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]);
  };

  const handleViewResume = (application) => {
    const resumeUrl = resolveResumeUrl(application);
    if (!resumeUrl) { setError("Resume file is not available for this application."); return; }
    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setEditingId(null);
    setSelectedIds([]);
    setCurrentStep(1);
    setShowOpportunityForm(false);
    setRequiredSkillInputs(["", "", ""]);
    setBenefitInputs(["", "", "", ""]);
    const opportunityTypes = ["Internship", "Apprenticeships", "Jobs", "Masterclasses", "Bootcamps", "Certificate Programs", "Post Graduate Programs", "Degree Programs", "Global Program"];
    if (opportunityTypes.includes(section)) { setForm((prev) => ({ ...prev, type: section })); }
    setFilterOpportunityId(null);
  };

  const refreshDirectory = async () => {
    try {
      setError("");
      const result = await getUserDirectory();
      setDirectory(result);
      setDirectoryLoaded(true);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to refresh users directory."));
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const isWhatsAppConnected = Boolean(whatsAppStatus?.connected);
  const whatsAppStatusText = whatsAppStatusLoading
    ? "Checking WhatsApp..."
    : whatsAppStatus?.message || (isWhatsAppConnected ? "WhatsApp connected" : "WhatsApp not connected");

  const handleOpenAdminDashboard = async (adminId) => {
    try {
      navigate(`/admin-dashboard?impersonate=${adminId}`);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to open selected admin dashboard."));
    }
  };

  const handleApproveAdminAccess = async (adminId) => {
    try {
      setError("");
      setAdminApprovalMessage("");
      setApprovingAdminId(adminId);
      const result = await approveAdminAccess(adminId);
      setAdminApprovalMessage(result?.message || "Admin access approved successfully.");
      await refreshDirectory();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to approve admin access."));
    } finally {
      setApprovingAdminId("");
    }
  };

  const handleReturnToSuperAdmin = async () => {
    try {
      setError("");
      await stopImpersonation();
      navigate("/super-admin-dashboard");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to return to super admin dashboard."));
    }
  };

  const handleDeleteAccount = async (targetUser) => {
    const label = targetUser?.fullName || targetUser?.email || "this account";
    const confirmed = window.confirm(`Are you sure you want to delete ${label}? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      setError("");
      setDeletingUserId(targetUser.id);
      await deleteUserAccount(targetUser.id);
      await refreshDirectory();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to delete account."));
    } finally {
      setDeletingUserId("");
    }
  };

  const handleStartPasswordEditor = (adminId) => {
    setError("");
    setPasswordChangeMessage("");
    setPasswordEditorAdminId(adminId);
    setAdminPasswordForm({ newPassword: "", confirmPassword: "", notifyAdmin: false });
    setShowAdminPassword({ newPassword: false, confirmPassword: false });
  };

  const handleCancelPasswordEditor = () => {
    setPasswordEditorAdminId("");
    setAdminPasswordForm({ newPassword: "", confirmPassword: "", notifyAdmin: false });
    setShowAdminPassword({ newPassword: false, confirmPassword: false });
  };

  const toggleAdminPasswordVisibility = (fieldName) => {
    setShowAdminPassword((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleAdminPasswordInputChange = (event) => {
    const { name, value } = event.target;
    setAdminPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotifyAdminToggle = (event) => {
    const { checked } = event.target;
    setAdminPasswordForm((prev) => ({ ...prev, notifyAdmin: checked }));
  };

  const handleChangeAdminPassword = async (adminId) => {
    const { newPassword, confirmPassword, notifyAdmin } = adminPasswordForm;
    if (!newPassword || !confirmPassword) { setError("Both password fields are required."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    try {
      setError("");
      setPasswordChangeMessage("");
      setChangingPasswordAdminId(adminId);
      const result = await changeAdminPassword(adminId, newPassword, notifyAdmin);
      setPasswordChangeMessage(result?.message || "Admin password changed successfully.");
      handleCancelPasswordEditor();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to change admin password."));
    } finally {
      setChangingPasswordAdminId("");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      setError("");
      setStatusChangeMessage("");
      setStatusChangingId(id);
      await updateApplicationStatus(id, status);
      setStatusChangeMessage(`Status updated to ${status}`);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to update status."));
    } finally {
      setStatusChangingId("");
      setTimeout(() => setStatusChangeMessage(""), 3000);
    }
  };

  // Turns a { sheetStatus, sheetUrl, sheetError } result into a one-line status.
  const describeSheetSync = (
    { sheetStatus, sheetError } = {},
    prefix = "",
  ) => {
    const lead = prefix ? `${prefix} ` : "";
    if (sheetStatus === "synced") return `${lead}Google Sheet updated.`;
    if (sheetStatus === "needs_setup") {
      return `${lead}${sheetError || "Link a Google Sheet above to enable sync."}`;
    }
    if (sheetStatus === "failed") {
      return `${lead}Google Sheet could not be updated${
        sheetError ? `: ${sheetError}` : " this time."
      }`;
    }
    if (sheetStatus === "not_configured") {
      return `${lead}Google Sheets sync is not set up on the server.`;
    }
    return prefix || "Done.";
  };

  // A failed blob download delivers the server's JSON error as a Blob — read it
  // so the user sees the real reason instead of a generic "failed to export".
  const resolveExportError = async (apiError, fallback) => {
    const data = apiError?.response?.data;
    if (typeof Blob !== "undefined" && data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text());
        return parsed.message || parsed.error || fallback;
      } catch {
        return fallback;
      }
    }
    return getApiErrorMessage(apiError, fallback);
  };

  const flashExportMessage = (message, url = "") => {
    setExportSheetMessage(message);
    setExportSheetUrl(url);
    setTimeout(() => {
      setExportSheetMessage("");
      setExportSheetUrl("");
    }, 12000);
  };

  const handleExport = async (format) => {
    try {
      setError("");
      const sync =
        activeSection === "Applications"
          ? await exportApplications(format)
          : await exportOpportunities(format, activeSection);
      const fileLabel = format === "xlsx" ? "Excel file downloaded." : "CSV file downloaded.";
      flashExportMessage(describeSheetSync(sync, fileLabel), sync?.sheetUrl);
    } catch (apiError) {
      setError(await resolveExportError(apiError, "Failed to export data."));
    }
  };

  // Stakeholders (Admins / Users / Mentors): download the list as an Excel file
  // and mirror it into a tab of this super-admin's own Google Sheet, one click.
  const handleExportStakeholders = async (type) => {
    if (stakeholderExportBusy) return;
    try {
      setError("");
      setExportSheetMessage("");
      setStakeholderExportBusy(type);

      const sync = await exportStakeholders(type);
      flashExportMessage(
        describeSheetSync(sync, `${sync.count} record(s) exported.`),
        sync?.sheetUrl,
      );
    } catch (apiError) {
      setError(await resolveExportError(apiError, "Failed to export stakeholders."));
    } finally {
      setStakeholderExportBusy("");
    }
  };

  // "Update Google Sheet" — pushes the current section's data to the account's
  // own Google Sheet only (no file download).
  const handleSyncToSheet = async () => {
    if (sheetSyncBusy) return;
    try {
      setError("");
      setExportSheetMessage("");
      setSheetSyncBusy(true);
      const sync =
        activeSection === "Applications"
          ? await syncApplicationsToSheet()
          : await syncOpportunitiesToSheet(activeSection);
      flashExportMessage(describeSheetSync(sync), sync?.sheetUrl);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to update Google Sheet."));
    } finally {
      setSheetSyncBusy(false);
    }
  };

  const handleSyncStakeholdersToSheet = async (type) => {
    if (sheetSyncBusy) return;
    try {
      setError("");
      setExportSheetMessage("");
      setSheetSyncBusy(true);
      const sync = await syncStakeholdersToSheet(type);
      flashExportMessage(
        describeSheetSync(sync, `${sync.count} record(s) processed.`),
        sync?.sheetUrl,
      );
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to update Google Sheet."));
    } finally {
      setSheetSyncBusy(false);
    }
  };

  const value = {
    isSuperDashboard, dashboardType,
    user, isAdmin, isSuperAdmin, isBootstrapping, isImpersonating,
    opportunities, sorted, filteredOpportunities,
    applications, scopedApplications, paginatedApplications, totalPages, recentApplications,
    form, setForm, editingId, showOpportunityForm, requiredSkillInputs, benefitInputs, currentStep, setCurrentStep, showPreviewModal, showSuccessMessage,
    activeSection, setActiveSection,
    isInternshipPanel, isGlobalProgramPanel, isJobsPanel, isBootcampsPanel, isMasterclassesPanel, isDegreeProgramsPanel, isPGProgramsPanel, isClosedApplicationPanel, isAllApplicationPanel,
    isSuperStatsSection, isSuperPostSection, isSuperUsersSection, isSuperAdminsSection,
    isSuperMentorsSection,
    isSuperApprovedRequestsSection, isAnySuperDirectorySection,
    currentPage, setCurrentPage, itemsPerPage, totalClosedPages, paginatedClosedItems,
    closedApplicationView, setClosedApplicationView, closedApplicationItems, closedApplicationTitle,
    selectedIds, setSelectedIds,
    directory, directoryLoaded,
    userCount, adminCount, superAdminCount, totalAccountCount, userPercent, adminPercent, superAdminPercent,
    whatsAppStatus, whatsAppStatusLoading, isWhatsAppConnected, whatsAppStatusText,
    passwordEditorAdminId, adminPasswordForm, showAdminPassword, changingPasswordAdminId, passwordChangeMessage, adminApprovalMessage, approvingAdminId,
    visiblePasswords, setVisiblePasswords, openingAdminId, deletingUserId,
    selectedApplication, setSelectedApplication, filterOpportunityId, setFilterOpportunityId,
    statusChangingId, statusChangeMessage,
    error, busy,
    toMultiline, resolveOwnerName, resolveResumeUrl,
    
    handleChange, handleLogoChange, handleRequiredSkillChange, addRequiredSkillInput, removeRequiredSkillInput,
    handleBenefitChange, addBenefitInput, resetForm,
    handleOpenCreateForm, handleOpenCreateShortVideo, handleSuperCreateInternship, handleSuperCreateGlobalProgram, handleSuperCreateJob, handleSuperCreateApprenticeship, handleSuperCreateMasterclass,
    handleSubmit, handleConfirmSubmit,
    handleEdit, handleViewResponses, handleDelete, handleBulkDelete,
    handleSelectAll, handleSelectItem,
    handleViewResume,
    handleSectionChange, handleLogout,
    handleOpenAdminDashboard, handleApproveAdminAccess, handleReturnToSuperAdmin, handleDeleteAccount,
    handleStartPasswordEditor, handleCancelPasswordEditor, toggleAdminPasswordVisibility,
    handleAdminPasswordInputChange, handleNotifyAdminToggle, handleChangeAdminPassword,
    handleStatusChange, handleExport, fetchDecryptedPassword, isOpportunityClosed,
    refreshDirectory,
    handleExportStakeholders, stakeholderExportBusy, exportSheetMessage, exportSheetUrl,
    handleSyncToSheet, handleSyncStakeholdersToSheet, sheetSyncBusy,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export default AdminContext;
