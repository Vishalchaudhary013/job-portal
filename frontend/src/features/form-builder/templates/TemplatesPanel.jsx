import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FiX, FiSearch, FiPlus, FiColumns, FiList, FiChevronDown } from "react-icons/fi";
import TemplateCard from "./TemplateCard";
import CreateTemplateModal from "./CreateTemplateModal";
import ConfirmDiscardModal from "./ConfirmDiscardModal";
import { CATEGORY_LABELS } from "./templateIcons";
import { getTemplates, createTemplate } from "../../../services/templatesAPI";
import { useToast } from "../hooks/use-toast";

const CATEGORIES = ["all", "10th", "12th", "iti", "diploma", "bachelors", "masters", "phd", "job-application", "custom"];

const TemplatesPanel = ({
  isOpen,
  onClose,
  onUseTemplate,
  onEditTemplate,
  currentFieldCount = 0,
  currentFields = [],
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'use' | 'edit', template }
  const [layoutMode, setLayoutMode] = useState("two"); // 'two' | 'single'

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load templates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = category === "all" || t.category === category;
      const matchesSearch = !search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, category, search]);

  if (!isOpen) return null;

  const applyLayoutMode = (fields) =>
    layoutMode === "single" ? (fields || []).map((f) => ({ ...f, width: "full" })) : (fields || []);

  const requestAction = (type, template) => {
    const prepared = { ...template, fields: applyLayoutMode(template.fields) };
    if (currentFieldCount > 0) {
      setPendingAction({ type, template: prepared });
    } else {
      type === "use" ? onUseTemplate(prepared) : onEditTemplate(prepared);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    const { type, template } = pendingAction;
    type === "use" ? onUseTemplate(template) : onEditTemplate(template);
    setPendingAction(null);
  };

  const handleCreateTemplate = async ({ name, description, category: newCategory }) => {
    setIsSavingTemplate(true);
    try {
      await createTemplate({
        name,
        description,
        category: newCategory,
        fields: currentFields,
      });
      toast({ title: "Success", description: "Template created" });
      setShowCreateModal(false);
      loadTemplates();
    } catch (err) {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Templates</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category filters + Create Template */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  category === c
                    ? "text-red-600 border-red-200 bg-blue-50/30"
                    : "text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              {layoutMode === "single" ? (
                <FiList className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              ) : (
                <FiColumns className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              )}
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value)}
                title="Fields per row"
                className="pl-8 pr-7 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="two">2 Column</option>
                <option value="single">1 Column</option>
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Create Template
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {loading ? (
            <div className="text-center text-sm text-gray-400 py-12">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-12">No templates found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  onEdit={(t) => requestAction("edit", t)}
                  onUse={(t) => requestAction("use", t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTemplate}
        fieldCount={currentFieldCount}
        isSaving={isSavingTemplate}
      />

      <ConfirmDiscardModal
        isOpen={!!pendingAction}
        title={pendingAction?.type === "edit" ? "Edit Template?" : "Use Template?"}
        message="This will replace the fields currently on your canvas. Any unsaved changes to the current form will be lost."
        confirmLabel={pendingAction?.type === "edit" ? "Edit Template" : "Use Template"}
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};

export default TemplatesPanel;
