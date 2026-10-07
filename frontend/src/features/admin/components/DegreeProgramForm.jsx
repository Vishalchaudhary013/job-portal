import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiX, FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../../services/apiClient";
import { createDegreeProgram, updateDegreeProgram } from "../../../services/degreeProgramAPI";

// Full 12-section Degree Program CMS, matching the admin's "Create Degree Program" spec:
// Card Information, Eligibility, Fees, Scholarships, Financing, Curriculum, Learning,
// Industry, Career, Admission, Content, Brochure — plus an Application Form step, mirroring
// the same left-nav/right-form layout used by UniversityProgramForm.jsx.
// Reorder controls use simple up/down buttons rather than drag-and-drop, and rich text
// fields are plain textareas — see conversation for why (full spec would be a multi-session build).

const DURATION_UNIT_OPTIONS = ["Months", "Years"];
const SCHOLARSHIP_TYPES = ["Merit Based", "Need Based", "Sports", "Women", "Government", "Entrance Exam", "Early Bird", "Other"];
const SUBJECT_TYPES = ["Core", "Elective", "Practical", "Laboratory", "Project", "Skill", "Open Elective"];
const PARTNERSHIP_TYPES = ["Hiring Partner", "Internship Partner", "Project Partner", "Industry Partner", "Training Partner"];
const LIVE_CLASS_FREQUENCIES = ["Daily", "Weekly", "Bi-Weekly", "Monthly"];
const ADMISSION_STATUS_OPTIONS = ["Upcoming", "Open", "Closing Soon", "Closed"];

const DEGREE_OPTIONS = ["B.Tech", "B.E.", "BCA", "MCA", "BBA", "MBA", "B.Sc", "M.Sc", "M.Tech", "M.Com", "PhD", "Diploma", "Certificate"];
const SPECIALIZATION_OPTIONS = ["Computer Science Engineering", "Artificial Intelligence", "Machine Learning", "Data Science", "Cyber Security", "Cloud Computing", "Finance", "Marketing", "Human Resources"];
const MODE_OPTIONS = ["Online", "Offline", "Hybrid"];
const RECOGNITION_OPTIONS = ["UGC", "AICTE", "DEB Approved", "Government Recognized"];
const ACCREDITATION_OPTIONS = ["NAAC A+", "NAAC A", "NAAC B+", "NBA"];
const CAREER_OUTCOME_OPTIONS = ["Software Developer", "Data Analyst", "Product Manager", "Business Analyst", "Consultant"];
const SKILL_OPTIONS = ["React", "Python", "Java", "SQL", "Machine Learning", "Communication", "Leadership"];
const REQUIRED_SUBJECT_OPTIONS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Science", "Economics", "Accountancy", "Business Studies"];
const FINANCING_PARTNER_OPTIONS = ["HDFC Credila", "Avanse", "Propelld", "Auxilo", "InCred", "ICICI Bank", "SBI"];

const SECTIONS = [
  { id: "section-card", label: "Card Information" },
  { id: "section-eligibility", label: "Eligibility" },
  { id: "section-fees", label: "Fees" },
  { id: "section-scholarships", label: "Scholarships" },
  { id: "section-financing", label: "Financing" },
  { id: "section-financing-engine", label: "Fees Engine" },
  { id: "section-curriculum", label: "Curriculum" },
  { id: "section-learning", label: "Learning" },
  { id: "section-industry", label: "Industry" },
  { id: "section-career", label: "Career" },
  { id: "section-admission", label: "Admission" },
  { id: "section-content", label: "Content" },
  { id: "section-brochure", label: "Brochure" },
];

const inputClass = "border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none w-full";
const sectionCardClass = "bg-white p-5 rounded-xl border border-[#E2E8F0] scroll-mt-24";
const sectionHeadingClass = "text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider";
const subHeadingClass = "text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3 mt-2";
// Inline notice for a payment option switched on with the fields it needs still blank.
const configWarningClass = "-mt-1 mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700";

const Field = ({ label, required, hint, children }) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
    <span>
      {label} {required && <span className="text-rose-600">*</span>}
    </span>
    {children}
    {hint && <span className="text-[11px] font-normal text-slate-400">{hint}</span>}
  </label>
);

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 px-1 py-2">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-700 w-4 h-4 rounded" />
    {label}
  </label>
);

// Pill-style on/off switch, used inline within a field's label row (e.g. "reveal this input only when on").
const Switch = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    {label && <span className="text-xs font-normal text-slate-500">{label}</span>}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-blue-700" : "bg-slate-300"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  </label>
);

const TagInput = ({ label, values = [], onChange, placeholder = "Type and press Enter...", hint }) => {
  const [text, setText] = useState("");
  const addTag = () => {
    const v = text.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText("");
  };
  return (
    <Field label={label} hint={hint}>
      <div className={`${inputClass} flex flex-wrap gap-1.5 items-center py-2`}>
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#EEF2FF] text-[#1F2853] text-xs font-medium">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-red-600">
              <FiX size={12} />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>
    </Field>
  );
};

const BuilderHeader = ({ title, onAdd, addLabel, hint }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between">
      <span className={`${subHeadingClass} mt-0 mb-0`}>{title}</span>
      <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800">
        <FiPlus size={14} /> {addLabel}
      </button>
    </div>
    {hint && <p className="text-[11px] font-normal text-slate-400">{hint}</p>}
  </div>
);

const ReorderRemove = ({ index, length, onMoveUp, onMoveDown, onRemove }) => (
  <div className="flex items-center gap-2 shrink-0">
    <button type="button" disabled={index === 0} onClick={onMoveUp} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
      <FiArrowUp size={14} />
    </button>
    <button type="button" disabled={index === length - 1} onClick={onMoveDown} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
      <FiArrowDown size={14} />
    </button>
    <button type="button" onClick={onRemove} className="text-red-600 hover:text-red-700">
      <FiTrash2 size={14} />
    </button>
  </div>
);

const moveItem = (arr, index, direction) => {
  const next = [...arr];
  const target = index + direction;
  if (target < 0 || target >= next.length) return arr;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

// Admin-added dropdown options are persisted to localStorage so they survive closing/reopening
// this form (same pattern as UniversityProgramForm.jsx's usePersistedOptions).
const CUSTOM_OPTIONS_STORAGE_KEY = "degree_program_custom_options_v1";

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

// Single-select dropdown where the admin can add new options on the fly.
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

// Multi-select checkbox dropdown where the admin can add new options on the fly.
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

// ---------------------------------------------------------------------------------

const emptyCard = {
  programName: "",
  degree: "",
  specialization: "",
  universityName: "",
  universityLogoFile: null,
  universityLogoUrl: "",
  mode: [],
  durationValue: "",
  durationUnit: "Years",
  totalSeats: "",
  applicationDeadline: "",
  intakeCycle: "",
  rating: "",
  reviewCount: "",
  industryIntegrationScore: "",
  internship: false,
  industryProject: false,
  placementSupport: false,
  certification: false,
  careerOutcomes: [],
  skills: [],
  featuredStatus: false,
  trendingStatus: false,
  verifiedDate: "",
  recognition: [],
  accreditation: [],
  scholarshipAvailable: false,
  scholarshipAmount: "",
  scholarshipPercentage: "",
};

const emptyEligibility = {
  overview: "",
  minQualification: "",
  minPercentage: "",
  requiredSubjects: [],
  ageLimit: "",
  entranceExamRequired: false,
  entranceExam: "",
  additionalRequirements: "",
};

const emptyFees = {
  totalFee: "",
  applicationFee: "",
  registrationFee: "",
  semesterFee: "",
  annualFee: "",
  otherFees: "",
  emi: "",
  description: "",
};

const emptyFinancing = {
  available: false,
  emiAvailable: false,
  emiAmount: "",
  emiDurationValue: "",
  emiDurationUnit: "Months",
  downPayment: "",
  financingPartners: [],
  educationLoanAvailable: false,
  details: "",
};

const emptyFinancingEngine = {
  feeComponents: [],
  paymentOptions: {
    fullPayment: true,
    semester: false,
    quarterly: false,
    monthlyInstallment: false,
    emi: false,
    noCostEmi: false,
    educationLoan: false,
  },
  emiInterestRate: "",
  emiProcessingFee: "",
  emiTenures: [],
  emiMinAmount: "",
  emiMaxAmount: "",
  emiLender: "",
  noCostEmiTenures: [],
  noCostEmiProcessingFee: "",
  monthlyInstallmentAmount: "",
  semesterCount: "",
  semesterSchedule: [],
  quarterlyCount: "",
  quarterlySchedule: [],
  educationLoanMaxAmount: "",
};

const FEE_FREQUENCY_OPTIONS = ["One-time", "Annual", "Semester-wise", "Quarterly", "Monthly"];

const emptyCurriculum = {
  overview: "",
  totalSemesters: "",
  totalCredits: "",
  pdfFile: null,
  pdfUrl: "",
  pdfFileName: "",
  pdfSize: null,
  semesters: [],
};

const emptyLearning = {
  overview: "",
  lmsAvailable: false,
  lmsName: "",
  lmsUrl: "",
  liveClasses: false,
  liveClassFrequency: "",
  recordedClasses: false,
  studyMaterial: false,
  digitalLibrary: false,
  doubtSupport: false,
  mentorSupport: false,
  learningHours: "",
};

const emptyIndustry = {
  projectsAvailable: false,
  projectsCount: "",
  projectTypes: [],
  projectDescription: "",
  projectPartners: [],
  projectCertificateGiven: false,
  internshipAvailable: false,
  internshipDurationValue: "",
  internshipDurationUnit: "Months",
  internshipType: "",
  internshipPaid: false,
  internshipStipend: "",
  internshipPartners: [],
  internshipDescription: "",
  certifications: [],
  employers: [],
};

const emptyCareer = {
  roles: [],
  skills: [],
  salaryAvailable: false,
  salaryAverage: "",
  salaryMedian: "",
  salaryHighest: "",
  salaryLowest: "",
  salaryRangeMin: "",
  salaryRangeMax: "",
  salaryYear: "",
  salarySource: "",
  salaryReportFile: null,
  salaryReportUrl: "",
  placementAvailable: false,
  placementAssistance: false,
  placementTraining: false,
  resumeBuilding: false,
  mockInterviews: false,
  aptitudeTraining: false,
  softSkillsTraining: false,
  careerCounseling: false,
  placementPartnersCount: "",
  placementRate: "",
  placementDescription: "",
  placementReportFile: null,
  placementReportUrl: "",
};

const emptyAdmission = {
  applicationStartDate: "",
  applicationDeadline: "",
  admissionStartDate: "",
  admissionEndDate: "",
  entranceExamDate: "",
  intakeCycle: "",
  status: "",
  documents: [],
  process: [],
};

const emptyContent = {
  shortOverview: "",
  fullOverview: "",
  highlights: [],
  learningOutcomes: [],
  whyChoose: "",
  benefits: [],
  faqs: [],
  testimonials: [],
};

const emptyBrochure = {
  file: null,
  url: "",
  fileName: "",
  title: "",
  description: "",
  downloadEnabled: true,
};

const DegreeProgramCMSForm = ({ onClose, onSaved, initialProgram }) => {
  const [card, setCard] = useState(emptyCard);
  const [eligibility, setEligibility] = useState(emptyEligibility);
  const [fees, setFees] = useState(emptyFees);
  const [scholarships, setScholarships] = useState([]);
  const [financing, setFinancing] = useState(emptyFinancing);
  const [financingEngine, setFinancingEngine] = useState(emptyFinancingEngine);
  const [curriculum, setCurriculum] = useState(emptyCurriculum);
  const [learning, setLearning] = useState(emptyLearning);
  const [industry, setIndustry] = useState(emptyIndustry);
  const [career, setCareer] = useState(emptyCareer);
  const [admission, setAdmission] = useState(emptyAdmission);
  const [content, setContent] = useState(emptyContent);
  const [brochure, setBrochure] = useState(emptyBrochure);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [savedProgramId, setSavedProgramId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const [degreeOptions, setDegreeOptions] = usePersistedOptions("degree", DEGREE_OPTIONS);
  const [specializationOptions, setSpecializationOptions] = usePersistedOptions("specialization", SPECIALIZATION_OPTIONS);
  const [modeOptions, setModeOptions] = usePersistedOptions("mode", MODE_OPTIONS);
  const [recognitionOptions, setRecognitionOptions] = usePersistedOptions("recognition", RECOGNITION_OPTIONS);
  const [accreditationOptions, setAccreditationOptions] = usePersistedOptions("accreditation", ACCREDITATION_OPTIONS);
  const [careerOutcomeOptions, setCareerOutcomeOptions] = usePersistedOptions("careerOutcomes", CAREER_OUTCOME_OPTIONS);
  const [skillOptions, setSkillOptions] = usePersistedOptions("skills", SKILL_OPTIONS);
  const [requiredSubjectOptions, setRequiredSubjectOptions] = usePersistedOptions("requiredSubjects", REQUIRED_SUBJECT_OPTIONS);
  const [financingPartnerOptions, setFinancingPartnerOptions] = usePersistedOptions("financingPartners", FINANCING_PARTNER_OPTIONS);

  const isEditMode = Boolean(initialProgram && initialProgram._id);

  const navigate = useNavigate();
  const location = useLocation();

  const dashboardBasePath = location.pathname.startsWith("/super-admin-dashboard")
    ? "/super-admin-dashboard"
    : location.pathname.startsWith("/mentor-dashboard")
      ? "/mentor-dashboard"
      : "/admin-dashboard";

  // In edit mode the program already has an id, so the Application Form step should be
  // reachable immediately — it doesn't require a fresh save in this session like create mode does.
  const applicationFormProgramId = savedProgramId || (isEditMode ? initialProgram._id : null);

  const goToApplicationForm = () => {
    if (!applicationFormProgramId) return;
    navigate(`${dashboardBasePath}/build-form/${applicationFormProgramId}`);
  };

  // Pre-fill every state slice from the program being edited. Falls back to the matching
  // empty* constant for any missing sub-object so partial/older records don't crash the form.
  useEffect(() => {
    if (!initialProgram || !initialProgram._id) return;

    const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");
    const numToStr = (value) => (value === null || value === undefined ? "" : String(value));

    setCard({
      ...emptyCard,
      programName: initialProgram.programName || "",
      degree: initialProgram.degree || "",
      specialization: initialProgram.specialization || "",
      universityName: initialProgram.university?.name || "",
      universityLogoFile: null,
      universityLogoUrl: initialProgram.university?.logo || "",
      mode: initialProgram.mode || [],
      durationValue: numToStr(initialProgram.duration?.value),
      durationUnit: initialProgram.duration?.unit || "Years",
      totalSeats: numToStr(initialProgram.totalSeats),
      applicationDeadline: toDateInput(initialProgram.applicationDeadline),
      intakeCycle: initialProgram.intakeCycle || "",
      rating: numToStr(initialProgram.rating),
      reviewCount: numToStr(initialProgram.reviewCount),
      industryIntegrationScore: numToStr(initialProgram.industryIntegrationScore),
      internship: Boolean(initialProgram.internship),
      industryProject: Boolean(initialProgram.industryProject),
      placementSupport: Boolean(initialProgram.placementSupport),
      certification: Boolean(initialProgram.certification),
      careerOutcomes: initialProgram.careerOutcomes || [],
      skills: initialProgram.skills || [],
      featuredStatus: Boolean(initialProgram.featuredStatus),
      trendingStatus: Boolean(initialProgram.trendingStatus),
      verifiedDate: toDateInput(initialProgram.verifiedDate),
      recognition: initialProgram.recognition || [],
      accreditation: initialProgram.accreditation || [],
      scholarshipAvailable: Boolean(initialProgram.scholarship?.available),
      scholarshipAmount: numToStr(initialProgram.scholarship?.amount),
      scholarshipPercentage: numToStr(initialProgram.scholarship?.percentage),
    });

    setEligibility({
      ...emptyEligibility,
      overview: initialProgram.eligibility?.overview || "",
      minQualification: initialProgram.eligibility?.minQualification || "",
      minPercentage: numToStr(initialProgram.eligibility?.minPercentage),
      requiredSubjects: initialProgram.eligibility?.requiredSubjects || [],
      ageLimit: numToStr(initialProgram.eligibility?.ageLimit),
      entranceExamRequired: Boolean(initialProgram.eligibility?.entranceExamRequired),
      entranceExam: initialProgram.eligibility?.entranceExam || "",
      additionalRequirements: initialProgram.eligibility?.additionalRequirements || "",
    });

    setFees({
      ...emptyFees,
      totalFee: numToStr(initialProgram.fees?.totalFee),
      applicationFee: numToStr(initialProgram.fees?.applicationFee),
      registrationFee: numToStr(initialProgram.fees?.registrationFee),
      semesterFee: numToStr(initialProgram.fees?.semesterFee),
      annualFee: numToStr(initialProgram.fees?.annualFee),
      otherFees: numToStr(initialProgram.fees?.otherFees),
      emi: numToStr(initialProgram.fees?.emi),
      description: initialProgram.fees?.description || "",
    });

    setScholarships(
      (initialProgram.scholarships || []).map((s) => ({
        name: s.name || "",
        type: s.type || "Merit Based",
        amount: numToStr(s.amount),
        percentage: numToStr(s.percentage),
        eligibility: s.eligibility || "",
        applicationRequired: Boolean(s.applicationRequired),
        applicationDeadline: toDateInput(s.applicationDeadline),
        description: s.description || "",
        applicableComponents: s.applicableComponents || [],
      }))
    );

    setFinancing({
      ...emptyFinancing,
      available: Boolean(initialProgram.financing?.available),
      emiAvailable: Boolean(initialProgram.financing?.emiAvailable),
      emiAmount: numToStr(initialProgram.financing?.emiAmount),
      emiDurationValue: numToStr(initialProgram.financing?.emiDuration?.value),
      emiDurationUnit: initialProgram.financing?.emiDuration?.unit || "Months",
      downPayment: numToStr(initialProgram.financing?.downPayment),
      financingPartners: initialProgram.financing?.financingPartners || [],
      educationLoanAvailable: Boolean(initialProgram.financing?.educationLoanAvailable),
      details: initialProgram.financing?.details || "",
    });

    setFinancingEngine({
      ...emptyFinancingEngine,
      feeComponents: (initialProgram.financingEngine?.feeComponents || []).map((c) => ({
        name: c.name || "",
        amount: numToStr(c.amount),
        frequency: c.frequency || "One-time",
        mandatory: c.mandatory !== false,
        scholarshipApplicable: c.scholarshipApplicable !== false,
      })),
      paymentOptions: {
        ...emptyFinancingEngine.paymentOptions,
        ...(initialProgram.financingEngine?.paymentOptions || {}),
      },
      emiInterestRate: numToStr(initialProgram.financingEngine?.emi?.interestRate),
      emiProcessingFee: numToStr(initialProgram.financingEngine?.emi?.processingFee),
      emiTenures: (initialProgram.financingEngine?.emi?.tenures || []).map(String),
      emiMinAmount: numToStr(initialProgram.financingEngine?.emi?.minAmount),
      emiMaxAmount: numToStr(initialProgram.financingEngine?.emi?.maxAmount),
      emiLender: initialProgram.financingEngine?.emi?.lender || "",
      noCostEmiTenures: (initialProgram.financingEngine?.noCostEmi?.tenures || []).map(String),
      noCostEmiProcessingFee: numToStr(initialProgram.financingEngine?.noCostEmi?.processingFee),
      monthlyInstallmentAmount: numToStr(initialProgram.financingEngine?.monthlyInstallmentAmount),
      semesterCount: numToStr(initialProgram.financingEngine?.semesterCount),
      semesterSchedule: (initialProgram.financingEngine?.semesterSchedule || []).map(String),
      quarterlyCount: numToStr(initialProgram.financingEngine?.quarterlyCount),
      quarterlySchedule: (initialProgram.financingEngine?.quarterlySchedule || []).map(String),
      educationLoanMaxAmount: numToStr(initialProgram.financingEngine?.educationLoan?.maxAmount),
    });

    setCurriculum({
      ...emptyCurriculum,
      overview: initialProgram.curriculum?.overview || "",
      totalSemesters: numToStr(initialProgram.curriculum?.totalSemesters),
      totalCredits: numToStr(initialProgram.curriculum?.totalCredits),
      pdfFile: null,
      pdfUrl: initialProgram.curriculum?.pdf?.url || "",
      pdfFileName: initialProgram.curriculum?.pdf?.fileName || "",
      pdfSize: initialProgram.curriculum?.pdf?.size ?? null,
      semesters: (initialProgram.curriculum?.semesters || []).map((s) => ({
        name: s.name || "",
        number: s.number ?? 1,
        credits: numToStr(s.credits),
        subjects: (s.subjects || []).map((sub) => ({
          name: sub.name || "",
          code: sub.code || "",
          type: sub.type || "Core",
          credits: numToStr(sub.credits),
          theoryHours: numToStr(sub.theoryHours),
          practicalHours: numToStr(sub.practicalHours),
          description: sub.description || "",
          syllabus: sub.syllabus || "",
        })),
      })),
    });

    setLearning({
      ...emptyLearning,
      ...(initialProgram.learning || {}),
      learningHours: numToStr(initialProgram.learning?.learningHours),
    });

    setIndustry({
      ...emptyIndustry,
      projectsAvailable: Boolean(initialProgram.industry?.projects?.available),
      projectsCount: numToStr(initialProgram.industry?.projects?.count),
      projectTypes: initialProgram.industry?.projects?.types || [],
      projectDescription: initialProgram.industry?.projects?.description || "",
      projectPartners: initialProgram.industry?.projects?.partners || [],
      projectCertificateGiven: Boolean(initialProgram.industry?.projects?.certificateGiven),
      internshipAvailable: Boolean(initialProgram.industry?.internshipDetails?.available),
      internshipDurationValue: numToStr(initialProgram.industry?.internshipDetails?.duration?.value),
      internshipDurationUnit: initialProgram.industry?.internshipDetails?.duration?.unit || "Months",
      internshipType: initialProgram.industry?.internshipDetails?.type || "",
      internshipPaid: Boolean(initialProgram.industry?.internshipDetails?.paid),
      internshipStipend: numToStr(initialProgram.industry?.internshipDetails?.stipend),
      internshipPartners: initialProgram.industry?.internshipDetails?.partners || [],
      internshipDescription: initialProgram.industry?.internshipDetails?.description || "",
      certifications: (initialProgram.industry?.certifications || []).map((c) => ({
        available: c.available !== false,
        name: c.name || "",
        provider: c.provider || "",
        type: c.type || "",
        description: c.description || "",
        logo: c.logo || "",
        sample: c.sample || "",
      })),
      employers: (initialProgram.industry?.employers || []).map((e) => ({
        name: e.name || "",
        logo: e.logo || "",
        industry: e.industry || "",
        partnershipType: e.partnershipType || "Hiring Partner",
        hiringPartner: Boolean(e.hiringPartner),
        internshipPartner: Boolean(e.internshipPartner),
        projectPartner: Boolean(e.projectPartner),
        description: e.description || "",
      })),
    });

    setCareer({
      ...emptyCareer,
      roles: initialProgram.career?.roles || [],
      skills: initialProgram.career?.skills || [],
      salaryAvailable: Boolean(initialProgram.career?.salary?.available),
      salaryAverage: numToStr(initialProgram.career?.salary?.average),
      salaryMedian: numToStr(initialProgram.career?.salary?.median),
      salaryHighest: numToStr(initialProgram.career?.salary?.highest),
      salaryLowest: numToStr(initialProgram.career?.salary?.lowest),
      salaryRangeMin: numToStr(initialProgram.career?.salary?.rangeMin),
      salaryRangeMax: numToStr(initialProgram.career?.salary?.rangeMax),
      salaryYear: numToStr(initialProgram.career?.salary?.year),
      salarySource: initialProgram.career?.salary?.source || "",
      salaryReportFile: null,
      salaryReportUrl: initialProgram.career?.salary?.report || "",
      placementAvailable: Boolean(initialProgram.career?.placement?.available),
      placementAssistance: Boolean(initialProgram.career?.placement?.assistance),
      placementTraining: Boolean(initialProgram.career?.placement?.training),
      resumeBuilding: Boolean(initialProgram.career?.placement?.resumeBuilding),
      mockInterviews: Boolean(initialProgram.career?.placement?.mockInterviews),
      aptitudeTraining: Boolean(initialProgram.career?.placement?.aptitudeTraining),
      softSkillsTraining: Boolean(initialProgram.career?.placement?.softSkillsTraining),
      careerCounseling: Boolean(initialProgram.career?.placement?.careerCounseling),
      placementPartnersCount: numToStr(initialProgram.career?.placement?.partnersCount),
      placementRate: numToStr(initialProgram.career?.placement?.rate),
      placementDescription: initialProgram.career?.placement?.description || "",
      placementReportFile: null,
      placementReportUrl: initialProgram.career?.placement?.report || "",
    });

    setAdmission({
      ...emptyAdmission,
      applicationStartDate: toDateInput(initialProgram.admission?.dates?.applicationStartDate),
      applicationDeadline: toDateInput(initialProgram.admission?.dates?.applicationDeadline),
      admissionStartDate: toDateInput(initialProgram.admission?.dates?.admissionStartDate),
      admissionEndDate: toDateInput(initialProgram.admission?.dates?.admissionEndDate),
      entranceExamDate: toDateInput(initialProgram.admission?.dates?.entranceExamDate),
      intakeCycle: initialProgram.admission?.intakeCycle || "",
      status: initialProgram.admission?.status || "",
      documents: (initialProgram.admission?.documents || []).map((d) => ({
        name: d.name || "",
        required: d.required !== false,
        description: d.description || "",
        acceptedFormats: d.acceptedFormats || [],
        maxFileSizeMB: numToStr(d.maxFileSizeMB),
      })),
      process: (initialProgram.admission?.process || []).map((p) => ({
        stepNumber: p.stepNumber ?? 1,
        title: p.title || "",
        description: p.description || "",
        estimatedTime: p.estimatedTime || "",
        required: p.required !== false,
      })),
    });

    setContent({
      ...emptyContent,
      shortOverview: initialProgram.content?.shortOverview || "",
      fullOverview: initialProgram.content?.fullOverview || "",
      highlights: initialProgram.content?.highlights || [],
      learningOutcomes: initialProgram.content?.learningOutcomes || [],
      whyChoose: initialProgram.content?.whyChoose || "",
      benefits: (initialProgram.content?.benefits || []).map((b) => ({
        title: b.title || "",
        description: b.description || "",
        icon: b.icon || "",
        image: b.image || "",
      })),
      faqs: (initialProgram.content?.faqs || []).map((f) => ({
        question: f.question || "",
        answer: f.answer || "",
        order: f.order ?? 0,
        published: f.published !== false,
      })),
      testimonials: (initialProgram.content?.testimonials || []).map((t) => ({
        studentName: t.studentName || "",
        photo: t.photo || "",
        designation: t.designation || "",
        company: t.company || "",
        rating: numToStr(t.rating),
        testimonial: t.testimonial || "",
        graduationYear: numToStr(t.graduationYear),
        featured: Boolean(t.featured),
      })),
    });

    setBrochure({
      file: null,
      url: initialProgram.brochure?.url || "",
      fileName: initialProgram.brochure?.fileName || "",
      title: initialProgram.brochure?.title || "",
      description: initialProgram.brochure?.description || "",
      downloadEnabled: initialProgram.brochure?.downloadEnabled !== false,
    });

    setSavedProgramId(null);
    setJustSaved(false);
  }, [initialProgram]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisible = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!mostVisible || entry.intersectionRatio > mostVisible.intersectionRatio)) mostVisible = entry;
        });
        if (mostVisible) setActiveSection(mostVisible.target.id);
      },
      { root: document.getElementById("degree-program-form-container"), rootMargin: "-10% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
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
    const container = document.getElementById("degree-program-form-container");
    if (el && container) container.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
  };

  const isSectionFilled = (id) => {
    switch (id) {
      case "section-card":
        return Boolean(card.programName && card.degree && card.universityName && card.durationValue);
      case "section-eligibility":
        return Boolean(eligibility.overview || eligibility.minQualification);
      case "section-fees":
        return Boolean(fees.totalFee);
      case "section-scholarships":
        return scholarships.length > 0;
      case "section-financing":
        return financing.available || financing.emiAvailable;
      case "section-financing-engine":
        return financingEngine.feeComponents.length > 0 || financingEngine.emiTenures.length > 0 || financingEngine.noCostEmiTenures.length > 0;
      case "section-curriculum":
        return Boolean(curriculum.overview || curriculum.semesters.length > 0);
      case "section-learning":
        return Boolean(learning.overview || learning.lmsAvailable);
      case "section-industry":
        return industry.projectsAvailable || industry.internshipAvailable || industry.certifications.length > 0 || industry.employers.length > 0;
      case "section-career":
        return career.roles.length > 0 || career.skills.length > 0;
      case "section-admission":
        return Boolean(admission.applicationDeadline || admission.documents.length > 0 || admission.process.length > 0);
      case "section-content":
        return Boolean(content.shortOverview || content.fullOverview);
      case "section-brochure":
        return Boolean(brochure.file || brochure.title);
      default:
        return false;
    }
  };

  // ---- Repeatable builder helpers ----
  const addScholarship = () =>
    setScholarships((prev) => [
      ...prev,
      { name: "", type: "Merit Based", amount: "", percentage: "", eligibility: "", applicationRequired: false, applicationDeadline: "", description: "", applicableComponents: [] },
    ]);
  const updateScholarship = (i, key, value) => setScholarships((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  const removeScholarship = (i) => setScholarships((prev) => prev.filter((_, idx) => idx !== i));
  const moveScholarship = (i, dir) => setScholarships((prev) => moveItem(prev, i, dir));
  const toggleScholarshipComponent = (i, componentName) =>
    setScholarships((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? { ...s, applicableComponents: s.applicableComponents.includes(componentName) ? s.applicableComponents.filter((c) => c !== componentName) : [...s.applicableComponents, componentName] }
          : s
      )
    );

  // ---- Fees & Financing Engine builder helpers ----
  const addFeeComponent = () =>
    setFinancingEngine((prev) => ({
      ...prev,
      feeComponents: [...prev.feeComponents, { name: "", amount: "", frequency: "One-time", mandatory: true, scholarshipApplicable: true }],
    }));
  const updateFeeComponent = (i, key, value) =>
    setFinancingEngine((prev) => ({ ...prev, feeComponents: prev.feeComponents.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)) }));
  const removeFeeComponent = (i) => setFinancingEngine((prev) => ({ ...prev, feeComponents: prev.feeComponents.filter((_, idx) => idx !== i) }));
  const moveFeeComponent = (i, dir) => setFinancingEngine((prev) => ({ ...prev, feeComponents: moveItem(prev.feeComponents, i, dir) }));
  const togglePaymentOption = (key) =>
    setFinancingEngine((prev) => ({ ...prev, paymentOptions: { ...prev.paymentOptions, [key]: !prev.paymentOptions[key] } }));

  // An EMI plan can't be calculated without a rate and a tenure to pick, so these two block
  // the save rather than only warning — the public calculator mirrors the same rule and
  // hides the option either way (backend/services/financing/financingResolver.js).
  const missingEmiConfig =
    financingEngine.paymentOptions.emi && (!financingEngine.emiInterestRate || financingEngine.emiTenures.length === 0);
  const missingNoCostEmiConfig =
    financingEngine.paymentOptions.noCostEmi && financingEngine.noCostEmiTenures.length === 0;

  const addSemester = () =>
    setCurriculum((prev) => ({ ...prev, semesters: [...prev.semesters, { name: "", number: prev.semesters.length + 1, credits: "", subjects: [] }] }));
  const updateSemester = (i, key, value) =>
    setCurriculum((prev) => ({ ...prev, semesters: prev.semesters.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)) }));
  const removeSemester = (i) => setCurriculum((prev) => ({ ...prev, semesters: prev.semesters.filter((_, idx) => idx !== i) }));
  const moveSemester = (i, dir) => setCurriculum((prev) => ({ ...prev, semesters: moveItem(prev.semesters, i, dir) }));

  const addSubject = (semIndex) =>
    setCurriculum((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s, idx) =>
        idx === semIndex
          ? { ...s, subjects: [...s.subjects, { name: "", code: "", type: "Core", credits: "", theoryHours: "", practicalHours: "", description: "", syllabus: "" }] }
          : s
      ),
    }));
  const updateSubject = (semIndex, subIndex, key, value) =>
    setCurriculum((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s, idx) =>
        idx === semIndex ? { ...s, subjects: s.subjects.map((sub, si) => (si === subIndex ? { ...sub, [key]: value } : sub)) } : s
      ),
    }));
  const removeSubject = (semIndex, subIndex) =>
    setCurriculum((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s, idx) => (idx === semIndex ? { ...s, subjects: s.subjects.filter((_, si) => si !== subIndex) } : s)),
    }));
  const moveSubject = (semIndex, subIndex, dir) =>
    setCurriculum((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s, idx) => (idx === semIndex ? { ...s, subjects: moveItem(s.subjects, subIndex, dir) } : s)),
    }));

  const addCertification = () =>
    setIndustry((prev) => ({ ...prev, certifications: [...prev.certifications, { available: true, name: "", provider: "", type: "", description: "", logo: "", sample: "" }] }));
  const updateCertification = (i, key, value) => setIndustry((prev) => ({ ...prev, certifications: prev.certifications.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)) }));
  const removeCertification = (i) => setIndustry((prev) => ({ ...prev, certifications: prev.certifications.filter((_, idx) => idx !== i) }));
  const moveCertification = (i, dir) => setIndustry((prev) => ({ ...prev, certifications: moveItem(prev.certifications, i, dir) }));

  const addEmployer = () =>
    setIndustry((prev) => ({
      ...prev,
      employers: [...prev.employers, { name: "", logo: "", industry: "", partnershipType: "Hiring Partner", hiringPartner: false, internshipPartner: false, projectPartner: false, description: "" }],
    }));
  const updateEmployer = (i, key, value) => setIndustry((prev) => ({ ...prev, employers: prev.employers.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)) }));
  const removeEmployer = (i) => setIndustry((prev) => ({ ...prev, employers: prev.employers.filter((_, idx) => idx !== i) }));
  const moveEmployer = (i, dir) => setIndustry((prev) => ({ ...prev, employers: moveItem(prev.employers, i, dir) }));

  const addDocument = () =>
    setAdmission((prev) => ({ ...prev, documents: [...prev.documents, { name: "", required: true, description: "", acceptedFormats: [], maxFileSizeMB: "" }] }));
  const updateDocument = (i, key, value) => setAdmission((prev) => ({ ...prev, documents: prev.documents.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)) }));
  const removeDocument = (i) => setAdmission((prev) => ({ ...prev, documents: prev.documents.filter((_, idx) => idx !== i) }));
  const moveDocument = (i, dir) => setAdmission((prev) => ({ ...prev, documents: moveItem(prev.documents, i, dir) }));

  const addProcessStep = () =>
    setAdmission((prev) => ({ ...prev, process: [...prev.process, { stepNumber: prev.process.length + 1, title: "", description: "", estimatedTime: "", required: true }] }));
  const updateProcessStep = (i, key, value) => setAdmission((prev) => ({ ...prev, process: prev.process.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)) }));
  const removeProcessStep = (i) => setAdmission((prev) => ({ ...prev, process: prev.process.filter((_, idx) => idx !== i) }));
  const moveProcessStep = (i, dir) => setAdmission((prev) => ({ ...prev, process: moveItem(prev.process, i, dir) }));

  const addBenefit = () => setContent((prev) => ({ ...prev, benefits: [...prev.benefits, { title: "", description: "", icon: "", image: "" }] }));
  const updateBenefit = (i, key, value) => setContent((prev) => ({ ...prev, benefits: prev.benefits.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)) }));
  const removeBenefit = (i) => setContent((prev) => ({ ...prev, benefits: prev.benefits.filter((_, idx) => idx !== i) }));
  const moveBenefit = (i, dir) => setContent((prev) => ({ ...prev, benefits: moveItem(prev.benefits, i, dir) }));

  const addFaq = () => setContent((prev) => ({ ...prev, faqs: [...prev.faqs, { question: "", answer: "", order: prev.faqs.length, published: true }] }));
  const updateFaq = (i, key, value) => setContent((prev) => ({ ...prev, faqs: prev.faqs.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)) }));
  const removeFaq = (i) => setContent((prev) => ({ ...prev, faqs: prev.faqs.filter((_, idx) => idx !== i) }));
  const moveFaq = (i, dir) => setContent((prev) => ({ ...prev, faqs: moveItem(prev.faqs, i, dir) }));

  const addTestimonial = () =>
    setContent((prev) => ({ ...prev, testimonials: [...prev.testimonials, { studentName: "", photo: "", designation: "", company: "", rating: "", testimonial: "", graduationYear: "", featured: false }] }));
  const updateTestimonial = (i, key, value) => setContent((prev) => ({ ...prev, testimonials: prev.testimonials.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)) }));
  const removeTestimonial = (i) => setContent((prev) => ({ ...prev, testimonials: prev.testimonials.filter((_, idx) => idx !== i) }));
  const moveTestimonial = (i, dir) => setContent((prev) => ({ ...prev, testimonials: moveItem(prev.testimonials, i, dir) }));

  const toggleTag = (list, setList, key, value) => setList((prev) => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value] }));

  // The error/success banners render at the top of this scroll container, so after any
  // submit outcome we jump the panel back up — otherwise a save from the (long way down)
  // Brochure section looks like "nothing happened".
  const scrollFormToTop = () => {
    document.getElementById("degree-program-form-container")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    setJustSaved(false);
    const fail = (message) => { setError(message); scrollFormToTop(); };

    if (!card.programName.trim()) { fail("Program name is required."); return; }
    if (!card.degree.trim()) { fail("Degree is required."); return; }
    if (!card.universityName.trim()) { fail("University name is required."); return; }
    if (!card.durationValue) { fail("Duration value is required."); return; }
    if (!fees.totalFee) { fail("Total fee is required."); return; }
    if (missingEmiConfig) { fail("EMI is switched on — add an interest rate and at least one tenure under EMI Configuration, or switch EMI off."); return; }
    if (missingNoCostEmiConfig) { fail("No-Cost EMI is switched on — add at least one tenure under No-Cost EMI Configuration, or switch No-Cost EMI off."); return; }

    const data = new FormData();
    data.append("programName", card.programName.trim());
    data.append("degree", card.degree.trim());
    data.append("specialization", card.specialization);
    const universityPayload = { name: card.universityName.trim() };
    // Preserve the existing logo on edit saves where the admin didn't pick a new file —
    // the backend replaces `university` wholesale on update, so an omitted `logo` key would wipe it.
    if (!card.universityLogoFile && card.universityLogoUrl) universityPayload.logo = card.universityLogoUrl;
    data.append("university", JSON.stringify(universityPayload));
    data.append("mode", JSON.stringify(card.mode));
    data.append("duration", JSON.stringify({ value: Number(card.durationValue), unit: card.durationUnit }));
    data.append("totalSeats", card.totalSeats || "");
    if (card.applicationDeadline) data.append("applicationDeadline", card.applicationDeadline);
    data.append("intakeCycle", card.intakeCycle);
    data.append("rating", card.rating || 0);
    data.append("reviewCount", card.reviewCount || 0);
    data.append("industryIntegrationScore", card.industryIntegrationScore || 0);
    data.append("internship", card.internship);
    data.append("industryProject", card.industryProject);
    data.append("placementSupport", card.placementSupport);
    data.append("certification", card.certification);
    data.append("careerOutcomes", JSON.stringify(card.careerOutcomes));
    data.append("skills", JSON.stringify(card.skills));
    data.append("featuredStatus", card.featuredStatus);
    data.append("trendingStatus", card.trendingStatus);
    if (card.verifiedDate) data.append("verifiedDate", card.verifiedDate);
    data.append("recognition", JSON.stringify(card.recognition));
    data.append("accreditation", JSON.stringify(card.accreditation));
    data.append(
      "scholarship",
      JSON.stringify({ available: card.scholarshipAvailable, amount: card.scholarshipAmount ? Number(card.scholarshipAmount) : null, percentage: card.scholarshipPercentage ? Number(card.scholarshipPercentage) : null })
    );
    if (card.universityLogoFile) data.append("universityLogo", card.universityLogoFile);

    const eligibilityPayload = {
      overview: eligibility.overview,
      minQualification: eligibility.minQualification,
      minPercentage: eligibility.minPercentage ? Number(eligibility.minPercentage) : null,
      requiredSubjects: eligibility.requiredSubjects,
      ageLimit: eligibility.ageLimit ? Number(eligibility.ageLimit) : null,
      entranceExamRequired: eligibility.entranceExamRequired,
      entranceExam: eligibility.entranceExam,
      additionalRequirements: eligibility.additionalRequirements,
    };
    // This form has no UI for the Eligibility Checker's structured criteria/meta, so on edit
    // saves pass them through unchanged rather than wiping them (the backend replaces
    // `eligibility` wholesale on update).
    if (isEditMode && initialProgram.eligibility) {
      eligibilityPayload.criteriaConfigured = initialProgram.eligibility.criteriaConfigured;
      eligibilityPayload.criteria = initialProgram.eligibility.criteria;
      eligibilityPayload.meta = initialProgram.eligibility.meta;
    }
    data.append("eligibility", JSON.stringify(eligibilityPayload));

    data.append(
      "fees",
      JSON.stringify({
        totalFee: Number(fees.totalFee),
        applicationFee: fees.applicationFee ? Number(fees.applicationFee) : null,
        registrationFee: fees.registrationFee ? Number(fees.registrationFee) : null,
        semesterFee: fees.semesterFee ? Number(fees.semesterFee) : null,
        annualFee: fees.annualFee ? Number(fees.annualFee) : null,
        otherFees: fees.otherFees ? Number(fees.otherFees) : null,
        emi: fees.emi ? Number(fees.emi) : null,
        description: fees.description,
      })
    );

    data.append(
      "scholarships",
      JSON.stringify(
        scholarships.map((s) => ({
          ...s,
          amount: s.amount ? Number(s.amount) : null,
          percentage: s.percentage ? Number(s.percentage) : null,
          applicationDeadline: s.applicationDeadline || null,
        }))
      )
    );

    data.append(
      "financing",
      JSON.stringify({
        available: financing.available,
        emiAvailable: financing.emiAvailable,
        emiAmount: financing.emiAmount ? Number(financing.emiAmount) : null,
        emiDuration: { value: financing.emiDurationValue ? Number(financing.emiDurationValue) : null, unit: financing.emiDurationUnit },
        downPayment: financing.downPayment ? Number(financing.downPayment) : null,
        financingPartners: financing.financingPartners,
        educationLoanAvailable: financing.educationLoanAvailable,
        details: financing.details,
      })
    );

    data.append(
      "financingEngine",
      JSON.stringify({
        feeComponents: financingEngine.feeComponents.map((c) => ({ ...c, amount: c.amount ? Number(c.amount) : 0 })),
        paymentOptions: financingEngine.paymentOptions,
        emi: {
          interestRate: financingEngine.emiInterestRate ? Number(financingEngine.emiInterestRate) : null,
          processingFee: financingEngine.emiProcessingFee ? Number(financingEngine.emiProcessingFee) : null,
          tenures: financingEngine.emiTenures.map(Number).filter(Boolean),
          minAmount: financingEngine.emiMinAmount ? Number(financingEngine.emiMinAmount) : null,
          maxAmount: financingEngine.emiMaxAmount ? Number(financingEngine.emiMaxAmount) : null,
          lender: financingEngine.emiLender,
        },
        noCostEmi: {
          tenures: financingEngine.noCostEmiTenures.map(Number).filter(Boolean),
          processingFee: financingEngine.noCostEmiProcessingFee ? Number(financingEngine.noCostEmiProcessingFee) : null,
        },
        monthlyInstallmentAmount: financingEngine.monthlyInstallmentAmount ? Number(financingEngine.monthlyInstallmentAmount) : null,
        semesterCount: financingEngine.semesterCount ? Number(financingEngine.semesterCount) : null,
        semesterSchedule: financingEngine.semesterSchedule.map(Number).filter(Boolean),
        quarterlyCount: financingEngine.quarterlyCount ? Number(financingEngine.quarterlyCount) : null,
        quarterlySchedule: financingEngine.quarterlySchedule.map(Number).filter(Boolean),
        educationLoan: {
          maxAmount: financingEngine.educationLoanMaxAmount ? Number(financingEngine.educationLoanMaxAmount) : null,
          partners: financing.financingPartners,
        },
      })
    );

    const curriculumPayload = {
      overview: curriculum.overview,
      totalSemesters: curriculum.totalSemesters ? Number(curriculum.totalSemesters) : null,
      totalCredits: curriculum.totalCredits ? Number(curriculum.totalCredits) : null,
      semesters: curriculum.semesters.map((s) => ({
        ...s,
        credits: s.credits ? Number(s.credits) : null,
        subjects: s.subjects.map((sub) => ({
          ...sub,
          credits: sub.credits ? Number(sub.credits) : null,
          theoryHours: sub.theoryHours ? Number(sub.theoryHours) : null,
          practicalHours: sub.practicalHours ? Number(sub.practicalHours) : null,
        })),
      })),
    };
    // Preserve the existing curriculum PDF on edit saves where the admin didn't pick a new
    // file — the backend replaces `curriculum` wholesale on update, so an omitted `pdf` key
    // would wipe it.
    if (!curriculum.pdfFile && curriculum.pdfUrl) {
      curriculumPayload.pdf = { url: curriculum.pdfUrl, fileName: curriculum.pdfFileName, size: curriculum.pdfSize };
    }
    data.append("curriculum", JSON.stringify(curriculumPayload));
    if (curriculum.pdfFile) data.append("curriculumPdf", curriculum.pdfFile);

    data.append(
      "learning",
      JSON.stringify({
        ...learning,
        learningHours: learning.learningHours ? Number(learning.learningHours) : null,
      })
    );

    data.append(
      "industry",
      JSON.stringify({
        projects: {
          available: industry.projectsAvailable,
          count: industry.projectsCount ? Number(industry.projectsCount) : null,
          types: industry.projectTypes,
          description: industry.projectDescription,
          partners: industry.projectPartners,
          certificateGiven: industry.projectCertificateGiven,
        },
        internshipDetails: {
          available: industry.internshipAvailable,
          duration: { value: industry.internshipDurationValue ? Number(industry.internshipDurationValue) : null, unit: industry.internshipDurationUnit },
          type: industry.internshipType,
          paid: industry.internshipPaid,
          stipend: industry.internshipStipend ? Number(industry.internshipStipend) : null,
          partners: industry.internshipPartners,
          description: industry.internshipDescription,
        },
        certifications: industry.certifications,
        employers: industry.employers,
      })
    );

    data.append(
      "career",
      JSON.stringify({
        roles: career.roles,
        skills: career.skills,
        salary: {
          available: career.salaryAvailable,
          average: career.salaryAverage ? Number(career.salaryAverage) : null,
          median: career.salaryMedian ? Number(career.salaryMedian) : null,
          highest: career.salaryHighest ? Number(career.salaryHighest) : null,
          lowest: career.salaryLowest ? Number(career.salaryLowest) : null,
          rangeMin: career.salaryRangeMin ? Number(career.salaryRangeMin) : null,
          rangeMax: career.salaryRangeMax ? Number(career.salaryRangeMax) : null,
          year: career.salaryYear ? Number(career.salaryYear) : null,
          source: career.salarySource,
          report: career.salaryReportUrl || "",
        },
        placement: {
          available: career.placementAvailable,
          assistance: career.placementAssistance,
          training: career.placementTraining,
          resumeBuilding: career.resumeBuilding,
          mockInterviews: career.mockInterviews,
          aptitudeTraining: career.aptitudeTraining,
          softSkillsTraining: career.softSkillsTraining,
          careerCounseling: career.careerCounseling,
          partnersCount: career.placementPartnersCount ? Number(career.placementPartnersCount) : null,
          rate: career.placementRate ? Number(career.placementRate) : null,
          description: career.placementDescription,
          report: career.placementReportUrl || "",
        },
      })
    );

    data.append(
      "admission",
      JSON.stringify({
        dates: {
          applicationStartDate: admission.applicationStartDate || null,
          applicationDeadline: admission.applicationDeadline || null,
          admissionStartDate: admission.admissionStartDate || null,
          admissionEndDate: admission.admissionEndDate || null,
          entranceExamDate: admission.entranceExamDate || null,
        },
        intakeCycle: admission.intakeCycle,
        status: admission.status,
        documents: admission.documents.map((d) => ({ ...d, maxFileSizeMB: d.maxFileSizeMB ? Number(d.maxFileSizeMB) : null })),
        process: admission.process,
      })
    );

    data.append(
      "content",
      JSON.stringify({
        shortOverview: content.shortOverview,
        fullOverview: content.fullOverview,
        highlights: content.highlights,
        learningOutcomes: content.learningOutcomes,
        whyChoose: content.whyChoose,
        benefits: content.benefits,
        faqs: content.faqs,
        testimonials: content.testimonials.map((t) => ({ ...t, rating: t.rating ? Number(t.rating) : null, graduationYear: t.graduationYear ? Number(t.graduationYear) : null })),
      })
    );

    const brochurePayload = { title: brochure.title, description: brochure.description, downloadEnabled: brochure.downloadEnabled };
    // Preserve the existing brochure file reference on edit saves where the admin didn't pick
    // a new file — the backend uses this JSON as-is when no new brochure file is uploaded.
    if (!brochure.file && brochure.url) {
      brochurePayload.url = brochure.url;
      brochurePayload.fileName = brochure.fileName;
    }
    data.append("brochure", JSON.stringify(brochurePayload));
    if (brochure.file) data.append("brochure", brochure.file);

    try {
      setBusy(true);
      const savedProgram = isEditMode
        ? await updateDegreeProgram(initialProgram._id, data)
        : await createDegreeProgram(data);
      setSavedProgramId(savedProgram?._id || savedProgram?.id || null);
      setJustSaved(true);
      onSaved?.(savedProgram);
      scrollFormToTop();
    } catch (apiError) {
      setError(getErrorMessage(apiError, isEditMode ? "Failed to update degree program." : "Failed to save degree program."));
      scrollFormToTop();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] flex flex-col xl:flex-row h-[90vh] overflow-hidden">
      {/* Left: section navigation */}
      <div className="w-full xl:w-[300px] bg-white border-r border-[#E2E8F0] p-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <h2 className="text-xl font-bold text-slate-800 mb-6">{isEditMode ? "Edit Degree Program" : "Create Degree Program"}</h2>

        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mb-5 overflow-hidden">
          <div className="bg-blue-700 h-full transition-all duration-300" style={{ width: applicationFormProgramId ? "100%" : "40%" }}></div>
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
                        isFilled && !isActive ? "bg-[#EEF2FF] text-[#21B573]" : isActive ? "bg-blue-700 text-white shadow-md" : "bg-white border-2 border-slate-300 text-slate-500"
                      }`}
                    >
                      {isFilled && !isActive ? <FiCheck className="w-5 h-5" /> : i + 1}
                    </div>
                    <div className="flex flex-col mt-[5px]">
                      <span className={`font-bold text-[13px] leading-tight transition-colors ${isActive ? "text-blue-700" : isFilled ? "text-slate-700" : "text-slate-500 group-hover:text-slate-700"}`}>
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
              disabled={!applicationFormProgramId}
              className={`flex items-center gap-4 relative z-10 w-full text-left group ${applicationFormProgramId ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`relative z-20 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${applicationFormProgramId ? "bg-[#1F2853] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}>
                2
              </div>
              <span className={`font-semibold text-sm transition-colors ${applicationFormProgramId ? "text-[#1F2853]" : "text-slate-400 group-hover:text-slate-600"}`}>Application Form</span>
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
      <div id="degree-program-form-container" className="flex-1 p-8 pb-6 bg-[#EEF2FF]/50 overflow-y-auto h-full">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">{error}</div>}
        {(savedProgramId || justSaved) && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 mb-6 flex items-center justify-between gap-4">
            <span>
              {isEditMode ? "Changes saved successfully." : "Program saved successfully. You can now build its Application Form."}
            </span>
            {applicationFormProgramId && (
              <button type="button" onClick={goToApplicationForm} className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800">
                Build Application Form
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 01 CARD INFORMATION */}
          <div id="section-card" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Card Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Program Name" required>
                <input value={card.programName} onChange={(e) => setCard((p) => ({ ...p, programName: e.target.value }))} placeholder="e.g. B.Tech in Computer Science" className={inputClass} required />
              </Field>
              <CreatableSingleDropdown
                label="Degree"
                required
                options={degreeOptions}
                setOptions={setDegreeOptions}
                selected={card.degree}
                onChange={(value) => setCard((p) => ({ ...p, degree: value }))}
                placeholder="Select or add a degree..."
              />
              <CreatableSingleDropdown
                label="Specialization"
                options={specializationOptions}
                setOptions={setSpecializationOptions}
                selected={card.specialization}
                onChange={(value) => setCard((p) => ({ ...p, specialization: value }))}
                placeholder="Select or add a specialization..."
              />
              <Field label="University" required>
                <input value={card.universityName} onChange={(e) => setCard((p) => ({ ...p, universityName: e.target.value }))} className={inputClass} required />
              </Field>
              <Field label="University Logo">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setCard((p) => ({ ...p, universityLogoFile: e.target.files[0] || null }))} className={`${inputClass} py-2.5`} />
                {card.universityLogoUrl && !card.universityLogoFile && (
                  <span className="text-[11px] font-normal text-slate-400">Current file: {card.universityLogoUrl.split("/").pop()}</span>
                )}
              </Field>
              <CreatableCheckboxDropdown
                label="Program Mode"
                options={modeOptions}
                setOptions={setModeOptions}
                selected={card.mode}
                onToggle={(value) => toggleTag(card, setCard, "mode", value)}
                placeholder="Select mode(s)..."
              />
              <Field label="Duration" required>
                <div className="flex gap-2">
                  <input type="number" min="1" value={card.durationValue} onChange={(e) => setCard((p) => ({ ...p, durationValue: e.target.value }))} className={`${inputClass} flex-[3] w-auto`} required />
                  <select value={card.durationUnit} onChange={(e) => setCard((p) => ({ ...p, durationUnit: e.target.value }))} className={`${inputClass} flex-1 w-auto shrink-0`}>
                    {DURATION_UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </Field>

              <Field label="Total Seats">
                <input type="number" min="0" value={card.totalSeats} onChange={(e) => setCard((p) => ({ ...p, totalSeats: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Application Deadline">
                <input type="date" value={card.applicationDeadline} onChange={(e) => setCard((p) => ({ ...p, applicationDeadline: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Intake Cycle" hint="e.g. September 2026">
                <input value={card.intakeCycle} onChange={(e) => setCard((p) => ({ ...p, intakeCycle: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Rating" hint="0–5, normally system-generated">
                <input type="number" min="0" max="5" step="0.1" value={card.rating} onChange={(e) => setCard((p) => ({ ...p, rating: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Review Count" hint="Normally system-generated">
                <input type="number" min="0" value={card.reviewCount} onChange={(e) => setCard((p) => ({ ...p, reviewCount: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Industry Integration Score" hint="Range: 0–100">
                <input type="number" min="0" max="100" value={card.industryIntegrationScore} onChange={(e) => setCard((p) => ({ ...p, industryIntegrationScore: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Verified Date">
                <input type="date" value={card.verifiedDate} onChange={(e) => setCard((p) => ({ ...p, verifiedDate: e.target.value }))} className={inputClass} />
              </Field>

              <CreatableCheckboxDropdown
                label="Recognition"
                options={recognitionOptions}
                setOptions={setRecognitionOptions}
                selected={card.recognition}
                onToggle={(value) => toggleTag(card, setCard, "recognition", value)}
                placeholder="Select recognition(s)..."
              />
              <CreatableCheckboxDropdown
                label="Accreditation"
                options={accreditationOptions}
                setOptions={setAccreditationOptions}
                selected={card.accreditation}
                onToggle={(value) => toggleTag(card, setCard, "accreditation", value)}
                placeholder="Select accreditation(s)..."
              />
              <CreatableCheckboxDropdown
                label="Career Outcomes"
                options={careerOutcomeOptions}
                setOptions={setCareerOutcomeOptions}
                selected={card.careerOutcomes}
                onToggle={(value) => toggleTag(card, setCard, "careerOutcomes", value)}
                placeholder="Select career outcome(s)..."
              />
              <CreatableCheckboxDropdown
                label="Skills"
                options={skillOptions}
                setOptions={setSkillOptions}
                selected={card.skills}
                onToggle={(value) => toggleTag(card, setCard, "skills", value)}
                placeholder="Select skill(s)..."
              />

              <div className="md:col-span-2">
                <div className={subHeadingClass}>Program Highlights</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Toggle label="Internship" checked={card.internship} onChange={(v) => setCard((p) => ({ ...p, internship: v }))} />
                  <Toggle label="Industry Project" checked={card.industryProject} onChange={(v) => setCard((p) => ({ ...p, industryProject: v }))} />
                  <Toggle label="Placement Support" checked={card.placementSupport} onChange={(v) => setCard((p) => ({ ...p, placementSupport: v }))} />
                  <Toggle label="Certification" checked={card.certification} onChange={(v) => setCard((p) => ({ ...p, certification: v }))} />
                  <Toggle label="Featured Status" checked={card.featuredStatus} onChange={(v) => setCard((p) => ({ ...p, featuredStatus: v }))} />
                  <Toggle label="Trending Status" checked={card.trendingStatus} onChange={(v) => setCard((p) => ({ ...p, trendingStatus: v }))} />
                  <Toggle label="Scholarship Available" checked={card.scholarshipAvailable} onChange={(v) => setCard((p) => ({ ...p, scholarshipAvailable: v }))} />
                </div>
              </div>
              {card.scholarshipAvailable && (
                <>
                  <Field label="Scholarship Amount">
                    <input type="number" min="0" value={card.scholarshipAmount} onChange={(e) => setCard((p) => ({ ...p, scholarshipAmount: e.target.value }))} className={inputClass} />
                  </Field>
                  <Field label="Scholarship Percentage">
                    <input type="number" min="0" max="100" value={card.scholarshipPercentage} onChange={(e) => setCard((p) => ({ ...p, scholarshipPercentage: e.target.value }))} className={inputClass} />
                  </Field>
                </>
              )}
            </div>
          </div>

          {/* 02 ELIGIBILITY */}
          <div id="section-eligibility" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Eligibility</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Field label="Eligibility Overview">
                  <textarea rows={3} value={eligibility.overview} onChange={(e) => setEligibility((p) => ({ ...p, overview: e.target.value }))} className={inputClass} />
                </Field>
              </div>
              <Field label="Minimum Qualification">
                <input value={eligibility.minQualification} onChange={(e) => setEligibility((p) => ({ ...p, minQualification: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Minimum Percentage">
                <input type="number" min="0" max="100" value={eligibility.minPercentage} onChange={(e) => setEligibility((p) => ({ ...p, minPercentage: e.target.value }))} className={inputClass} />
              </Field>
              <CreatableCheckboxDropdown
                label="Required Subjects"
                options={requiredSubjectOptions}
                setOptions={setRequiredSubjectOptions}
                selected={eligibility.requiredSubjects}
                onToggle={(value) => toggleTag(eligibility, setEligibility, "requiredSubjects", value)}
                placeholder="Select required subject(s)..."
              />
              <Field label="Age Limit">
                <input type="number" min="0" value={eligibility.ageLimit} onChange={(e) => setEligibility((p) => ({ ...p, ageLimit: e.target.value }))} className={inputClass} />
              </Field>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span className="flex items-center justify-between">
                  <span>Entrance Exam</span>
                  <Switch checked={eligibility.entranceExamRequired} onChange={(v) => setEligibility((p) => ({ ...p, entranceExamRequired: v }))} label="Required" />
                </span>
                {eligibility.entranceExamRequired && (
                  <input
                    value={eligibility.entranceExam}
                    onChange={(e) => setEligibility((p) => ({ ...p, entranceExam: e.target.value }))}
                    placeholder="e.g. JEE Main, CAT"
                    className={inputClass}
                  />
                )}
              </label>
              <div className="md:col-span-2">
                <Field label="Additional Requirements">
                  <textarea rows={2} value={eligibility.additionalRequirements} onChange={(e) => setEligibility((p) => ({ ...p, additionalRequirements: e.target.value }))} className={inputClass} />
                </Field>
              </div>
            </div>
          </div>

          {/* 03 FEES */}
          <div id="section-fees" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Fees</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Total Program Fee" required>
                <input type="number" min="0" value={fees.totalFee} onChange={(e) => setFees((p) => ({ ...p, totalFee: e.target.value }))} className={inputClass} required />
              </Field>
              <Field label="Application Fee">
                <input type="number" min="0" value={fees.applicationFee} onChange={(e) => setFees((p) => ({ ...p, applicationFee: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Registration Fee">
                <input type="number" min="0" value={fees.registrationFee} onChange={(e) => setFees((p) => ({ ...p, registrationFee: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Semester Fee">
                <input type="number" min="0" value={fees.semesterFee} onChange={(e) => setFees((p) => ({ ...p, semesterFee: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Annual Fee">
                <input type="number" min="0" value={fees.annualFee} onChange={(e) => setFees((p) => ({ ...p, annualFee: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Other Fees">
                <input type="number" min="0" value={fees.otherFees} onChange={(e) => setFees((p) => ({ ...p, otherFees: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="EMI (card summary)">
                <input type="number" min="0" value={fees.emi} onChange={(e) => setFees((p) => ({ ...p, emi: e.target.value }))} className={inputClass} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Fee Description">
                  <textarea rows={2} value={fees.description} onChange={(e) => setFees((p) => ({ ...p, description: e.target.value }))} className={inputClass} />
                </Field>
              </div>
            </div>
          </div>

          {/* 04 SCHOLARSHIPS */}
          <div id="section-scholarships" className={sectionCardClass}>
            <BuilderHeader title="Scholarships" onAdd={addScholarship} addLabel="Add Scholarship" />
            <div className="flex flex-col gap-4">
              {scholarships.map((s, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Scholarship #{i + 1}</span>
                    <ReorderRemove index={i} length={scholarships.length} onMoveUp={() => moveScholarship(i, -1)} onMoveDown={() => moveScholarship(i, 1)} onRemove={() => removeScholarship(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Scholarship Name">
                      <input value={s.name} onChange={(e) => updateScholarship(i, "name", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Scholarship Type">
                      <select value={s.type} onChange={(e) => updateScholarship(i, "type", e.target.value)} className={inputClass}>
                        {SCHOLARSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Scholarship Amount">
                      <input type="number" min="0" value={s.amount} onChange={(e) => updateScholarship(i, "amount", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Scholarship Percentage">
                      <input type="number" min="0" max="100" value={s.percentage} onChange={(e) => updateScholarship(i, "percentage", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Application Deadline">
                      <input type="date" value={s.applicationDeadline} onChange={(e) => updateScholarship(i, "applicationDeadline", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Application Required">
                      <div className="px-1 py-2"><Toggle label="Required" checked={s.applicationRequired} onChange={(v) => updateScholarship(i, "applicationRequired", v)} /></div>
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Eligibility"><textarea rows={2} value={s.eligibility} onChange={(e) => updateScholarship(i, "eligibility", e.target.value)} className={inputClass} /></Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Scholarship Description"><textarea rows={2} value={s.description} onChange={(e) => updateScholarship(i, "description", e.target.value)} className={inputClass} /></Field>
                    </div>
                    {financingEngine.feeComponents.length > 0 && (
                      <div className="md:col-span-2">
                        <Field label="Applicable Fee Components" hint="Leave all unchecked to apply this scholarship to the whole net program fee.">
                          <div className="flex flex-wrap gap-3 px-1 py-1">
                            {financingEngine.feeComponents.map((c) => (
                              <label key={c.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={s.applicableComponents.includes(c.name)}
                                  onChange={() => toggleScholarshipComponent(i, c.name)}
                                  className="accent-blue-700 w-3.5 h-3.5 rounded"
                                />
                                {c.name || "(unnamed)"}
                              </label>
                            ))}
                          </div>
                        </Field>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {scholarships.length === 0 && <p className="text-sm text-slate-400">No scholarships added yet.</p>}
            </div>
          </div>

          {/* 05 FINANCING */}
          <div id="section-financing" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Financing</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Toggle label="Financing Available" checked={financing.available} onChange={(v) => setFinancing((p) => ({ ...p, available: v }))} />
              <Toggle label="EMI Available" checked={financing.emiAvailable} onChange={(v) => setFinancing((p) => ({ ...p, emiAvailable: v }))} />
              <Toggle label="Education Loan Available" checked={financing.educationLoanAvailable} onChange={(v) => setFinancing((p) => ({ ...p, educationLoanAvailable: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="EMI Amount">
                <input type="number" min="0" value={financing.emiAmount} onChange={(e) => setFinancing((p) => ({ ...p, emiAmount: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="EMI Duration">
                <div className="flex gap-2">
                  <input type="number" min="0" value={financing.emiDurationValue} onChange={(e) => setFinancing((p) => ({ ...p, emiDurationValue: e.target.value }))} className={`${inputClass} flex-[3] w-auto`} />
                  <select value={financing.emiDurationUnit} onChange={(e) => setFinancing((p) => ({ ...p, emiDurationUnit: e.target.value }))} className={`${inputClass} flex-1 w-auto shrink-0`}>
                    {DURATION_UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </Field>
              <Field label="Down Payment">
                <input type="number" min="0" value={financing.downPayment} onChange={(e) => setFinancing((p) => ({ ...p, downPayment: e.target.value }))} className={inputClass} />
              </Field>
              <CreatableCheckboxDropdown
                label="Financing Partners"
                options={financingPartnerOptions}
                setOptions={setFinancingPartnerOptions}
                selected={financing.financingPartners}
                onToggle={(value) => toggleTag(financing, setFinancing, "financingPartners", value)}
                placeholder="Select financing partner(s)..."
              />
              <div className="md:col-span-2">
                <Field label="Financing Details"><textarea rows={2} value={financing.details} onChange={(e) => setFinancing((p) => ({ ...p, details: e.target.value }))} className={inputClass} /></Field>
              </div>
            </div>
          </div>

          {/* 05b FEES & FINANCING ENGINE */}
          <div id="section-financing-engine" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Fees & Financing Engine</h4>
            <p className="text-xs text-slate-400 -mt-4 mb-5">
              Powers the student-facing fee calculator. Leave blank to fall back to the flat Total Program Fee above with Full
              Payment only.
            </p>

            <BuilderHeader title="Fee Components" onAdd={addFeeComponent} addLabel="Add Fee Component" />
            <div className="flex flex-col gap-4 mb-6">
              {financingEngine.feeComponents.map((c, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Component #{i + 1}</span>
                    <ReorderRemove index={i} length={financingEngine.feeComponents.length} onMoveUp={() => moveFeeComponent(i, -1)} onMoveDown={() => moveFeeComponent(i, 1)} onRemove={() => removeFeeComponent(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Name"><input value={c.name} onChange={(e) => updateFeeComponent(i, "name", e.target.value)} placeholder="e.g. Tuition Fee" className={inputClass} /></Field>
                    <Field label="Amount"><input type="number" min="0" value={c.amount} onChange={(e) => updateFeeComponent(i, "amount", e.target.value)} className={inputClass} /></Field>
                    <Field label="Frequency">
                      <select value={c.frequency} onChange={(e) => updateFeeComponent(i, "frequency", e.target.value)} className={inputClass}>
                        {FEE_FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </Field>
                    <div className="flex items-center gap-4">
                      <Toggle label="Mandatory" checked={c.mandatory} onChange={(v) => updateFeeComponent(i, "mandatory", v)} />
                      <Toggle label="Scholarship Applicable" checked={c.scholarshipApplicable} onChange={(v) => updateFeeComponent(i, "scholarshipApplicable", v)} />
                    </div>
                  </div>
                </div>
              ))}
              {financingEngine.feeComponents.length === 0 && <p className="text-sm text-slate-400">No fee components added yet — the calculator will use the flat Total Program Fee.</p>}
            </div>

            <div className={`${subHeadingClass}`}>Payment Options</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
              <Toggle label="Full Payment" checked={financingEngine.paymentOptions.fullPayment} onChange={() => togglePaymentOption("fullPayment")} />
              <Toggle label="Semester" checked={financingEngine.paymentOptions.semester} onChange={() => togglePaymentOption("semester")} />
              <Toggle label="Quarterly" checked={financingEngine.paymentOptions.quarterly} onChange={() => togglePaymentOption("quarterly")} />
              <Toggle label="Monthly Installment" checked={financingEngine.paymentOptions.monthlyInstallment} onChange={() => togglePaymentOption("monthlyInstallment")} />
              <Toggle label="EMI" checked={financingEngine.paymentOptions.emi} onChange={() => togglePaymentOption("emi")} />
              <Toggle label="No-Cost EMI" checked={financingEngine.paymentOptions.noCostEmi} onChange={() => togglePaymentOption("noCostEmi")} />
              <Toggle label="Education Loan" checked={financingEngine.paymentOptions.educationLoan} onChange={() => togglePaymentOption("educationLoan")} />
            </div>
            <p className="-mt-4 mb-6 text-xs text-slate-500">
              Each option's fields appear below only while its toggle is on. A student never sees an
              option until the fields it needs are filled, so the calculator can't offer a plan it
              can't work out.
            </p>

            {/* Configuration blocks are gated on their own toggle: an option that isn't offered has
                nothing to configure, and a half-filled block used to surface a payment method the
                calculator could never compute. See decisions.md. */}
            {financingEngine.paymentOptions.emi && (
              <>
                <div className={`${subHeadingClass}`}>EMI Configuration</div>
                {missingEmiConfig && <p className={configWarningClass}>Interest rate and at least one tenure are required — EMI is switched on, so this must be filled in before you can save.</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Field label="Interest Rate (% p.a.)"><input type="number" min="0" step="0.01" value={financingEngine.emiInterestRate} onChange={(e) => setFinancingEngine((p) => ({ ...p, emiInterestRate: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Processing Fee"><input type="number" min="0" value={financingEngine.emiProcessingFee} onChange={(e) => setFinancingEngine((p) => ({ ...p, emiProcessingFee: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Minimum Amount"><input type="number" min="0" value={financingEngine.emiMinAmount} onChange={(e) => setFinancingEngine((p) => ({ ...p, emiMinAmount: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Maximum Amount"><input type="number" min="0" value={financingEngine.emiMaxAmount} onChange={(e) => setFinancingEngine((p) => ({ ...p, emiMaxAmount: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Lender / Provider"><input value={financingEngine.emiLender} onChange={(e) => setFinancingEngine((p) => ({ ...p, emiLender: e.target.value }))} className={inputClass} /></Field>
                  <div className="md:col-span-2">
                    <TagInput label="Available Tenures (months)" values={financingEngine.emiTenures} onChange={(v) => setFinancingEngine((p) => ({ ...p, emiTenures: v }))} placeholder="e.g. 12, press Enter" />
                  </div>
                </div>
              </>
            )}

            {financingEngine.paymentOptions.noCostEmi && (
              <>
                <div className={`${subHeadingClass}`}>No-Cost EMI Configuration</div>
                {missingNoCostEmiConfig && <p className={configWarningClass}>At least one tenure is required — No-Cost EMI is switched on, so this must be filled in before you can save.</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Field label="Processing Fee"><input type="number" min="0" value={financingEngine.noCostEmiProcessingFee} onChange={(e) => setFinancingEngine((p) => ({ ...p, noCostEmiProcessingFee: e.target.value }))} className={inputClass} /></Field>
                  <div>
                    <TagInput label="Available Tenures (months)" values={financingEngine.noCostEmiTenures} onChange={(v) => setFinancingEngine((p) => ({ ...p, noCostEmiTenures: v }))} placeholder="e.g. 6, press Enter" />
                  </div>
                </div>
              </>
            )}

            {financingEngine.paymentOptions.monthlyInstallment && (
              <>
                <div className={`${subHeadingClass}`}>Monthly Installment</div>
                {!financingEngine.monthlyInstallmentAmount && <p className={configWarningClass}>Without an amount per month this option stays hidden from students.</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Field label="Amount per Month" hint="A flat, non-financing installment plan — not an interest-bearing EMI.">
                    <input type="number" min="0" value={financingEngine.monthlyInstallmentAmount} onChange={(e) => setFinancingEngine((p) => ({ ...p, monthlyInstallmentAmount: e.target.value }))} className={inputClass} />
                  </Field>
                </div>
              </>
            )}

            {financingEngine.paymentOptions.semester && (
              <>
                <div className={`${subHeadingClass}`}>Semester Payment</div>
                {!financingEngine.semesterCount && financingEngine.semesterSchedule.length === 0 && <p className={configWarningClass}>Without a semester count or an exact schedule this option stays hidden from students.</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Field label="Number of Semesters" hint="Used to split the net fee evenly if no exact schedule is given below."><input type="number" min="1" value={financingEngine.semesterCount} onChange={(e) => setFinancingEngine((p) => ({ ...p, semesterCount: e.target.value }))} className={inputClass} /></Field>
                  <div>
                    <TagInput label="Exact Semester Amounts (optional)" values={financingEngine.semesterSchedule} onChange={(v) => setFinancingEngine((p) => ({ ...p, semesterSchedule: v }))} placeholder="e.g. 50000, press Enter" />
                  </div>
                </div>
              </>
            )}

            {financingEngine.paymentOptions.quarterly && (
              <>
                <div className={`${subHeadingClass}`}>Quarterly Payment</div>
                {!financingEngine.quarterlyCount && financingEngine.quarterlySchedule.length === 0 && <p className={configWarningClass}>Without a quarter count or an exact schedule this option stays hidden from students.</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Field label="Number of Quarters" hint="Used to split the net fee evenly if no exact schedule is given below."><input type="number" min="1" value={financingEngine.quarterlyCount} onChange={(e) => setFinancingEngine((p) => ({ ...p, quarterlyCount: e.target.value }))} className={inputClass} /></Field>
                  <div>
                    <TagInput label="Exact Quarterly Amounts (optional)" values={financingEngine.quarterlySchedule} onChange={(v) => setFinancingEngine((p) => ({ ...p, quarterlySchedule: v }))} placeholder="e.g. 45000, press Enter" />
                  </div>
                </div>
              </>
            )}

            <div className={`${subHeadingClass}`}>Education Loan</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Maximum Supported Amount" hint="Defaults to the Total Program Fee if left blank."><input type="number" min="0" value={financingEngine.educationLoanMaxAmount} onChange={(e) => setFinancingEngine((p) => ({ ...p, educationLoanMaxAmount: e.target.value }))} className={inputClass} /></Field>
            </div>
          </div>

          {/* 06 CURRICULUM */}
          <div id="section-curriculum" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Curriculum</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <Field label="Curriculum Overview"><textarea rows={3} value={curriculum.overview} onChange={(e) => setCurriculum((p) => ({ ...p, overview: e.target.value }))} className={inputClass} /></Field>
              </div>
              <Field label="Total Semesters">
                <input type="number" min="0" value={curriculum.totalSemesters} onChange={(e) => setCurriculum((p) => ({ ...p, totalSemesters: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Total Credits">
                <input type="number" min="0" value={curriculum.totalCredits} onChange={(e) => setCurriculum((p) => ({ ...p, totalCredits: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Curriculum PDF">
                <input type="file" accept="application/pdf" onChange={(e) => setCurriculum((p) => ({ ...p, pdfFile: e.target.files[0] || null }))} className={`${inputClass} py-2.5`} />
                {curriculum.pdfFileName && !curriculum.pdfFile && (
                  <span className="text-[11px] font-normal text-slate-400">Current file: {curriculum.pdfFileName}</span>
                )}
              </Field>
            </div>

            <BuilderHeader title="Semester Builder" onAdd={addSemester} addLabel="Add Semester" />
            <div className="flex flex-col gap-4">
              {curriculum.semesters.map((sem, si) => (
                <div key={si} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Semester #{si + 1}</span>
                    <ReorderRemove index={si} length={curriculum.semesters.length} onMoveUp={() => moveSemester(si, -1)} onMoveDown={() => moveSemester(si, 1)} onRemove={() => removeSemester(si)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Field label="Semester Name"><input value={sem.name} onChange={(e) => updateSemester(si, "name", e.target.value)} className={inputClass} /></Field>
                    <Field label="Semester Number"><input type="number" value={sem.number} onChange={(e) => updateSemester(si, "number", Number(e.target.value))} className={inputClass} /></Field>
                    <Field label="Semester Credits"><input type="number" value={sem.credits} onChange={(e) => updateSemester(si, "credits", e.target.value)} className={inputClass} /></Field>
                  </div>

                  <BuilderHeader title="Subjects" onAdd={() => addSubject(si)} addLabel="Add Subject" />
                  <div className="flex flex-col gap-3">
                    {sem.subjects.map((sub, subi) => (
                      <div key={subi} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-400">Subject #{subi + 1}</span>
                          <ReorderRemove index={subi} length={sem.subjects.length} onMoveUp={() => moveSubject(si, subi, -1)} onMoveDown={() => moveSubject(si, subi, 1)} onRemove={() => removeSubject(si, subi)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Field label="Subject Name"><input value={sub.name} onChange={(e) => updateSubject(si, subi, "name", e.target.value)} className={inputClass} /></Field>
                          <Field label="Subject Code"><input value={sub.code} onChange={(e) => updateSubject(si, subi, "code", e.target.value)} className={inputClass} /></Field>
                          <Field label="Subject Type">
                            <select value={sub.type} onChange={(e) => updateSubject(si, subi, "type", e.target.value)} className={inputClass}>
                              {SUBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </Field>
                          <Field label="Credits"><input type="number" value={sub.credits} onChange={(e) => updateSubject(si, subi, "credits", e.target.value)} className={inputClass} /></Field>
                          <Field label="Theory Hours"><input type="number" value={sub.theoryHours} onChange={(e) => updateSubject(si, subi, "theoryHours", e.target.value)} className={inputClass} /></Field>
                          <Field label="Practical Hours"><input type="number" value={sub.practicalHours} onChange={(e) => updateSubject(si, subi, "practicalHours", e.target.value)} className={inputClass} /></Field>
                          <div className="md:col-span-3">
                            <Field label="Subject Description"><textarea rows={2} value={sub.description} onChange={(e) => updateSubject(si, subi, "description", e.target.value)} className={inputClass} /></Field>
                          </div>
                          <div className="md:col-span-3">
                            <Field label="Syllabus"><textarea rows={2} value={sub.syllabus} onChange={(e) => updateSubject(si, subi, "syllabus", e.target.value)} className={inputClass} /></Field>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sem.subjects.length === 0 && <p className="text-xs text-slate-400">No subjects added yet.</p>}
                  </div>
                </div>
              ))}
              {curriculum.semesters.length === 0 && <p className="text-sm text-slate-400">No semesters added yet.</p>}
            </div>
          </div>

          {/* 07 LEARNING */}
          <div id="section-learning" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Learning</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="md:col-span-2">
                <Field label="Learning Overview"><textarea rows={2} value={learning.overview} onChange={(e) => setLearning((p) => ({ ...p, overview: e.target.value }))} className={inputClass} /></Field>
              </div>
              <Field label="Learning Management System Name" hint="The online platform students use to access classes and course material, e.g. Google Classroom">
                <input value={learning.lmsName} onChange={(e) => setLearning((p) => ({ ...p, lmsName: e.target.value }))} placeholder="e.g. Moodle" className={inputClass} />
              </Field>
              <Field label="Learning Management System URL" hint="Link students use to log in to the platform above">
                <input value={learning.lmsUrl} onChange={(e) => setLearning((p) => ({ ...p, lmsUrl: e.target.value }))} placeholder="e.g. https://lms.university.edu" className={inputClass} />
              </Field>
              <Field label="Live Class Frequency">
                <select value={learning.liveClassFrequency} onChange={(e) => setLearning((p) => ({ ...p, liveClassFrequency: e.target.value }))} className={inputClass}>
                  <option value="">Select frequency</option>
                  {LIVE_CLASS_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Learning Hours"><input type="number" min="0" value={learning.learningHours} onChange={(e) => setLearning((p) => ({ ...p, learningHours: e.target.value }))} className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Toggle label="Learning Platform (LMS) Available" checked={learning.lmsAvailable} onChange={(v) => setLearning((p) => ({ ...p, lmsAvailable: v }))} />
              <Toggle label="Live Classes" checked={learning.liveClasses} onChange={(v) => setLearning((p) => ({ ...p, liveClasses: v }))} />
              <Toggle label="Recorded Classes" checked={learning.recordedClasses} onChange={(v) => setLearning((p) => ({ ...p, recordedClasses: v }))} />
              <Toggle label="Study Material" checked={learning.studyMaterial} onChange={(v) => setLearning((p) => ({ ...p, studyMaterial: v }))} />
              <Toggle label="Digital Library" checked={learning.digitalLibrary} onChange={(v) => setLearning((p) => ({ ...p, digitalLibrary: v }))} />
              <Toggle label="Doubt Support" checked={learning.doubtSupport} onChange={(v) => setLearning((p) => ({ ...p, doubtSupport: v }))} />
              <Toggle label="Mentor Support" checked={learning.mentorSupport} onChange={(v) => setLearning((p) => ({ ...p, mentorSupport: v }))} />
            </div>
          </div>

          {/* 08 INDUSTRY */}
          <div id="section-industry" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Industry</h4>

            <div className={subHeadingClass}>Projects</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Toggle label="Projects Available" checked={industry.projectsAvailable} onChange={(v) => setIndustry((p) => ({ ...p, projectsAvailable: v }))} />
              <Toggle label="Project Certificate" checked={industry.projectCertificateGiven} onChange={(v) => setIndustry((p) => ({ ...p, projectCertificateGiven: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Field label="Number of Projects"><input type="number" min="0" value={industry.projectsCount} onChange={(e) => setIndustry((p) => ({ ...p, projectsCount: e.target.value }))} className={inputClass} /></Field>
              <TagInput label="Project Type" values={industry.projectTypes} onChange={(v) => setIndustry((p) => ({ ...p, projectTypes: v }))} />
              <TagInput label="Industry Project Partners" values={industry.projectPartners} onChange={(v) => setIndustry((p) => ({ ...p, projectPartners: v }))} />
              <div className="md:col-span-2">
                <Field label="Project Description"><textarea rows={2} value={industry.projectDescription} onChange={(e) => setIndustry((p) => ({ ...p, projectDescription: e.target.value }))} className={inputClass} /></Field>
              </div>
            </div>

            <div className={subHeadingClass}>Internship</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Toggle label="Internship Available" checked={industry.internshipAvailable} onChange={(v) => setIndustry((p) => ({ ...p, internshipAvailable: v }))} />
              <Toggle label="Paid Internship" checked={industry.internshipPaid} onChange={(v) => setIndustry((p) => ({ ...p, internshipPaid: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Field label="Internship Duration">
                <div className="flex gap-2">
                  <input type="number" min="0" value={industry.internshipDurationValue} onChange={(e) => setIndustry((p) => ({ ...p, internshipDurationValue: e.target.value }))} className={`${inputClass} flex-[3] w-auto`} />
                  <select value={industry.internshipDurationUnit} onChange={(e) => setIndustry((p) => ({ ...p, internshipDurationUnit: e.target.value }))} className={`${inputClass} flex-1 w-auto shrink-0`}>
                    {DURATION_UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </Field>
              <Field label="Internship Type"><input value={industry.internshipType} onChange={(e) => setIndustry((p) => ({ ...p, internshipType: e.target.value }))} className={inputClass} /></Field>
              <Field label="Internship Stipend"><input type="number" min="0" value={industry.internshipStipend} onChange={(e) => setIndustry((p) => ({ ...p, internshipStipend: e.target.value }))} className={inputClass} /></Field>
              <TagInput label="Internship Partners" values={industry.internshipPartners} onChange={(v) => setIndustry((p) => ({ ...p, internshipPartners: v }))} />
              <div className="md:col-span-2">
                <Field label="Internship Description"><textarea rows={2} value={industry.internshipDescription} onChange={(e) => setIndustry((p) => ({ ...p, internshipDescription: e.target.value }))} className={inputClass} /></Field>
              </div>
            </div>

            <BuilderHeader title="Certifications" onAdd={addCertification} addLabel="Add Certification" />
            <div className="flex flex-col gap-4 mb-6">
              {industry.certifications.map((c, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Certification #{i + 1}</span>
                    <ReorderRemove index={i} length={industry.certifications.length} onMoveUp={() => moveCertification(i, -1)} onMoveDown={() => moveCertification(i, 1)} onRemove={() => removeCertification(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Certification Name"><input value={c.name} onChange={(e) => updateCertification(i, "name", e.target.value)} className={inputClass} /></Field>
                    <Field label="Certification Provider"><input value={c.provider} onChange={(e) => updateCertification(i, "provider", e.target.value)} className={inputClass} /></Field>
                    <Field label="Certification Type"><input value={c.type} onChange={(e) => updateCertification(i, "type", e.target.value)} className={inputClass} /></Field>
                    <Field label="Certification Logo URL"><input value={c.logo} onChange={(e) => updateCertification(i, "logo", e.target.value)} className={inputClass} /></Field>
                    <Field label="Certificate Sample URL"><input value={c.sample} onChange={(e) => updateCertification(i, "sample", e.target.value)} className={inputClass} /></Field>
                    <div className="md:col-span-2">
                      <Field label="Certification Description"><textarea rows={2} value={c.description} onChange={(e) => updateCertification(i, "description", e.target.value)} className={inputClass} /></Field>
                    </div>
                  </div>
                </div>
              ))}
              {industry.certifications.length === 0 && <p className="text-sm text-slate-400">No certifications added yet.</p>}
            </div>

            <BuilderHeader title="Employers" onAdd={addEmployer} addLabel="Add Employer" />
            <div className="flex flex-col gap-4">
              {industry.employers.map((emp, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Employer #{i + 1}</span>
                    <ReorderRemove index={i} length={industry.employers.length} onMoveUp={() => moveEmployer(i, -1)} onMoveDown={() => moveEmployer(i, 1)} onRemove={() => removeEmployer(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Employer Name"><input value={emp.name} onChange={(e) => updateEmployer(i, "name", e.target.value)} className={inputClass} /></Field>
                    <Field label="Employer Logo URL"><input value={emp.logo} onChange={(e) => updateEmployer(i, "logo", e.target.value)} className={inputClass} /></Field>
                    <Field label="Industry"><input value={emp.industry} onChange={(e) => updateEmployer(i, "industry", e.target.value)} className={inputClass} /></Field>
                    <Field label="Partnership Type">
                      <select value={emp.partnershipType} onChange={(e) => updateEmployer(i, "partnershipType", e.target.value)} className={inputClass}>
                        {PARTNERSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <div className="md:col-span-2 grid grid-cols-3 gap-2">
                      <Toggle label="Hiring Partner" checked={emp.hiringPartner} onChange={(v) => updateEmployer(i, "hiringPartner", v)} />
                      <Toggle label="Internship Partner" checked={emp.internshipPartner} onChange={(v) => updateEmployer(i, "internshipPartner", v)} />
                      <Toggle label="Project Partner" checked={emp.projectPartner} onChange={(v) => updateEmployer(i, "projectPartner", v)} />
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Employer Description"><textarea rows={2} value={emp.description} onChange={(e) => updateEmployer(i, "description", e.target.value)} className={inputClass} /></Field>
                    </div>
                  </div>
                </div>
              ))}
              {industry.employers.length === 0 && <p className="text-sm text-slate-400">No employers added yet.</p>}
            </div>
          </div>

          {/* 09 CAREER */}
          <div id="section-career" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Career</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TagInput label="Career Roles" values={career.roles} onChange={(v) => setCareer((p) => ({ ...p, roles: v }))} placeholder="e.g. Software Developer" />
              <TagInput label="Skills" values={career.skills} onChange={(v) => setCareer((p) => ({ ...p, skills: v }))} placeholder="e.g. React, Node.js" />
            </div>

            <div className={subHeadingClass}>Salary Information</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Toggle label="Salary Info Available" checked={career.salaryAvailable} onChange={(v) => setCareer((p) => ({ ...p, salaryAvailable: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Field label="Average Salary"><input type="number" min="0" value={career.salaryAverage} onChange={(e) => setCareer((p) => ({ ...p, salaryAverage: e.target.value }))} className={inputClass} /></Field>
              <Field label="Median Salary"><input type="number" min="0" value={career.salaryMedian} onChange={(e) => setCareer((p) => ({ ...p, salaryMedian: e.target.value }))} className={inputClass} /></Field>
              <Field label="Highest Salary"><input type="number" min="0" value={career.salaryHighest} onChange={(e) => setCareer((p) => ({ ...p, salaryHighest: e.target.value }))} className={inputClass} /></Field>
              <Field label="Lowest Salary"><input type="number" min="0" value={career.salaryLowest} onChange={(e) => setCareer((p) => ({ ...p, salaryLowest: e.target.value }))} className={inputClass} /></Field>
              <Field label="Salary Range Min"><input type="number" min="0" value={career.salaryRangeMin} onChange={(e) => setCareer((p) => ({ ...p, salaryRangeMin: e.target.value }))} className={inputClass} /></Field>
              <Field label="Salary Range Max"><input type="number" min="0" value={career.salaryRangeMax} onChange={(e) => setCareer((p) => ({ ...p, salaryRangeMax: e.target.value }))} className={inputClass} /></Field>
              <Field label="Salary Year"><input type="number" value={career.salaryYear} onChange={(e) => setCareer((p) => ({ ...p, salaryYear: e.target.value }))} className={inputClass} /></Field>
              <Field label="Salary Source"><input value={career.salarySource} onChange={(e) => setCareer((p) => ({ ...p, salarySource: e.target.value }))} className={inputClass} /></Field>
              <Field label="Salary Report (PDF)"><input type="file" accept="application/pdf" onChange={(e) => setCareer((p) => ({ ...p, salaryReportFile: e.target.files[0] || null }))} className={`${inputClass} py-2.5`} /></Field>
            </div>

            <div className={subHeadingClass}>Placement Support</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Toggle label="Placement Support Available" checked={career.placementAvailable} onChange={(v) => setCareer((p) => ({ ...p, placementAvailable: v }))} />
              <Toggle label="Placement Assistance" checked={career.placementAssistance} onChange={(v) => setCareer((p) => ({ ...p, placementAssistance: v }))} />
              <Toggle label="Placement Training" checked={career.placementTraining} onChange={(v) => setCareer((p) => ({ ...p, placementTraining: v }))} />
              <Toggle label="Resume Building" checked={career.resumeBuilding} onChange={(v) => setCareer((p) => ({ ...p, resumeBuilding: v }))} />
              <Toggle label="Mock Interviews" checked={career.mockInterviews} onChange={(v) => setCareer((p) => ({ ...p, mockInterviews: v }))} />
              <Toggle label="Aptitude Training" checked={career.aptitudeTraining} onChange={(v) => setCareer((p) => ({ ...p, aptitudeTraining: v }))} />
              <Toggle label="Soft Skills Training" checked={career.softSkillsTraining} onChange={(v) => setCareer((p) => ({ ...p, softSkillsTraining: v }))} />
              <Toggle label="Career Counseling" checked={career.careerCounseling} onChange={(v) => setCareer((p) => ({ ...p, careerCounseling: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Placement Partners"><input type="number" min="0" value={career.placementPartnersCount} onChange={(e) => setCareer((p) => ({ ...p, placementPartnersCount: e.target.value }))} className={inputClass} /></Field>
              <Field label="Placement Rate (%)"><input type="number" min="0" max="100" value={career.placementRate} onChange={(e) => setCareer((p) => ({ ...p, placementRate: e.target.value }))} className={inputClass} /></Field>
              <Field label="Placement Report (PDF)"><input type="file" accept="application/pdf" onChange={(e) => setCareer((p) => ({ ...p, placementReportFile: e.target.files[0] || null }))} className={`${inputClass} py-2.5`} /></Field>
              <div className="md:col-span-2">
                <Field label="Placement Description"><textarea rows={2} value={career.placementDescription} onChange={(e) => setCareer((p) => ({ ...p, placementDescription: e.target.value }))} className={inputClass} /></Field>
              </div>
            </div>
          </div>

          {/* 10 ADMISSION */}
          <div id="section-admission" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Admission</h4>
            <div className={subHeadingClass}>Dates</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Field label="Application Start Date"><input type="date" value={admission.applicationStartDate} onChange={(e) => setAdmission((p) => ({ ...p, applicationStartDate: e.target.value }))} className={inputClass} /></Field>
              <Field label="Application Deadline"><input type="date" value={admission.applicationDeadline} onChange={(e) => setAdmission((p) => ({ ...p, applicationDeadline: e.target.value }))} className={inputClass} /></Field>
              <Field label="Admission Start Date"><input type="date" value={admission.admissionStartDate} onChange={(e) => setAdmission((p) => ({ ...p, admissionStartDate: e.target.value }))} className={inputClass} /></Field>
              <Field label="Admission End Date"><input type="date" value={admission.admissionEndDate} onChange={(e) => setAdmission((p) => ({ ...p, admissionEndDate: e.target.value }))} className={inputClass} /></Field>
              <Field label="Entrance Exam Date"><input type="date" value={admission.entranceExamDate} onChange={(e) => setAdmission((p) => ({ ...p, entranceExamDate: e.target.value }))} className={inputClass} /></Field>
              <Field label="Intake Cycle"><input value={admission.intakeCycle} onChange={(e) => setAdmission((p) => ({ ...p, intakeCycle: e.target.value }))} className={inputClass} /></Field>
              <Field label="Admission Status">
                <select value={admission.status} onChange={(e) => setAdmission((p) => ({ ...p, status: e.target.value }))} className={inputClass}>
                  <option value="">Select status</option>
                  {ADMISSION_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>

            <BuilderHeader title="Documents" onAdd={addDocument} addLabel="Add Document" />
            <div className="flex flex-col gap-4 mb-6">
              {admission.documents.map((d, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Document #{i + 1}</span>
                    <ReorderRemove index={i} length={admission.documents.length} onMoveUp={() => moveDocument(i, -1)} onMoveDown={() => moveDocument(i, 1)} onRemove={() => removeDocument(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Document Name"><input value={d.name} onChange={(e) => updateDocument(i, "name", e.target.value)} className={inputClass} /></Field>
                    <Field label="Required"><div className="px-1 py-2"><Toggle label="Required" checked={d.required} onChange={(v) => updateDocument(i, "required", v)} /></div></Field>
                    <TagInput label="Accepted Formats" values={d.acceptedFormats} onChange={(v) => updateDocument(i, "acceptedFormats", v)} placeholder="e.g. PDF, JPG" />
                    <Field label="Maximum File Size (MB)"><input type="number" min="0" value={d.maxFileSizeMB} onChange={(e) => updateDocument(i, "maxFileSizeMB", e.target.value)} className={inputClass} /></Field>
                    <div className="md:col-span-2">
                      <Field label="Description"><textarea rows={2} value={d.description} onChange={(e) => updateDocument(i, "description", e.target.value)} className={inputClass} /></Field>
                    </div>
                  </div>
                </div>
              ))}
              {admission.documents.length === 0 && <p className="text-sm text-slate-400">No documents added yet.</p>}
            </div>

            <BuilderHeader title="Admission Process" onAdd={addProcessStep} addLabel="Add Step" />
            <div className="flex flex-col gap-4">
              {admission.process.map((step, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Step {step.stepNumber}</span>
                    <ReorderRemove index={i} length={admission.process.length} onMoveUp={() => moveProcessStep(i, -1)} onMoveDown={() => moveProcessStep(i, 1)} onRemove={() => removeProcessStep(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Step Title"><input value={step.title} onChange={(e) => updateProcessStep(i, "title", e.target.value)} className={inputClass} /></Field>
                    <Field label="Estimated Time"><input value={step.estimatedTime} onChange={(e) => updateProcessStep(i, "estimatedTime", e.target.value)} className={inputClass} /></Field>
                    <Field label="Required"><div className="px-1 py-2"><Toggle label="Required" checked={step.required} onChange={(v) => updateProcessStep(i, "required", v)} /></div></Field>
                    <div className="md:col-span-2">
                      <Field label="Description"><textarea rows={2} value={step.description} onChange={(e) => updateProcessStep(i, "description", e.target.value)} className={inputClass} /></Field>
                    </div>
                  </div>
                </div>
              ))}
              {admission.process.length === 0 && <p className="text-sm text-slate-400">No admission steps added yet. Example: Register, Submit Application, Upload Documents, Application Review, Admission Decision, Fee Payment, Enrollment.</p>}
            </div>
          </div>

          {/* 11 CONTENT */}
          <div id="section-content" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Content</h4>
            {/* Every hint below names where the field actually surfaces on
                /degree/:id, so an admin can see what they are writing for. */}
            <p className="-mt-3 mb-5 text-xs text-slate-500">
              This section fills the "Overview" tab of the public programme page.
            </p>
            <div className="grid grid-cols-1 gap-4 mb-6">
              <Field label="Short Overview" hint="Fallback only — used as the Overview paragraph when Full Overview is empty. One or two sentences.">
                <textarea rows={2} value={content.shortOverview} onChange={(e) => setContent((p) => ({ ...p, shortOverview: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Full Overview" hint="The main Overview paragraph at the top of the programme page. Takes priority over Short Overview; if both are empty the page reads 'An overview for this programme is coming soon.'">
                <textarea rows={4} value={content.fullOverview} onChange={(e) => setContent((p) => ({ ...p, fullOverview: e.target.value }))} className={inputClass} />
              </Field>
              <TagInput label="Program Highlights" values={content.highlights} onChange={(v) => setContent((p) => ({ ...p, highlights: v }))} hint="Becomes the ticked 'Key highlights' list under the Overview. One short selling point per entry, e.g. 'Recognized by AIU and NAAC'." />
              <TagInput label="Learning Outcomes" values={content.learningOutcomes} onChange={(v) => setContent((p) => ({ ...p, learningOutcomes: v }))} hint="Becomes the ticked 'What you will learn' list. One skill or outcome per entry." />
              <Field label="Why Choose This Program" hint="Shown as the highlighted blue callout under the highlights, prefixed 'Why choose this programme:'. Leave empty to hide the callout.">
                <textarea rows={2} value={content.whyChoose} onChange={(e) => setContent((p) => ({ ...p, whyChoose: e.target.value }))} className={inputClass} />
              </Field>
            </div>

            <BuilderHeader title="Benefits" onAdd={addBenefit} addLabel="Add Benefit" hint="Saved with the programme but not displayed on the public programme page yet — use Program Highlights for anything students must see." />
            <div className="flex flex-col gap-4 mb-6">
              {content.benefits.map((b, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Benefit #{i + 1}</span>
                    <ReorderRemove index={i} length={content.benefits.length} onMoveUp={() => moveBenefit(i, -1)} onMoveDown={() => moveBenefit(i, 1)} onRemove={() => removeBenefit(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Benefit Title" hint="Required."><input value={b.title} onChange={(e) => updateBenefit(i, "title", e.target.value)} className={inputClass} /></Field>
                    <Field label="Benefit Icon" hint="Free-text icon name, for whenever this block gets a public renderer."><input value={b.icon} onChange={(e) => updateBenefit(i, "icon", e.target.value)} placeholder="icon name" className={inputClass} /></Field>
                    <Field label="Benefit Image URL" hint="Full URL to an already-hosted image — this field does not upload a file."><input value={b.image} onChange={(e) => updateBenefit(i, "image", e.target.value)} className={inputClass} /></Field>
                    <div className="md:col-span-2">
                      <Field label="Benefit Description"><textarea rows={2} value={b.description} onChange={(e) => updateBenefit(i, "description", e.target.value)} className={inputClass} /></Field>
                    </div>
                  </div>
                </div>
              ))}
              {content.benefits.length === 0 && <p className="text-sm text-slate-400">No benefits added yet.</p>}
            </div>

            <BuilderHeader title="FAQs" onAdd={addFaq} addLabel="Add FAQ" hint="Renders as the 'Frequently asked questions' accordion at the bottom of the programme page. The whole section is hidden when there are none." />
            <div className="flex flex-col gap-4 mb-6">
              {content.faqs.map((f, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">FAQ #{i + 1}</span>
                    <ReorderRemove index={i} length={content.faqs.length} onMoveUp={() => moveFaq(i, -1)} onMoveDown={() => moveFaq(i, 1)} onRemove={() => removeFaq(i)} />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Question" hint="The accordion's clickable title."><input value={f.question} onChange={(e) => updateFaq(i, "question", e.target.value)} className={inputClass} /></Field>
                    <Field label="Answer" hint="Revealed when a student expands the question."><textarea rows={2} value={f.answer} onChange={(e) => updateFaq(i, "answer", e.target.value)} className={inputClass} /></Field>
                    <Field label="Published" hint="Switch off to keep this FAQ out of the programme page without deleting it."><div className="px-1 py-2"><Toggle label="Published" checked={f.published} onChange={(v) => updateFaq(i, "published", v)} /></div></Field>
                  </div>
                </div>
              ))}
              {content.faqs.length === 0 && <p className="text-sm text-slate-400">No FAQs added yet.</p>}
            </div>

            <BuilderHeader title="Testimonials" onAdd={addTestimonial} addLabel="Add Testimonial" hint="Renders as the 'What learners say' cards on the programme page. Only name, designation, graduation year, rating and the quote are shown there — photo, company and Featured are stored but unused." />
            <div className="flex flex-col gap-4">
              {content.testimonials.map((t, i) => (
                <div key={i} className="border border-[#EEF2FF] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">Testimonial #{i + 1}</span>
                    <ReorderRemove index={i} length={content.testimonials.length} onMoveUp={() => moveTestimonial(i, -1)} onMoveDown={() => moveTestimonial(i, 1)} onRemove={() => removeTestimonial(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Student Name"><input value={t.studentName} onChange={(e) => updateTestimonial(i, "studentName", e.target.value)} className={inputClass} /></Field>
                    <Field label="Student Photo URL"><input value={t.photo} onChange={(e) => updateTestimonial(i, "photo", e.target.value)} className={inputClass} /></Field>
                    <Field label="Designation"><input value={t.designation} onChange={(e) => updateTestimonial(i, "designation", e.target.value)} className={inputClass} /></Field>
                    <Field label="Company"><input value={t.company} onChange={(e) => updateTestimonial(i, "company", e.target.value)} className={inputClass} /></Field>
                    <Field label="Rating (0-5)" hint="Drawn as that many filled stars, rounded to a whole star."><input type="number" min="0" max="5" value={t.rating} onChange={(e) => updateTestimonial(i, "rating", e.target.value)} className={inputClass} /></Field>
                    <Field label="Graduation Year" hint="Appended after the designation, e.g. 'Product Manager, 2024'."><input type="number" value={t.graduationYear} onChange={(e) => updateTestimonial(i, "graduationYear", e.target.value)} className={inputClass} /></Field>
                    <Field label="Featured"><div className="px-1 py-2"><Toggle label="Featured" checked={t.featured} onChange={(v) => updateTestimonial(i, "featured", v)} /></div></Field>
                    <div className="md:col-span-2">
                      <Field label="Testimonial"><textarea rows={2} value={t.testimonial} onChange={(e) => updateTestimonial(i, "testimonial", e.target.value)} className={inputClass} /></Field>
                    </div>
                  </div>
                </div>
              ))}
              {content.testimonials.length === 0 && <p className="text-sm text-slate-400">No testimonials added yet.</p>}
            </div>
          </div>

          {/* 12 BROCHURE */}
          <div id="section-brochure" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Brochure</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Program Brochure (PDF)">
                <input type="file" accept="application/pdf" onChange={(e) => setBrochure((p) => ({ ...p, file: e.target.files[0] || null }))} className={`${inputClass} py-2.5`} />
                {brochure.fileName && !brochure.file && (
                  <span className="text-[11px] font-normal text-slate-400">Current file: {brochure.fileName}</span>
                )}
              </Field>
              <Field label="Brochure Title"><input value={brochure.title} onChange={(e) => setBrochure((p) => ({ ...p, title: e.target.value }))} className={inputClass} /></Field>
              <div className="md:col-span-2">
                <Field label="Brochure Description"><textarea rows={2} value={brochure.description} onChange={(e) => setBrochure((p) => ({ ...p, description: e.target.value }))} className={inputClass} /></Field>
              </div>
              <Field label="Download Enabled">
                <div className="px-1 py-2"><Toggle label="Allow download" checked={brochure.downloadEnabled} onChange={(v) => setBrochure((p) => ({ ...p, downloadEnabled: v }))} /></div>
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
              {savedProgramId ? "Close" : "Cancel"}
            </button>
            {!isEditMode && savedProgramId ? (
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

export default DegreeProgramCMSForm;
