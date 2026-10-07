import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import FormComponents from "../../form-builder/FormComponents";
import { API_BASE_URL, resolveAssetUrl } from "../../../services/apiClient";
import { getInternshipById } from "../../../services/internshipAPI";
import { getPublicForm, submitPublicForm } from "../../../services/formsAPI";
import useAuthStore from "../../../store/authStore";
import { startApplyResumeHandoff } from "../../resume-builder/utils/formResumeHandoff";
import Icons from "../../form-builder/ui/ui-icons";
import ImageCarousel from "../../form-builder/ui/image-carousel";

const ApplicationFormModal = ({
  isOpen,
  onClose,
  opportunityTitle = "Opportunity",
  opportunity = null,
  seedValues = null,
}) => {
  const { submitApplication, getApiErrorMessage } = useOpportunities();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // Dynamic Form State
  const [dynamicForm, setDynamicForm] = useState(null);
  const [formValues, setFormValues] = useState(seedValues || {});
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  // Legacy Form State (Fallback)
  const [legacyForm, setLegacyForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    degree: "",
    year: "",
    skills: "",
    experience: "",
    portfolio: "",
    linkedin: "",
    whySelectYou: "",
  });
  const [resumeFile, setResumeFile] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch dynamic form if opportunity has formId
  useEffect(() => {
    const fetchDynamicForm = async () => {
      let rawFormId = opportunity?.formId || opportunity?.form;

      // If no formId present on the passed opportunity, try fetching the
      // latest internship from the server (covers situation where form was
      // just attached but local object is stale).
      if (!rawFormId && opportunity?.id) {
        try {
          const latest = await getInternshipById(opportunity.id);
          rawFormId = latest?.formId || latest?.form;
        } catch (err) {
          // ignore; we'll fall back to legacy
          console.warn("Could not refresh internship to find attached form", err);
        }
      }

      if (!isOpen || !rawFormId) {
        setDynamicForm(null);
        return;
      }

      setIsLoadingForm(true);
      try {
        const formId = typeof rawFormId === 'object' ? (rawFormId._id || rawFormId.id) : rawFormId;
        const fetchedForm = await getPublicForm(formId);
        if (fetchedForm) {
          console.log("📥 FETCHED DYNAMIC FORM:", fetchedForm);
          setDynamicForm(fetchedForm);

          // Initialize values with default values from fields
          const initialValues = {};
          const fields = fetchedForm.formSchema?.fields || fetchedForm.fields || [];
          console.log("📋 FORM FIELDS FOUND:", fields);

          fields.forEach(field => {
            if (field.defaultValue !== undefined) {
              initialValues[field.id] = field.defaultValue;
            }
          });
          // Values carried back from the Resume Builder round trip win over defaults.
          setFormValues({ ...initialValues, ...(seedValues || {}) });
        }
      } catch (err) {
        console.error("Failed to load dynamic form:", err);
        // Fallback to legacy form is implicit since dynamicForm remains null
      } finally {
        setIsLoadingForm(false);
      }
    };

    fetchDynamicForm();
  }, [isOpen, opportunity?.formId, opportunity?.form]);

  if (!isOpen) return null;

  const handleLegacyInputChange = (event) => {
    const { name, value } = event.target;
    setLegacyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDynamicValueChange = (fieldId, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Resume field "Build a resume now" — stash this application and hand off to
  // the Resume Builder; <ApplyHandoffReviver /> reopens this modal on return.
  const handleBuildResume = (fieldId) => {
    startApplyResumeHandoff({
      pathname: location.pathname,
      fieldId,
      opportunity,
      opportunityTitle,
      formValues,
      isAuthenticated,
      navigate,
    });
  };

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0] || null;
    setError("");
    if (!file) {
      setResumeFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setResumeFile(null);
      setError("Resume must be a PDF file.");
      return;
    }
    setResumeFile(file);
  };

  const resetForm = () => {
    setLegacyForm({
      name: "",
      email: "",
      phone: "",
      college: "",
      degree: "",
      year: "",
      skills: "",
      experience: "",
      portfolio: "",
      linkedin: "",
      whySelectYou: "",
    });
    setFormValues({});
    setResumeFile(null);
    setError("");
    setSuccess("");
  };

  const resolveAssetUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalized}`;
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!opportunity?.id) {
      setError("Opportunity details are missing. Please reopen this form.");
      return;
    }

    setSubmitting(true);
    try {
      if (dynamicForm) {
        // Submit Dynamic Form
        const formData = new FormData();
        formData.append("opportunityId", opportunity.id);
        formData.append("opportunityTitle", opportunityTitle);
        formData.append("opportunityType", opportunity?.type || "Internship");
        formData.append("formId", dynamicForm._id);

        // Process dynamic values
        Object.entries(formValues).forEach(([fieldId, value]) => {
          if (value instanceof File || (value && value.file instanceof File)) {
            formData.append(fieldId, value.file || value);
          } else if (typeof value === 'object' && value !== null) {
            formData.append(fieldId, JSON.stringify(value));
          } else {
            formData.append(fieldId, value || "");
          }
        });

        await submitPublicForm(dynamicForm._id, formData);

      } else {
        // Submit Legacy Form
        // if (!resumeFile) {
        //   setError("Resume upload is mandatory.");
        //   setSubmitting(false);
        //   return;
        // }

        await submitApplication({
          ...legacyForm,
          resumeFile,
          opportunityId: opportunity.id,
          opportunityTitle,
          opportunityType: opportunity?.type || "Internship",
          company: opportunity?.company || "",
        });
      }

      setSuccess("Application submitted successfully! redirecting...");
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Failed to submit application."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#EEF2FF] flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* FULL PAGE SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex  flex-col">




        {/* MODAL CONTENT LAYOUT */}
        {(() => {
          const fields = dynamicForm?.formSchema?.fields || dynamicForm?.fields || [];

          // A component is considered 'left' if position is explicitly 'left' OR if it's undefined (defaulting to left)
          const hasLeftComponent = fields.some(f =>
            ['bannerUpload', 'pdfUpload', 'carouselUpload'].includes(f.type) &&
            (f.position === 'left' || !f.position)
          );

          const hasSpecialComponent = fields.some(f => ['bannerUpload', 'pdfUpload', 'carouselUpload'].includes(f.type));

          return (
            <div className={`flex-1 flex flex-col ${hasLeftComponent ? 'md:flex-row' : 'flex-col'}`}>

              {/* SPECIAL COMPONENT SECTION (Banner/PDF/Carousel) */}
              {hasSpecialComponent && (
                <div className={`${hasLeftComponent
                    ? 'w-full md:w-1/2 h-[300px] md:h-screen p-4.5  sticky top-0'
                    : 'w-full h-[300px] sm:h-[450px] lg:h-[500px]'
                  }  overflow-hidden rounded-xl`}>
                  {fields.map(field => {
                    if (!['bannerUpload', 'pdfUpload', 'carouselUpload'].includes(field.type)) return null;

                    if (field.type === 'bannerUpload') {
                      const bannerSrc = resolveAssetUrl(field.bannerUrl || field.value?.preview);
                      if (!bannerSrc) return null;
                      return (
                        <img
                          key={field.id}
                          src={bannerSrc}
                          alt="Form Banner"
                          className="w-full p-0.5 rounded-xl h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      );
                    }

                    if (field.type === 'pdfUpload') {
                      return (
                        <div key={field.id} className="w-full h-full flex items-center justify-center bg-blue-50">
                          <div className="text-center p-8">
                            <div className="w-20 h-20 bg-blue-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Icons.PdfUpload size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-blue-900">PDF Document Included</h3>
                            <p className="text-red-600 mt-2">This application form includes a document for your reference.</p>
                          </div>
                        </div>
                      );
                    }

                    if (field.type === 'carouselUpload') {
                      const carouselImages = (field.images || []).map(img => ({
                        ...img,
                        src: resolveAssetUrl(img.src || img.preview || img.dataUrl)
                      }));
                      console.log("CAROUSEL IMAGES IN MODAL:", carouselImages);
                      return (
                        <ImageCarousel
                          key={field.id}
                          images={carouselImages}
                          autoAdvanceTime={field.autoAdvanceTime || 20000}
                          showDots={field.showDots !== false}
                          maxImages={field.maxImages || 8}
                          className="w-full h-full"
                        />
                      );
                    }

                    return null;
                  })}
                </div>
              )}

              {/* FORM FIELDS SECTION */}
              <div className="flex-1 flex flex-col items-center py-5 px-4 overflow-y-auto">
                <div className="w-full max-w-[800px] border border-black/10 rounded-xl p-5 bg-white shadow-sm animate-in slide-in-from-bottom-8 duration-500 mx-auto">

                  <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {dynamicForm ? dynamicForm.name : "Application Form"}
                    </h2>
                    {dynamicForm?.description && (
                      <p className="text-slate-500 mt-2 font-medium">
                        {dynamicForm.description}
                      </p>
                    )}
                  </div>

                  {isLoadingForm ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Form...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                      {dynamicForm && (
                        <div className="grid grid-cols-12 gap-x-6 gap-y-6">
                          {fields
                            .filter(f => !['bannerUpload', 'pdfUpload', 'carouselUpload'].includes(f.type))
                            .map((field) => (
                              <div
                                key={field.id}
                                className={field.width === "half" ? "col-span-12 md:col-span-6" : "col-span-12"}
                              >
                                {!field.hideLabel && field.type !== 'checkbox' && (
                                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    {field.label}
                                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                                  </label>
                                )}
                                {field.helperText && (
                                  <p className="text-xs text-slate-400 mb-2 italic">
                                    {field.helperText}
                                  </p>
                                )}
                                <div className="relative">
                                  <FormComponents
                                    field={{
                                      ...field,
                                      value: formValues[field.id]
                                    }}
                                    isPreview={true}
                                    onChange={(id, value) => setFormValues(prev => ({ ...prev, [id]: value }))}
                                    onBuildResume={handleBuildResume}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Status Messages */}
                      {error && (
                        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 font-bold flex items-center gap-4 animate-in shake duration-500">
                          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-200">
                            !
                          </div>
                          {error}
                        </div>
                      )}
                      {success && (
                        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center gap-4 animate-in slide-in-from-right duration-500">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                            <Icons.Check size={18} />
                          </div>
                          {success}
                        </div>
                      )}

                      {/* Submit Action */}
                      <div className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-8">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-12 py-2 rounded-xl bg-[#1F2853] text-white font-semibold text-lg shadow-2xl shadow-blue-200 hover:bg-[#162040] hover:-translate-y-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                        >
                          {submitting ? (
                            <div className="flex items-center justify-center gap-4">
                              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="tracking-widest uppercase text-sm">Processing...</span>
                            </div>
                          ) : "Submit"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ApplicationFormModal;
