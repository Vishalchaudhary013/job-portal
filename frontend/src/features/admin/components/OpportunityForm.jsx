import React from "react";
import { FiFileText, FiTrash2, FiEdit2, FiCheck, FiX, FiCheckCircle, FiEye, FiEyeOff, FiExternalLink, FiKey, FiGlobe } from "react-icons/fi";
import { useAdminContext } from "../context/AdminContext";
import { API_BASE_URL } from "../../../services/apiClient";
import { createCustomCategory, getCustomCategories } from "../../../services/customCategoryAPI";
import { useNavigate } from "react-router-dom";
import TextEditor from "./TextEditor";
import MediaUrlListField from "./MediaUrlListField";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";

const CheckboxDropdown = ({ label, options, selected, onChange, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <span>{label} {required && <span className="text-rose-600">*</span>}</span>
      <div 
        className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex justify-between items-center transition-all hover:bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-normal text-slate-600 truncate">
          {selected?.length > 0 ? selected.join(', ') : "Select options..."}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      
      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto p-2">
          {options.map(option => (
            <label key={option} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                className="accent-red-600 w-4 h-4 rounded"
                checked={selected?.includes(option)} 
                onChange={(e) => onChange(e, option)}
              />
              <span className="font-normal text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const CreatableCheckboxDropdown = ({ label, defaultOptions, selected, onChange, required, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(defaultOptions);
  const [inputValue, setInputValue] = useState("");
  const dropdownRef = useRef(null);

useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selected && selected.length > 0) {
      const newOptions = selected.filter(s => !options.includes(s));
      if (newOptions.length > 0) {
        setOptions(prev => [...prev, ...newOptions]);
      }
    }
  }, [selected, options]);

  const handleAddOption = (e) => {
    e.preventDefault();
    const newOption = inputValue.trim();
    if (newOption && !options.includes(newOption)) {
      setOptions([...options, newOption]);
      onChange({ target: { checked: true } }, newOption);
    }
    setInputValue("");
  };

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <span>{label} {required && <span className="text-rose-600">*</span>}</span>
      <div 
        className={`border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex justify-between transition-all hover:bg-white flex-1 ${className || 'items-center'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-normal text-slate-600 truncate">
          {selected?.length > 0 ? selected.join(', ') : "Select options..."}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      
      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-10 max-h-72 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(e); } }}
              placeholder="Create new perk..." 
              className="flex-1 border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm font-normal outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button 
              type="button" 
              onClick={handleAddOption}
              className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-700"
            >
              Add
            </button>
          </div>
          <div className="overflow-y-auto p-2 max-h-48">
            {options.map(option => (
              <label key={option} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  className="accent-red-600 w-4 h-4 rounded"
                  checked={selected?.includes(option)} 
                  onChange={(e) => onChange(e, option)}
                />
                <span className="font-normal text-slate-700">{option}</span>
              </label>
            ))}
            {options.length === 0 && <div className="p-3 text-slate-500 text-sm text-center">No options available</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const CreatableSingleDropdown = ({ label, defaultOptions, selected, onChange, required, className = "", name = "category", placeholder = "Select or create category...", addPlaceholder = "Create new category..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(defaultOptions);
  const [inputValue, setInputValue] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selected && !options.includes(selected)) {
      setOptions(prev => [...prev, selected]);
    }
  }, [selected, options]);

  const handleAddOption = (e) => {
    e.preventDefault();
    const newOption = inputValue.trim();
    if (newOption && !options.includes(newOption)) {
      setOptions([...options, newOption]);
      onChange({ target: { name, value: newOption } });
      setIsOpen(false);
    }
    setInputValue("");
  };

  const handleSelectOption = (option) => {
    onChange({ target: { name, value: option } });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 relative" ref={dropdownRef}>
      <span>{label} {required && <span className="text-rose-600">*</span>}</span>
      <div
        className={`border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 cursor-pointer flex justify-between transition-all hover:bg-white flex-1 ${className || 'items-center'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-normal text-slate-600 truncate">
          {selected || placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-[#EEF2FF] rounded-xl shadow-lg z-10 max-h-72 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(e); } }}
              placeholder={addPlaceholder}
              className="flex-1 border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm font-normal outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button 
              type="button" 
              onClick={handleAddOption}
              className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-700"
            >
              Add
            </button>
          </div>
          <div className="overflow-y-auto p-2 max-h-48">
            {options.map(option => (
              <div 
                key={option} 
                onClick={() => handleSelectOption(option)}
                className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors font-normal text-slate-700 ${selected === option ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
              >
                {option}
              </div>
            ))}
            {options.length === 0 && <div className="p-3 text-slate-500 text-sm text-center">No options available</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const OpportunityForm = () => {
  const {
    isSuperDashboard,
    dashboardType,
    user, isAdmin, isSuperAdmin, isBootstrapping, isImpersonating,
    form, editingId, showOpportunityForm, requiredSkillInputs, benefitInputs,
    currentStep, setCurrentStep, showPreviewModal, showSuccessMessage,
    activeSection,
    busy,
    handleChange, handleLogoChange, handleRequiredSkillChange, addRequiredSkillInput, removeRequiredSkillInput,
    handleBenefitChange, addBenefitInput, resetForm,
    handleSubmit, handleConfirmSubmit, setForm,
  } = useAdminContext();
  const navigate = useNavigate();

  const PREDEFINED_CATEGORIES = [
    "Sarkari Kaam", "Instagram", "Business", "English Speaking", "Youtube", 
    "Part Time Income", "Astrology", "Career & Jobs", "Share Market", 
    "Finance", "Facebook", "Life Hacks", "Wellness"
  ];
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  useEffect(() => {
    if (form.category && !PREDEFINED_CATEGORIES.includes(form.category)) {
      setIsCustomCategory(true);
    }
  }, []);

  const isDegreeType = ["Degree Programs", "Global Program"].includes(form.type);
  const isDegreeProgramsType = form.type === "Degree Programs";

  const DEFAULT_DEGREE_CATEGORIES = ["Bachelors", "Masters", "Doctorate & PhD", "Integrated Degree"];
  const [degreeCategories, setDegreeCategories] = useState(DEFAULT_DEGREE_CATEGORIES);

  useEffect(() => {
    if (!isDegreeProgramsType) return;
    let cancelled = false;
    getCustomCategories("Degree Programs")
      .then((res) => {
        if (cancelled) return;
        const fetched = (res.data?.categories || []).map((c) => c.title).filter(Boolean);
        const merged = [...new Set([...DEFAULT_DEGREE_CATEGORIES, ...fetched])];
        setDegreeCategories(merged);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isDegreeProgramsType]);

  const handleDegreeCategoryChange = (event) => {
    handleChange(event);
    const newCategory = event.target.value;
    if (newCategory && !degreeCategories.includes(newCategory)) {
      setDegreeCategories((prev) => [...prev, newCategory]);
      createCustomCategory({ title: newCategory, opportunityType: "Degree Programs" }).catch(() => {});
    }
  };

  const isBootcampsType = form.type === "Bootcamps";

  const DEFAULT_BOOTCAMP_CATEGORIES = ["Web Development", "Data Science", "Design", "Digital Marketing", "Cloud & DevOps", "Cybersecurity"];
  const [bootcampCategories, setBootcampCategories] = useState(DEFAULT_BOOTCAMP_CATEGORIES);
  const DEFAULT_BOOTCAMP_PROVIDERS = ["Coursera", "Udemy", "Simplilearn", "upGrad", "Great Learning", "Scaler", "Internshala"];
  const [bootcampProviders, setBootcampProviders] = useState(DEFAULT_BOOTCAMP_PROVIDERS);

  useEffect(() => {
    if (!isBootcampsType) return;
    let cancelled = false;
    getCustomCategories("Bootcamps")
      .then((res) => {
        if (cancelled) return;
        const fetched = (res.data?.categories || []).map((c) => c.title).filter(Boolean);
        const merged = [...new Set([...DEFAULT_BOOTCAMP_CATEGORIES, ...fetched])];
        setBootcampCategories(merged);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isBootcampsType]);

  const handleBootcampCategoryChange = (event) => {
    handleChange(event);
    const newCategory = event.target.value;
    if (newCategory && !bootcampCategories.includes(newCategory)) {
      setBootcampCategories((prev) => [...prev, newCategory]);
      createCustomCategory({ title: newCategory, opportunityType: "Bootcamps" }).catch(() => {});
    }
  };

  const handleBootcampProviderChange = (event) => {
    handleChange(event);
    const newProvider = event.target.value;
    if (newProvider && !bootcampProviders.includes(newProvider)) {
      setBootcampProviders((prev) => [...prev, newProvider]);
    }
  };

  const handleArrayChange = (e, field) => {
    const value = e.target.value;
    const array = value.split(',').map(item => item.trim());
    setForm(prev => ({ ...prev, [field]: array }));
  };

  const handleMultiSelectChange = (e, field) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setForm(prev => ({ ...prev, [field]: options }));
  };

  const handleCheckboxChange = (e, field, value) => {
    const isChecked = e.target.checked;
    setForm(prev => {
      const array = prev[field] || [];
      if (isChecked) {
        return { ...prev, [field]: [...array, value] };
      } else {
        return { ...prev, [field]: array.filter(item => item !== value) };
      }
    });
  };

  const handleSocialProofChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, socialProofLinks: { ...prev.socialProofLinks, [name]: value } }));
  };

  const isSectionFilled = (sectionId) => {
    switch (sectionId) {
      case "section-program-specifics":
        return !!form.title && !!form.departmentCategory && (form.workMode === 'Remote' || !!form.cityState) && !!form.duration && !!form.workMode && !!form.workingHours && !!form.experienceLevel && (form.hasOpenings === false || !!form.openings);
      case "section-program-timeline":
        return !!form.deadline && !!form.startDate;
      case "section-financials":
        return !!form.stipendType && (form.stipendType === "Unpaid" || !!form.stipend);
      case "section-requirements":
        return form.targetEducation?.length > 0 && form.batchEligibility?.length > 0 && !!form.requiredSkills;
      case "section-qualifications":
        return !!form.minimumRequirements || !!form.preferredQualifications;
      case "section-job-description":
        return !!form.description;
      case "section-selection-process":
        return (form.selectionRounds && form.selectionRounds.length > 0) || !!form.assignmentLink || !!form.customScreeningQuestion;
      case "section-about-company":
        return !!form.company;
      case "section-masterclass-specifics":
        return !!form.title && !!form.category && !!form.description;
      case "section-mentor-details":
        return !!form.mentorName && !!form.mentorDesignation;
      case "section-degree-program-details":
        return !!form.title && !!form.category && !!form.mode && !!form.duration && !!form.university;
      case "section-bootcamp-details":
        return !!form.title && !!form.category && !!form.provider && !!form.level && !!form.duration && !!form.studyMode && !!form.price;
      default:
        return false;
    }
  };

  const [activeSubStep, setActiveSubStep] = useState("section-program-specifics");

  useEffect(() => {
    if (!showOpportunityForm || currentStep !== 1) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisible = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!mostVisible || entry.intersectionRatio > mostVisible.intersectionRatio) {
              mostVisible = entry;
            }
          }
        });
        if (mostVisible) {
          setActiveSubStep(mostVisible.target.id);
        }
      },
      { root: document.getElementById('opportunity-form-container'), rootMargin: "-10% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    const ids = [
      "section-program-specifics", "section-program-timeline", "section-financials",
      "section-requirements", "section-qualifications", "section-job-description",
      "section-selection-process", "section-about-company",
      "section-masterclass-specifics", "section-mentor-details",
      "section-degree-program-details", "section-bootcamp-details"
    ];
    setTimeout(() => {
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 100);
    return () => observer.disconnect();
  }, [showOpportunityForm, currentStep]);

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

  const minDate = today.toISOString().split("T")[0];

  return (
    <>
      {showOpportunityForm && (
        <div className="bg-white border border-[#E2E8F0] flex flex-col xl:flex-row h-[90vh] overflow-hidden">
          
          <div className="w-full xl:w-[300px] bg-white border-r border-[#E2E8F0] p-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editingId ? "Edit" : "Create"} {form.type}
            </h2>

            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mb-5 overflow-hidden">
              <div
                className="bg-blue-700 h-full transition-all duration-300"
                style={{ width: currentStep === 1 ? "40%" : "100%" }}
              ></div>
            </div>

            <div className="space-y-4 relative">
              {/* Main rail: runs from the centre of the step 1 marker to the centre of the step 2 marker. */}
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-[#E2E8F0] z-0"></div>
              <div className="flex flex-col gap-4 w-full">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`flex items-center gap-4 relative z-10 w-full text-left group ${editingId ? "cursor-pointer" : "cursor-default"}`}
                  disabled={!editingId && currentStep !== 1}
                >
                  <div className={`relative z-20 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep === 1 ? "bg-blue-700 text-white" : "bg-blue-100 text-[#1F2853] group-hover:bg-blue-200"}`}>1</div>
                  <span className={`font-semibold text-sm transition-colors ${currentStep === 1 ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"}`}>Program Details</span>
                </button>
                {currentStep === 1 && (
                  <div className="flex flex-col gap-5 pl-8 relative z-10 mt-3 mb-2">
                    {(() => {
                      const substeps = (form.type === "Masterclasses")
                        ? [
                            { id: "section-masterclass-specifics", label: "Masterclass Specifics" },
                            { id: "section-mentor-details", label: "Mentor Details" }
                          ]
                        : isDegreeProgramsType
                        ? [
                            { id: "section-degree-program-details", label: "Degree Program Details" },
                          ]
                        : isBootcampsType
                        ? [
                            { id: "section-bootcamp-details", label: "Bootcamp Details" },
                          ]
                        : [
                            { id: "section-program-specifics", label: "Program Specifics" },
                            { id: "section-program-timeline", label: "Program Timeline" },
                            { id: "section-financials", label: "Financials & Incentives" },
                            { id: "section-requirements", label: "Requirements" },
                            { id: "section-qualifications", label: "Qualifications" },
                            { id: "section-job-description", label: form.type === "Jobs" ? "Job Description" : form.type === "Apprenticeships" ? "Apprenticeship Description" : "Description" },
                            { id: "section-selection-process", label: "Selection Process" },
                            { id: "section-about-company", label: "About the Company" },
                          ];
                      return substeps.map((subStep, i) => {
                      const isFilled = isSectionFilled(subStep.id);
                      const isActive = activeSubStep === subStep.id;
                      
                      return (
                        <button 
                          key={subStep.id}
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(subStep.id);
                            const container = document.getElementById('opportunity-form-container');
                            if (el && container) {
                              const top = el.offsetTop - 24; 
                              container.scrollTo({ top, behavior: 'smooth' });
                            }
                          }}
                          className="flex items-start gap-4 relative z-10 w-full text-left group"
                        >
                          {/* Branch rail segment: circle bottom to the next circle, so it never dangles when a label wraps. */}
                          {i < substeps.length - 1 && (
                            <span aria-hidden="true" className="absolute left-[15px] top-8 -bottom-5 w-0.5 bg-[#E2E8F0] z-0" />
                          )}
                          <div className={`relative z-20 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            isFilled && !isActive ? 'bg-[#EEF2FF] text-[#21B573]' : 
                            isActive ? 'bg-blue-700 text-white shadow-md' : 
                            'bg-white border-2 border-slate-300 text-slate-500'
                          }`}>
                            {isFilled && !isActive ? <FiCheck className="w-5 h-5" /> : (i + 1)}
                          </div>
                          <div className="flex flex-col mt-[5px]">
                            <span className={`font-bold text-[13px] leading-tight transition-colors ${
                              isActive ? 'text-blue-700' : 
                              isFilled ? 'text-slate-700' : 
                              'text-slate-500 group-hover:text-slate-700'
                            }`}>
                              {subStep.label}
                            </span>
                            {isFilled && !isActive && (
                              <span className="text-[11px] font-bold text-red-600/80 mt-0.5">Complete</span>
                            )}
                          </div>
                        </button>
                      );
                    });
                  })()}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4 w-full mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingId) {
                        const path = isSuperDashboard 
                          ? `/super-admin-dashboard/build-form/${editingId}` 
                          : dashboardType === "mentor" 
                            ? `/mentor-dashboard/build-form/${editingId}` 
                            : `/admin-dashboard/build-form/${editingId}`;
                        navigate(path);
                      } else {
                        alert("Please save the opportunity details first before building the form.");
                      }
                    }}
                    className={`flex items-center gap-4 relative z-10 w-full text-left group ${editingId ? "cursor-pointer" : "cursor-default"}`}
                    disabled={!editingId}
                  >
                    <div className={`relative z-20 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep === 2 ? "bg-[#1F2853] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}>2</div>
                    <span className={`font-semibold text-sm transition-colors ${currentStep === 2 ? "text-[#1F2853]" : "text-slate-400 group-hover:text-slate-600"}`}>{isDegreeProgramsType ? "Enquiry Form" : "Application Form"}</span>
                  </button>
                </div>
            </div>

            <div className="mt-auto">
              <button onClick={resetForm} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
                Discard
              </button>
            </div>
          </div>

          <div id="opportunity-form-container" className="flex-1 p-8 pb-6 bg-[#EEF2FF]/50 overflow-y-auto h-full">
            <form id="opportunity-form" onSubmit={handleSubmit} className="space-y-8">
              
              {form.type === "Masterclasses" ? (
                <div className="flex flex-col gap-6">

                  {/* ── Section 1: Masterclass Specifics ── */}
                  <div id="section-masterclass-specifics" className="bg-white p-5 rounded-xl border border-[#E2E8F0] scroll-mt-24">
                    <h4 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Masterclass Specifics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Title <span className="text-rose-600">*</span></span>
                        <input name="title" value={form.title} onChange={handleChange} placeholder="Masterclass Title" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                      </label>
                    
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <CreatableSingleDropdown
                          label="Category"
                          defaultOptions={PREDEFINED_CATEGORIES}
                          selected={form.category}
                          onChange={handleChange}
                          required
                        />
                      </label>
                        {!form.isShortVideo && (
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          <span>Go Live Date <span className="text-rose-600">*</span></span>
                          <input type="datetime-local" name="goLiveDate" value={form.goLiveDate} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                        </label>
                      )}
                      {!form.isShortVideo && (
                        <>
                          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                            <span>Duration</span>
                            <input name="duration" value={form.duration || ''} onChange={handleChange} placeholder="e.g. 1 h 10 min 10 sec" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                          </label>
                          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                            <span>Level</span>
                            <input name="level" value={form.level || ''} onChange={handleChange} placeholder="e.g. Beginner" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                          </label>
                        </>
                      )}
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        <span>Description <span className="text-rose-600">*</span></span>
                        <textarea name="description" value={form.description} onChange={handleChange} placeholder="About this masterclass..." className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[100px]" required />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Video Banner Image <span className="text-rose-600">*</span></span>
                        <input type="file" name="bannerImage" accept="image/*" onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required={!editingId} />
                      </label>
                      
                       <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 ">
                        <span>Upload Video <span className="text-rose-600">*</span></span>
                        <input type="file" name="videoFile" accept="video/*" onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required={!editingId} />
                      </label>
                      

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        <span>YouTube Link</span>
                        <input type="url" name="youtubeLink" value={form.youtubeLink || ''} onChange={handleChange} placeholder="https://youtube.com/..." className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>
                     
                    </div>
                  </div>

                  {/* ── Section: Highlights & FAQs ── */}
                  {!form.isShortVideo && (
                    <div id="section-highlights-faqs" className="bg-white p-5 rounded-xl border border-[#E2E8F0] scroll-mt-24">
                      <h4 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Highlights & FAQs</h4>
                      
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-semibold text-slate-700">Highlights</span>
                          <button type="button" onClick={() => setForm(prev => ({ ...prev, highlights: [...(prev.highlights || []), { title: '', description: '' }] }))} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors">+ Add Highlight</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(form.highlights || []).map((highlight, index) => (
                            <div key={index} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-[#EEF2FF] relative group transition-all">
                              <button type="button" onClick={() => setForm(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }))} className="absolute top-3 right-3 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><FiTrash2 size={16}/></button>
                              <input placeholder="Highlight Title" value={highlight.title} onChange={(e) => setForm(prev => ({ ...prev, highlights: prev.highlights.map((h, i) => i === index ? { ...h, title: e.target.value } : h) }))} className="border border-[#EEF2FF] rounded-lg px-3 py-2 bg-white outline-none w-full text-sm" />
                              <textarea placeholder="Highlight Description" value={highlight.description} onChange={(e) => setForm(prev => ({ ...prev, highlights: prev.highlights.map((h, i) => i === index ? { ...h, description: e.target.value } : h) }))} className="border border-[#EEF2FF] rounded-lg px-3 py-2 bg-white outline-none w-full text-sm min-h-[60px]" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-semibold text-slate-700">FAQs</span>
                          <button type="button" onClick={() => setForm(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }))} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors">+ Add FAQ</button>
                        </div>
                        <div className="flex flex-col gap-4">
                          {(form.faqs || []).map((faq, index) => (
                            <div key={index} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-[#EEF2FF] relative group transition-all">
                              <button type="button" onClick={() => setForm(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }))} className="absolute top-3 right-3 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><FiTrash2 size={16}/></button>
                              <input placeholder="Question" value={faq.question} onChange={(e) => setForm(prev => ({ ...prev, faqs: prev.faqs.map((f, i) => i === index ? { ...f, question: e.target.value } : f) }))} className="border border-[#EEF2FF] rounded-lg px-3 py-2 bg-white outline-none w-full text-sm font-medium" />
                              <textarea placeholder="Answer" value={faq.answer} onChange={(e) => setForm(prev => ({ ...prev, faqs: prev.faqs.map((f, i) => i === index ? { ...f, answer: e.target.value } : f) }))} className="border border-[#EEF2FF] rounded-lg px-3 py-2 bg-white outline-none w-full text-sm min-h-[60px]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Section 2: Mentor Details ── */}
                  <div id="section-mentor-details" className="bg-white p-6 rounded-xl border border-[#E2E8F0]  scroll-mt-24">
                    {/* Header row with title + toggle */}
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mentor Details</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500">Show</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={form.showInFrontend !== false}
                            onChange={(e) => setForm(prev => ({ ...prev, showInFrontend: e.target.checked }))}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Mentor Name <span className="text-rose-600">*</span></span>
                        <input name="mentorName" value={form.mentorName || ''} onChange={handleChange} placeholder="John Doe" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Mentor Designation <span className="text-rose-600">*</span></span>
                        <input name="mentorDesignation" value={form.mentorDesignation || ''} onChange={handleChange} placeholder="e.g. Senior Designer" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        <span>Mentor Image <span className="text-rose-600">*</span></span>
                        <input type="file" name="mentorImage" accept="image/*" onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required={!editingId} />
                      </label>

                      {/* Social Links sub-section */}
                      <div className="md:col-span-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Social Links</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                            <span className="flex items-center gap-2">
                              
                              LinkedIn
                            </span>
                            <input type="url" placeholder="https://linkedin.com/in/..." value={(form.mentorSocialLinks?.linkedin) || ''} onChange={(e) => setForm(prev => ({ ...prev, mentorSocialLinks: { ...(prev.mentorSocialLinks || {}), linkedin: e.target.value }}))} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-normal" />
                          </label>
                          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                            <span className="flex items-center gap-2">
                              
                              Twitter / X
                            </span>
                            <input type="url" placeholder="https://x.com/..." value={(form.mentorSocialLinks?.twitter) || ''} onChange={(e) => setForm(prev => ({ ...prev, mentorSocialLinks: { ...(prev.mentorSocialLinks || {}), twitter: e.target.value }}))} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-normal" />
                          </label>
                          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                            <span className="flex items-center gap-2">
                              
                              Instagram
                            </span>
                            <input type="url" placeholder="https://instagram.com/..." value={(form.mentorSocialLinks?.instagram) || ''} onChange={(e) => setForm(prev => ({ ...prev, mentorSocialLinks: { ...(prev.mentorSocialLinks || {}), instagram: e.target.value }}))} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-normal" />
                          </label>
                          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                            <span className="flex items-center gap-2">
                              
                              WhatsApp
                            </span>
                            <input type="url" placeholder="https://wa.me/..." value={(form.mentorSocialLinks?.whatsapp) || ''} onChange={(e) => setForm(prev => ({ ...prev, mentorSocialLinks: { ...(prev.mentorSocialLinks || {}), whatsapp: e.target.value }}))} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-normal" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : isDegreeProgramsType ? (
                <div className="flex flex-col gap-6">
                  <div id="section-degree-program-details" className="bg-white p-5 rounded-xl border border-[#E2E8F0] scroll-mt-24">
                    <h4 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Degree Program Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Title <span className="text-rose-600">*</span></span>
                        <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Master of Science in Computer Science" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <CreatableSingleDropdown
                          label="Category"
                          defaultOptions={degreeCategories}
                          selected={form.category}
                          onChange={handleDegreeCategoryChange}
                          required
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Mode <span className="text-rose-600">*</span></span>
                        <select name="mode" value={form.mode || ''} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required>
                          <option value="">Select Mode</option>
                          {["Full Time", "Part Time", "Online", "Offline", "Hybrid", "Distance Learning"].map(mode => (
                            <option key={mode} value={mode}>{mode}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Duration <span className="text-rose-600">*</span></span>
                        <div className="flex gap-2">
                          <input type="number" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 3" className="flex-1 border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                          <select name="durationUnit" value={form.durationUnit} onChange={handleChange} className="w-[120px] border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                            <option value="day">Days</option>
                            <option value="Months">Months</option>
                            <option value="Year">Year</option>
                          </select>
                        </div>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>University <span className="text-rose-600">*</span></span>
                        <input name="university" value={form.university || ''} onChange={handleChange} placeholder="e.g. University of Huddersfield" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>University Logo</span>
                        <input type="file" name="universityLogo" accept="image/*" onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Thumbnail Image</span>
                        <input type="file" name="thumbnail" accept="image/*" onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Annual Fees</span>
                        <div className="flex gap-2">
                          <select name="annualFeesCurrency" value={form.annualFeesCurrency || 'INR'} onChange={handleChange} className="w-[100px] border border-[#EEF2FF] rounded-xl px-3 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                            <option value="INR">₹ INR</option>
                            <option value="USD">$ USD</option>
                          </select>
                          <input type="number" name="annualFeesAmount" value={form.annualFeesAmount || ''} onChange={handleChange} placeholder="e.g. 120000" className="flex-1 border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                        </div>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Card Badge</span>
                        <input name="cardBadge" value={form.cardBadge || ''} onChange={handleChange} placeholder="e.g. Popular" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <CreatableSingleDropdown
                          label="Approval Badge"
                          name="approvalBadge"
                          defaultOptions={["AICTE", "UGC"]}
                          selected={form.approvalBadge}
                          onChange={handleChange}
                          placeholder="Select or create approval badge..."
                          addPlaceholder="Create new approval badge..."
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : isBootcampsType ? (
                <div className="flex flex-col gap-6">
                  <div id="section-bootcamp-details" className="bg-white p-5 rounded-xl border border-[#E2E8F0] scroll-mt-24">
                    <h4 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Bootcamp Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Bootcamp Title <span className="text-rose-600">*</span></span>
                        <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Full Stack Web Development Bootcamp" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <CreatableSingleDropdown
                          label="Category"
                          defaultOptions={bootcampCategories}
                          selected={form.category}
                          onChange={handleBootcampCategoryChange}
                          required
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <CreatableSingleDropdown
                          label="Provider"
                          name="provider"
                          defaultOptions={bootcampProviders}
                          selected={form.provider}
                          onChange={handleBootcampProviderChange}
                          placeholder="Select or create provider..."
                          addPlaceholder="Create new provider..."
                          required
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Provider Logo <span className="text-rose-600">*</span></span>
                        <input type="file" name="providerLogo" accept="image/*" onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required={!editingId} />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Thumbnail Image <span className="text-rose-600">*</span></span>
                        <input type="file" name="thumbnail" accept="image/*" onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required={!editingId} />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Rating (0–5)</span>
                        <input type="number" name="rating" value={form.rating || ''} onChange={handleChange} min="0" max="5" step="0.1" placeholder="e.g. 4.5" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Level <span className="text-rose-600">*</span></span>
                        <select name="level" value={form.level || ''} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required>
                          <option value="">Select Level</option>
                          {["Beginner", "Intermediate", "Advanced", "All Levels"].map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Duration <span className="text-rose-600">*</span></span>
                        <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 6 Months" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Study Mode <span className="text-rose-600">*</span></span>
                        <select name="studyMode" value={form.studyMode || ''} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required>
                          <option value="">Select Study Mode</option>
                          {["Live", "Recorded", "Live + Recorded", "Hybrid"].map(mode => (
                            <option key={mode} value={mode}>{mode}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Language</span>
                        <select name="language" value={form.language || ''} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                          <option value="">Select Language</option>
                          {["English", "Hindi", "Spanish", "French", "German", "Mandarin", "Other"].map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Price <span className="text-rose-600">*</span></span>
                        <div className="flex gap-2">
                          <select name="currency" value={form.currency || 'INR'} onChange={handleChange} className="w-[100px] border border-[#EEF2FF] rounded-xl px-3 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required>
                            <option value="INR">₹ INR</option>
                            <option value="USD">$ USD</option>
                          </select>
                          <input type="number" name="price" value={form.price || ''} onChange={handleChange} placeholder="e.g. 25000" className="flex-1 border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                        </div>
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Discount Price</span>
                        <input type="number" name="discountPrice" value={form.discountPrice || ''} onChange={handleChange} placeholder="e.g. 18000" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Students Enrolled</span>
                        <input type="number" name="studentsEnrolled" value={form.studentsEnrolled || ''} onChange={handleChange} placeholder="e.g. 1200" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Next Batch Date</span>
                        <input type="date" name="nextBatchDate" value={form.nextBatchDate || ''} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Badge</span>
                        <select name="badge" value={form.badge || ''} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                          <option value="">Select Badge</option>
                          {["Popular", "Bestseller", "Trending", "New", "Recommended", "Editor's Choice"].map(badge => (
                            <option key={badge} value={badge}>{badge}</option>
                          ))}
                        </select>
                      </label>

                      <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Certificate Included</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={!!form.certificateIncluded} onChange={(e) => setForm(prev => ({ ...prev, certificateIncluded: e.target.checked }))} />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Placement Assistance</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={!!form.placementAssistance} onChange={(e) => setForm(prev => ({ ...prev, placementAssistance: e.target.checked }))} />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Featured</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={!!form.featured} onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))} />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div id="section-program-specifics" className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <h4 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Program Specifics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>{isDegreeType ? "Program Title" : form.type === "Jobs" ? "Job Title" : form.type === "Apprenticeships" ? "Apprenticeship Title" : "Internship Title"} <span className="text-rose-600">*</span></span>
                    <input name="title" value={form.title} onChange={handleChange} placeholder={isDegreeType ? "e.g. Master of Science in Computer Science" : form.type === "Jobs" ? "e.g. Software Engineer" : form.type === "Apprenticeships" ? "e.g. Electrician Apprentice" : "e.g. Software Engineer Intern"} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Department/Category <span className="text-rose-600">*</span></span>
                    <select name="departmentCategory" value={form.departmentCategory} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required>
                      <option value="">Select Department</option>
                      {/* <option value="Marketing">Marketing</option>
                      <option value="IT">IT</option>
                      <option value="Operations">Operations</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option> */}
                      <option value="Corporate">Corporate</option>
                      <option value="Teaching">Teaching </option>
                      <option value="NGO / Social Work">NGO / Social Work</option>
                      <option value="Government">Government</option>
                      <option value="Research">Research</option>
                      <option value="Assessment ">Assessment</option>
                      <option value="Summer / Winter Break">Summer / Winter Break</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>{form.type === "Jobs" ? "Job Location" : form.type === "Apprenticeships" ? "Apprenticeship Location" : "Internship Location"} (City/State) {form.workMode !== 'Remote' && <span className="text-rose-600">*</span>}</span>
                    <input name="cityState" value={form.cityState} onChange={handleChange} placeholder="e.g. Bangalore, Karnataka" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required={form.workMode !== 'Remote'} />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 ">
                    <span>Company Location Link</span>
                    <input type="url" name="googleLocationLink" value={form.googleLocationLink} onChange={handleChange} placeholder="https://maps.google.com/..." className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 ">
                    <span>Tags for Cards (Comma separated)</span>
                    <input type="text" name="frontendTags" value={Array.isArray(form.frontendTags) ? form.frontendTags.join(', ') : form.frontendTags || ''} onChange={(e) => handleArrayChange(e, 'frontendTags')} placeholder="e.g. Remote, Urgent" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </label>

                  {isDegreeType && (
                    <>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>University / Institution <span className="text-rose-600">*</span></span>
                        <input name="university" value={form.university || ''} onChange={handleChange} placeholder="e.g. University of Huddersfield" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required={isDegreeType} />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Degree Type</span>
                        <input name="degreeType" value={form.degreeType || ''} onChange={handleChange} placeholder="e.g. Bachelor, Master" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>
                      <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                        <span>Learning Mode</span>
                        <div className="flex flex-wrap gap-4 mt-2">
                          {["On-Campus", "100% Online", "Hybrid", "Industry Integrated"].map(mode => (
                            <label key={mode} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="learningMode" value={mode} checked={form.learningMode === mode} onChange={handleChange} className="accent-red-600" />
                              <span>{mode}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                 
                  

                  <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Number of Openings {form.hasOpenings !== false && <span className="text-rose-600">*</span>}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={form.hasOpenings !== false} 
                          onChange={(e) => setForm(prev => ({...prev, hasOpenings: e.target.checked, openings: e.target.checked ? prev.openings : ""} ))} 
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    {form.hasOpenings !== false && (
                      <input type="number" name="openings" value={form.openings} onChange={handleChange} placeholder="e.g. 5" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                    )}
                  </div>

                  {form.type !== "Jobs" && (
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                      <span>Duration <span className="text-rose-600">*</span></span>
                        <div className="flex gap-2">
                        {form.type === "Apprenticeships" ? (
                          <select name="duration" value={form.duration} onChange={handleChange} className="flex-1 border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required>
                            <option value="">Select Duration</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                             <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                             <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                             <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                          </select>
                        ) : (
                          <input type="number" name="duration" value={form.duration} onChange={handleChange} className="flex-1 border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                        )}
                        <select name="durationUnit" value={form.durationUnit} onChange={handleChange} className="w-[120px] border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                          <option value="day">Days</option><option value="Months">Months</option>
                          <option value="Year">Year</option>
                        </select>
                      </div>
                    </label>
                  )}

                  
                
                  <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Work Mode <span className="text-rose-600">*</span></span>
                    <div className="flex gap-4 mt-2">
                      {["On-site", "Remote", "Hybrid"].map(mode => (
                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="workMode" value={mode} checked={form.workMode === mode} onChange={handleChange} className="accent-red-600" />
                          <span>{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  
                  {form.type !== "Jobs" && (
                    <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                      <span>{form.type === "Apprenticeships" ? "Apprenticeship Type" : "Internship Type"}</span>
                      <div className="flex gap-4 mt-2">
                        {["Summer", "Winter", "Full-year"].map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="internshipType" value={type} checked={form.internshipType === type} onChange={handleChange} className="accent-red-600" />
                            <span>{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Working Hours <span className="text-rose-600">*</span></span>
                    <div className="flex gap-4 mt-2">
                      {["Full-time", "Part-time"].map(hours => (
                        <label key={hours} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="workingHours" value={hours} checked={form.workingHours === hours} onChange={handleChange} className="accent-red-600" required />
                          <span>{hours}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Experience Level {form.type === "Jobs" && <span className="text-rose-600">*</span>}</span>
                    <div className="flex gap-2">
                      <input type="text" name="experienceLevel" value={form.experienceLevel || ''} onChange={handleChange} placeholder="e.g. 0-6 or 1" className="flex-1 border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required={form.type === "Jobs"} />
                      <select name="experienceUnit" value={form.experienceUnit || 'Years'} onChange={handleChange} className="w-[120px] border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                        <option value="Months">Months</option>
                        <option value="Years">Years</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div id="section-program-timeline" className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <h4 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Program Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Applications Open</span>
                    <input type="date" name="applicationsOpenDate" value={form.applicationsOpenDate} onChange={handleChange} min={minDate} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Application Deadline <span className="text-rose-600">*</span></span>
                    <input type="date" name="deadline" value={form.deadline} onChange={handleChange} min={minDate} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Selection Announcement</span>
                    <input type="date" name="selectionAnnouncementDate" value={form.selectionAnnouncementDate} min={minDate} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Program Start Date <span className="text-rose-600">*</span></span>
                    <input type="date" name="startDate" value={form.startDate} onChange={handleChange} min={minDate} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                  </label>
                </div>
              </div>

              
              <div id="section-financials" className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <h4 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Financials & Incentives</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isDegreeType ? (
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                      <span>Program Fees</span>
                      <input name="fees" value={form.fees || ''} onChange={handleChange} placeholder="e.g. INR 1.20 Lac per year" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                    </label>
                  ) : (
                    <>
                      {form.type !== "Jobs" && (
                        <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700 ">
                          <span>Stipend Type <span className="text-rose-600">*</span></span>
                          <div className="flex gap-4 mt-2">
                            {["Fixed", "Performance-based", "Unpaid"].map(type => (
                              <label key={type} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="stipendType" value={type} checked={form.stipendType === type} onChange={(e) => { handleChange(e); setForm(prev => ({...prev, isUnpaid: type === "Unpaid", stipend: type === "Unpaid" ? "" : prev.stipend})) }} className="accent-red-600" required={!isDegreeType} />
                                <span>{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!form.isUnpaid || form.type === "Jobs") && (
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          <span>{form.type === "Jobs" ? "Salary" : "Amount (per month)"}</span>
                          <div className="flex gap-2">
                            <select name="stipendCurrency" value={form.stipendCurrency} onChange={handleChange} className="w-[100px] border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                              <option value="INR">INR</option>
                              <option value="USD">USD</option>
                            </select>
                            <input name="stipend" value={form.stipend} onChange={handleChange} placeholder="e.g. 10000" className="flex-1 border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                          </div>
                        </label>
                      )}
                    </>
                  )}

                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Incentives/Bonuses</span>
                    <textarea name="incentivesBonuses" value={form.incentivesBonuses || ''} onChange={handleChange} placeholder="e.g., Success fee per candidate" className="flex-1 border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-y min-h-[48px]" rows="1" />
                  </label>

                  <CreatableCheckboxDropdown
                    label="Perks"
                    defaultOptions={["Certificate", "LOR", "PPO", "Flexible Hours"]}
                    selected={form.perks || []}
                    onChange={(e, value) => handleCheckboxChange(e, 'perks', value)}
                  />
                </div>
              </div>

              <div id="section-requirements" className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <h4 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Candidate Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CheckboxDropdown
                    label="Target Education"
                    options={["B.Tech", "MBA", "MCA", "BBA", "B.Com"]}
                    selected={form.targetEducation || []}
                    onChange={(e, value) => handleCheckboxChange(e, 'targetEducation', value)}
                    required
                  />
                  
                  {form.type !== "Jobs" && (
                    <>
                      <CheckboxDropdown
                        label="Batch Eligibility"
                        options={["2024", "2025", "2026", "2027"]}
                        selected={form.batchEligibility || []}
                        onChange={(e, value) => handleCheckboxChange(e, 'batchEligibility', value)}
                        required
                      />

                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Minimum CGPA/Percentage</span>
                        <input type="number" step="0.1" name="minimumCGPA" value={form.minimumCGPA} onChange={handleChange} placeholder="0.0 - 10.0" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>
                    </>
                  )}

                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Required Skills <span className="text-rose-600">*</span></span>
                    <input name="requiredSkills" value={form.requiredSkills} onChange={handleChange} placeholder="e.g. React, Node.js, Python" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                  </label>

                </div>
              </div>

           
              <div id="section-qualifications" className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <h4 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Qualifications</h4>
                <div className="grid grid-cols-1 gap-6">
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Minimum Requirements (Eligibility Criteria - In Bullet Points)</span>
                    <textarea name="minimumRequirements" value={form.minimumRequirements} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[100px]" placeholder="- Must have experience with...&#10;- Knowledge of..." />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Preferred Qualifications (Key Skills - In Bullet Points)</span>
                    <textarea name="preferredQualifications" value={form.preferredQualifications} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[100px]" placeholder="- Prior internship in...&#10;- Familiarity with..." />
                  </label>
                </div>
              </div>

            
              <div id="section-job-description" className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <h4 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">{form.type === "Jobs" ? "Job Description" : form.type === "Apprenticeships" ? "Apprenticeship Description" : "Description"}</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col gap-2">
                    
                    <TextEditor 
                      label="About the Program"
                      value={form.aboutProgram}
                      onChange={(html) => setForm(prev => ({ ...prev, aboutProgram: html }))}
                      placeholder=""
                    />
                  </div>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Key Responsibilities <span className="text-rose-600">*</span></span>
                    <textarea name="description" value={form.description} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[100px]" placeholder="Bulleted list of daily tasks and ownership areas." required />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>What You Will Learn</span>
                    <textarea name="whatYouWillLearn" value={form.whatYouWillLearn} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[100px]" placeholder="Focus on the experiential learning aspect..." />
                  </label>
                </div>
              </div>

            
              <div id="section-selection-process" className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <h4 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Selection Process</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Selection Rounds</span>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {["Resume Shortlist", "Assignment", "Interview"].map(round => (
                        <label key={round} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.selectionRounds?.includes(round)} onChange={(e) => handleCheckboxChange(e, 'selectionRounds', round)} className="accent-red-600 w-4 h-4 rounded" />
                          <span>{round}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Assignment Link (Optional)</span>
                    <input type="url" name="assignmentLink" value={form.assignmentLink} onChange={handleChange} placeholder="https://..." className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Custom Screening Question</span>
                    <textarea name="customScreeningQuestion" value={form.customScreeningQuestion} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[80px]" placeholder='e.g., "Why are you interested in this role?"' />
                  </label>
                </div>
              </div>

              
              <div id="section-about-company" className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <h4 className="text-md font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">About the Company</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Company Name <span className="text-rose-600">*</span></span>
                    <input name="company" value={form.company} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Website Link</span>
                    <input type="url" name="website" value={form.website} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Industry Vertical</span>
                    <select name="industry" value={form.industry} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                      <option value="">Select Industry</option>
                      <option value="IT Services">IT Services</option>
                      <option value="EdTech">EdTech</option>
                      <option value="Higher Education">Higher Education</option>
                      <option value="Fintech">Fintech</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Headquarters</span>
                    <input name="headquarters" value={form.headquarters} onChange={handleChange} placeholder="City, State, Country" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Founded Year</span>
                    <input name="foundedYear" value={form.foundedYear} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Number of Employees</span>
                    <select name="companySize" value={form.companySize} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                      <option value="">Select</option>
                      <option value="Startup 0-5">Startup 0-5</option>
                      <option value="SME 2-20">SME 2-20</option>
                      <option value="MSME 21-50">MSME 21-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span>Company Size</span>
                    <select name="companyClassification" value={form.companyClassification} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none">
                      <option value="">Select</option>
                      <option value="Boutique Firm">Boutique Firm</option>
                      <option value="Mid-market">Mid-market</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </label>

              
                  <div className="flex flex-col gap-4 mt-4 md:col-span-2 p-4 bg-slate-50 rounded-xl">
                   
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-sm font-semibold text-slate-700">Upload Organization Logo</span>
                      <label className="w-full h-40 rounded-xl bg-white border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-blue-50 transition-colors group relative">
                        {form.logo ? (
                          <img src={form.logo} alt="Preview" className="w-full h-full object-contain p-4 group-hover:opacity-75 transition-opacity" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FiGlobe className="text-slate-300 group-hover:text-blue-500 transition-colors" size={40} />
                            <span className="text-xs text-slate-500 font-medium">Click to browse files</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </div>
                    
                    {/* <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 mt-2 cursor-pointer">
                      <input type="checkbox" name="featuredListing" checked={form.featuredListing} onChange={handleChange} className="w-4 h-4 accent-red-600" />
                      <span>Featured Listing (Push to top of the board)</span>
                    </label> */}

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Hiring Manager/POC LinkedIn <span className="text-rose-600">*</span></span>
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={form.showHiringManager !== false} 
                              onChange={(e) => setForm(prev => ({ ...prev, showHiringManager: e.target.checked }))} 
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${form.showHiringManager !== false ? 'bg-red-600' : 'bg-slate-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${form.showHiringManager !== false ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                          <span className="ml-3 text-xs font-medium text-slate-600">Show</span>
                        </label>
                      </div>
                      <input required type="url" name="hiringManager" value={form.hiringManager} onChange={handleChange} placeholder="LinkedIn URL" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Company LinkedIn</span>
                        <input name="linkedin" value={form.socialProofLinks?.linkedin || ""} onChange={handleSocialProofChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Company Twitter</span>
                        <input name="twitter" value={form.socialProofLinks?.twitter || ""} onChange={handleSocialProofChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                        <span>Company Instagram</span>
                        <input name="instagram" value={form.socialProofLinks?.instagram || ""} onChange={handleSocialProofChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </label>
                    </div>

                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                      <span>Virtual Tour (Office URL)</span>
                      <input type="url" name="virtualTour" value={form.virtualTour} onChange={handleChange} placeholder="Link to 360 view or video" className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                    </label>

                    {/* Feed the "Office Photos" / "Video" gallery on the detail
                        page: paste links, one per line, or upload from this
                        machine. Either way the field stays a URL list, which is
                        what the backend's parseTextList consumes. */}
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                      <span>Office Photos</span>
                      <MediaUrlListField
                        value={form.officePhotos}
                        onChange={(next) => handleChange({ target: { name: "officePhotos", value: next } })}
                        accept="image/*"
                        kind="photos"
                        placeholder={"https://.../office-1.jpg\nhttps://.../office-2.jpg"}
                        textareaClassName="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[90px]"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                      <span>Office Videos</span>
                      <MediaUrlListField
                        value={form.cultureVideos}
                        onChange={(next) => handleChange({ target: { name: "cultureVideos", value: next } })}
                        accept="video/*"
                        kind="videos"
                        placeholder={"https://.../culture.mp4\nhttps://www.youtube.com/watch?v=..."}
                        textareaClassName="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[90px]"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2 mt-4">
                    <span>Company Overview</span>
                    <textarea name="companyOverview" value={form.companyOverview} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[100px]" placeholder="Introduction, Vision, Mission..." />
                  </label>
                  
                  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                    <span>Specialties</span>
                    <textarea name="specialties" value={form.specialties} onChange={handleChange} className="border border-[#EEF2FF] rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[80px]" placeholder="e.g. Airport Ground Handling, Robotic Cleaning..." />
                  </label>
                </div>
              </div>
              </>
              )}

              <div className="flex justify-end  border-[#E2E8F0]">
                <button type="submit" disabled={busy} className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold  shadow-blue-200 transition-all active:scale-95 disabled:opacity-50">
                  {busy ? "Saving..." : editingId ? "Update & Next" : "Create & Next"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Confirm Program Details</h2>
              <button onClick={() => showPreviewModal(false)} className="text-red-600 font-bold hover:underline text-sm">Edit</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
               <p className="text-slate-600 font-medium">Ready to save the following opportunity?</p>
               <h3 className="text-xl font-bold text-blue-900">{form.title} @ {form.company}</h3>
            </div>
            <div className="p-6  border-slate-100 flex items-center justify-end gap-4 bg-white">
              <button type="button" onClick={() => resetForm()} className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all">Cancel</button>
              <button type="button" onClick={handleConfirmSubmit} disabled={busy} className="px-8 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 min-w-[160px]">
                {busy ? "Publishing..." : "Confirm & Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top duration-300">
          <div className="bg-green-100 text-green-500 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-400">
            <div>
              <p className="font-bold">Successfully Published!</p>
              <p className="text-xs text-green-500">Your opportunity is now live on the portal.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OpportunityForm;
