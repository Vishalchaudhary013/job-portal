import React, { useEffect, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../../services/apiClient";
import { createUniversityProgram, updateUniversityProgram } from "../../../services/universityProgramAPI";

// Dedicated form for the University Program module (/api/university-programs).
// Kept separate from the generic OpportunityForm because the schema (nested
// university/fees/credentials/curriculum/career objects, dynamic scholarship
// and ranking arrays, EMI-calculated fees) does not fit the shared opportunity shape.
// Layout mirrors OpportunityForm.jsx: left step/section nav, right scrollable form.

const DEGREE_OPTIONS = ["B.Tech", "B.E.", "BCA", "MCA", "BBA", "MBA", "B.Sc", "M.Sc", "M.Tech", "M.Com", "PhD", "Diploma", "Certificate"];
const LEVEL_OPTIONS = ["Certificate", "Diploma", "Undergraduate", "Postgraduate", "Doctorate"];
const MODE_OPTIONS = ["Online", "Offline", "Hybrid"];
const SPECIALIZATION_OPTIONS = ["Artificial Intelligence", "Machine Learning", "Data Science", "Cyber Security", "Cloud Computing", "Finance", "Marketing", "Human Resources"];
const RECOGNITION_OPTIONS = ["UGC Recognized", "DEB Approved", "Government Recognized"];
const ACCREDITATION_OPTIONS = ["NAAC A+", "NAAC A", "NAAC B+", "NBA Accredited"];
const AFFILIATION_OPTIONS = ["AICTE Approved", "UGC Affiliated", "State University Affiliated"];
const CAREER_SERVICE_OPTIONS = ["Career Counseling", "Mock Interviews", "Resume Building", "Job Portal Access"];
const RECRUITER_OPTIONS = ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro", "Deloitte", "Accenture"];
const DURATION_UNIT_OPTIONS = ["Months", "Years"];
const EXAMINATION_MODE_OPTIONS = ["Online", "Offline", "Hybrid", "University Center", "Proctored Online"];

// Fixed curriculum toggles map to dedicated boolean fields on the backend; anything the admin
// adds beyond these goes into curriculum.additionalFeatures instead.
const CURRICULUM_FEATURES = [
  ["liveClasses", "Live Classes"],
  ["recordedClasses", "Recorded Classes"],
  ["lms", "LMS Access"],
  ["assignment", "Assignments"],
  ["internship", "Internship"],
  ["industryProject", "Industry Project"],
  ["industryCertification", "Industry Certification"],
];
const CURRICULUM_FEATURE_LABELS = CURRICULUM_FEATURES.map(([, label]) => label);
const CURRICULUM_FEATURE_KEY_BY_LABEL = Object.fromEntries(CURRICULUM_FEATURES.map(([key, label]) => [label, key]));

const DEFAULT_SCHOLARSHIPS = [
  { minPercentage: 90, discountPercentage: 50 },
  { minPercentage: 80, discountPercentage: 25 },
  { minPercentage: 70, discountPercentage: 15 },
  { minPercentage: 60, discountPercentage: 10 },
];

const SECTIONS = [
  { id: "section-up-program-details", label: "Program Details" },
  { id: "section-up-university-details", label: "University Details" },
  { id: "section-up-brochure", label: "Brochure" },
  { id: "section-up-eligibility-admission", label: "Eligibility & Admission" },
  { id: "section-up-fees", label: "Fees" },
  { id: "section-up-scholarships", label: "Scholarships" },
  { id: "section-up-credentials", label: "Credentials" },
  { id: "section-up-curriculum", label: "Curriculum & Learning" },
  { id: "section-up-career", label: "Career & Placement" },
];

const emptyForm = {
  programName: "",
  degree: DEGREE_OPTIONS[0],
  level: LEVEL_OPTIONS[2],
  specializations: [],
  mode: [],
  durationValue: "",
  durationUnit: "Years",
  universityName: "",
  universityOfficialUrl: "",
  universityLocation: "",
  universityCity: "",
  universityGoogleMapUrl: "",
  universityAddress: "",
  universityLogoFile: null,
  universityLogoUrl: "",
  brochureFile: null,
  eligibility: "",
  applicationDeadline: "",
  admissionCycle: "",
  programStartDate: "",
  totalFee: "",
  semesterFee: "",
  applicationFee: "",
  emiAvailable: false,
  upfrontAmount: "",
  emiDuration: "",
  scholarships: DEFAULT_SCHOLARSHIPS,
  recognition: [],
  accreditation: [],
  affiliation: [],
  rankings: [],
  credits: "",
  liveClasses: false,
  recordedClasses: false,
  lms: false,
  examinationMode: "",
  assignment: false,
  internship: false,
  industryProject: false,
  industryCertification: false,
  additionalFeatures: [],
  placementSupport: false,
  careerServices: [],
  alumni: "",
  recruiters: [],
};

const inputClass = "border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none w-full";
const fieldLabelClass = "flex flex-col gap-2 text-sm font-semibold text-slate-700";
const sectionCardClass = "bg-white p-5 rounded-xl border border-[#E2E8F0] scroll-mt-24";
const sectionHeadingClass = "text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider";

// Admin-added dropdown options are persisted to localStorage so they survive closing/reopening
// this form (a plain useState would reset back to the hardcoded defaults every time it remounts).
const CUSTOM_OPTIONS_STORAGE_KEY = "university_program_custom_options_v1";

const readStoredOptions = (storageKey) => {
  try {
    const raw = window.localStorage.getItem(CUSTOM_OPTIONS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return Array.isArray(all[storageKey]) ? all[storageKey] : [];
  } catch {
    return [];
  }
};

const writeStoredOptions = (storageKey, options) => {
  try {
    const raw = window.localStorage.getItem(CUSTOM_OPTIONS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(CUSTOM_OPTIONS_STORAGE_KEY, JSON.stringify({ ...all, [storageKey]: options }));
  } catch {
    // localStorage unavailable (e.g. private browsing) — options simply won't persist across reloads.
  }
};

const usePersistedOptions = (storageKey, defaultOptions) => {
  const [options, setOptionsState] = useState(() => {
    const stored = readStoredOptions(storageKey);
    return [...defaultOptions, ...stored.filter((o) => !defaultOptions.includes(o))];
  });

  const setOptions = (updater) => {
    setOptionsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeStoredOptions(storageKey, next.filter((o) => !defaultOptions.includes(o)));
      return next;
    });
  };

  return [options, setOptions];
};

const Field = ({ label, required, children }) => (
  <label className={fieldLabelClass}>
    <span>
      {label} {required && <span className="text-rose-600">*</span>}
    </span>
    {children}
  </label>
);

// Single-select dropdown where the admin can add new options on the fly (same pattern as OpportunityForm.jsx's CreatableSingleDropdown).
const CreatableSingleDropdown = ({ label, options, setOptions, selected, onChange, required, placeholder = "Select or add..." }) => {
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
      onChange(newOption);
      setIsOpen(false);
    }
    setInputValue("");
  };

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <span>{label} {required && <span className="text-rose-600">*</span>}</span>
      <div
        className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex justify-between items-center transition-all hover:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-normal text-slate-600 truncate">{selected || placeholder}</span>
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
            <button type="button" onClick={handleAddOption} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">
              Add
            </button>
          </div>
          <div className="overflow-y-auto p-2 max-h-48">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => { onChange(option); setIsOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors font-normal text-slate-700 ${selected === option ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Multi-select checkbox dropdown where the admin can add new options on the fly (same pattern as OpportunityForm.jsx's CreatableCheckboxDropdown).
const CreatableCheckboxDropdown = ({ label, options, setOptions, selected, onToggle, required, placeholder = "Select options..." }) => {
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
      <span>{label} {required && <span className="text-rose-600">*</span>}</span>
      <div
        className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex justify-between items-center transition-all hover:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
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
            <button type="button" onClick={handleAddOption} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">
              Add
            </button>
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

const orEmpty = (value) => (value === null || value === undefined ? "" : value);

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

// Builds the flat form-state shape (mirrors emptyForm) from a UniversityProgram document
// returned by the API, falling back to sensible defaults for anything missing/older records.
const formFromProgram = (program) => ({
  programName: program.programName || "",
  degree: program.degree || DEGREE_OPTIONS[0],
  level: program.level || LEVEL_OPTIONS[2],
  specializations: Array.isArray(program.specializations) ? program.specializations : [],
  mode: Array.isArray(program.mode) ? program.mode : [],
  durationValue: orEmpty(program.duration?.value),
  durationUnit: program.duration?.unit || "Years",
  universityName: program.university?.name || "",
  universityOfficialUrl: program.university?.officialUrl || "",
  universityLocation: program.university?.location || "",
  universityCity: program.university?.city || "",
  universityGoogleMapUrl: program.university?.googleMapUrl || "",
  universityAddress: program.university?.address || "",
  universityLogoFile: null,
  universityLogoUrl: program.university?.logo || "",
  brochureFile: null,
  eligibility: program.eligibility || "",
  applicationDeadline: toDateInputValue(program.applicationDeadline),
  admissionCycle: program.admissionCycle || "",
  programStartDate: toDateInputValue(program.programStartDate),
  totalFee: orEmpty(program.fees?.totalFee),
  semesterFee: orEmpty(program.fees?.semesterFee),
  applicationFee: orEmpty(program.fees?.applicationFee),
  emiAvailable: Boolean(program.fees?.emiAvailable),
  upfrontAmount: orEmpty(program.fees?.upfrontAmount),
  emiDuration: orEmpty(program.fees?.emiDuration),
  scholarships:
    Array.isArray(program.scholarships) && program.scholarships.length > 0
      ? program.scholarships.map((s) => ({ minPercentage: orEmpty(s.minPercentage), discountPercentage: orEmpty(s.discountPercentage) }))
      : DEFAULT_SCHOLARSHIPS,
  recognition: Array.isArray(program.credentials?.recognition) ? program.credentials.recognition : [],
  accreditation: Array.isArray(program.credentials?.accreditation) ? program.credentials.accreditation : [],
  affiliation: Array.isArray(program.credentials?.affiliation) ? program.credentials.affiliation : [],
  rankings: Array.isArray(program.credentials?.rankings)
    ? program.credentials.rankings.map((r) => ({ organization: r.organization || "", rank: orEmpty(r.rank), year: orEmpty(r.year) }))
    : [],
  credits: orEmpty(program.curriculum?.credits),
  liveClasses: Boolean(program.curriculum?.liveClasses),
  recordedClasses: Boolean(program.curriculum?.recordedClasses),
  lms: Boolean(program.curriculum?.lms),
  examinationMode: program.curriculum?.examinationMode || "",
  assignment: Boolean(program.curriculum?.assignment),
  internship: Boolean(program.curriculum?.internship),
  industryProject: Boolean(program.curriculum?.industryProject),
  industryCertification: Boolean(program.curriculum?.industryCertification),
  additionalFeatures: Array.isArray(program.curriculum?.additionalFeatures) ? program.curriculum.additionalFeatures : [],
  placementSupport: Boolean(program.career?.placementSupport),
  careerServices: Array.isArray(program.career?.careerServices) ? program.career.careerServices : [],
  alumni: program.career?.alumni || "",
  recruiters: Array.isArray(program.career?.recruiters) ? program.career.recruiters : [],
});

const UniversityProgramForm = ({ onClose, onSaved, initialProgram }) => {
  const isEditMode = Boolean(initialProgram?._id);
  const [form, setForm] = useState(() => (isEditMode ? formFromProgram(initialProgram) : emptyForm));
  const [existingBrochure, setExistingBrochure] = useState(() => (initialProgram?.brochure?.url ? initialProgram.brochure : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [savedProgramId, setSavedProgramId] = useState(null);
  const [degreeOptions, setDegreeOptions] = usePersistedOptions("degree", DEGREE_OPTIONS);
  const [modeOptions, setModeOptions] = usePersistedOptions("mode", MODE_OPTIONS);
  const [specializationOptions, setSpecializationOptions] = usePersistedOptions("specializations", SPECIALIZATION_OPTIONS);
  const [curriculumFeatureOptions, setCurriculumFeatureOptions] = usePersistedOptions("curriculumFeatures", CURRICULUM_FEATURE_LABELS);
  const [recognitionOptions, setRecognitionOptions] = usePersistedOptions("recognition", RECOGNITION_OPTIONS);
  const [accreditationOptions, setAccreditationOptions] = usePersistedOptions("accreditation", ACCREDITATION_OPTIONS);
  const [affiliationOptions, setAffiliationOptions] = usePersistedOptions("affiliation", AFFILIATION_OPTIONS);
  const [careerServiceOptions, setCareerServiceOptions] = usePersistedOptions("careerServices", CAREER_SERVICE_OPTIONS);
  const [recruiterOptions, setRecruiterOptions] = usePersistedOptions("recruiters", RECRUITER_OPTIONS);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!initialProgram?._id) return;
    setForm(formFromProgram(initialProgram));
    setExistingBrochure(initialProgram.brochure?.url ? initialProgram.brochure : null);
  }, [initialProgram]);

  const dashboardBasePath = location.pathname.startsWith("/super-admin-dashboard")
    ? "/super-admin-dashboard"
    : location.pathname.startsWith("/mentor-dashboard")
      ? "/mentor-dashboard"
      : "/admin-dashboard";

  const goToApplicationForm = () => {
    if (!savedProgramId) return;
    navigate(`${dashboardBasePath}/build-form/${savedProgramId}`);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisible = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!mostVisible || entry.intersectionRatio > mostVisible.intersectionRatio)) {
            mostVisible = entry;
          }
        });
        if (mostVisible) setActiveSection(mostVisible.target.id);
      },
      { root: document.getElementById("university-program-form-container"), rootMargin: "-10% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
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
    const container = document.getElementById("university-program-form-container");
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
    }
  };

  const handleField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const toggleMode = (mode) => {
    setForm((prev) => ({
      ...prev,
      mode: prev.mode.includes(mode) ? prev.mode.filter((m) => m !== mode) : [...prev.mode, mode],
    }));
  };

  const toggleSpecialization = (specialization) => {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter((s) => s !== specialization)
        : [...prev.specializations, specialization],
    }));
  };

  const toggleArrayField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value],
    }));
  };

  const selectedCurriculumFeatures = [
    ...CURRICULUM_FEATURES.filter(([key]) => form[key]).map(([, label]) => label),
    ...form.additionalFeatures,
  ];

  const toggleCurriculumFeature = (label) => {
    const knownKey = CURRICULUM_FEATURE_KEY_BY_LABEL[label];
    if (knownKey) {
      handleField(knownKey, !form[knownKey]);
      return;
    }
    setForm((prev) => ({
      ...prev,
      additionalFeatures: prev.additionalFeatures.includes(label)
        ? prev.additionalFeatures.filter((f) => f !== label)
        : [...prev.additionalFeatures, label],
    }));
  };

  const updateScholarship = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      scholarships: prev.scholarships.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
    }));
  };

  const addScholarship = () =>
    setForm((prev) => ({ ...prev, scholarships: [...prev.scholarships, { minPercentage: "", discountPercentage: "" }] }));

  const removeScholarship = (index) =>
    setForm((prev) => ({ ...prev, scholarships: prev.scholarships.filter((_, i) => i !== index) }));

  const updateRanking = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      rankings: prev.rankings.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    }));
  };

  const addRanking = () =>
    setForm((prev) => ({ ...prev, rankings: [...prev.rankings, { organization: "", rank: "", year: "" }] }));

  const removeRanking = (index) =>
    setForm((prev) => ({ ...prev, rankings: prev.rankings.filter((_, i) => i !== index) }));

  const isSectionFilled = (id) => {
    switch (id) {
      case "section-up-program-details":
        return Boolean(form.programName && form.durationValue);
      case "section-up-university-details":
        return Boolean(form.universityName);
      case "section-up-brochure":
        return Boolean(form.brochureFile);
      case "section-up-eligibility-admission":
        return Boolean(form.eligibility || form.admissionCycle);
      case "section-up-fees":
        return Boolean(form.totalFee);
      case "section-up-scholarships":
        return form.scholarships.length > 0;
      case "section-up-credentials":
        return Boolean(form.recognition.length > 0 || form.accreditation.length > 0 || form.affiliation.length > 0 || form.rankings.length > 0);
      case "section-up-curriculum":
        return Boolean(form.credits || form.examinationMode);
      case "section-up-career":
        return Boolean(form.placementSupport || form.careerServices.length > 0 || form.recruiters.length > 0);
      default:
        return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.programName.trim()) { setError("Program name is required."); return; }
    if (!form.universityName.trim()) { setError("University name is required."); return; }
    if (!form.durationValue) { setError("Duration value is required."); return; }
    if (!form.totalFee) { setError("Total fee is required."); return; }
    if (form.emiAvailable && Number(form.upfrontAmount || 0) > Number(form.totalFee)) {
      setError("Upfront amount cannot be greater than the total fee.");
      return;
    }

    const data = new FormData();
    data.append("programName", form.programName.trim());
    data.append("degree", form.degree);
    data.append("level", form.level);
    data.append("specializations", JSON.stringify(form.specializations));
    data.append("mode", JSON.stringify(form.mode));
    data.append("duration", JSON.stringify({ value: Number(form.durationValue), unit: form.durationUnit }));
    data.append(
      "university",
      JSON.stringify({
        name: form.universityName.trim(),
        officialUrl: form.universityOfficialUrl.trim(),
        location: form.universityLocation.trim(),
        city: form.universityCity.trim(),
        googleMapUrl: form.universityGoogleMapUrl.trim(),
        address: form.universityAddress.trim(),
        // Only sent when no file is chosen — the backend overwrites this with the uploaded file's path if present.
        logo: form.universityLogoFile ? "" : form.universityLogoUrl.trim(),
      })
    );
    if (form.universityLogoFile) data.append("universityLogo", form.universityLogoFile);
    data.append("eligibility", form.eligibility);
    if (form.applicationDeadline) data.append("applicationDeadline", form.applicationDeadline);
    data.append("admissionCycle", form.admissionCycle);
    if (form.programStartDate) data.append("programStartDate", form.programStartDate);
    data.append(
      "fees",
      JSON.stringify({
        totalFee: Number(form.totalFee),
        semesterFee: form.semesterFee ? Number(form.semesterFee) : null,
        applicationFee: form.applicationFee ? Number(form.applicationFee) : null,
        emiAvailable: form.emiAvailable,
        upfrontAmount: form.emiAvailable ? Number(form.upfrontAmount || 0) : null,
        emiDuration: form.emiAvailable ? Number(form.emiDuration || 0) : null,
      })
    );
    data.append(
      "scholarships",
      JSON.stringify(
        form.scholarships.map((s) => ({ minPercentage: Number(s.minPercentage), discountPercentage: Number(s.discountPercentage) }))
      )
    );
    data.append(
      "credentials",
      JSON.stringify({
        recognition: form.recognition,
        accreditation: form.accreditation,
        affiliation: form.affiliation,
        rankings: form.rankings.map((r) => ({ organization: r.organization, rank: r.rank ? Number(r.rank) : null, year: r.year ? Number(r.year) : null })),
      })
    );
    data.append(
      "curriculum",
      JSON.stringify({
        credits: form.credits ? Number(form.credits) : null,
        liveClasses: form.liveClasses,
        recordedClasses: form.recordedClasses,
        lms: form.lms,
        examinationMode: form.examinationMode,
        assignment: form.assignment,
        internship: form.internship,
        industryProject: form.industryProject,
        industryCertification: form.industryCertification,
        additionalFeatures: form.additionalFeatures,
      })
    );
    data.append(
      "career",
      JSON.stringify({
        placementSupport: form.placementSupport,
        careerServices: form.careerServices,
        alumni: form.alumni,
        recruiters: form.recruiters,
      })
    );
    if (form.brochureFile) {
      data.append("brochure", form.brochureFile);
    } else if (isEditMode && existingBrochure) {
      // No new file picked — resend the existing brochure metadata so the update keeps it
      // instead of clearing it (normalizePayload only preserves keys that are actually sent).
      data.append("brochure", JSON.stringify(existingBrochure));
    }

    try {
      setBusy(true);
      const savedProgram = isEditMode
        ? await updateUniversityProgram(initialProgram._id, data)
        : await createUniversityProgram(data);
      setSavedProgramId(savedProgram?._id || savedProgram?.id || null);
      onSaved?.(savedProgram);
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Failed to save university program."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] flex flex-col xl:flex-row h-[90vh] overflow-hidden">
      {/* Left: section navigation, mirrors OpportunityForm.jsx */}
      <div className="w-full xl:w-[300px] bg-white border-r border-[#E2E8F0] p-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <h2 className="text-xl font-bold text-slate-800 mb-6">{isEditMode ? "Edit University Program" : "Create University Program"}</h2>

        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mb-5 overflow-hidden">
          <div
            className="bg-blue-700 h-full transition-all duration-300"
            style={{ width: savedProgramId ? "100%" : "40%" }}
          ></div>
        </div>

        <div className="space-y-4 relative">
          <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-300 z-0"></div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className="relative z-20 w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-bold bg-blue-700 text-white">1</div>
              <span className="font-semibold text-sm text-blue-700">Program Details</span>
            </div>

            <div className="flex flex-col gap-5 pl-8 relative z-10 mt-3 mb-2">
              <div className="absolute left-[47px] top-4 bottom-4 w-0.5 bg-slate-300 z-0"></div>

              {SECTIONS.map((section, i) => {
                const isFilled = isSectionFilled(section.id);
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-start gap-4 relative z-10 w-full text-left group"
                  >
                    <div
                      className={`relative z-20 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isFilled && !isActive
                          ? "bg-[#EEF2FF] text-[#21B573]"
                          : isActive
                            ? "bg-blue-700 text-white shadow-md"
                            : "bg-white border-2 border-slate-300 text-slate-500"
                      }`}
                    >
                      {isFilled && !isActive ? <FiCheck className="w-5 h-5" /> : i + 1}
                    </div>
                    <div className="flex flex-col mt-[5px]">
                      <span
                        className={`font-bold text-[13px] leading-tight transition-colors ${
                          isActive ? "text-blue-700" : isFilled ? "text-slate-700" : "text-slate-500 group-hover:text-slate-700"
                        }`}
                      >
                        {section.label}
                      </span>
                      {isFilled && !isActive && <span className="text-[11px] font-bold text-red-600/80 mt-0.5">Complete</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full mt-4">
            <button
              type="button"
              onClick={goToApplicationForm}
              disabled={!savedProgramId}
              className={`flex items-center gap-4 relative z-10 w-full text-left group ${savedProgramId ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`relative z-20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${savedProgramId ? "bg-[#1F2853] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}>
                2
              </div>
              <span className={`font-semibold text-sm transition-colors ${savedProgramId ? "text-[#1F2853]" : "text-slate-400 group-hover:text-slate-600"}`}>Application Form</span>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
            {savedProgramId ? "Close" : "Cancel"}
          </button>
        </div>
      </div>

      {/* Right: scrollable form */}
      <div id="university-program-form-container" className="flex-1 p-8 pb-6 bg-[#EEF2FF]/50 overflow-y-auto h-full">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">{error}</div>}
        {savedProgramId && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 mb-6 flex items-center justify-between gap-4">
            <span>Program saved successfully. You can now build its Application Form.</span>
            <button type="button" onClick={goToApplicationForm} className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800">
              Build Application Form
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div id="section-up-program-details" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Program Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Program Name" required>
                <input value={form.programName} onChange={(e) => handleField("programName", e.target.value)} placeholder="e.g. B.Tech in Computer Science Engineering" className={inputClass} required />
              </Field>

              <CreatableSingleDropdown
                label="Degree"
                required
                options={degreeOptions}
                setOptions={setDegreeOptions}
                selected={form.degree}
                onChange={(value) => handleField("degree", value)}
                placeholder="Select or add a degree..."
              />

              <Field label="Level" required>
                <select value={form.level} onChange={(e) => handleField("level", e.target.value)} className={inputClass}>
                  {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>

              <CreatableCheckboxDropdown
                label="Specializations"
                options={specializationOptions}
                setOptions={setSpecializationOptions}
                selected={form.specializations}
                onToggle={toggleSpecialization}
                placeholder="Select specialization(s)..."
              />

              <CreatableCheckboxDropdown
                label="Mode"
                required
                options={modeOptions}
                setOptions={setModeOptions}
                selected={form.mode}
                onToggle={toggleMode}
                placeholder="Select mode(s)..."
              />

              <Field label="Duration" required>
                <div className="flex gap-2">
                  <input required type="number" min="1" placeholder="e.g. 4" value={form.durationValue} onChange={(e) => handleField("durationValue", e.target.value)} className={`${inputClass} flex-[3] w-auto`} />
                  <select value={form.durationUnit} onChange={(e) => handleField("durationUnit", e.target.value)} className={`${inputClass} flex-1 w-auto shrink-0`}>
                    {DURATION_UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </Field>
            </div>
          </div>

          <div id="section-up-university-details" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>University Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="University Name" required>
                <input value={form.universityName} onChange={(e) => handleField("universityName", e.target.value)} placeholder="e.g. Chandigarh University" className={inputClass} required />
              </Field>

              <Field label="Official University URL">
                <input value={form.universityOfficialUrl} onChange={(e) => handleField("universityOfficialUrl", e.target.value)} placeholder="https://www.example.edu" className={inputClass} />
              </Field>

              <Field label="Location">
                <input value={form.universityLocation} onChange={(e) => handleField("universityLocation", e.target.value)} placeholder="e.g. India" className={inputClass} />
              </Field>

              <Field label="City / Town">
                <input value={form.universityCity} onChange={(e) => handleField("universityCity", e.target.value)} placeholder="e.g. Mohali" className={inputClass} />
              </Field>

              

              <Field label="University Logo (link)">
                <input
                  value={form.universityLogoUrl}
                  onChange={(e) => handleField("universityLogoUrl", e.target.value)}
                  placeholder="https://www.example.edu/logo.png"
                  disabled={Boolean(form.universityLogoFile)}
                  className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                />
               
              </Field>

              <Field label="University Logo (upload)">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleField("universityLogoFile", e.target.files[0] || null)}
                  className={`${inputClass} py-2.5`}
                />
                {isEditMode && !form.universityLogoFile && form.universityLogoUrl && (
                  <span className="text-xs font-normal text-slate-500">Keeping the current logo. Choose a file to replace it.</span>
                )}
              </Field>


              <Field label="Google Map URL">
                <input value={form.universityGoogleMapUrl} onChange={(e) => handleField("universityGoogleMapUrl", e.target.value)} placeholder="https://maps.google.com/..." className={inputClass} />
              </Field>
              

              <Field label="Complete Address">
                <textarea value={form.universityAddress} onChange={(e) => handleField("universityAddress", e.target.value)} placeholder="Full campus address" className={inputClass} rows={2} />
              </Field>
            </div>
          </div>

          <div id="section-up-brochure" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Brochure</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Brochure (PDF, max 10MB)">
                <input type="file" accept="application/pdf" onChange={(e) => handleField("brochureFile", e.target.files[0] || null)} className={`${inputClass} py-2.5`} />
                {isEditMode && !form.brochureFile && existingBrochure && (
                  <span className="text-xs font-normal text-slate-500">Current brochure: {existingBrochure.fileName || existingBrochure.url}. Choose a file to replace it.</span>
                )}
              </Field>
            </div>
          </div>

          <div id="section-up-eligibility-admission" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Eligibility & Admission</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Eligibility">
                <textarea value={form.eligibility} onChange={(e) => handleField("eligibility", e.target.value)} placeholder="e.g. 10+2 with Physics, Chemistry and Mathematics." className={`${inputClass} md:col-span-2`} rows={3} />
              </Field>
              <Field label="Application Deadline">
                <input type="date" value={form.applicationDeadline} onChange={(e) => handleField("applicationDeadline", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Admission Cycle">
                <input value={form.admissionCycle} onChange={(e) => handleField("admissionCycle", e.target.value)} placeholder="e.g. 2026-27" className={inputClass} />
              </Field>
              <Field label="Program Start Date">
                <input type="date" value={form.programStartDate} onChange={(e) => handleField("programStartDate", e.target.value)} className={inputClass} />
              </Field>
            </div>
          </div>

          <div id="section-up-fees" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Fees</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Total Fee" required>
                <input required type="number" min="0" value={form.totalFee} onChange={(e) => handleField("totalFee", e.target.value)} placeholder="e.g. 480000" className={inputClass} />
              </Field>
              <Field label="Semester Fee">
                <input type="number" min="0" value={form.semesterFee} onChange={(e) => handleField("semesterFee", e.target.value)} placeholder="e.g. 60000" className={inputClass} />
              </Field>
              <Field label="Application Fee">
                <input type="number" min="0" value={form.applicationFee} onChange={(e) => handleField("applicationFee", e.target.value)} placeholder="e.g. 1000" className={inputClass} />
              </Field>
              <Field label="EMI Available">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 px-1 py-3">
                  <input type="checkbox" checked={form.emiAvailable} onChange={(e) => handleField("emiAvailable", e.target.checked)} className="accent-blue-700 w-4 h-4 rounded" />
                  Allow EMI payments for this program
                </label>
              </Field>
              {form.emiAvailable && (
                <>
                  <Field label="Upfront Amount" required>
                    <input type="number" min="0" value={form.upfrontAmount} onChange={(e) => handleField("upfrontAmount", e.target.value)} placeholder="e.g. 80000" className={inputClass} />
                  </Field>
                  <Field label="EMI Duration (months)" required>
                    <input type="number" min="1" value={form.emiDuration} onChange={(e) => handleField("emiDuration", e.target.value)} placeholder="e.g. 10" className={inputClass} />
                  </Field>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-4">Monthly EMI is calculated automatically on the backend from total fee, upfront amount and EMI duration — it is not entered manually.</p>
          </div>

          <div id="section-up-scholarships" className={sectionCardClass}>
            <div className="flex items-center justify-between mb-6">
              <h4 className={`${sectionHeadingClass} mb-0`}>Scholarships</h4>
              <button type="button" onClick={addScholarship} className="text-xs font-bold text-blue-700 hover:text-blue-800">+ Add Scholarship</button>
            </div>
            <div className="flex flex-col gap-4">
              {form.scholarships.map((s, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                  <Field label="Min Percentage">
                    <input type="number" min="0" max="100" value={s.minPercentage} onChange={(e) => updateScholarship(i, "minPercentage", e.target.value)} placeholder="e.g. 90" className={inputClass} />
                  </Field>
                  <Field label="Discount Percentage">
                    <input type="number" min="0" max="100" value={s.discountPercentage} onChange={(e) => updateScholarship(i, "discountPercentage", e.target.value)} placeholder="e.g. 50" className={inputClass} />
                  </Field>
                  <button type="button" onClick={() => removeScholarship(i)} className="text-xs font-bold text-red-600 hover:text-red-700 py-3">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div id="section-up-credentials" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <CreatableCheckboxDropdown
                label="Recognition"
                options={recognitionOptions}
                setOptions={setRecognitionOptions}
                selected={form.recognition}
                onToggle={(value) => toggleArrayField("recognition", value)}
                placeholder="Select recognition(s)..."
              />
              <CreatableCheckboxDropdown
                label="Accreditation"
                options={accreditationOptions}
                setOptions={setAccreditationOptions}
                selected={form.accreditation}
                onToggle={(value) => toggleArrayField("accreditation", value)}
                placeholder="Select accreditation(s)..."
              />
              <CreatableCheckboxDropdown
                label="Affiliation"
                options={affiliationOptions}
                setOptions={setAffiliationOptions}
                selected={form.affiliation}
                onToggle={(value) => toggleArrayField("affiliation", value)}
                placeholder="Select affiliation(s)..."
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rankings</span>
              <button type="button" onClick={addRanking} className="text-xs font-bold text-blue-700 hover:text-blue-800">+ Add Ranking</button>
            </div>
            <div className="flex flex-col gap-4">
              {form.rankings.map((r, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                  <Field label="Organization">
                    <input value={r.organization} onChange={(e) => updateRanking(i, "organization", e.target.value)} placeholder="e.g. NIRF" className={inputClass} />
                  </Field>
                  <Field label="Rank">
                    <input type="number" value={r.rank} onChange={(e) => updateRanking(i, "rank", e.target.value)} placeholder="e.g. 45" className={inputClass} />
                  </Field>
                  <Field label="Year">
                    <input type="number" value={r.year} onChange={(e) => updateRanking(i, "year", e.target.value)} placeholder="e.g. 2025" className={inputClass} />
                  </Field>
                  <button type="button" onClick={() => removeRanking(i)} className="text-xs font-bold text-red-600 hover:text-red-700 py-3">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div id="section-up-curriculum" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Curriculum & Learning</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Credits">
                <input type="number" min="0" value={form.credits} onChange={(e) => handleField("credits", e.target.value)} placeholder="e.g. 160" className={inputClass} />
              </Field>
              <Field label="Examination Mode">
                <select value={form.examinationMode} onChange={(e) => handleField("examinationMode", e.target.value)} className={inputClass}>
                  <option value="">Select Examination Mode</option>
                  {EXAMINATION_MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <CreatableCheckboxDropdown
                label="Learning Features"
                options={curriculumFeatureOptions}
                setOptions={setCurriculumFeatureOptions}
                selected={selectedCurriculumFeatures}
                onToggle={toggleCurriculumFeature}
                placeholder="Select learning feature(s)..."
              />
            </div>
          </div>

          <div id="section-up-career" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Career & Placement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Placement Support">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 px-1 py-3">
                  <input type="checkbox" checked={form.placementSupport} onChange={(e) => handleField("placementSupport", e.target.checked)} className="accent-blue-700 w-4 h-4 rounded" />
                  This program offers placement support
                </label>
              </Field>
              <Field label="Alumni">
                <input value={form.alumni} onChange={(e) => handleField("alumni", e.target.value)} placeholder="e.g. 25,000+ alumni" className={inputClass} />
              </Field>
              <CreatableCheckboxDropdown
                label="Career Services"
                options={careerServiceOptions}
                setOptions={setCareerServiceOptions}
                selected={form.careerServices}
                onToggle={(value) => toggleArrayField("careerServices", value)}
                placeholder="Select career service(s)..."
              />
              <CreatableCheckboxDropdown
                label="Recruiters"
                options={recruiterOptions}
                setOptions={setRecruiterOptions}
                selected={form.recruiters}
                onToggle={(value) => toggleArrayField("recruiters", value)}
                placeholder="Select recruiter(s)..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
              {savedProgramId ? "Close" : "Cancel"}
            </button>
            {savedProgramId ? (
              <button type="button" onClick={goToApplicationForm} className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-all">
                Continue to Application Form
              </button>
            ) : (
              <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-all disabled:opacity-60">
                {busy ? "Saving..." : isEditMode ? "Save Changes" : "Save Program"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniversityProgramForm;
