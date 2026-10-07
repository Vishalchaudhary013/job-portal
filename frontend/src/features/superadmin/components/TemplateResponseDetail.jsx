import { useMemo } from "react";
import { FiX, FiDownload, FiExternalLink } from "react-icons/fi";
import { resolveAssetUrl } from "../../../services/apiClient";
import { exportTemplateResponsePdf } from "../utils/exportTemplateResponsePdf";

const SKIP_TYPES = ["bannerUpload", "pdfUpload", "carouselUpload"];

const formatDateTime = (d) => {
  try {
    return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
};

const isSignatureDataUrl = (v) => typeof v === "string" && v.startsWith("data:image");
const basename = (p) => {
  const s = String(p || "");
  return s.split("/").pop() || s;
};

const textValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(textValue).join(", ");
  if (typeof value === "object") {
    if (value.label) return String(value.label);
    if (value.fileName) return String(value.fileName);
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

// Match how SharedTemplatePage / PreviewModal read a field's stored value.
const answerFor = (field, response, index) => {
  const keys = [field.id, field.name, String(index)].filter(Boolean);
  for (const k of keys) {
    if (response?.files && response.files[k] != null) return { filePath: response.files[k] };
  }
  for (const k of keys) {
    if (response?.data && response.data[k] !== undefined) return { raw: response.data[k] };
  }
  return {};
};

const TableAnswer = ({ field, value }) => {
  const rows = field.tableRows || [];
  const columns = field.tableColumns || [];
  const cells = value?.cells || {};
  if (!rows.length || !columns.length) {
    return <pre className="whitespace-pre-wrap break-words text-[13px] text-slate-700">{JSON.stringify(value, null, 2)}</pre>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {field.hasRowLabelColumn && <th className="border border-slate-200 bg-slate-50 px-2 py-1.5 text-left" />}
            {columns.map((col) => (
              <th key={col.key} className="border border-slate-200 bg-slate-50 px-2 py-1.5 text-left font-semibold text-slate-600">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              {field.hasRowLabelColumn && (
                <td className="border border-slate-200 bg-slate-50/60 px-2 py-1.5 font-medium text-slate-600">{r.label}</td>
              )}
              {columns.map((col) => (
                <td key={col.key} className="border border-slate-200 px-2 py-1.5 text-slate-700">
                  {cells[r.key]?.[col.key] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Answer = ({ field, response, index }) => {
  const { filePath, raw } = answerFor(field, response, index);

  if (filePath) {
    return (
      <a
        href={resolveAssetUrl(filePath)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F2853] hover:underline"
      >
        <FiExternalLink size={13} /> {basename(filePath)}
      </a>
    );
  }

  if (isSignatureDataUrl(raw)) {
    return <img src={raw} alt="signature" className="max-h-24 max-w-[280px] rounded border border-slate-200 bg-white object-contain p-1" />;
  }

  if (field.type === "table") return <TableAnswer field={field} value={raw} />;

  const text = textValue(raw);
  if (!text) return <span className="text-sm italic text-slate-400">No answer</span>;

  return <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{text}</p>;
};

/**
 * Read-only detail view of one template submission. Fields are laid out in the same
 * 1-/2-column grid the form was built with (`field.width === "half"` ⇒ half width),
 * question label on top, answer below — and can be downloaded as a matching PDF.
 */
const TemplateResponseDetail = ({ template, response, onClose }) => {
  const fields = useMemo(
    () => (template?.fields || []).filter((f) => !SKIP_TYPES.includes(f.type)),
    [template]
  );

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{template?.name}</h2>
          <p className="text-xs text-slate-500">Submitted {formatDateTime(response?.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportTemplateResponsePdf(template, response)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FiDownload size={13} /> Download PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {fields.length === 0 ? (
            <p className="text-center text-sm text-slate-500">This template has no fields.</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              {fields.map((field, index) => (
                <div
                  key={field.id ?? field.name ?? index}
                  className={field.width === "half" ? "md:col-span-1" : "md:col-span-2"}
                >
                  <div className="text-[13px] font-semibold text-slate-900">
                    {field.label || field.name || `Field ${index + 1}`}
                    {field.required && <span className="ml-0.5 text-red-500">*</span>}
                  </div>
                  {field.helperText && <p className="mb-1 text-xs text-slate-400">{field.helperText}</p>}
                  <div className="mt-1 rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <Answer field={field} response={response} index={index} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateResponseDetail;
