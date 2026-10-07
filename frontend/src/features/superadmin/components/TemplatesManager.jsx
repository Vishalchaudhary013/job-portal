import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiColumns, FiList, FiChevronDown } from "react-icons/fi";
import { getErrorMessage } from "../../../services/apiClient";
import { getTemplates, toggleTemplateStatus, getTemplateResponseCounts } from "../../../services/templatesAPI";
import { FormBuilderProvider } from "../../form-builder/context/FormBuilderContext";
import PreviewModal from "../../form-builder/modals/PreviewModal";
import ShareModal from "../../../components/common/ShareModal";
import AdminTemplateCard from "./AdminTemplateCard";
import TemplateResponsesModal from "./TemplateResponsesModal";

/**
 * Read-only overview of the Form Builder's templates (10th/12th/ITI/Diploma/Bachelor's/
 * Master's/PhD + any custom ones), reachable from the Super Admin sidebar. This page is
 * standalone — it doesn't embed the Form Builder itself. "Edit" is the only thing that
 * connects to it: it navigates into the real, already-existing Form Builder (in template
 * edit mode), rather than re-implementing field editing here.
 */
const TemplatesManager = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [shareTemplate, setShareTemplate] = useState(null);
  const [responsesTemplate, setResponsesTemplate] = useState(null);
  const [responseCounts, setResponseCounts] = useState({});
  const [layoutMode, setLayoutMode] = useState("two"); // 'two' | 'single' — fields per row in the View preview

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch templates"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    getTemplateResponseCounts()
      .then(setResponseCounts)
      .catch(() => {});
  }, []);

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.trim().toLowerCase();
    return templates.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [templates, search]);

  const handleEdit = (template) => {
    navigate(`/super-admin-dashboard/templates/edit/${template._id}`);
  };

  const handleShare = (template) => {
    setShareTemplate(template);
  };

  const handleView = (template) => {
    const fields =
      layoutMode === "single"
        ? (template.fields || []).map((f) => ({ ...f, width: "full" }))
        : template.fields || [];
    setPreviewTemplate({ ...template, fields });
  };

  const handleToggleStatus = async (template) => {
    setTogglingId(template._id);
    try {
      const updated = await toggleTemplateStatus(template._id, !template.isActive);
      setTemplates((prev) => prev.map((t) => (t._id === template._id ? updated : t)));
    } catch (err) {
      alert(getErrorMessage(err, "Failed to update template status"));
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading templates...</div>;
  }

  return (
    <div className="bg-white border border-[#E2E8F0] p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Form Builder Templates</h2>
          <p className="text-sm text-slate-500 mt-1">
            Predefined and custom application-form templates. Editing opens the real Form Builder.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            {layoutMode === "single" ? (
              <FiList className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            ) : (
              <FiColumns className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            )}
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value)}
              title="Fields per row — applies to View and to shared links"
              className="pl-8 pr-7 py-2 text-xs font-medium border border-[#EEF2FF] rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
            >
              <option value="two">2 Column</option>
              <option value="single">1 Column</option>
            </select>
            <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 pr-3 py-2 text-sm border border-[#EEF2FF] rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 outline-none w-64"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
      )}

      {filteredTemplates.length === 0 ? (
        <div className="p-12 text-center text-slate-500 border border-[#E2E8F0] rounded-lg">No templates found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <AdminTemplateCard
              key={template._id}
              template={template}
              onView={handleView}
              onShare={handleShare}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onViewResponses={setResponsesTemplate}
              responseCount={responseCounts[template._id] || 0}
              isToggling={togglingId === template._id}
            />
          ))}
        </div>
      )}

      {previewTemplate && (
        <FormBuilderProvider>
          <PreviewModal
            onClose={() => setPreviewTemplate(null)}
            formFields={previewTemplate.fields}
            formName={previewTemplate.name}
          />
        </FormBuilderProvider>
      )}

      {shareTemplate && (
        <ShareModal
          isOpen
          onClose={() => setShareTemplate(null)}
          title="Share Template"
          eventTitle={shareTemplate.name}
          shareUrl={`${window.location.origin}/shared-template/${shareTemplate._id}${
            layoutMode === "single" ? "?layout=single" : ""
          }`}
        />
      )}

      {responsesTemplate && (
        <TemplateResponsesModal template={responsesTemplate} onClose={() => setResponsesTemplate(null)} />
      )}
    </div>
  );
};

export default TemplatesManager;
