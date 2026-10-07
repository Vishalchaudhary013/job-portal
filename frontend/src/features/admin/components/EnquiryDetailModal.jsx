import React, { useCallback, useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import {
  getEnquiryById,
  updateEnquiryStatus,
  updateAdmissionFlags,
  sendCounsellingPackage,
  sendPostAdmissionMessage,
  getEnquiryMessages,
} from "../../../services/enquiryAPI";
import { getDegreePrograms } from "../../../services/degreeProgramAPI";
import { getErrorMessage } from "../../../services/apiClient";

const STATUS_OPTIONS = ["new", "counselled", "applied", "admitted", "enrolled", "closed"];

const POST_ADMISSION_TYPES = [
  { key: "lms_credentials", label: "LMS Credentials", fields: [
    { key: "lmsUrl", label: "LMS URL", type: "text" },
    { key: "username", label: "Username", type: "text" },
    { key: "password", label: "Password", type: "text" },
  ] },
  { key: "orientation", label: "Orientation", fields: [
    { key: "date", label: "Date / Time", type: "text" },
    { key: "link", label: "Join Link", type: "text" },
    { key: "notes", label: "Notes", type: "textarea" },
  ] },
  { key: "class_schedule", label: "Class Schedule", fields: [
    { key: "scheduleText", label: "Schedule", type: "textarea" },
    { key: "link", label: "Full Schedule Link", type: "text" },
  ] },
  { key: "exam_notification", label: "Exam Notification", fields: [
    { key: "examName", label: "Exam Name", type: "text" },
    { key: "date", label: "Date", type: "text" },
    { key: "details", label: "Details", type: "textarea" },
  ] },
];

const SectionCard = ({ title, children }) => (
  <div className="rounded-xl border border-[#EEF2FF] p-4">
    <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">{title}</h4>
    {children}
  </div>
);

const SendResultNote = ({ results }) => {
  if (!results) return null;
  const parts = Object.entries(results).map(([channel, result]) => `${channel}: ${result.sent ? "sent" : result.message}`);
  return <p className="mt-2 text-[12px] text-slate-500">{parts.join(" · ")}</p>;
};

const EnquiryDetailModal = ({ enquiryId, onClose, onChanged }) => {
  const [enquiry, setEnquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusValue, setStatusValue] = useState("new");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  const [documentsPending, setDocumentsPending] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [flagsSaving, setFlagsSaving] = useState(false);
  const [flagsResult, setFlagsResult] = useState(null);

  const [programSearch, setProgramSearch] = useState("");
  const [programResults, setProgramResults] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [includeComparison, setIncludeComparison] = useState(false);
  const [includeBrochure, setIncludeBrochure] = useState(false);
  const [includeFeeDetails, setIncludeFeeDetails] = useState(true);
  const [includeApplicationLink, setIncludeApplicationLink] = useState(true);
  const [counsellorName, setCounsellorName] = useState("");
  const [notes, setNotes] = useState("");
  const [counsellingSending, setCounsellingSending] = useState(false);
  const [counsellingResult, setCounsellingResult] = useState(null);

  const [activePostAdmissionType, setActivePostAdmissionType] = useState(null);
  const [postAdmissionPayload, setPostAdmissionPayload] = useState({});
  const [postAdmissionSending, setPostAdmissionSending] = useState(false);
  const [postAdmissionResult, setPostAdmissionResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [enquiryResponse, messagesResponse] = await Promise.all([getEnquiryById(enquiryId), getEnquiryMessages(enquiryId)]);
      const data = enquiryResponse.data;
      setEnquiry(data);
      setMessages(messagesResponse.data);
      setStatusValue(data.status);
      setDocumentsPending(data.admission?.documentsPending || false);
      setPaymentPending(data.admission?.paymentPending || false);
      setApplicationDeadline(data.admission?.applicationDeadline ? data.admission.applicationDeadline.slice(0, 10) : "");
      setRecommended(data.counselling?.recommendedProgramIds || []);
      setCounsellorName(data.counselling?.counsellorName || "");
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load this enquiry."));
    } finally {
      setLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!programSearch.trim()) {
      setProgramResults([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      getDegreePrograms({ search: programSearch, limit: 5 })
        .then((res) => setProgramResults(res.data))
        .catch(() => setProgramResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [programSearch]);

  const notifyChanged = () => {
    onChanged?.();
    load();
  };

  const handleStatusSave = async () => {
    setStatusSaving(true);
    setStatusResult(null);
    try {
      const res = await updateEnquiryStatus(enquiryId, statusValue);
      setStatusResult(res.data.sendResults);
      notifyChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update status."));
    } finally {
      setStatusSaving(false);
    }
  };

  const handleFlagsSave = async () => {
    setFlagsSaving(true);
    setFlagsResult(null);
    try {
      const res = await updateAdmissionFlags(enquiryId, { documentsPending, paymentPending, applicationDeadline: applicationDeadline || null });
      setFlagsResult(res.data.sendResults);
      notifyChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update admission flags."));
    } finally {
      setFlagsSaving(false);
    }
  };

  const addRecommended = (program) => {
    if (recommended.some((p) => p._id === program._id)) return;
    setRecommended((prev) => [...prev, program]);
    setProgramSearch("");
    setProgramResults([]);
  };

  const removeRecommended = (id) => setRecommended((prev) => prev.filter((p) => p._id !== id));

  const handleSendCounsellingPackage = async () => {
    setCounsellingSending(true);
    setCounsellingResult(null);
    try {
      const res = await sendCounsellingPackage(enquiryId, {
        recommendedProgramIds: recommended.map((p) => p._id),
        includeComparison,
        includeBrochure,
        includeFeeDetails,
        includeApplicationLink,
        notes,
        counsellorName,
      });
      setCounsellingResult(res.data.sendResults);
      notifyChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send counselling package."));
    } finally {
      setCounsellingSending(false);
    }
  };

  const handleSendPostAdmission = async () => {
    if (!activePostAdmissionType) return;
    setPostAdmissionSending(true);
    setPostAdmissionResult(null);
    try {
      const res = await sendPostAdmissionMessage(enquiryId, activePostAdmissionType, postAdmissionPayload);
      setPostAdmissionResult(res.data.sendResults);
      notifyChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send message."));
    } finally {
      setPostAdmissionSending(false);
    }
  };

  const activeTypeConfig = POST_ADMISSION_TYPES.find((t) => t.key === activePostAdmissionType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700">
          <FiX size={20} />
        </button>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : !enquiry ? (
          <p className="text-red-600">{error || "Enquiry not found."}</p>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{enquiry.name}</h3>
              <p className="text-sm text-slate-500">
                {enquiry.email} · {enquiry.phone}
              </p>
              {enquiry.programId && <p className="text-sm text-slate-600 mt-1">Program: {enquiry.programId.programName}</p>}
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <SectionCard title="Status">
              <div className="flex flex-wrap items-center gap-2">
                <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)} className="border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm bg-slate-50">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleStatusSave}
                  disabled={statusSaving}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#1F2853] text-white hover:bg-[#141c3d] disabled:opacity-60"
                >
                  {statusSaving ? "Saving…" : "Update Status"}
                </button>
              </div>
              <SendResultNote results={statusResult} />
            </SectionCard>

            <SectionCard title="Admission">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={documentsPending} onChange={(e) => setDocumentsPending(e.target.checked)} className="accent-blue-700 w-4 h-4" />
                  Documents Pending
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={paymentPending} onChange={(e) => setPaymentPending(e.target.checked)} className="accent-blue-700 w-4 h-4" />
                  Payment Pending
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm text-slate-600">Application Deadline</label>
                <input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} className="border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm bg-slate-50" />
                <button
                  type="button"
                  onClick={handleFlagsSave}
                  disabled={flagsSaving}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#1F2853] text-white hover:bg-[#141c3d] disabled:opacity-60"
                >
                  {flagsSaving ? "Saving…" : "Save"}
                </button>
              </div>
              <SendResultNote results={flagsResult} />
            </SectionCard>

            <SectionCard title="Counselling Package">
              <div className="space-y-3">
                <div className="relative">
                  <input
                    value={programSearch}
                    onChange={(e) => setProgramSearch(e.target.value)}
                    placeholder="Search programs to recommend…"
                    className="w-full border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm bg-slate-50"
                  />
                  {programResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#EEF2FF] bg-white shadow-lg">
                      {programResults.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => addRecommended(p)}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          {p.programName} — {p.university?.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {recommended.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recommended.map((p) => (
                      <span key={p._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EEF2FF] text-[#1F2853] text-xs font-medium">
                        {p.programName}
                        <button type="button" onClick={() => removeRecommended(p._id)} className="hover:text-red-600">
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={includeComparison} onChange={(e) => setIncludeComparison(e.target.checked)} className="accent-blue-700 w-3.5 h-3.5" />
                    Comparison
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={includeBrochure} onChange={(e) => setIncludeBrochure(e.target.checked)} className="accent-blue-700 w-3.5 h-3.5" />
                    Brochure
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={includeFeeDetails} onChange={(e) => setIncludeFeeDetails(e.target.checked)} className="accent-blue-700 w-3.5 h-3.5" />
                    Fee Details
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={includeApplicationLink} onChange={(e) => setIncludeApplicationLink(e.target.checked)} className="accent-blue-700 w-3.5 h-3.5" />
                    Application Link
                  </label>
                </div>

                <input
                  value={counsellorName}
                  onChange={(e) => setCounsellorName(e.target.value)}
                  placeholder="Counsellor name"
                  className="w-full border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm bg-slate-50"
                />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for the student…"
                  rows={2}
                  className="w-full border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm bg-slate-50"
                />

                <button
                  type="button"
                  onClick={handleSendCounsellingPackage}
                  disabled={counsellingSending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1F2853] text-white hover:bg-[#141c3d] disabled:opacity-60"
                >
                  {counsellingSending ? "Sending…" : "Send Counselling Package"}
                </button>
                <SendResultNote results={counsellingResult} />
              </div>
            </SectionCard>

            <SectionCard title="Post-Admission Messages">
              <div className="flex flex-wrap gap-2 mb-3">
                {POST_ADMISSION_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setActivePostAdmissionType(t.key);
                      setPostAdmissionPayload({});
                      setPostAdmissionResult(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      activePostAdmissionType === t.key ? "bg-[#1F2853] text-white border-[#1F2853]" : "bg-slate-50 text-slate-700 border-[#EEF2FF] hover:bg-slate-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTypeConfig && (
                <div className="space-y-2">
                  {activeTypeConfig.fields.map((field) => (
                    <div key={field.key}>
                      {field.type === "textarea" ? (
                        <textarea
                          value={postAdmissionPayload[field.key] || ""}
                          onChange={(e) => setPostAdmissionPayload((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.label}
                          rows={2}
                          className="w-full border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm bg-slate-50"
                        />
                      ) : (
                        <input
                          value={postAdmissionPayload[field.key] || ""}
                          onChange={(e) => setPostAdmissionPayload((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.label}
                          className="w-full border border-[#EEF2FF] rounded-lg px-3 py-2 text-sm bg-slate-50"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleSendPostAdmission}
                    disabled={postAdmissionSending}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1F2853] text-white hover:bg-[#141c3d] disabled:opacity-60"
                  >
                    {postAdmissionSending ? "Sending…" : `Send ${activeTypeConfig.label}`}
                  </button>
                  <SendResultNote results={postAdmissionResult} />
                </div>
              )}
            </SectionCard>

            <SectionCard title="Message Log">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-400">No messages sent yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m._id} className="flex items-center justify-between text-xs text-slate-600 border-b border-[#EEF2FF] py-1.5">
                      <span>
                        {m.channel} · {m.messageType}
                      </span>
                      <span className={m.status === "sent" ? "text-emerald-600" : m.status === "failed" ? "text-red-600" : "text-slate-400"}>
                        {m.status}
                      </span>
                      <span className="text-slate-400">{new Date(m.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnquiryDetailModal;
