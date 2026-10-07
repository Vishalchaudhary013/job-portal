import { useState, useEffect, useCallback } from 'react';
import { useFormBuilder } from './context/FormBuilderContext';
import FormHeader from './FormHeader';
import ComponentsPanel from './ComponentsPanel';
import FormCanvas from './FormCanvas';
import PropertyEditor from './PropertyEditor';
import PreviewModal from './modals/PreviewModal';
import PublishModal from './modals/PublishModal';
import ConfirmReplaceModal from './modals/ConfirmReplaceModal';
import { useToast } from './hooks/use-toast';
import { API_BASE_URL } from "../../services/apiClient";
import { getInternshipById, attachInternshipForm } from "../../services/internshipAPI";
import { getGlobalProgramById, attachGlobalProgramForm } from "../../services/globalProgramAPI";
import { getMasterclassById, attachMasterclassForm } from "../../services/masterclassAPI";
import { getDegreeProgramById, attachDegreeProgramForm } from "../../services/degreeProgramAPI";
import { getBootcampById, attachBootcampForm } from "../../services/bootcampAPI";
import { getForm, createForm, updateForm, publishForm } from "../../services/formsAPI";
import { getTemplate, updateTemplate } from "../../services/templatesAPI";
import TemplatesPanel from "./templates/TemplatesPanel";

// Maps each opportunity's REST base path to its own dedicated API module's functions
// (one file per entity). Used by the attach-form fallback loop below, which needs to
// try several bases by raw path rather than by a single resolved `type`.
const BASE_TO_OPPORTUNITY_API = {
  "/api/internships": { getById: getInternshipById, attachForm: attachInternshipForm },
  "/api/masterclasses": { getById: getMasterclassById, attachForm: attachMasterclassForm },
  "/api/global-programs": { getById: getGlobalProgramById, attachForm: attachGlobalProgramForm },
  "/api/degree-programs": { getById: getDegreeProgramById, attachForm: attachDegreeProgramForm },
  "/api/bootcamps": { getById: getBootcampById, attachForm: attachBootcampForm },
};
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { useOpportunities } from '../../context/OpportunitiesContext';

const FormBuilder = ({ formId, internshipId: propInternshipId, initialTemplateId }) => {
const [searchParams] = useSearchParams();
const urlInternshipId = searchParams.get("internshipId");
const { 
  formState,
  setFormState,
  showPreviewModal,
  setShowPreviewModal,
  showPublishModal,
  setShowPublishModal,
  resetFormBuilder,
  registerHandlers,
  setIsPublishing,
  pendingSpecialField,
  confirmReplaceSpecial,
  cancelReplaceSpecial,
  showTemplatesModal,
  closeTemplatesModal,
  isEditingTemplate,
  editingTemplate,
  applyTemplateToForm,
  enterTemplateEditMode,
  exitTemplateEditMode,
  bumpEditingTemplateVersion
} = useFormBuilder();

const internshipId = propInternshipId || urlInternshipId || formState.internshipId;

const [publishing, setPublishing] = useState(false);

const cleanFields = (fields) => {
  return fields.map(field => {
    const newField = { ...field };

    // remove direct heavy props
    delete newField.preview;
    delete newField.dataUrl;
    delete newField.fileName;

    // remove banner base64
    if (newField.bannerUrl && newField.bannerUrl.startsWith("data:")) {
      newField.bannerUrl = "";
    }

    // remove pdf base64
    if (newField.pdfUrl && newField.pdfUrl.startsWith("data:")) {
      newField.pdfUrl = "";
    }

    // remove carousel images base64
    if (newField.images && Array.isArray(newField.images)) {
      newField.images = newField.images.map(img => ({
        ...img,
        dataUrl: undefined,
        preview: undefined
      }));
    }

    return newField;
  });
};

console.log("📥 RESOLVED internshipId:", internshipId);

 useEffect(() => {
  if (internshipId && !formState.internshipId) {
    console.log("✅ SETTING internshipId:", internshipId);

    setFormState(prev => ({
      ...prev,
      internshipId
    }));
  }
}, [internshipId, formState.internshipId]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadOpportunities, isSuperAdmin, opportunities } = useOpportunities();

  const getApiBaseForType = (type) => {
    if (type === "Masterclasses") return "/api/masterclasses";
    if (type === "Global Program") return "/api/global-programs";
    if (type === "Degree Programs") return "/api/degree-programs";
    if (type === "Bootcamps") return "/api/bootcamps";
    return "/api/internships";
  };

  const findOpportunityType = (id) => {
    const match = opportunities.find((o) => String(o.id || o._id) === String(id));
    return match?.type;
  };

  // Direct template-edit mount (e.g. /super-admin-dashboard/templates/edit/:templateId) —
  // skips the internship/form loading entirely and goes straight into template-edit mode.
  useEffect(() => {
    if (!initialTemplateId) return;

    getTemplate(initialTemplateId)
      .then((template) => {
        if (template) enterTemplateEditMode(template);
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load template',
          variant: 'destructive'
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per templateId
  }, [initialTemplateId]);

  // Load form data if editing existing form
  useEffect(() => {
    if (initialTemplateId) return;

    const loadForm = async () => {
      let activeFormId = formId;

      // If no formId is passed directly, try to find it via the internshipId
      if (!activeFormId && internshipId) {
        try {
          const apiBase = getApiBaseForType(findOpportunityType(internshipId));
          const internship = await BASE_TO_OPPORTUNITY_API[apiBase].getById(internshipId);
          if (internship?.formId) {
            activeFormId = typeof internship.formId === 'object'
              ? internship.formId._id
              : internship.formId;
          }
        } catch (error) {
          console.error("Failed to fetch internship for formId:", error);
        }
      }

      if (activeFormId) {
        try {
          const formData = await getForm(activeFormId);

          setFormState(prev => ({
            ...prev,
            id: formData._id || formData.id,
            name: formData.name,
            description: formData.description,
            fields: formData.formSchema?.fields || [],
            status: formData.status,
            internshipId: internshipId || prev.internshipId
          }));
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load form',
            variant: 'destructive'
          });
        }
      } else {
        resetFormBuilder();
        if (internshipId) {
          setFormState(prev => ({ ...prev, internshipId }));
        }
      }
    };

    loadForm();
  }, [formId, internshipId, setFormState, resetFormBuilder, toast]);

 const handleSaveDraft = useCallback(async () => {
  console.log("Save draft started");

  try {
    // validation
    if (
  !formState.name || formState.name === 'Untitled Form' ||
  !formState.description || formState.description.trim() === ''
) {
  toast({
    title: 'Required Fields Missing',
    description: 'Please add form name and description before continuing.',
    variant: 'destructive'
  });
  return;
}

    if (!formState.fields || formState.fields.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please add at least one field to your form before saving.',
        variant: 'warning'
      });
      return;
    }

    // clean form data
    const formData = {
      name: formState.name || 'Untitled Form',
      description: formState.description || '',
      formSchema: { fields: cleanFields(formState.fields) },
      status: 'draft',
      templateId: formState.templateId || null,
      templateVersion: formState.templateVersion || null,
    };

    if (formId) {
      // ✅ UPDATE
      console.log("Updating existing form:", formId);

     const fd = new FormData();
fd.append("formData", JSON.stringify(formData));

const res = await updateForm(formId, fd);

      console.log("Update response:", res);

      toast({
        title: 'Success',
        description: 'Form saved as draft successfully',
      });

    } else {
      // ✅ CREATE
      console.log("Creating new form");

      const fd = new FormData();

// JSON
fd.append("formData", JSON.stringify(formData));

// 🔥 FILES ADD
formState.fields.forEach(field => {

  console.log("🧠 FIELD:", field);

  // ✅ BANNER
  if (field.type === "bannerUpload" && field.value?.file) {
    console.log("📤 SENDING BANNER:", field.value.file);

    fd.append(`files[${field.id}]`, field.value.file);
  }

  // ✅ PDF
  if (field.type === "pdfUpload" && field.value?.file) {
    fd.append(`files[${field.id}]`, field.value.file);
  }

  // ✅ CAROUSEL
  if (field.type === "carouselUpload" && field.images) {
    field.images.forEach(img => {
      if (img.file) {
        fd.append(`files[${field.id}]`, img.file);
      }
    });
  }

});

// CREATE
const response = await createForm(fd);
      console.log("Created form:", response);

      const newFormId = response.data._id;

      if (!newFormId) {
        throw new Error("Form ID not received from backend");
      }

      setFormState(prev => ({
        ...prev,
        id: newFormId
      }));

      toast({
        title: 'Success',
        description: 'Form created and saved as draft',
      });
    }

  } catch (error) {
    console.error("Error saving form:", error);

    toast({
      title: 'Error',
      description: `Failed to save form: ${error.message}`,
      variant: 'destructive'
    });
  }
}, [formId, formState, setFormState, toast]);

const handleSaveTemplate = useCallback(async () => {
  if (!editingTemplate?.id) return;

  try {
    const updated = await updateTemplate(editingTemplate.id, {
      fields: cleanFields(formState.fields),
    });

    bumpEditingTemplateVersion(updated.version);

    toast({
      title: 'Success',
      description: `Template saved as v${updated.version}`,
    });
  } catch (error) {
    console.error("Error saving template:", error);
    toast({
      title: 'Error',
      description: `Failed to save template: ${error.message}`,
      variant: 'destructive'
    });
  }
}, [editingTemplate, formState.fields, toast, bumpEditingTemplateVersion]);

const handlePublish = useCallback(async () => {
  if (publishing) return;
  setPublishing(true);

  try {
    // ✅ VALIDATIONS
    if (
      !formState.name || formState.name.trim() === '' || formState.name === 'Untitled Form' ||
      !formState.description || formState.description.trim() === ''
    ) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please add a unique form name and a detailed description before publishing.',
        variant: 'destructive'
      });
      setPublishing(false); // 🔥 MUST RESET HERE
      return;
    }

    if (!formState.fields || formState.fields.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please add at least one field to your form before publishing.',
        variant: 'warning'
      });
      setPublishing(false);
      return;
    }

    const hasRequiredField = formState.fields.some(f => f.required);
    if (!hasRequiredField) {
      toast({
        title: "Required Field Missing",
        description: "Please mark at least one field as required before publishing.",
        variant: "destructive"
      });
      setPublishing(false);
      return;
    }

    const formData = {
      name: formState.name,
      description: formState.description,
      formSchema: { fields: cleanFields(formState.fields) },
      status: 'draft',
    };

    // ✅ CREATE FORM DATA (IMPORTANT)
    const fd = new FormData();
    fd.append("formData", JSON.stringify(formData));

    // 🔥 FILES ADD
  formState.fields.forEach(field => {

  console.log("🧠 FIELD:", field);

  // ✅ BANNER
  if (field.type === "bannerUpload" && field.value?.file) {
    console.log("📤 SENDING BANNER:", field.value.file);

    fd.append(`files[${field.id}]`, field.value.file);
  }

  // ✅ PDF
  if (field.type === "pdfUpload" && field.value?.file) {
    fd.append(`files[${field.id}]`, field.value.file);
  }

  // ✅ CAROUSEL
  if (field.type === "carouselUpload" && field.images) {
    field.images.forEach(img => {
      if (img.file) {
        fd.append(`files[${field.id}]`, img.file);
      }
    });
  }

});

    let formToPublishId = formState.id || formId;

    // =========================
    // ✅ CREATE FORM (IF NEW)
    // =========================
    if (!formToPublishId) {
      const res = await createForm(fd);

      const newFormId = res.data._id;

      if (!newFormId) throw new Error("Form ID not received");

      formToPublishId = newFormId;

      setFormState(prev => ({
        ...prev,
        id: newFormId
      }));

      console.log("✅ NEW FORM CREATED:", newFormId);
    }

    // =========================
    // ✅ UPDATE FORM (IF EXIST)
    // =========================
    else {
      await updateForm(formToPublishId, fd);

      console.log("✅ FORM UPDATED:", formToPublishId);
    }

    // =========================
    // ✅ PUBLISH FORM
    // =========================
    const publishedForm = await publishForm(formToPublishId);

    console.log("🚀 FORM PUBLISHED:", publishedForm);

    // =========================
    // ✅ ATTACH TO INTERNSHIP
    // =========================
    const finalInternshipId = formState.internshipId || internshipId;

    console.log("🧠 FINAL internshipId:", finalInternshipId);
    console.log("🧠 FORM ID:", formToPublishId);

    if (finalInternshipId) {
      console.log("🔗 ATTACHING FORM:", finalInternshipId);

      let apiBase = getApiBaseForType(findOpportunityType(finalInternshipId));
      try {
        await BASE_TO_OPPORTUNITY_API[apiBase].attachForm(finalInternshipId, formToPublishId);
      } catch (err) {
        if (err.response?.status === 404) {
          // Type lookup missed (e.g. stale opportunities cache) — fall back to
          // trying the other known attach-form endpoints.
          const fallbackBases = ["/api/internships", "/api/masterclasses", "/api/global-programs", "/api/degree-programs", "/api/bootcamps"].filter(
            (base) => base !== apiBase
          );
          let attached = false;
          for (const fallbackBase of fallbackBases) {
            try {
              await BASE_TO_OPPORTUNITY_API[fallbackBase].attachForm(finalInternshipId, formToPublishId);
              apiBase = fallbackBase;
              attached = true;
              break;
            } catch (fallbackErr) {
              if (fallbackErr.response?.status !== 404) throw fallbackErr;
            }
          }
          if (!attached) throw err;
        } else {
          throw err;
        }
      }

      const check = await BASE_TO_OPPORTUNITY_API[apiBase].getById(finalInternshipId);

      // Refresh global opportunities state so "Apply Now" shows the new form
      await loadOpportunities();

      console.log("🔥 FINAL OPPORTUNITY DATA:", check);
    }

    // =========================
    // ✅ UPDATE STATE
    // =========================
    setFormState(prev => ({
      ...prev,
      status: 'published',
      publishedUrl: publishedForm?.publishedUrl
    }));

    toast({
      title: "Successfully Published! ",
      description: "Your application form  linked to the internship.",
      variant: "success",
      duration: 2500,
    });

    setTimeout(() => {
      if (isSuperAdmin) {
        navigate("/super-admin-dashboard");
      } else {
        navigate("/admin-dashboard");
      }
    }, 2500);

  } catch (error) {
    console.error("❌ PUBLISH ERROR:", error);

    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    });
  } finally {
    setPublishing(false);
  }

}, [publishing, formId, formState, setFormState, toast, navigate]);

  const handlePreview = useCallback(() => {
  if (
    !formState.name || formState.name === 'Untitled Form' ||
    !formState.description || formState.description.trim() === ''
  ) {
    toast({
      title: 'Required Fields Missing',
      description: 'Please add form name and description before preview.',
      variant: 'destructive'
    });
    return;
  }

  setShowPreviewModal(true);
}, [formState.name, formState.description, setShowPreviewModal, toast]);

  useEffect(() => {
    registerHandlers({
      onSave: isEditingTemplate ? handleSaveTemplate : handleSaveDraft,
      onPublish: handlePublish,
      onPreview: handlePreview
    });
  }, [registerHandlers, handleSaveDraft, handleSaveTemplate, isEditingTemplate, handlePublish, handlePreview]);

  return (
    <div id="formBuilder" className="h-full flex flex-col">
      <FormHeader 
        onPreview={handlePreview}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />

      <div className="flex flex-1 overflow-hidden bg-[#EEF2FF]">
        <ComponentsPanel />
        <FormCanvas />
      </div>

      {showPreviewModal && (
        <PreviewModal 
          onClose={() => setShowPreviewModal(false)}
          formFields={formState.fields}
          formName={formState.name || 'Untitled Form'}
        />
      )}
      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          formId={formState.id}
          publishedUrl={formState.publishedUrl}
          formState={formState}
        />
      )}

      <ConfirmReplaceModal
        isOpen={!!pendingSpecialField}
        onConfirm={confirmReplaceSpecial}
        onCancel={cancelReplaceSpecial}
        oldType={pendingSpecialField?.oldType}
        newType={pendingSpecialField?.newType}
      />

      <TemplatesPanel
        isOpen={showTemplatesModal}
        onClose={closeTemplatesModal}
        onUseTemplate={(template) =>
          applyTemplateToForm(template.fields, { templateId: template._id, templateVersion: template.version })
        }
        onEditTemplate={enterTemplateEditMode}
        currentFieldCount={formState.fields.length}
        currentFields={formState.fields}
      />
    </div>
  );
};

export default FormBuilder;