import React from "react";
import { FiEye, FiShare2, FiEdit2, FiInbox } from "react-icons/fi";
import { getTemplateIcon, CATEGORY_LABELS } from "../../form-builder/templates/templateIcons";

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return null;
  }
};

const AdminTemplateCard = ({ template, onView, onShare, onEdit, onToggleStatus, onViewResponses, responseCount = 0, isToggling }) => {
  const Icon = getTemplateIcon(template.icon, template.category);
  const fieldCount = Array.isArray(template.fields) ? template.fields.length : 0;
  const updatedAt = formatDate(template.updatedAt);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleStatus(template)}
            disabled={isToggling}
            title="Toggle active status"
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors disabled:opacity-50 ${
              template.isActive
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {template.isActive ? "Active" : "Inactive"}
          </button>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {CATEGORY_LABELS[template.category] || template.category}
          </span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-gray-800 mb-1">{template.name}</h4>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">{template.description}</p>

      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-4">
        <span>{fieldCount} Field{fieldCount === 1 ? "" : "s"}</span>
        {updatedAt && (
          <>
            <span>&middot;</span>
            <span>Updated {updatedAt}</span>
          </>
        )}
      </div>

      {onViewResponses && (
        <button
          onClick={() => onViewResponses(template)}
          className="mb-2 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#1F2853] hover:bg-white"
        >
          <span className="flex items-center gap-1.5">
            <FiInbox size={13} /> View Responses
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${responseCount ? "bg-[#1F2853] text-white" : "bg-slate-200 text-slate-500"}`}>
            {responseCount}
          </span>
        </button>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onView(template)}
          title="View"
          className="flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <FiEye size={14} />
        </button>
        <button
          onClick={() => onShare(template)}
          title="Share"
          className="flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-emerald-600 bg-white hover:bg-emerald-50 transition-colors"
        >
          <FiShare2 size={14} />
        </button>
        <button
          onClick={() => onEdit(template)}
          title="Edit in Form Builder"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-blue-700 transition-colors"
        >
          <FiEdit2 size={14} />
          Edit
        </button>
      </div>
    </div>
  );
};

export default AdminTemplateCard;
