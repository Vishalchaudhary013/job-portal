import { useEffect, useMemo, useState } from "react";
import { FiX, FiTrash2, FiDownload, FiExternalLink, FiEye } from "react-icons/fi";
import { getErrorMessage, resolveAssetUrl } from "../../../services/apiClient";
import { getTemplateResponses, deleteTemplateResponse } from "../../../services/templatesAPI";
import TemplateResponseDetail from "./TemplateResponseDetail";

const formatDateTime = (d) => {
  try {
    return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
};

// Turn one stored value into readable text for the table / CSV.
const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(displayValue).join(", ");
  if (typeof value === "object") {
    if (value.label) return value.label;
    if (value.fileName) return value.fileName;
    return JSON.stringify(value);
  }
  return String(value);
};

const isSignatureDataUrl = (v) => typeof v === "string" && v.startsWith("data:image");

const csvCell = (text) => {
  const s = String(text ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Super-admin view of every submission to a standalone shared template. Columns come from
 * the template's current field definitions; rows are the stored responses.
 */
const TemplateResponsesModal = ({ template, onClose }) => {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });
  const [deletingId, setDeletingId] = useState(null);
  const [detailResponse, setDetailResponse] = useState(null);

  const load = () => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    getTemplateResponses(template._id)
      .then((data) => setState({ status: "ready", data, error: "" }))
      .catch((err) => setState({ status: "error", data: null, error: getErrorMessage(err, "Failed to load responses.") }));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template._id]);

  const columns = useMemo(() => {
    const fields = state.data?.template?.fields || template.fields || [];
    return fields
      .filter((f) => !["bannerUpload", "pdfUpload", "carouselUpload"].includes(f.type))
      .map((f, i) => ({ id: f.id ?? f.name ?? String(i), label: f.label || f.name || `Field ${i + 1}`, type: f.type }));
  }, [state.data, template.fields]);

  const responses = useMemo(() => state.data?.responses || [], [state.data]);

  // Keys present in the stored responses that don't line up with any known field —
  // surfaces mismatches instead of silently showing "—".
  const orphanKeys = useMemo(() => {
    const known = new Set(columns.map((c) => c.id));
    const extra = new Set();
    responses.forEach((r) => {
      Object.keys(r.data || {}).forEach((k) => {
        if (!known.has(k)) extra.add(k);
      });
      Object.keys(r.files || {}).forEach((k) => {
        if (!known.has(k)) extra.add(k);
      });
    });
    return [...extra];
  }, [columns, responses]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this response permanently?")) return;
    setDeletingId(id);
    try {
      await deleteTemplateResponse(id);
      setState((s) => ({
        ...s,
        data: { ...s.data, responses: s.data.responses.filter((r) => r._id !== id), total: s.data.total - 1 },
      }));
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete response."));
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = () => {
    const header = ["Submitted at", ...columns.map((c) => c.label)];
    const rows = responses.map((r) => [
      formatDateTime(r.createdAt),
      ...columns.map((c) => {
        if (r.files?.[c.id]) return r.files[c.id];
        return displayValue(r.data?.[c.id]);
      }),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(template.name || "template").replace(/[^a-z0-9]/gi, "_").toLowerCase()}-responses.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Responses — {template.name}</h2>
            <p className="text-xs text-slate-500">
              {state.status === "ready" ? `${state.data.total} response${state.data.total === 1 ? "" : "s"}` : " "}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {responses.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FiDownload size={13} /> Export CSV
              </button>
            )}
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
          {state.status === "loading" && <p className="p-10 text-center text-sm text-slate-500">Loading responses…</p>}
          {state.status === "error" && (
            <div className="p-10 text-center text-sm text-red-600">
              {state.error}
              <button type="button" onClick={load} className="ml-2 font-semibold underline">
                Retry
              </button>
            </div>
          )}
          {state.status === "ready" && responses.length === 0 && (
            <p className="p-10 text-center text-sm text-slate-500">No one has submitted this form yet.</p>
          )}

          {state.status === "ready" && responses.length > 0 && (
            <>
              {orphanKeys.length > 0 && (
                <div className="mx-4 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                  Some stored keys don&rsquo;t match this template&rsquo;s current fields (shown as extra columns):{" "}
                  <span className="font-semibold">{orphanKeys.join(", ")}</span>. This usually means the template was
                  edited after these responses came in.
                </div>
              )}
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Submitted</th>
                    {columns.map((c) => (
                      <th key={c.id} className="px-4 py-2.5">
                        {c.label}
                      </th>
                    ))}
                    {orphanKeys.map((k) => (
                      <th key={k} className="px-4 py-2.5 text-amber-700">
                        {k}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => {
                    const cell = (key) => {
                      const filePath = r.files?.[key];
                      const raw = r.data?.[key];
                      if (filePath) {
                        return (
                          <a
                            href={resolveAssetUrl(filePath)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#1F2853] hover:underline"
                          >
                            <FiExternalLink size={12} /> View file
                          </a>
                        );
                      }
                      if (isSignatureDataUrl(raw)) return <img src={raw} alt="signature" className="h-10 max-w-[160px] object-contain" />;
                      return <span className="whitespace-pre-wrap break-words">{displayValue(raw)}</span>;
                    };
                    return (
                      <tr key={r._id} className="border-t border-slate-100 align-top">
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => setDetailResponse(r)}
                            title="View full response"
                            className="font-semibold text-[#1F2853] hover:underline"
                          >
                            {formatDateTime(r.createdAt)}
                          </button>
                        </td>
                        {columns.map((c) => (
                          <td key={c.id} className="px-4 py-2.5 text-slate-700">
                            {cell(c.id)}
                          </td>
                        ))}
                        {orphanKeys.map((k) => (
                          <td key={k} className="px-4 py-2.5 text-slate-700">
                            {cell(k)}
                          </td>
                        ))}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setDetailResponse(r)}
                              title="View full response"
                              className="text-slate-400 hover:text-[#1F2853]"
                            >
                              <FiEye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r._id)}
                              disabled={deletingId === r._id}
                              title="Delete response"
                              className="text-slate-400 hover:text-red-600 disabled:opacity-40"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {detailResponse && (
          <TemplateResponseDetail
            template={state.data?.template || template}
            response={detailResponse}
            onClose={() => setDetailResponse(null)}
          />
        )}
    </div>
  );
};

export default TemplateResponsesModal;
