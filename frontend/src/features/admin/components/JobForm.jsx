import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiGlobe } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAdminContext } from "../context/AdminContext";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import TextEditor from "./TextEditor";
import MediaUrlListField from "./MediaUrlListField";
import { createCustomCategory, getCustomCategories } from "../../../services/customCategoryAPI";
import { DEFAULT_JOB_CATEGORIES } from "../../job/utils/jobCategories";

// Dedicated form for Jobs, split out of the generic OpportunityForm.jsx for clarity.
// Jobs still lives in the same InternshipOpportunity backend collection (type: "Jobs")
// — only the UI is separated, not the schema, since the fields are ~90% identical to
// Internship. Submits via the same addOpportunity/updateOpportunity used everywhere else.

// Department/Category is no longer a fixed list — see the Job Specifics section:
// the options come from /api/custom-categories?opportunityType=Jobs and the admin
// can add any category of their own from inside the dropdown.
// const DEPARTMENT_OPTIONS = ["Corporate", "Teaching", "NGO / Social Work", "Government", "Research", "Assessment", "Summer / Winter Break"];
const INDUSTRY_OPTIONS = ["IT Services", "EdTech", "Higher Education", "Fintech"];
const COMPANY_SIZE_OPTIONS = ["Startup 0-5", "SME 2-20", "MSME 21-50", "51-200", "201-500"];
const COMPANY_CLASSIFICATION_OPTIONS = ["Boutique Firm", "Mid-market", "Enterprise"];
const TARGET_EDUCATION_OPTIONS = ["B.Tech", "MBA", "MCA", "BBA", "B.Com"];
const SELECTION_ROUND_OPTIONS = ["Resume Shortlist", "Assignment", "Interview"];
const DEFAULT_PERK_OPTIONS = ["Certificate", "LOR", "PPO", "Flexible Hours"];

const SECTIONS = [
  { id: "section-job-specifics", label: "Job Specifics" },
  { id: "section-job-timeline", label: "Timeline" },
  { id: "section-job-financials", label: "Financials & Incentives" },
  { id: "section-job-requirements", label: "Requirements" },
  { id: "section-job-description", label: "Job Description" },
  { id: "section-job-selection", label: "Selection Process" },
  { id: "section-job-company", label: "About the Company" },
];

const inputClass = "border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none w-full";
const fieldLabelClass = "flex flex-col gap-2 text-sm font-semibold text-slate-700";
const sectionCardClass = "bg-white p-5 rounded-xl border border-[#E2E8F0] scroll-mt-24";
const sectionHeadingClass = "text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider";

const Field = ({ label, required, children }) => (
  <label className={fieldLabelClass}>
    <span>
      {label} {required && <span className="text-rose-600">*</span>}
    </span>
    {children}
  </label>
);

const CheckboxDropdown = ({ label, options, selected, onToggle, required, placeholder = "Select options..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <span>{label} {required && <span className="text-rose-600">*</span>}</span>
      <div className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex justify-between items-center transition-all hover:bg-white" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-normal text-slate-600 truncate">{selected?.length > 0 ? selected.join(", ") : placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto p-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
              <input type="checkbox" className="accent-blue-700 w-4 h-4 rounded" checked={selected?.includes(option)} onChange={() => onToggle(option)} />
              <span className="font-normal text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// Same as CheckboxDropdown, but the admin can also type in a new option on the fly (used for Perks).
const CreatableCheckboxDropdown = ({ label, options, setOptions, selected, onToggle, placeholder = "Select options..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddOption = (e) => {
    e.preventDefault();
    const newOption = inputValue.trim();
    if (newOption && !options.includes(newOption)) {
      setOptions((prev) => [...prev, newOption]);
      onToggle(newOption);
    }
    setInputValue("");
  };

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <span>{label}</span>
      <div className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex justify-between items-center transition-all hover:bg-white" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-normal text-slate-600 truncate">{selected?.length > 0 ? selected.join(", ") : placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-10 max-h-72 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddOption(e); } }}
              placeholder="Add new option..."
              className="flex-1 border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm font-normal outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button type="button" onClick={handleAddOption} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">Add</button>
          </div>
          <div className="overflow-y-auto p-2 max-h-48">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" className="accent-blue-700 w-4 h-4 rounded" checked={selected?.includes(option)} onChange={() => onToggle(option)} />
                <span className="font-normal text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Single-select dropdown that also lets the admin type a category that isn't in
// the list yet. Unlike CreatableCheckboxDropdown the options are owned by the
// parent, so a list arriving from the API after mount shows up here.
const CreatableSingleDropdown = ({ label, options, onCreateOption, selected, onSelect, required, placeholder = "Select or create category..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddOption = (e) => {
    e.preventDefault();
    const newOption = inputValue.trim();
    if (newOption) {
      if (!options.includes(newOption)) onCreateOption(newOption);
      onSelect(newOption);
      setIsOpen(false);
    }
    setInputValue("");
  };

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <span>{label} {required && <span className="text-rose-600">*</span>}</span>
      <div className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex justify-between items-center transition-all hover:bg-white" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-normal text-slate-600 truncate">{selected || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-20 max-h-72 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddOption(e); } }}
              placeholder="Create new category..."
              className="flex-1 border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm font-normal outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button type="button" onClick={handleAddOption} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">Add</button>
          </div>
          <div className="overflow-y-auto p-2 max-h-48">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => { onSelect(option); setIsOpen(false); }}
                className={`px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors font-normal text-slate-700 ${selected === option ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
              >
                {option}
              </div>
            ))}
            {options.length === 0 && <div className="p-3 text-slate-500 text-sm text-center">No categories yet — add one above.</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const emptyForm = {
  title: "",
  departmentCategory: "",
  cityState: "",
  googleLocationLink: "",
  frontendTags: "",
  hasOpenings: false,
  openings: "",
  workMode: "On-site",
  workingHours: "Full-time",
  experienceLevel: "",
  experienceUnit: "Years",

  applicationsOpenDate: "",
  deadline: "",
  selectionAnnouncementDate: "",
  startDate: "",

  salaryCurrency: "INR",
  salary: "",
  incentivesBonuses: "",
  perks: [],

  targetEducation: [],
  requiredSkills: "",

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
  logoFile: null,
  logoUrl: "",
  hiringManager: "",
  showHiringManager: true,
  linkedin: "",
  twitter: "",
  instagram: "",
  virtualTour: "",
  officePhotos: "",
  cultureVideos: "",
  companyOverview: "",
  specialties: "",
};

const hydrateFromJob = (job) => ({
  ...emptyForm,
  title: job.title || "",
  departmentCategory: job.departmentCategory || "",
  cityState: job.cityState || "",
  googleLocationLink: job.googleLocationLink || "",
  frontendTags: Array.isArray(job.frontendTags) ? job.frontendTags.join(", ") : job.frontendTags || "",
  hasOpenings: job.openings != null && String(job.openings).trim() !== "",
  openings: job.openings ?? "",
  workMode: job.workMode || "On-site",
  workingHours: job.workingHours || "Full-time",
  experienceLevel: job.experienceLevel ? String(job.experienceLevel).split(" ")[0] : "",
  experienceUnit: job.experienceLevel && String(job.experienceLevel).split(" ").length > 1 ? String(job.experienceLevel).split(" ").slice(1).join(" ") : "Years",

  applicationsOpenDate: job.applicationsOpenDate ? new Date(job.applicationsOpenDate).toISOString().split("T")[0] : "",
  deadline: job.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
  selectionAnnouncementDate: job.selectionAnnouncementDate ? new Date(job.selectionAnnouncementDate).toISOString().split("T")[0] : "",
  startDate: job.startDate ? new Date(job.startDate).toISOString().split("T")[0] : "",

  salaryCurrency: String(job.stipend || "").includes("$") || String(job.stipend || "").toUpperCase().startsWith("USD") ? "USD" : "INR",
  salary: String(job.stipend || "").replace(/[₹$]|USD/g, "").trim(),
  incentivesBonuses: job.incentivesBonuses || "",
  perks: job.perks || [],

  targetEducation: job.targetEducation || [],
  requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : job.requiredSkills || "",

  minimumRequirements: job.minimumRequirements || "",
  preferredQualifications: job.preferredQualifications || "",

  aboutProgram: job.aboutProgram || "",
  description: job.description || "",
  whatYouWillLearn: job.whatYouWillLearn || "",

  selectionRounds: job.selectionRounds || [],
  assignmentLink: job.assignmentLink || "",
  customScreeningQuestion: job.customScreeningQuestion || "",

  company: job.company || "",
  website: job.website || "",
  industry: job.industry || "",
  headquarters: job.headquarters || "",
  foundedYear: job.foundedYear || "",
  companySize: job.companySize || "",
  companyClassification: job.companyClassification || "",
  logoUrl: job.logo || "",
  hiringManager: job.hiringManager || "",
  showHiringManager: job.showHiringManager !== false,
  linkedin: job.socialProofLinks?.linkedin || "",
  twitter: job.socialProofLinks?.twitter || "",
  instagram: job.socialProofLinks?.instagram || "",
  virtualTour: job.virtualTour || "",
  officePhotos: (job.officePhotos || []).join("\n"),
  cultureVideos: (job.cultureVideos || []).join("\n"),
  companyOverview: job.companyOverview || "",
  specialties: job.specialties || "",
});

const JobForm = ({ onClose, onSaved, initialJob = null }) => {
  const { isSuperDashboard, dashboardType } = useAdminContext();
  const { addOpportunity, updateOpportunity, getApiErrorMessage } = useOpportunities();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialJob ? hydrateFromJob(initialJob) : emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSectionState] = useState(SECTIONS[0].id);
  const [perkOptions, setPerkOptions] = useState(() => [...new Set([...DEFAULT_PERK_OPTIONS, ...(initialJob?.perks || [])])]);

  // Job categories are data, not code: the backend seeds the built-in list and
  // serves anything admins have added since. Scoped to opportunityType "Jobs",
  // so Internship / Apprenticeship forms are unaffected.
  const initialCategory = initialJob?.departmentCategory || "";
  const [categoryOptions, setCategoryOptions] = useState(() => [
    ...new Set([...DEFAULT_JOB_CATEGORIES, ...(initialCategory ? [initialCategory] : [])]),
  ]);

  useEffect(() => {
    let cancelled = false;
    getCustomCategories("Jobs")
      .then((res) => {
        if (cancelled) return;
        const fetched = (res.data?.categories || []).map((c) => c.title).filter(Boolean);
        if (!fetched.length) return;
        // The server list wins over the local fallback, but the category the
        // job already carries stays selectable even if it was deactivated.
        setCategoryOptions(
          [...new Set([...fetched, ...(initialCategory ? [initialCategory] : [])])].sort((a, b) => a.localeCompare(b)),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialCategory]);

  // Persisted immediately so the category is available to the next job too,
  // not only to the one being saved right now. A failure is non-blocking —
  // departmentCategory is a free string, so the job still saves with it.
  const handleCreateCategory = (title) => {
    setCategoryOptions((prev) => [...new Set([...prev, title])]);
    createCustomCategory({ title, opportunityType: "Jobs" }).catch(() => {});
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisible = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!mostVisible || entry.intersectionRatio > mostVisible.intersectionRatio)) mostVisible = entry;
        });
        if (mostVisible) setActiveSectionState(mostVisible.target.id);
      },
      { root: document.getElementById("job-form-container"), rootMargin: "-10% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    const timer = setTimeout(() => {
      SECTIONS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 100);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    const container = document.getElementById("job-form-container");
    if (el && container) container.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
  };

  const jobId = initialJob?.id || initialJob?._id || "";

  const buildFormPath = (id) =>
    isSuperDashboard
      ? `/super-admin-dashboard/build-form/${id}`
      : dashboardType === "mentor"
        ? `/mentor-dashboard/build-form/${id}`
        : `/admin-dashboard/build-form/${id}`;

  // Step 2 needs a saved job to attach the form to, so on create we send the admin back
  // to finish step 1 first — the submit handler opens the builder automatically after saving.
  const openApplicationFormBuilder = () => {
    if (!jobId) {
      setError("Save the job details first — the application form builder opens once the job is created.");
      document.getElementById("job-form-container")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(buildFormPath(jobId));
  };

  const isSectionFilled = (sectionId) => {
    switch (sectionId) {
      case "section-job-specifics":
        return (
          !!form.title &&
          !!form.departmentCategory &&
          (form.workMode === "Remote" || !!form.cityState) &&
          !!form.workMode &&
          !!form.workingHours &&
          !!form.experienceLevel &&
          (!form.hasOpenings || !!form.openings)
        );
      case "section-job-timeline":
        return !!form.deadline && !!form.startDate;
      case "section-job-financials":
        return !!form.salary || !!form.incentivesBonuses || form.perks.length > 0;
      case "section-job-requirements":
        return form.targetEducation.length > 0 && !!form.requiredSkills;
      case "section-job-description":
        return !!form.description;
      case "section-job-selection":
        return form.selectionRounds.length > 0 || !!form.assignmentLink || !!form.customScreeningQuestion;
      case "section-job-company":
        return !!form.company && (!form.showHiringManager || !!form.hiringManager);
      default:
        return false;
    }
  };

  const handleField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const toggleArrayField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value] }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Job title is required.");
    if (!form.departmentCategory) return setError("Department/Category is required.");
    if (!form.company.trim()) return setError("Company name is required.");
    if (form.workMode !== "Remote" && !form.cityState.trim()) return setError("Job location is required unless work mode is Remote.");
    if (!form.experienceLevel) return setError("Experience level is required.");
    if (!form.deadline) return setError("Application deadline is required.");
    if (!form.startDate) return setError("Job start date is required.");
    if (!form.requiredSkills.trim()) return setError("Required skills are required.");
    if (!form.description.trim()) return setError("Key responsibilities are required.");
    if (form.showHiringManager && !form.hiringManager.trim()) return setError("Hiring Manager/POC LinkedIn is required.");

    const symbol = form.salaryCurrency === "USD" ? "$" : "₹";

    const payload = {
      type: "Jobs",
      title: form.title.trim(),
      departmentCategory: form.departmentCategory,
      cityState: form.cityState.trim(),
      googleLocationLink: form.googleLocationLink.trim(),
      frontendTags: form.frontendTags,
      openings: form.hasOpenings ? form.openings : "",
      workMode: form.workMode,
      workingHours: form.workingHours,
      experienceLevel: `${form.experienceLevel} ${form.experienceUnit}`,
      location: form.cityState.trim() || "Remote",

      applicationsOpenDate: form.applicationsOpenDate ? new Date(form.applicationsOpenDate).toISOString() : null,
      deadline: new Date(form.deadline).toISOString(),
      selectionAnnouncementDate: form.selectionAnnouncementDate ? new Date(form.selectionAnnouncementDate).toISOString() : null,
      startDate: new Date(form.startDate).toISOString(),

      stipend: form.salary ? `${symbol}${String(form.salary).trim()}` : "",
      incentivesBonuses: form.incentivesBonuses,
      perks: form.perks,

      targetEducation: form.targetEducation,
      requiredSkills: form.requiredSkills,

      minimumRequirements: form.minimumRequirements,
      preferredQualifications: form.preferredQualifications,

      aboutProgram: form.aboutProgram,
      description: form.description,
      whatYouWillLearn: form.whatYouWillLearn,

      selectionRounds: form.selectionRounds,
      assignmentLink: form.assignmentLink,
      customScreeningQuestion: form.customScreeningQuestion,

      company: form.company.trim(),
      website: form.website,
      industry: form.industry,
      headquarters: form.headquarters,
      foundedYear: form.foundedYear,
      companySize: form.companySize,
      companyClassification: form.companyClassification,
      hiringManager: form.hiringManager,
      showHiringManager: form.showHiringManager,
      socialProofLinks: { linkedin: form.linkedin, twitter: form.twitter, instagram: form.instagram },
      virtualTour: form.virtualTour,
      officePhotos: form.officePhotos,
      cultureVideos: form.cultureVideos,
      companyOverview: form.companyOverview,
      specialties: form.specialties,
      logoFile: form.logoFile || undefined,
      ...(form.logoFile ? {} : { logo: form.logoUrl }),
    };

    try {
      setBusy(true);
      const saved = initialJob
        ? await updateOpportunity(initialJob.id || initialJob._id, payload)
        : await addOpportunity(payload);
      onSaved?.(saved);
      navigate(buildFormPath(saved?.id || saved?._id));
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to save job."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] flex flex-col xl:flex-row h-[90vh] overflow-hidden">
      <div className="w-full xl:w-[300px] bg-white border-r border-[#E2E8F0] p-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <h2 className="text-xl font-bold text-slate-800 mb-6">{initialJob ? "Edit Job" : "Create Job"}</h2>

        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mb-5 overflow-hidden">
          <div className="bg-blue-700 h-full transition-all duration-300" style={{ width: "40%" }}></div>
        </div>

        <div className="space-y-4 relative">
          {/* Main rail: runs from the centre of the step 1 marker to the centre of the step 2 marker. */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-[#E2E8F0] z-0"></div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className="relative z-20 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold bg-blue-700 text-white">1</div>
              <span className="font-semibold text-sm text-blue-700">Job Details</span>
            </div>

            <div className="flex flex-col gap-5 pl-8 relative z-10 mt-3 mb-2">
              {SECTIONS.map((section, i) => {
                const isActive = activeSection === section.id;
                const isFilled = isSectionFilled(section.id);
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-start gap-4 relative z-10 w-full text-left group"
                  >
                    {/* Branch rail segment: circle bottom to the next circle, so it never dangles when a label wraps. */}
                    {i < SECTIONS.length - 1 && (
                      <span aria-hidden="true" className="absolute left-[15px] top-8 -bottom-5 w-0.5 bg-[#E2E8F0] z-0" />
                    )}
                    <div className={`relative z-20 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isFilled && !isActive ? "bg-[#EEF2FF] text-[#21B573]" :
                      isActive ? "bg-blue-700 text-white shadow-md" :
                      "bg-white border-2 border-slate-300 text-slate-500"
                    }`}>
                      {isFilled && !isActive ? <FiCheck className="w-5 h-5" /> : i + 1}
                    </div>
                    <div className="flex flex-col mt-[5px]">
                      <span className={`font-bold text-[13px] leading-tight transition-colors ${
                        isActive ? "text-blue-700" :
                        isFilled ? "text-slate-700" :
                        "text-slate-500 group-hover:text-slate-700"
                      }`}>
                        {section.label}
                      </span>
                      {isFilled && !isActive && (
                        <span className="text-[11px] font-bold text-red-600/80 mt-0.5">Complete</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full mt-4">
            <button
              type="button"
              onClick={openApplicationFormBuilder}
              className={`flex items-center gap-4 relative z-10 w-full text-left group ${jobId ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="relative z-20 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold bg-slate-100 text-slate-400 group-hover:bg-slate-200 transition-colors">2</div>
              <span className="font-semibold text-sm text-slate-400 group-hover:text-slate-600 transition-colors">Application Form</span>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">Cancel</button>
        </div>
      </div>

      <div id="job-form-container" className="flex-1 p-8 pb-6 bg-[#EEF2FF]/50 overflow-y-auto h-full">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div id="section-job-specifics" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Job Specifics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Job Title" required>
                <input value={form.title} onChange={(e) => handleField("title", e.target.value)} placeholder="e.g. Software Engineer" className={inputClass} required />
              </Field>
              <CreatableSingleDropdown
                label="Department/Category"
                required
                options={categoryOptions}
                selected={form.departmentCategory}
                onSelect={(value) => handleField("departmentCategory", value)}
                onCreateOption={handleCreateCategory}
              />
              <Field label={`Job Location (City/State)${form.workMode !== "Remote" ? " *" : ""}`}>
                <input value={form.cityState} onChange={(e) => handleField("cityState", e.target.value)} placeholder="e.g. Bangalore, Karnataka" className={inputClass} required={form.workMode !== "Remote"} />
              </Field>
              <Field label="Company Location Link">
                <input type="url" value={form.googleLocationLink} onChange={(e) => handleField("googleLocationLink", e.target.value)} placeholder="https://maps.google.com/..." className={inputClass} />
              </Field>
              <Field label="Tags for Cards (Comma separated)">
                <input value={form.frontendTags} onChange={(e) => handleField("frontendTags", e.target.value)} placeholder="e.g. Remote, Urgent" className={inputClass} />
              </Field>

              <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Number of Openings</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={form.hasOpenings} onChange={(e) => handleField("hasOpenings", e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {form.hasOpenings && (
                  <input type="number" value={form.openings} onChange={(e) => handleField("openings", e.target.value)} placeholder="e.g. 5" className={inputClass} />
                )}
              </div>

              <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Work Mode <span className="text-rose-600">*</span></span>
                <div className="flex gap-4 mt-2">
                  {["On-site", "Remote", "Hybrid"].map((mode) => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.workMode === mode} onChange={() => handleField("workMode", mode)} className="accent-blue-700" />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Working Hours <span className="text-rose-600">*</span></span>
                <div className="flex gap-4 mt-2">
                  {["Full-time", "Part-time"].map((hours) => (
                    <label key={hours} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.workingHours === hours} onChange={() => handleField("workingHours", hours)} className="accent-blue-700" required />
                      <span>{hours}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Field label="Experience Level" required>
                <div className="flex gap-2">
                  <input type="text" value={form.experienceLevel} onChange={(e) => handleField("experienceLevel", e.target.value)} placeholder="e.g. 0-6 or 1" className={`${inputClass} flex-1`} required />
                  <select value={form.experienceUnit} onChange={(e) => handleField("experienceUnit", e.target.value)} className={`${inputClass} w-[120px] shrink-0`}>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>
              </Field>
            </div>
          </div>

          <div id="section-job-timeline" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Timeline</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Applications Open">
                <input type="date" value={form.applicationsOpenDate} onChange={(e) => handleField("applicationsOpenDate", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Application Deadline" required>
                <input type="date" value={form.deadline} onChange={(e) => handleField("deadline", e.target.value)} className={inputClass} required />
              </Field>
              <Field label="Selection Announcement">
                <input type="date" value={form.selectionAnnouncementDate} onChange={(e) => handleField("selectionAnnouncementDate", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Job Start Date" required>
                <input type="date" value={form.startDate} onChange={(e) => handleField("startDate", e.target.value)} className={inputClass} required />
              </Field>
            </div>
          </div>

          <div id="section-job-financials" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Financials & Incentives</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Salary">
                <div className="flex gap-2">
                  <select value={form.salaryCurrency} onChange={(e) => handleField("salaryCurrency", e.target.value)} className={`${inputClass} w-[100px] shrink-0`}>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                  <input value={form.salary} onChange={(e) => handleField("salary", e.target.value)} placeholder="e.g. 800000" className={inputClass} />
                </div>
              </Field>
              <Field label="Incentives/Bonuses">
                <textarea value={form.incentivesBonuses} onChange={(e) => handleField("incentivesBonuses", e.target.value)} placeholder="e.g., Success fee per candidate" className={`${inputClass} resize-y min-h-[48px]`} rows={1} />
              </Field>
              <CreatableCheckboxDropdown label="Perks" options={perkOptions} setOptions={setPerkOptions} selected={form.perks} onToggle={(value) => toggleArrayField("perks", value)} placeholder="Select perk(s)..." />
            </div>
          </div>

          <div id="section-job-requirements" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Candidate Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CheckboxDropdown label="Target Education" options={TARGET_EDUCATION_OPTIONS} selected={form.targetEducation} onToggle={(value) => toggleArrayField("targetEducation", value)} required placeholder="Select education(s)..." />
              <Field label="Required Skills" required>
                <input value={form.requiredSkills} onChange={(e) => handleField("requiredSkills", e.target.value)} placeholder="e.g. React, Node.js, Python" className={inputClass} required />
              </Field>
            </div>
          </div>

          <div id="section-job-description" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Job Description</h4>
            <div className="grid grid-cols-1 gap-6">
              <TextEditor label="About the Program" value={form.aboutProgram} onChange={(html) => handleField("aboutProgram", html)} placeholder="" />
              <Field label="Key Responsibilities" required>
                <textarea value={form.description} onChange={(e) => handleField("description", e.target.value)} className={`${inputClass} min-h-[100px]`} placeholder="Bulleted list of daily tasks and ownership areas." required />
              </Field>
              <Field label="Minimum Requirements (Eligibility Criteria)">
                <textarea value={form.minimumRequirements} onChange={(e) => handleField("minimumRequirements", e.target.value)} className={`${inputClass} min-h-[100px]`} placeholder="- Must have experience with...&#10;- Knowledge of..." />
              </Field>
              <Field label="Preferred Qualifications (Key Skills)">
                <textarea value={form.preferredQualifications} onChange={(e) => handleField("preferredQualifications", e.target.value)} className={`${inputClass} min-h-[100px]`} placeholder="- Prior experience in...&#10;- Familiarity with..." />
              </Field>
            </div>
          </div>

          <div id="section-job-selection" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Selection Process</h4>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>Selection Rounds</span>
                <div className="flex flex-wrap gap-4 mt-2">
                  {SELECTION_ROUND_OPTIONS.map((round) => (
                    <label key={round} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.selectionRounds.includes(round)} onChange={() => toggleArrayField("selectionRounds", round)} className="accent-blue-700 w-4 h-4 rounded" />
                      <span>{round}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Assignment Link (Optional)">
                <input type="url" value={form.assignmentLink} onChange={(e) => handleField("assignmentLink", e.target.value)} placeholder="https://..." className={inputClass} />
              </Field>
              <Field label="Custom Screening Question">
                <textarea value={form.customScreeningQuestion} onChange={(e) => handleField("customScreeningQuestion", e.target.value)} className={`${inputClass} min-h-[80px]`} placeholder='e.g., "Why are you interested in this role?"' />
              </Field>
            </div>
          </div>

          <div id="section-job-company" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>About the Company</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Company Name" required>
                <input value={form.company} onChange={(e) => handleField("company", e.target.value)} className={inputClass} required />
              </Field>
              <Field label="Website Link">
                <input type="url" value={form.website} onChange={(e) => handleField("website", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Industry Vertical">
                <select value={form.industry} onChange={(e) => handleField("industry", e.target.value)} className={inputClass}>
                  <option value="">Select Industry</option>
                  {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Headquarters">
                <input value={form.headquarters} onChange={(e) => handleField("headquarters", e.target.value)} placeholder="City, State, Country" className={inputClass} />
              </Field>
              <Field label="Founded Year">
                <input value={form.foundedYear} onChange={(e) => handleField("foundedYear", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Number of Employees">
                <select value={form.companySize} onChange={(e) => handleField("companySize", e.target.value)} className={inputClass}>
                  <option value="">Select</option>
                  {COMPANY_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Company Size">
                <select value={form.companyClassification} onChange={(e) => handleField("companyClassification", e.target.value)} className={inputClass}>
                  <option value="">Select</option>
                  {COMPANY_CLASSIFICATION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <div className="flex flex-col gap-4 mt-4 md:col-span-2 p-4 bg-slate-50 rounded-xl">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700">Upload Organization Logo</span>
                  <label className="w-full h-40 rounded-xl bg-white border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-blue-50 transition-colors group relative">
                    {form.logoFile ? (
                      <img src={URL.createObjectURL(form.logoFile)} alt="Preview" className="w-full h-full object-contain p-4" />
                    ) : form.logoUrl ? (
                      <img src={form.logoUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FiGlobe className="text-slate-300 group-hover:text-blue-500 transition-colors" size={40} />
                        <span className="text-xs text-slate-500 font-medium">Click to browse files</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleField("logoFile", e.target.files[0] || null)} />
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Hiring Manager/POC LinkedIn <span className="text-rose-600">*</span></span>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={form.showHiringManager} onChange={(e) => handleField("showHiringManager", e.target.checked)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${form.showHiringManager ? "bg-blue-700" : "bg-slate-300"}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${form.showHiringManager ? "transform translate-x-4" : ""}`}></div>
                      </div>
                      <span className="ml-3 text-xs font-medium text-slate-600">Show</span>
                    </label>
                  </div>
                  <input required={form.showHiringManager} type="url" value={form.hiringManager} onChange={(e) => handleField("hiringManager", e.target.value)} placeholder="LinkedIn URL" className={`${inputClass} bg-white`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <Field label="Company LinkedIn">
                    <input value={form.linkedin} onChange={(e) => handleField("linkedin", e.target.value)} className={`${inputClass} bg-white`} />
                  </Field>
                  <Field label="Company Twitter">
                    <input value={form.twitter} onChange={(e) => handleField("twitter", e.target.value)} className={`${inputClass} bg-white`} />
                  </Field>
                  <Field label="Company Instagram">
                    <input value={form.instagram} onChange={(e) => handleField("instagram", e.target.value)} className={`${inputClass} bg-white`} />
                  </Field>
                </div>

                <Field label="Virtual Tour (Office URL)">
                  <input type="url" value={form.virtualTour} onChange={(e) => handleField("virtualTour", e.target.value)} placeholder="Link to 360 view or video" className={`${inputClass} bg-white`} />
                </Field>

                {/* Feed the "Office Photos" / "Video" gallery on the detail
                    page: paste links, one per line, or upload from this machine.
                    Either way the field stays a URL list, which is what the
                    backend's parseTextList consumes. */}
                <Field label="Office Photos">
                  <MediaUrlListField
                    value={form.officePhotos}
                    onChange={(next) => handleField("officePhotos", next)}
                    accept="image/*"
                    kind="photos"
                    placeholder={"https://.../office-1.jpg\nhttps://.../office-2.jpg"}
                    textareaClassName={`${inputClass} bg-white min-h-[90px]`}
                  />
                </Field>

                <Field label="Office Videos">
                  <MediaUrlListField
                    value={form.cultureVideos}
                    onChange={(next) => handleField("cultureVideos", next)}
                    accept="video/*"
                    kind="videos"
                    placeholder={"https://.../culture.mp4\nhttps://www.youtube.com/watch?v=..."}
                    textareaClassName={`${inputClass} bg-white min-h-[90px]`}
                  />
                </Field>
              </div>

              <Field label="Company Overview">
                <textarea value={form.companyOverview} onChange={(e) => handleField("companyOverview", e.target.value)} className={`${inputClass} min-h-[100px] md:col-span-2`} placeholder="Introduction, Vision, Mission..." />
              </Field>
              <Field label="Specialties">
                <textarea value={form.specialties} onChange={(e) => handleField("specialties", e.target.value)} className={`${inputClass} min-h-[80px] md:col-span-2`} placeholder="e.g. Airport Ground Handling, Robotic Cleaning..." />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-all disabled:opacity-60">
              {busy ? "Saving..." : initialJob ? "Update & Continue" : "Create & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
