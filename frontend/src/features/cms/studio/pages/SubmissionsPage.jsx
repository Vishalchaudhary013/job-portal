import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, FileText, Inbox, MessageSquarePlus, Trash2 } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import DynamicFieldRenderer from "../../render/DynamicFieldRenderer";
import { isBlank } from "../../render/resolve";
import { flattenFields } from "../../shared/schemaUtils.js";
import { useStudio } from "../StudioContext";
import { useDebouncedValue, useLoader } from "../hooks";
import { Badge, Button, Card, Drawer, EmptyState, ErrorState, FormRow, PageHeader, Pagination, SearchInput, Select, Skeleton, StatusBadge, TextArea, TextInput, formatDateTime, timeAgo, useFeedback } from "../ui";

// All responses from every response form, with origin context (who, from
// which content entry, from where), status workflow, notes and history.

const AttachmentList = ({ value }) => {
  const { toast } = useFeedback();
  const items = (Array.isArray(value) ? value : [value]).filter((item) => item?.url);
  const open = async (item) => {
    try {
      // Attachments are private: fetch with the admin session, then open.
      const mediaId = item.id || /\/media\/([a-f0-9]{24})\//.exec(item.url)?.[1];
      const blob = mediaId ? await cmsAdmin.downloadMedia(mediaId) : null;
      if (!blob) throw new Error("File unavailable.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.name || "attachment";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      toast(cmsError(error, error.message).message, "error");
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <button key={index} type="button" onClick={() => open(item)} className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 px-2.5 py-1.5 text-sm text-[#1F2853] hover:bg-slate-50">
          <FileText size={14} /> {item.name || "Attachment"}
        </button>
      ))}
    </div>
  );
};

const SubmissionDrawer = ({ submissionId, onClose, onChanged }) => {
  const { can } = useStudio();
  const { toast, confirm } = useFeedback();
  const [state, setState] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    setState(null);
    cmsAdmin.getSubmission(submissionId).then(setState).catch((error) => setState({ error: cmsError(error).message }));
  }, [submissionId]);

  const answers = useMemo(() => {
    if (!state?.submission) return [];
    // Top-level answers (sections flattened); nested values render inside their group/repeater.
    return flattenFields(state.fields)
      .filter(({ field, path }) => field.key && !path.includes(".") && !path.includes("[]"))
      .map(({ field }) => ({ field, value: state.submission.data?.[field.key] }));
  }, [state]);
  const known = new Set(answers.map(({ field }) => field.key));
  const extra = state?.submission ? Object.entries(state.submission.data || {}).filter(([key]) => !known.has(key)) : [];

  const setStatus = async (status) => {
    try {
      const result = await cmsAdmin.setSubmissionStatus(submissionId, status);
      setState((current) => ({ ...current, submission: result.submission }));
      onChanged();
    } catch (error) {
      toast(cmsError(error).message, "error");
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const result = await cmsAdmin.addSubmissionNote(submissionId, noteText);
      setState((current) => ({ ...current, submission: result.submission }));
      setNoteText("");
    } catch (error) {
      toast(cmsError(error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const submission = state?.submission;
  return (
    <Drawer
      open={Boolean(submissionId)}
      onClose={onClose}
      title={state?.form?.name || "Response"}
      description={submission ? `Submitted ${formatDateTime(submission.createdAt)} · form v${submission.formVersion}` : ""}
      footer={
        submission && can("submissions.manage") && (
          <Button
            variant="danger-ghost"
            icon={Trash2}
            className="mr-auto"
            onClick={async () => {
              if (!(await confirm({ title: "Delete this response?", message: "This can't be undone.", confirmLabel: "Delete", tone: "danger" }))) return;
              cmsAdmin.deleteSubmission(submissionId).then(() => { toast("Deleted."); onChanged(); onClose(); }).catch((error) => toast(cmsError(error).message, "error"));
            }}
          >
            Delete
          </Button>
        )
      }
    >
      {!state ? (
        <div className="space-y-3">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>
      ) : state.error ? (
        <ErrorState message={state.error} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 rounded-sm bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</p>
              <p className="text-slate-800">{submission.userName || "Anonymous"}</p>
              {submission.userEmail && <p className="text-slate-600">{submission.userEmail}</p>}
              {submission.userId && <p className="font-mono text-[11px] text-slate-400">user {submission.userId}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origin</p>
              {submission.contentId ? (
                <Link to={`/form-builder/content/${submission.contentId}`} className="text-[#1F2853] hover:underline">{submission.contentTitle || "Content entry"}</Link>
              ) : (
                <p className="text-slate-600">Not tied to an entry</p>
              )}
              <p className="text-slate-600">Source: {submission.source}</p>
              {submission.context?.pageUrl && <p className="truncate text-xs text-slate-500" title={submission.context.pageUrl}>{submission.context.pageUrl}</p>}
            </div>
          </div>

          <FormRow label="Status">
            <Select value={submission.status} disabled={!can("submissions.manage")} onChange={(event) => setStatus(event.target.value)}>
              {[...new Set([submission.status, ...(state.form?.statuses || [])])].map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </FormRow>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Answers</h3>
            <dl className="space-y-4">
              {answers.map(({ field, value }) => (
                <div key={field.id}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</dt>
                  <dd className="mt-1 text-sm">
                    {isBlank(value) ? (
                      <span className="text-slate-400">—</span>
                    ) : ["file", "image"].includes(field.type) ? (
                      <AttachmentList value={value} />
                    ) : (
                      <DynamicFieldRenderer fieldRef={{ id: field.id, key: field.key, type: field.type, label: field.label, field }} value={value} compact />
                    )}
                  </dd>
                </div>
              ))}
              {extra.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key} <span className="normal-case text-slate-400">(no longer in form)</span></dt>
                  <dd className="mt-1 break-words text-sm text-slate-700">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Notes</h3>
            <div className="space-y-2">
              {submission.notes.map((note) => (
                <div key={note._id} className="rounded-sm border border-slate-200 p-3">
                  <p className="whitespace-pre-line text-sm text-slate-800">{note.text}</p>
                  <p className="mt-1 text-xs text-slate-500">{note.author?.name} · {timeAgo(note.createdAt)}</p>
                </div>
              ))}
              {!submission.notes.length && <p className="text-sm text-slate-400">No notes yet.</p>}
            </div>
            {can("submissions.manage") && (
              <div className="mt-3 space-y-2">
                <TextArea rows={2} placeholder="Add an internal note…" value={noteText} onChange={(event) => setNoteText(event.target.value)} />
                <Button size="sm" icon={MessageSquarePlus} loading={saving} disabled={!noteText.trim()} onClick={addNote}>Add note</Button>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">History</h3>
            <ol className="space-y-2 border-l-2 border-slate-200 pl-4">
              {[...submission.history].reverse().map((item, index) => (
                <li key={index} className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">
                    {item.action === "created" ? "Submitted" : item.action === "status" ? `Status ${item.from} → ${item.to}` : item.action === "note" ? "Note added" : item.action}
                  </span>
                  <span className="text-xs text-slate-500"> · {item.by?.name || "Student"} · {formatDateTime(item.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Drawer>
  );
};

const SubmissionsPage = () => {
  const { can } = useStudio();
  const { toast } = useFeedback();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const q = useDebouncedValue(search);
  const formId = params.get("formId") || "";
  const status = params.get("status") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const page = Number(params.get("page")) || 1;

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
    setSelected([]);
  };

  const forms = useLoader(() => cmsAdmin.listForms({ status: "all" }), []);
  const list = useLoader(() => cmsAdmin.listSubmissions({ formId: formId || undefined, status: status || undefined, from: from || undefined, to: to || undefined, q: q || undefined, page }), [formId, status, from, to, q, page]);
  const currentForm = forms.data?.items?.find((form) => form.id === formId);
  const statuses = currentForm?.published?.settings?.statuses || ["new", "in-review", "accepted", "rejected", "archived"];

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { blob, name } = await cmsAdmin.exportSubmissions({ formId, status: status || undefined, from: from || undefined, to: to || undefined, q: q || undefined });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      toast(cmsError(error, "Export failed.").message, "error");
    } finally {
      setExporting(false);
    }
  };

  const bulk = async (nextStatus) => {
    try {
      const result = await cmsAdmin.bulkSubmissionStatus(selected, nextStatus);
      toast(`${result.changed} response${result.changed === 1 ? "" : "s"} updated.`);
      setSelected([]);
      list.reload();
    } catch (error) {
      toast(cmsError(error).message, "error");
    }
  };

  const items = list.data?.items || [];
  return (
    <>
      <PageHeader
        title="All responses"
        description="Submissions from every published response form."
        actions={
          can("submissions.export") && (
            <Button icon={Download} loading={exporting} disabled={!formId} title={formId ? "" : "Choose a form to export"} onClick={exportCsv}>
              Export CSV
            </Button>
          )
        }
      />
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_200px_160px_140px_140px]">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setParam("page", ""); }} placeholder="Search answers, names, emails" />
        <Select value={formId} onChange={(event) => setParam("formId", event.target.value)} aria-label="Form">
          <option value="">All forms</option>
          {(forms.data?.items || []).map((form) => <option key={form.id} value={form.id}>{form.name}</option>)}
        </Select>
        <Select value={status} onChange={(event) => setParam("status", event.target.value)} aria-label="Status">
          <option value="">Any status</option>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <TextInput type="date" aria-label="From date" value={from} onChange={(event) => setParam("from", event.target.value)} />
        <TextInput type="date" aria-label="To date" value={to} onChange={(event) => setParam("to", event.target.value)} />
      </div>

      {selected.length > 0 && can("submissions.manage") && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-sm bg-[#1F2853] px-3 py-2 text-sm text-white">
          <span className="mr-2">{selected.length} selected</span>
          <span className="text-white/70">Set status:</span>
          {statuses.map((item) => (
            <button key={item} type="button" onClick={() => bulk(item)} className="rounded-sm bg-white/10 px-2 py-1 text-xs font-medium hover:bg-white/20">{item}</button>
          ))}
          <button type="button" onClick={() => setSelected([])} className="ml-auto text-xs text-white/80 hover:text-white">Clear</button>
        </div>
      )}

      {list.error && <ErrorState message={list.error.message} onRetry={list.reload} />}
      {list.loading && !list.data ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-14" />)}</div>
      ) : !items.length ? (
        <EmptyState icon={Inbox} title="No responses" description={q || status || formId ? "Nothing matches these filters." : "Responses appear here when Edeco users submit a published form."} />
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
              {can("submissions.manage") && (
                <input
                  type="checkbox"
                  aria-label="Select response"
                  className="h-4 w-4 accent-[#1F2853]"
                  checked={selected.includes(item.id)}
                  onChange={() => setSelected((current) => (current.includes(item.id) ? current.filter((x) => x !== item.id) : [...current, item.id]))}
                />
              )}
              <button type="button" onClick={() => setOpenId(item.id)} className="grid min-w-0 flex-1 gap-0.5 text-left sm:grid-cols-[minmax(0,1fr)_200px_110px] sm:items-center sm:gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{item.userName || item.userEmail || "Anonymous"}</span>
                  <span className="block truncate text-xs text-slate-500">{item.form?.name || item.formSlug}{item.contentTitle ? ` · ${item.contentTitle}` : ""}</span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.noteCount > 0 && <Badge>{item.noteCount} note{item.noteCount === 1 ? "" : "s"}</Badge>}
                </span>
                <span className="text-xs text-slate-500" title={formatDateTime(item.createdAt)}>{timeAgo(item.createdAt)}</span>
              </button>
            </div>
          ))}
        </Card>
      )}
      <Pagination pagination={list.data?.pagination} onPage={(next) => setParam("page", String(next))} />

      <SubmissionDrawer submissionId={openId} onClose={() => setOpenId(null)} onChanged={list.reload} />
    </>
  );
};

export default SubmissionsPage;
