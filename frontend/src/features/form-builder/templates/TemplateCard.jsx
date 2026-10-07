import React from "react";
import { getTemplateIcon } from "./templateIcons";

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
};

const TemplateCard = ({ template, onEdit, onUse }) => {
  const Icon = getTemplateIcon(template.icon, template.category);
  const fieldCount = Array.isArray(template.fields) ? template.fields.length : 0;
  const updatedAt = formatDate(template.updatedAt);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1">
          {!template.isActive && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Inactive
            </span>
          )}
          {/* <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            v{template.version}
          </span> */}
        </div>
      </div>

      <h4 className="text-sm font-semibold text-gray-800 mb-1">{template.name}</h4>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">
        {template.description}
      </p>

      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-4">
        <span>{fieldCount} Field{fieldCount === 1 ? "" : "s"}</span>
        {updatedAt && (
          <>
            <span>&middot;</span>
            <span>Updated {updatedAt}</span>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(template)}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onUse(template)}
          className="flex-1 px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-blue-700 transition-colors"
        >
          Use Template
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;
