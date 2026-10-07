import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiX, FiPlus, FiUpload, FiFile, FiTrash2, FiExternalLink, FiSearch } from "react-icons/fi";
import { getErrorMessage, API_BASE_URL } from "../../../services/apiClient";
import { createUniversityPortfolio, updateUniversityPortfolio, searchProgramsForPortfolio } from "../../../services/universityPortfolioAPI";

// Dedicated form for the University Portfolio module (/api/university-portfolios).
// Layout mirrors UniversityProgramForm.jsx: left section nav, right scrollable form.

const RECOGNITION_OPTIONS = [
  "UGC",
  "UGC-DEB",
  "AICTE",
  "AIU",
  "NAAC",
  "NIRF",
  "NBA",
  "AACSB",
  "EQUIS",
  "AMBA",
  "ACBSP",
  "IACBE",
  "EFMD Accredited Programme",
  "WES",
  "Other",
];

const NAAC_GRADE_OPTIONS = ["A++", "A+", "A", "B++", "B+", "B", "C", "D"];
const MAX_VIDEOS = 10;
const YOUTUBE_REGEX = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i;
const URL_REGEX = /^https?:\/\/.+/i;

const UNIVERSITY_TYPE_OPTIONS = ["Private", "State", "Central", "Deemed", "Autonomous", "Other"];

const APPROVAL_OPTIONS = [
  "UGC",
  "UGC-DEB",
  "AICTE",
  "AIU",
  "NAAC",
  "NIRF",
  "NBA",
  "BCI",
  "PCI",
  "NCTE",
  "MCI/NMC",
  "Other",
];

const PLACEMENT_PARTNERS_OPTIONS = [
  "Google",
  "Microsoft",
  "Amazon",
  "TCS",
  "Infosys",
  "Wipro",
  "Deloitte",
  "Accenture",
  "IBM",
  "Capgemini",
  "Other",
];

const EXAMINATION_SYSTEM_OPTIONS = ["Online", "Offline", "Hybrid"];

const PORTFOLIO_TAG_OPTIONS = ["Featured", "Partner", "Platinum", "Gold", "Silver"];

const SECTIONS = [
  { id: "section-portfolio-overview", label: "Overview" },
  { id: "section-portfolio-banner", label: "Banner" },
  { id: "section-portfolio-recognition", label: "Recognition & Accreditation" },
  { id: "section-portfolio-academic", label: "Academic" },
  { id: "section-portfolio-courses", label: "Courses by University" },
  { id: "section-portfolio-campus", label: "Campus Experience" },
  { id: "section-portfolio-location", label: "Location" },
  { id: "section-portfolio-financial", label: "Financial" },
  { id: "section-portfolio-career", label: "Career" },
  { id: "section-portfolio-student-experience", label: "Student Experience" },
  { id: "section-portfolio-promotions", label: "Promotions" },
];

const inputClass = "border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none w-full";
const fieldLabelClass = "flex flex-col gap-2 text-sm font-semibold text-slate-700";
const sectionCardClass = "bg-white p-5 rounded-xl border border-[#E2E8F0] scroll-mt-24";
const sectionHeadingClass = "text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider";

const resolveFileUrl = (path) => (path?.startsWith("http") ? path : `${API_BASE_URL}${path}`);

const emptyForm = {
  universityName: "",
  bannerImageFile: null,
  bannerImageExisting: null,
  recognition: [],
  naacGrade: "",
  otherRecognition: [""],
  courses: [],
  campusTour360Url: "",
  videos: [""],
  currentPhotoFiles: [],
  currentPhotosExisting: [],
  locationAddress: "",
  locationLat: null,
  locationLng: null,
  programBrochureFile: null,
  programBrochureExisting: null,
  leafletFiles: [],
  leafletsExisting: [],
  universityHandbookFile: null,
  universityHandbookExisting: null,
  placementBrochureFile: null,
  placementBrochureExisting: null,
  applicationFormFile: null,
  applicationFormExisting: null,

  // Overview
  logoFile: null,
  logoExisting: null,
  establishedYear: "",
  universityType: "",
  approvals: [],
  tags: [],
  onlineEducationStatus: false,
  distanceEducationStatus: false,
  website: "",
  studentSupport: "",
  about: "",
  keyStats: [{ value: "", label: "" }],
  highlights: [{ title: "", text: "" }],

  // Academic
  facultyDetails: "",
  learningMethodology: "",

  // Financial
  totalFeeRange: "",
  semesterFeeRange: "",
  applicationFee: "",
  emiAvailable: false,
  scholarshipsAvailable: false,
  educationLoanAvailable: false,
  scholarshipsAbout: "",
  scholarships: [{ name: "", value: "" }],

  // Career
  placementSupport: false,
  placementPartners: [],
  careerServices: [""],
  internshipsAvailable: false,
  industryInteraction: false,
  alumniNetwork: "",
  careerOutcomes: "",
  highestPackage: "",
  averagePackage: "",
  placementPercentage: "",
  companiesVisiting: "",
  recruiterLogoFiles: [],
  recruiterLogosExisting: [],

  // Student Experience
  lmsAvailable: false,
  mobileApplication: false,
  liveClasses: false,
  recordedClasses: false,
  discussionForums: false,
  assessments: [""],
  examinationSystem: "",
};

const Field = ({ label, required, children, hint }) => (
  <label className={fieldLabelClass}>
    <span>
      {label} {required && <span className="text-rose-600">*</span>}
    </span>
    {children}
    {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
  </label>
);

// --- Boolean toggle rendered as a labeled checkbox ---
const BooleanField = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 px-1 py-3">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-700 w-4 h-4 rounded" />
    {label}
  </label>
);

// --- Single Image Upload: preview, replace, remove ---
const SingleImageUpload = ({ label, file, existingUrl, onFileChange, onRemove }) => {
  const previewSrc = file ? URL.createObjectURL(file) : existingUrl ? resolveFileUrl(existingUrl) : null;
  return (
    <Field label={label}>
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-center gap-2 px-5 py-6 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
          <FiUpload className="text-slate-500" />
          <span className="text-sm font-medium text-slate-600">{previewSrc ? "Replace Banner Image" : "Upload Banner Image"}</span>
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(e) => onFileChange(e.target.files[0] || null)} />
        </label>
        {previewSrc && (
          <div className="relative w-full max-w-sm">
            <img src={previewSrc} alt="Banner preview" className="w-full h-40 object-cover rounded-xl border border-slate-200" />
            <button type="button" onClick={onRemove} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm" title="Remove">
              <FiX size={14} />
            </button>
          </div>
        )}
      </div>
    </Field>
  );
};

// --- Multiple Image Upload: add, preview grid, remove individual ---
const MultiImageUpload = ({ label, newFiles, existingPhotos, onAddFiles, onRemoveNew, onRemoveExisting }) => (
  <Field label={label}>
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-center gap-2 px-5 py-6 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors w-full">
        <FiUpload className="text-slate-500" />
        <span className="text-sm font-medium text-slate-600">Upload Photos</span>
        <input type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(e) => onAddFiles(Array.from(e.target.files || []))} />
      </label>
      {(existingPhotos.length > 0 || newFiles.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {existingPhotos.map((photo, idx) => (
            <div key={`existing-${idx}`} className="relative group">
              <img src={resolveFileUrl(photo.url)} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
              <button type="button" onClick={() => onRemoveExisting(idx)} className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm">
                <FiX size={10} />
              </button>
            </div>
          ))}
          {newFiles.map((file, idx) => (
            <div key={`new-${idx}`} className="relative group">
              <img src={URL.createObjectURL(file)} alt="" className="w-20 h-20 object-cover rounded-lg border border-blue-300" />
              <button type="button" onClick={() => onRemoveNew(idx)} className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm">
                <FiX size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </Field>
);

// --- Single PDF Upload: filename, replace, delete ---
const SinglePdfUpload = ({ label, file, existingFile, onFileChange, onRemove }) => (
  <Field label={label}>
    <div className="flex flex-col gap-2">
      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
        <FiUpload className="text-slate-500" />
        <span className="text-sm font-medium text-slate-600">Upload PDF</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => onFileChange(e.target.files[0] || null)} />
      </label>
      {(file || existingFile) && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-600 truncate">
            <FiFile /> {file ? file.name : existingFile?.fileName || "Uploaded file"}
          </span>
          <button type="button" onClick={onRemove} className="text-red-600 hover:text-red-700 shrink-0">
            <FiTrash2 size={14} />
          </button>
        </div>
      )}
    </div>
  </Field>
);

// --- Multiple PDF Upload (Leaflets) ---
const MultiPdfUpload = ({ label, newFiles, existingFiles, onAddFiles, onRemoveNew, onRemoveExisting }) => (
  <Field label={label}>
    <div className="flex flex-col gap-2">
      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
        <FiUpload className="text-slate-500" />
        <span className="text-sm font-medium text-slate-600">Upload PDFs</span>
        <input type="file" multiple accept="application/pdf" className="hidden" onChange={(e) => onAddFiles(Array.from(e.target.files || []))} />
      </label>
      {(existingFiles.length > 0 || newFiles.length > 0) && (
        <div className="flex flex-col gap-2">
          {existingFiles.map((f, idx) => (
            <div key={`existing-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600 truncate"><FiFile /> {f.fileName}</span>
              <button type="button" onClick={() => onRemoveExisting(idx)} className="text-red-600 hover:text-red-700 shrink-0"><FiTrash2 size={14} /></button>
            </div>
          ))}
          {newFiles.map((f, idx) => (
            <div key={`new-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600 truncate"><FiFile /> {f.name}</span>
              <button type="button" onClick={() => onRemoveNew(idx)} className="text-red-600 hover:text-red-700 shrink-0"><FiTrash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  </Field>
);

// --- Recognition & Accreditation: single fixed multi-select. Only NAAC opens a sub-dropdown. ---
const RecognitionMultiSelect = ({ selected, onToggle }) => {
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
      
      <div
        className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex flex-wrap gap-1.5 items-center transition-all hover:bg-white min-h-[52px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && <span className="font-normal text-slate-400">Select Recognition</span>}
        {selected.map((item) => (
          <span key={item} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
            {item}
            <FiX
              size={12}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(item);
              }}
            />
          </span>
        ))}
        <svg className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-20 max-h-72 overflow-y-auto p-2">
          {RECOGNITION_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
              <input type="checkbox" className="accent-blue-700 w-4 h-4 rounded" checked={selected.includes(option)} onChange={() => onToggle(option)} />
              <span className="font-normal text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Generic checkbox multi-select against a fixed options list (Approvals, Placement Partners) ---
const CheckboxMultiSelect = ({ options, selected, onToggle, placeholder = "Select options..." }) => {
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
      <div
        className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex flex-wrap gap-1.5 items-center transition-all hover:bg-white min-h-[52px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && <span className="font-normal text-slate-400">{placeholder}</span>}
        {selected.map((item) => (
          <span key={item} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
            {item}
            <FiX
              size={12}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(item);
              }}
            />
          </span>
        ))}
        <svg className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-20 max-h-72 overflow-y-auto p-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
              <input type="checkbox" className="accent-blue-700 w-4 h-4 rounded" checked={selected.includes(option)} onChange={() => onToggle(option)} />
              <span className="font-normal text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Repeatable text input (Other Recognition) ---
const RepeatableTextInput = ({ values, onChange, onAdd, onRemove, placeholder }) => (
  <div className="flex flex-col gap-2">
    {values.map((value, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <input value={value} onChange={(e) => onChange(idx, e.target.value)} placeholder={placeholder} className={inputClass} />
        {values.length > 1 && (
          <button type="button" onClick={() => onRemove(idx)} className="text-red-600 hover:text-red-700 shrink-0 p-2">
            <FiX size={16} />
          </button>
        )}
      </div>
    ))}
    <button type="button" onClick={onAdd} className="self-start text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
      <FiPlus size={12} /> Add Recognition
    </button>
  </div>
);

// --- Repeatable two-field rows (Key Stats: value + label, Highlights: title + text) ---
const PairListInput = ({ rows, fields, onChange, onAdd, onRemove, addLabel }) => (
  <div className="flex flex-col gap-2">
    {rows.map((row, idx) => (
      <div key={idx} className="flex items-center gap-2">
        {fields.map(({ key, placeholder, className = "" }) => (
          <input
            key={key}
            value={row[key]}
            onChange={(e) => onChange(idx, key, e.target.value)}
            placeholder={placeholder}
            className={`${inputClass} ${className}`}
          />
        ))}
        {rows.length > 1 && (
          <button type="button" onClick={() => onRemove(idx)} className="text-red-600 hover:text-red-700 shrink-0 p-2">
            <FiX size={16} />
          </button>
        )}
      </div>
    ))}
    <button type="button" onClick={onAdd} className="self-start text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
      <FiPlus size={12} /> {addLabel}
    </button>
  </div>
);

// --- Repeatable URL input (YouTube videos, max 10) ---
const RepeatableUrlInput = ({ values, onChange, onAdd, onRemove, placeholder, max }) => (
  <div className="flex flex-col gap-2">
    {values.map((value, idx) => (
      <div key={idx} className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-500">Video {idx + 1}</span>
        <div className="flex items-center gap-2">
          <input value={value} onChange={(e) => onChange(idx, e.target.value)} placeholder={placeholder} className={inputClass} />
          {values.length > 1 && (
            <button type="button" onClick={() => onRemove(idx)} className="text-red-600 hover:text-red-700 shrink-0 p-2">
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>
    ))}
    <button
      type="button"
      onClick={onAdd}
      disabled={values.length >= max}
      className="self-start text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <FiPlus size={12} /> Add Video {values.length >= max ? `(Max ${max})` : ""}
    </button>
  </div>
);

// Admin-added course names are persisted to localStorage so they keep showing up as selectable
// options across sessions (same idea as CreatableCheckboxDropdown in UniversityProgramForm.jsx).
const CUSTOM_COURSES_STORAGE_KEY = "university_portfolio_custom_courses_v1";

const readStoredCourses = () => {
  try {
    const raw = window.localStorage.getItem(CUSTOM_COURSES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredCourses = (courses) => {
  try {
    window.localStorage.setItem(CUSTOM_COURSES_STORAGE_KEY, JSON.stringify(courses));
  } catch {
    // localStorage unavailable (e.g. private browsing) — custom courses simply won't persist across reloads.
  }
};

// Dynamic dropdown for "Courses by University": searches existing DegreeProgram records, and also
// lets the admin type and add their own course name on the fly (kept as a name-only entry, no
// program id, so it never duplicates real program data).
const CourseSearchMultiSelect = ({ selected, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customCourses, setCustomCourses] = useState(() => readStoredCourses());
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchProgramsForPortfolio(query);
        setResults(res?.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleAddCustomCourse = (e) => {
    e.preventDefault();
    const name = query.trim();
    if (!name) return;
    if (!customCourses.includes(name)) {
      const next = [...customCourses, name];
      setCustomCourses(next);
      writeStoredCourses(next);
    }
    onToggle({ _id: `custom:${name}`, programName: name, isCustom: true });
    setQuery("");
  };

  const visibleCustomCourses = customCourses.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <div
        className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex flex-wrap gap-1.5 items-center transition-all hover:bg-white min-h-[52px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && <span className="font-normal text-slate-400">Search or add courses/programs</span>}
        {selected.map((course) => (
          <span key={course._id} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
            {course.programName}
            <FiX
              size={12}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(course);
              }}
            />
          </span>
        ))}
        <svg className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-20 max-h-96 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-2">
              <FiSearch className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCustomCourse(e); }}
                placeholder="Search or type a new course name..."
                className="flex-1 border-none bg-transparent py-2 text-sm font-normal outline-none"
              />
            </div>
            <button type="button" onClick={handleAddCustomCourse} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 shrink-0">
              Add
            </button>
          </div>
          <div className="overflow-y-auto p-2 max-h-72">
            {loading && <p className="text-xs text-slate-400 px-3 py-2">Searching...</p>}
            {!loading && results.length === 0 && <p className="text-xs text-slate-400 px-3 py-2">No existing programs found.</p>}
            {results.map((course) => {
              const isSelected = selected.some((c) => c._id === course._id);
              return (
                <label key={course._id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" className="accent-blue-700 w-4 h-4 rounded" checked={isSelected} onChange={() => onToggle(course)} />
                  <span className="font-normal text-slate-700 truncate">
                    {course.programName} <span className="text-slate-400">— {course.university?.name}</span>
                  </span>
                </label>
              );
            })}

            {visibleCustomCourses.length > 0 && (
              <>
                <p className="text-[10px] uppercase font-bold text-slate-400 mt-2 mb-1 px-3 tracking-wider">Your Added Courses</p>
                {visibleCustomCourses.map((name) => {
                  const customId = `custom:${name}`;
                  const isSelected = selected.some((c) => c._id === customId);
                  return (
                    <label key={customId} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="accent-blue-700 w-4 h-4 rounded"
                        checked={isSelected}
                        onChange={() => onToggle({ _id: customId, programName: name, isCustom: true })}
                      />
                      <span className="font-normal text-slate-700 truncate">{name}</span>
                    </label>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Location Autocomplete (OpenStreetMap Nominatim — no API key required) ---
const LocationAutocomplete = ({ address, latitude, longitude, onSelect }) => {
  const [query, setQuery] = useState(address || "");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query === address) {
      const clearTimer = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(clearTimer);
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setIsOpen(true);
      } catch {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <span>University Location</span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Search university location..."
        className={inputClass}
      />
      {isOpen && results.length > 0 && (
        <div className="absolute top-[72px] left-0 w-full bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto p-1">
          {results.map((r) => (
            <div
              key={r.place_id}
              onClick={() => {
                setQuery(r.display_name);
                setIsOpen(false);
                onSelect({ address: r.display_name, latitude: Number(r.lat), longitude: Number(r.lon) });
              }}
              className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-normal text-slate-700"
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}
      {latitude != null && longitude != null && (
        <div className="flex gap-4 text-xs text-slate-500 font-medium">
          <span>Latitude: {latitude.toFixed(6)} (auto)</span>
          <span>Longitude: {longitude.toFixed(6)} (auto)</span>
        </div>
      )}
    </div>
  );
};

const UniversityPortfolioForm = ({ onClose, onSaved, initialPortfolio = null }) => {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSectionState] = useState(SECTIONS[0].id);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!initialPortfolio) return;
    setForm({
      ...emptyForm,
      universityName: initialPortfolio.universityName || "",
      bannerImageExisting: initialPortfolio.bannerImage || null,
      recognition: initialPortfolio.recognition || [],
      naacGrade: initialPortfolio.naacGrade || "",
      otherRecognition: initialPortfolio.otherRecognition?.length ? initialPortfolio.otherRecognition : [""],
      courses: (initialPortfolio.courses || []).map((c) =>
        c.programId
          ? { _id: c.programId._id || c.programId, programName: c.name, university: c.programId.university, isCustom: false }
          : { _id: `custom:${c.name}`, programName: c.name, isCustom: true }
      ),
      campusTour360Url: initialPortfolio.campusTour360Url || "",
      videos: initialPortfolio.videos?.length ? initialPortfolio.videos : [""],
      currentPhotosExisting: initialPortfolio.currentPhotos || [],
      locationAddress: initialPortfolio.location?.address || "",
      locationLat: initialPortfolio.location?.latitude ?? null,
      locationLng: initialPortfolio.location?.longitude ?? null,
      programBrochureExisting: initialPortfolio.promotions?.programBrochure || null,
      leafletsExisting: initialPortfolio.promotions?.leaflets || [],
      universityHandbookExisting: initialPortfolio.promotions?.universityHandbook || null,
      placementBrochureExisting: initialPortfolio.promotions?.placementBrochure || null,
      applicationFormExisting: initialPortfolio.promotions?.applicationForm || null,

      logoExisting: initialPortfolio.logo || null,
      establishedYear: initialPortfolio.establishedYear ?? "",
      universityType: initialPortfolio.universityType || "",
      approvals: initialPortfolio.approvals || [],
      tags: initialPortfolio.tags || [],
      onlineEducationStatus: Boolean(initialPortfolio.onlineEducationStatus),
      distanceEducationStatus: Boolean(initialPortfolio.distanceEducationStatus),
      website: initialPortfolio.website || "",
      studentSupport: initialPortfolio.studentSupport || "",
      about: initialPortfolio.about || "",
      keyStats: initialPortfolio.keyStats?.length ? initialPortfolio.keyStats : [{ value: "", label: "" }],
      highlights: initialPortfolio.highlights?.length ? initialPortfolio.highlights : [{ title: "", text: "" }],

      facultyDetails: initialPortfolio.facultyDetails || "",
      learningMethodology: initialPortfolio.learningMethodology || "",

      totalFeeRange: initialPortfolio.financial?.totalFeeRange ?? "",
      semesterFeeRange: initialPortfolio.financial?.semesterFeeRange ?? "",
      applicationFee: initialPortfolio.financial?.applicationFee ?? "",
      emiAvailable: Boolean(initialPortfolio.financial?.emiAvailable),
      scholarshipsAvailable: Boolean(initialPortfolio.financial?.scholarshipsAvailable),
      educationLoanAvailable: Boolean(initialPortfolio.financial?.educationLoanAvailable),
      scholarshipsAbout: initialPortfolio.scholarshipsAbout || "",
      scholarships: initialPortfolio.scholarships?.length ? initialPortfolio.scholarships : [{ name: "", value: "" }],

      placementSupport: Boolean(initialPortfolio.career?.placementSupport),
      placementPartners: initialPortfolio.career?.placementPartners || [],
      careerServices: initialPortfolio.career?.careerServices?.length ? initialPortfolio.career.careerServices : [""],
      internshipsAvailable: Boolean(initialPortfolio.career?.internshipsAvailable),
      industryInteraction: Boolean(initialPortfolio.career?.industryInteraction),
      alumniNetwork: initialPortfolio.career?.alumniNetwork || "",
      careerOutcomes: initialPortfolio.career?.careerOutcomes || "",
      highestPackage: initialPortfolio.career?.highestPackage || "",
      averagePackage: initialPortfolio.career?.averagePackage || "",
      placementPercentage: initialPortfolio.career?.placementPercentage || "",
      companiesVisiting: initialPortfolio.career?.companiesVisiting || "",
      recruiterLogosExisting: initialPortfolio.recruiterLogos || [],

      lmsAvailable: Boolean(initialPortfolio.studentExperience?.lmsAvailable),
      mobileApplication: Boolean(initialPortfolio.studentExperience?.mobileApplication),
      liveClasses: Boolean(initialPortfolio.studentExperience?.liveClasses),
      recordedClasses: Boolean(initialPortfolio.studentExperience?.recordedClasses),
      discussionForums: Boolean(initialPortfolio.studentExperience?.discussionForums),
      assessments: initialPortfolio.studentExperience?.assessments?.length ? initialPortfolio.studentExperience.assessments : [""],
      examinationSystem: initialPortfolio.studentExperience?.examinationSystem || "",
    });
  }, [initialPortfolio]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisible = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!mostVisible || entry.intersectionRatio > mostVisible.intersectionRatio)) {
            mostVisible = entry;
          }
        });
        if (mostVisible) setActiveSectionState(mostVisible.target.id);
      },
      { root: document.getElementById("university-portfolio-form-container"), rootMargin: "-10% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
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
    const container = document.getElementById("university-portfolio-form-container");
    if (el && container) container.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
  };

  const handleField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const toggleRecognition = (option) => {
    setForm((prev) => {
      const isSelected = prev.recognition.includes(option);
      const nextRecognition = isSelected ? prev.recognition.filter((r) => r !== option) : [...prev.recognition, option];
      return {
        ...prev,
        recognition: nextRecognition,
        naacGrade: nextRecognition.includes("NAAC") ? prev.naacGrade : "",
        otherRecognition: nextRecognition.includes("Other") ? prev.otherRecognition : [""],
      };
    });
  };

  const updateOtherRecognition = (idx, value) =>
    setForm((prev) => ({ ...prev, otherRecognition: prev.otherRecognition.map((v, i) => (i === idx ? value : v)) }));
  const addOtherRecognition = () => setForm((prev) => ({ ...prev, otherRecognition: [...prev.otherRecognition, ""] }));
  const removeOtherRecognition = (idx) => setForm((prev) => ({ ...prev, otherRecognition: prev.otherRecognition.filter((_, i) => i !== idx) }));

  const toggleCourse = (course) =>
    setForm((prev) => ({
      ...prev,
      courses: prev.courses.some((c) => c._id === course._id) ? prev.courses.filter((c) => c._id !== course._id) : [...prev.courses, course],
    }));

  const updateVideo = (idx, value) => setForm((prev) => ({ ...prev, videos: prev.videos.map((v, i) => (i === idx ? value : v)) }));
  const addVideo = () => setForm((prev) => (prev.videos.length >= MAX_VIDEOS ? prev : { ...prev, videos: [...prev.videos, ""] }));
  const removeVideo = (idx) => setForm((prev) => ({ ...prev, videos: prev.videos.length > 1 ? prev.videos.filter((_, i) => i !== idx) : [""] }));

  const toggleArrayField = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value],
    }));

  const updatePairField = (field, idx, key, value) =>
    setForm((prev) => ({ ...prev, [field]: prev[field].map((row, i) => (i === idx ? { ...row, [key]: value } : row)) }));
  const addPairRow = (field, blank) => setForm((prev) => ({ ...prev, [field]: [...prev[field], blank] }));
  const removePairRow = (field, idx, blank) =>
    setForm((prev) => ({ ...prev, [field]: prev[field].length > 1 ? prev[field].filter((_, i) => i !== idx) : [blank] }));

  const updateListField = (field, idx, value) => setForm((prev) => ({ ...prev, [field]: prev[field].map((v, i) => (i === idx ? value : v)) }));
  const addListItem = (field) => setForm((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  const removeListItem = (field, idx) => setForm((prev) => ({ ...prev, [field]: prev[field].length > 1 ? prev[field].filter((_, i) => i !== idx) : [""] }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.universityName.trim()) {
      setError("University name is required.");
      return;
    }
    if (form.recognition.includes("NAAC") && !form.naacGrade) {
      setError("Please select the NAAC grade.");
      return;
    }
    const cleanVideos = form.videos.map((v) => v.trim()).filter(Boolean);
    if (cleanVideos.length > MAX_VIDEOS) {
      setError(`A maximum of ${MAX_VIDEOS} videos is allowed.`);
      return;
    }
    if (cleanVideos.some((v) => !YOUTUBE_REGEX.test(v))) {
      setError("Only YouTube URLs are allowed for videos.");
      return;
    }
    if (form.campusTour360Url && !URL_REGEX.test(form.campusTour360Url)) {
      setError("Campus Tour 360 must be a valid URL.");
      return;
    }

    const data = new FormData();
    data.append("universityName", form.universityName.trim());
    data.append("recognition", JSON.stringify(form.recognition));
    data.append("naacGrade", form.recognition.includes("NAAC") ? form.naacGrade : "");
    data.append("otherRecognition", JSON.stringify(form.recognition.includes("Other") ? form.otherRecognition.map((v) => v.trim()).filter(Boolean) : []));
    data.append(
      "courses",
      JSON.stringify(form.courses.map((c) => ({ programId: c.isCustom ? null : c._id, name: c.programName })))
    );
    data.append("campusTour360Url", form.campusTour360Url.trim());
    data.append("videos", JSON.stringify(cleanVideos));
    data.append(
      "location",
      JSON.stringify({ address: form.locationAddress || "", latitude: form.locationLat, longitude: form.locationLng })
    );

    if (form.bannerImageFile) data.append("bannerImage", form.bannerImageFile);
    else if (initialPortfolio && !form.bannerImageExisting) data.append("bannerImageRemoved", "true");

    data.append("currentPhotosKept", JSON.stringify(form.currentPhotosExisting));
    form.currentPhotoFiles.forEach((file) => data.append("currentPhotos", file));

    if (form.programBrochureFile) data.append("programBrochure", form.programBrochureFile);
    else if (initialPortfolio && !form.programBrochureExisting) data.append("programBrochureRemoved", "true");

    data.append("leafletsKept", JSON.stringify(form.leafletsExisting));
    form.leafletFiles.forEach((file) => data.append("leaflets", file));

    if (form.universityHandbookFile) data.append("universityHandbook", form.universityHandbookFile);
    else if (initialPortfolio && !form.universityHandbookExisting) data.append("universityHandbookRemoved", "true");

    if (form.placementBrochureFile) data.append("placementBrochure", form.placementBrochureFile);
    else if (initialPortfolio && !form.placementBrochureExisting) data.append("placementBrochureRemoved", "true");

    if (form.applicationFormFile) data.append("applicationForm", form.applicationFormFile);
    else if (initialPortfolio && !form.applicationFormExisting) data.append("applicationFormRemoved", "true");

    if (form.logoFile) data.append("logo", form.logoFile);
    else if (initialPortfolio && !form.logoExisting) data.append("logoRemoved", "true");

    data.append("establishedYear", form.establishedYear ? String(Number(form.establishedYear)) : "");
    data.append("universityType", form.universityType);
    data.append("approvals", JSON.stringify(form.approvals));
    data.append("tags", JSON.stringify(form.tags));
    data.append("onlineEducationStatus", String(form.onlineEducationStatus));
    data.append("distanceEducationStatus", String(form.distanceEducationStatus));
    data.append("website", form.website.trim());
    data.append("studentSupport", form.studentSupport.trim());
    data.append("about", form.about.trim());
    // Half-filled rows are dropped rather than rejected — the backend requires both parts.
    data.append(
      "keyStats",
      JSON.stringify(
        form.keyStats
          .map((s) => ({ value: s.value.trim(), label: s.label.trim() }))
          .filter((s) => s.value && s.label)
      )
    );
    data.append(
      "highlights",
      JSON.stringify(
        form.highlights.map((h) => ({ title: h.title.trim(), text: h.text.trim() })).filter((h) => h.title)
      )
    );

    data.append("scholarshipsAbout", form.scholarshipsAbout.trim());
    data.append(
      "scholarships",
      JSON.stringify(form.scholarships.map((s) => ({ name: s.name.trim(), value: s.value.trim() })).filter((s) => s.name))
    );

    data.append("recruiterLogosKept", JSON.stringify(form.recruiterLogosExisting));
    form.recruiterLogoFiles.forEach((file) => data.append("recruiterLogos", file));

    data.append("facultyDetails", form.facultyDetails.trim());
    data.append("learningMethodology", form.learningMethodology.trim());

    data.append(
      "financial",
      JSON.stringify({
        totalFeeRange: form.totalFeeRange ? Number(form.totalFeeRange) : null,
        semesterFeeRange: form.semesterFeeRange ? Number(form.semesterFeeRange) : null,
        applicationFee: form.applicationFee ? Number(form.applicationFee) : null,
        emiAvailable: form.emiAvailable,
        scholarshipsAvailable: form.scholarshipsAvailable,
        educationLoanAvailable: form.educationLoanAvailable,
      })
    );

    data.append(
      "career",
      JSON.stringify({
        placementSupport: form.placementSupport,
        placementPartners: form.placementPartners,
        careerServices: form.careerServices.map((v) => v.trim()).filter(Boolean),
        internshipsAvailable: form.internshipsAvailable,
        industryInteraction: form.industryInteraction,
        alumniNetwork: form.alumniNetwork.trim(),
        careerOutcomes: form.careerOutcomes.trim(),
        highestPackage: form.highestPackage.trim(),
        averagePackage: form.averagePackage.trim(),
        placementPercentage: form.placementPercentage.trim(),
        companiesVisiting: form.companiesVisiting.trim(),
      })
    );

    data.append(
      "studentExperience",
      JSON.stringify({
        lmsAvailable: form.lmsAvailable,
        mobileApplication: form.mobileApplication,
        liveClasses: form.liveClasses,
        recordedClasses: form.recordedClasses,
        discussionForums: form.discussionForums,
        assessments: form.assessments.map((v) => v.trim()).filter(Boolean),
        examinationSystem: form.examinationSystem,
      })
    );

    try {
      setBusy(true);
      const result = initialPortfolio
        ? await updateUniversityPortfolio(initialPortfolio._id, data)
        : await createUniversityPortfolio(data);
      setSaved(true);
      onSaved?.(result);
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Failed to save university portfolio."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] flex flex-col xl:flex-row h-[90vh] overflow-hidden">
      {/* Left: section navigation */}
      <div className="w-full xl:w-[280px] bg-white border-r border-[#E2E8F0] p-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <h2 className="text-xl font-bold text-slate-800 mb-6">{initialPortfolio ? "Edit University Portfolio" : "Create University Portfolio"}</h2>

        <div className="space-y-1 relative">
          <div className="flex flex-col relative">
            <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-300 z-0"></div>
            {SECTIONS.map((section, i) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-start gap-4 relative z-10 w-full text-left group ${i !== SECTIONS.length - 1 ? "pb-5" : ""}`}
                >
                  <div
                    className={`relative z-20 w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isActive ? "bg-blue-700 text-white shadow-md" : "bg-white border-2 border-slate-300 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`font-bold text-[13px] leading-tight mt-1 transition-colors ${isActive ? "text-blue-700" : "text-slate-500 group-hover:text-slate-700"}`}>
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
            {saved ? "Close" : "Cancel"}
          </button>
        </div>
      </div>

      {/* Right: scrollable form */}
      <div id="university-portfolio-form-container" className="flex-1 p-8 pb-6 bg-[#EEF2FF]/50 overflow-y-auto h-full">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">{error}</div>}
        {saved && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 mb-6">
            University portfolio saved successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div id="section-portfolio-overview" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <SingleImageUpload
                label="University Logo"
                file={form.logoFile}
                existingUrl={form.logoExisting?.url}
                onFileChange={(file) => handleField("logoFile", file)}
                onRemove={() => {
                  handleField("logoFile", null);
                  handleField("logoExisting", null);
                }}
              />
              <Field label="Established Year">
                <input type="number" min="1000" max="9999" value={form.establishedYear} onChange={(e) => handleField("establishedYear", e.target.value)} placeholder="e.g. 1995" className={inputClass} />
              </Field>
              <Field label="University Type">
                <select value={form.universityType} onChange={(e) => handleField("universityType", e.target.value)} className={inputClass}>
                  <option value="">Select Type</option>
                  {UNIVERSITY_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Website">
                <input value={form.website} onChange={(e) => handleField("website", e.target.value)} placeholder="https://www.example.edu" className={inputClass} />
              </Field>
              <Field label="Approvals">
                <CheckboxMultiSelect options={APPROVAL_OPTIONS} selected={form.approvals} onToggle={(value) => toggleArrayField("approvals", value)} placeholder="Select approval(s)..." />
              </Field>
              <Field label="Tags">
                <CheckboxMultiSelect options={PORTFOLIO_TAG_OPTIONS} selected={form.tags} onToggle={(value) => toggleArrayField("tags", value)} placeholder="Select tag(s)..." />
              </Field>
              <Field label="Student Support">
                <textarea value={form.studentSupport} onChange={(e) => handleField("studentSupport", e.target.value)} placeholder="Describe student support services..." className={inputClass} rows={2} />
              </Field>
            </div>
            <div className="flex flex-col gap-6 mb-6">
              <Field label="About the University" hint="Shown under “About” on the public page; long text collapses behind Read More.">
                <textarea value={form.about} onChange={(e) => handleField("about", e.target.value)} placeholder="Founded in 2003, the university offers..." className={inputClass} rows={5} />
              </Field>
              <Field label="Key Stats" hint="Headline figures, e.g. “#1001-1200” — “QS World Ranking”, “95,000” — “Total Students”.">
                <PairListInput
                  rows={form.keyStats}
                  fields={[
                    { key: "value", placeholder: "Value (e.g. #801-1000)", className: "md:max-w-[220px]" },
                    { key: "label", placeholder: "Label (e.g. THE World Ranking)" },
                  ]}
                  onChange={(idx, key, value) => updatePairField("keyStats", idx, key, value)}
                  onAdd={() => addPairRow("keyStats", { value: "", label: "" })}
                  onRemove={(idx) => removePairRow("keyStats", idx, { value: "", label: "" })}
                  addLabel="Add Stat"
                />
              </Field>
              <Field label="Highlights" hint="The title is shown in bold, followed by the detail text.">
                <PairListInput
                  rows={form.highlights}
                  fields={[
                    { key: "title", placeholder: "Title (e.g. 29 campuses)", className: "md:max-w-[260px]" },
                    { key: "text", placeholder: "Detail (e.g. across India and abroad)" },
                  ]}
                  onChange={(idx, key, value) => updatePairField("highlights", idx, key, value)}
                  onAdd={() => addPairRow("highlights", { title: "", text: "" })}
                  onRemove={(idx) => removePairRow("highlights", idx, { title: "", text: "" })}
                  addLabel="Add Highlight"
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6">
              <BooleanField label="Online Education Available" checked={form.onlineEducationStatus} onChange={(v) => handleField("onlineEducationStatus", v)} />
              <BooleanField label="Distance Education Available" checked={form.distanceEducationStatus} onChange={(v) => handleField("distanceEducationStatus", v)} />
            </div>
          </div>

          <div id="section-portfolio-banner" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Banner</h4>
            <Field label="University Name" required>
              <input value={form.universityName} onChange={(e) => handleField("universityName", e.target.value)} placeholder="e.g. Chandigarh University" className={`${inputClass} mb-6`} required />
            </Field>
            <SingleImageUpload
              label="Banner Image"
              file={form.bannerImageFile}
              existingUrl={form.bannerImageExisting?.url}
              onFileChange={(file) => handleField("bannerImageFile", file)}
              onRemove={() => {
                handleField("bannerImageFile", null);
                handleField("bannerImageExisting", null);
              }}
            />
          </div>

          <div id="section-portfolio-recognition" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Recognition & Accreditation</h4>
            <div className="flex flex-col gap-6">
              <RecognitionMultiSelect selected={form.recognition} onToggle={toggleRecognition} />

              {form.recognition.includes("NAAC") && (
                <Field label="NAAC Grade" required>
                  <select value={form.naacGrade} onChange={(e) => handleField("naacGrade", e.target.value)} className={`${inputClass} max-w-xs`}>
                    <option value="">Select Grade</option>
                    {NAAC_GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </Field>
              )}

              {form.recognition.includes("Other") && (
                <Field label="Other Recognition">
                  <RepeatableTextInput
                    values={form.otherRecognition}
                    onChange={updateOtherRecognition}
                    onAdd={addOtherRecognition}
                    onRemove={removeOtherRecognition}
                    placeholder="Enter recognition name..."
                  />
                </Field>
              )}
            </div>
          </div>

          <div id="section-portfolio-academic" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Academic</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Faculty Details" hint="e.g. student-faculty ratio, faculty profile.">
                <textarea value={form.facultyDetails} onChange={(e) => handleField("facultyDetails", e.target.value)} placeholder="e.g. 1:15 student-faculty ratio, PhD faculty..." className={inputClass} rows={3} />
              </Field>
              <Field label="Learning Methodology">
                <textarea value={form.learningMethodology} onChange={(e) => handleField("learningMethodology", e.target.value)} placeholder="Describe the teaching/learning approach..." className={inputClass} rows={3} />
              </Field>
            </div>
          </div>

          <div id="section-portfolio-courses" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Courses by University</h4>
            <CourseSearchMultiSelect selected={form.courses} onToggle={toggleCourse} />
          </div>

          <div id="section-portfolio-campus" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Campus Experience</h4>
            <div className="flex flex-col gap-6">
              <Field label="Campus Tour 360" hint="Enter a valid 360° campus tour URL.">
                <div className="flex gap-2">
                  <input value={form.campusTour360Url} onChange={(e) => handleField("campusTour360Url", e.target.value)} placeholder="Enter 360° Campus Tour URL..." className={inputClass} />
                  {form.campusTour360Url && (
                    <a href={form.campusTour360Url} target="_blank" rel="noreferrer" className="shrink-0 flex items-center gap-1.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                      <FiExternalLink size={14} /> Preview
                    </a>
                  )}
                </div>
              </Field>

              <Field label="University Videos" hint="YouTube links only, maximum 10.">
                <RepeatableUrlInput values={form.videos} onChange={updateVideo} onAdd={addVideo} onRemove={removeVideo} placeholder="YouTube URL..." max={MAX_VIDEOS} />
              </Field>

              <MultiImageUpload
                label="Current Photos"
                newFiles={form.currentPhotoFiles}
                existingPhotos={form.currentPhotosExisting}
                onAddFiles={(files) => handleField("currentPhotoFiles", [...form.currentPhotoFiles, ...files])}
                onRemoveNew={(idx) => handleField("currentPhotoFiles", form.currentPhotoFiles.filter((_, i) => i !== idx))}
                onRemoveExisting={(idx) => handleField("currentPhotosExisting", form.currentPhotosExisting.filter((_, i) => i !== idx))}
              />
            </div>
          </div>

          <div id="section-portfolio-location" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Location</h4>
            <LocationAutocomplete
              address={form.locationAddress}
              latitude={form.locationLat}
              longitude={form.locationLng}
              onSelect={({ address, latitude, longitude }) => {
                setForm((prev) => ({ ...prev, locationAddress: address, locationLat: latitude, locationLng: longitude }));
              }}
            />
          </div>

          <div id="section-portfolio-financial" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Financial</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Total Fee Range">
                <input type="number" min="0" value={form.totalFeeRange} onChange={(e) => handleField("totalFeeRange", e.target.value)} placeholder="e.g. 480000" className={inputClass} />
              </Field>
              <Field label="Semester Fee Range">
                <input type="number" min="0" value={form.semesterFeeRange} onChange={(e) => handleField("semesterFeeRange", e.target.value)} placeholder="e.g. 60000" className={inputClass} />
              </Field>
              <Field label="Application Fee">
                <input type="number" min="0" value={form.applicationFee} onChange={(e) => handleField("applicationFee", e.target.value)} placeholder="e.g. 1000" className={inputClass} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6 mt-2">
              <BooleanField label="EMI Available" checked={form.emiAvailable} onChange={(v) => handleField("emiAvailable", v)} />
              <BooleanField label="Scholarships Available" checked={form.scholarshipsAvailable} onChange={(v) => handleField("scholarshipsAvailable", v)} />
              <BooleanField label="Education Loan Available" checked={form.educationLoanAvailable} onChange={(v) => handleField("educationLoanAvailable", v)} />
            </div>
            <div className="flex flex-col gap-6 mt-4">
              <Field label="Scholarships Overview" hint="Intro paragraph shown above the scholarship list.">
                <textarea value={form.scholarshipsAbout} onChange={(e) => handleField("scholarshipsAbout", e.target.value)} placeholder="The university supports deserving students through..." className={inputClass} rows={3} />
              </Field>
              <Field label="Scholarships" hint="Name in bold, followed by the benefit, e.g. “Merit-Based” — “20% of Fees”.">
                <PairListInput
                  rows={form.scholarships}
                  fields={[
                    { key: "name", placeholder: "Scholarship (e.g. Defence Personnel)", className: "md:max-w-[320px]" },
                    { key: "value", placeholder: "Benefit (e.g. 20% of Fees)" },
                  ]}
                  onChange={(idx, key, value) => updatePairField("scholarships", idx, key, value)}
                  onAdd={() => addPairRow("scholarships", { name: "", value: "" })}
                  onRemove={(idx) => removePairRow("scholarships", idx, { name: "", value: "" })}
                  addLabel="Add Scholarship"
                />
              </Field>
            </div>
          </div>

          <div id="section-portfolio-career" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Career</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <Field label="Placement Partners">
                <CheckboxMultiSelect options={PLACEMENT_PARTNERS_OPTIONS} selected={form.placementPartners} onToggle={(value) => toggleArrayField("placementPartners", value)} placeholder="Select placement partner(s)..." />
              </Field>
              <Field label="Alumni Network">
                <input value={form.alumniNetwork} onChange={(e) => handleField("alumniNetwork", e.target.value)} placeholder="e.g. 25,000+ alumni" className={inputClass} />
              </Field>
              <Field label="Career Services">
                <RepeatableTextInput
                  values={form.careerServices}
                  onChange={(idx, value) => updateListField("careerServices", idx, value)}
                  onAdd={() => addListItem("careerServices")}
                  onRemove={(idx) => removeListItem("careerServices", idx)}
                  placeholder="e.g. Resume Building"
                />
              </Field>
              <Field label="Career Outcomes" hint="e.g. highest package, average package stats.">
                <textarea value={form.careerOutcomes} onChange={(e) => handleField("careerOutcomes", e.target.value)} placeholder="e.g. Highest package: 24 LPA" className={inputClass} rows={2} />
              </Field>
              <Field label="Highest Package">
                <input value={form.highestPackage} onChange={(e) => handleField("highestPackage", e.target.value)} placeholder="e.g. 61.75 LPA" className={inputClass} />
              </Field>
              <Field label="Average Package">
                <input value={form.averagePackage} onChange={(e) => handleField("averagePackage", e.target.value)} placeholder="e.g. 9.60 LPA" className={inputClass} />
              </Field>
              <Field label="Placement Percentage">
                <input value={form.placementPercentage} onChange={(e) => handleField("placementPercentage", e.target.value)} placeholder="e.g. 92.70%" className={inputClass} />
              </Field>
              <Field label="Total Companies Visiting">
                <input value={form.companiesVisiting} onChange={(e) => handleField("companiesVisiting", e.target.value)} placeholder="e.g. 1,100+" className={inputClass} />
              </Field>
            </div>
            <div className="mb-4">
              <MultiImageUpload
                label="Top Recruiter Logos"
                newFiles={form.recruiterLogoFiles}
                existingPhotos={form.recruiterLogosExisting}
                onAddFiles={(files) => handleField("recruiterLogoFiles", [...form.recruiterLogoFiles, ...files])}
                onRemoveNew={(idx) => handleField("recruiterLogoFiles", form.recruiterLogoFiles.filter((_, i) => i !== idx))}
                onRemoveExisting={(idx) => handleField("recruiterLogosExisting", form.recruiterLogosExisting.filter((_, i) => i !== idx))}
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <BooleanField label="Placement Support" checked={form.placementSupport} onChange={(v) => handleField("placementSupport", v)} />
              <BooleanField label="Internships Available" checked={form.internshipsAvailable} onChange={(v) => handleField("internshipsAvailable", v)} />
              <BooleanField label="Industry Interaction" checked={form.industryInteraction} onChange={(v) => handleField("industryInteraction", v)} />
            </div>
          </div>

          <div id="section-portfolio-student-experience" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Student Experience</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <Field label="Examination System">
                <select value={form.examinationSystem} onChange={(e) => handleField("examinationSystem", e.target.value)} className={inputClass}>
                  <option value="">Select Examination System</option>
                  {EXAMINATION_SYSTEM_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Assessments">
                <RepeatableTextInput
                  values={form.assessments}
                  onChange={(idx, value) => updateListField("assessments", idx, value)}
                  onAdd={() => addListItem("assessments")}
                  onRemove={(idx) => removeListItem("assessments", idx)}
                  placeholder="e.g. Quizzes, Assignments"
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6">
              <BooleanField label="LMS Available" checked={form.lmsAvailable} onChange={(v) => handleField("lmsAvailable", v)} />
              <BooleanField label="Mobile Application" checked={form.mobileApplication} onChange={(v) => handleField("mobileApplication", v)} />
              <BooleanField label="Live Classes" checked={form.liveClasses} onChange={(v) => handleField("liveClasses", v)} />
              <BooleanField label="Recorded Classes" checked={form.recordedClasses} onChange={(v) => handleField("recordedClasses", v)} />
              <BooleanField label="Discussion Forums" checked={form.discussionForums} onChange={(v) => handleField("discussionForums", v)} />
            </div>
          </div>

          <div id="section-portfolio-promotions" className={sectionCardClass}>
            <h4 className={sectionHeadingClass}>Promotions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SinglePdfUpload
                label="Program Brochure"
                file={form.programBrochureFile}
                existingFile={form.programBrochureExisting}
                onFileChange={(file) => handleField("programBrochureFile", file)}
                onRemove={() => {
                  handleField("programBrochureFile", null);
                  handleField("programBrochureExisting", null);
                }}
              />
              {/* <MultiPdfUpload
                label="Leaflets"
                newFiles={form.leafletFiles}
                existingFiles={form.leafletsExisting}
                onAddFiles={(files) => handleField("leafletFiles", [...form.leafletFiles, ...files])}
                onRemoveNew={(idx) => handleField("leafletFiles", form.leafletFiles.filter((_, i) => i !== idx))}
                onRemoveExisting={(idx) => handleField("leafletsExisting", form.leafletsExisting.filter((_, i) => i !== idx))}
              /> */}
              <SinglePdfUpload
                label="University Handbook"
                file={form.universityHandbookFile}
                existingFile={form.universityHandbookExisting}
                onFileChange={(file) => handleField("universityHandbookFile", file)}
                onRemove={() => {
                  handleField("universityHandbookFile", null);
                  handleField("universityHandbookExisting", null);
                }}
              />
              <SinglePdfUpload
                label="Placement Brochure"
                file={form.placementBrochureFile}
                existingFile={form.placementBrochureExisting}
                onFileChange={(file) => handleField("placementBrochureFile", file)}
                onRemove={() => {
                  handleField("placementBrochureFile", null);
                  handleField("placementBrochureExisting", null);
                }}
              />
              <SinglePdfUpload
                label="Application Form"
                file={form.applicationFormFile}
                existingFile={form.applicationFormExisting}
                onFileChange={(file) => handleField("applicationFormFile", file)}
                onRemove={() => {
                  handleField("applicationFormFile", null);
                  handleField("applicationFormExisting", null);
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
              {saved ? "Close" : "Cancel"}
            </button>
            <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-all disabled:opacity-60">
              {busy ? "Saving..." : saved ? "Save Changes" : "Save Portfolio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniversityPortfolioForm;
