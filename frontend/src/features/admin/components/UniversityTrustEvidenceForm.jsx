import React, { useState } from "react";
import { EVIDENCE_STATUSES, EVIDENCE_SOURCE_TYPES, EVIDENCE_SOURCE_TYPE_LABELS, EVIDENCE_STATUS_LABELS } from "../../universityTrust/utils/trustFormatting";

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] outline-none focus:border-[#1F2853] focus:ring-2 focus:ring-[#1F2853]/15";
const labelClass = "mb-1 block text-[12px] font-semibold text-slate-600";

// No field on this form can produce a final Trust Score directly — status/source/dates only.
// The scoring engine (backend) is the only thing that ever turns this into a number.
const UniversityTrustEvidenceForm = ({ criterion, initialValues, onSubmit, onCancel, submitting }) => {
  const [form, setForm] = useState({
    status: initialValues?.status || "verified",
    sourceType: initialValues?.sourceType || "officialUniversity",
    sourceName: initialValues?.sourceName || "",
    sourceUrl: initialValues?.sourceUrl || "",
    evidenceText: initialValues?.evidenceText || "",
    verifiedAt: toDateInput(initialValues?.verifiedAt),
    validFrom: toDateInput(initialValues?.validFrom),
    validUntil: toDateInput(initialValues?.validUntil),
    notes: initialValues?.notes || "",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, criterion });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={set("status")} className={inputClass}>
            {EVIDENCE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {EVIDENCE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Source Type</label>
          <select value={form.sourceType} onChange={set("sourceType")} className={inputClass}>
            {EVIDENCE_SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {EVIDENCE_SOURCE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Source Name</label>
        <input value={form.sourceName} onChange={set("sourceName")} placeholder="e.g. NAAC official portal" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Source URL</label>
        <input value={form.sourceUrl} onChange={set("sourceUrl")} placeholder="https://..." className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Evidence Summary</label>
        <textarea value={form.evidenceText} onChange={set("evidenceText")} rows={2} className={inputClass} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Verified On</label>
          <input type="date" value={form.verifiedAt} onChange={set("verifiedAt")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Valid From</label>
          <input type="date" value={form.validFrom} onChange={set("validFrom")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Valid Until</label>
          <input type="date" value={form.validUntil} onChange={set("validUntil")} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Internal Notes (admin-only, never shown publicly)</label>
        <textarea value={form.notes} onChange={set("notes")} rows={2} className={inputClass} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-600">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-[#1F2853] px-3.5 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-60">
          {submitting ? "Saving..." : "Save Evidence"}
        </button>
      </div>
    </form>
  );
};

export default UniversityTrustEvidenceForm;
