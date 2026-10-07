import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Archive, ArchiveRestore, ArrowLeft, Copy, Eye, EyeOff, History, Rocket, RotateCcw, Save, Send, Trash2, Undo2 } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import DynamicFields from "../../inputs/DynamicFields";
import { MediaHandlerContext } from "../../inputs/MediaInput";
import { defaultDataFor } from "../../shared/fieldTypes.js";
import { toSlug } from "../../shared/ids.js";
import { validateData } from "../../shared/validation.js";
import Icon from "../Icon";
import { useStudio } from "../StudioContext";
import { useAutosave, useBeforeUnload, useHotkeys } from "../hooks";
import useMediaPicker from "../media/useMediaPicker";
import PreviewModal from "../preview/PreviewModal";
import { Alert, Badge, Button, Card, ErrorState, FormRow, Modal, PageLoader, SaveIndicator, StatusBadge, TextArea, TextInput, formatDateTime, timeAgo, useFeedback } from "../ui";

// Content editor: the form is rendered from the content type's schema — there
// are no hand-written forms per content type. Drafts autosave; publishing
// snapshots the draft as a new version that Edeco serves.

const VersionsModal = ({ open, onClose, entry, onRestored }) => {
  const { confirm, toast } = useFeedback();
  const [items, setItems] = useState(null);
  useEffect(() => {
    if (!open) return;
    setItems(null);
    cmsAdmin.contentVersions(entry.id).then((result) => setItems(result.items)).catch(() => setItems([]));
  }, [open, entry.id]);
  return (
    <Modal open={open} onClose={onClose} title="Published versions" size="md">
      {!items ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !items.length ? (
        <p className="text-sm text-slate-500">This entry hasn't been published yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.version} className="flex items-center gap-3 py-2.5">
              <Badge tone={item.version === entry.version ? "green" : "neutral"}>v{item.version}</Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)} · {item.createdBy?.name}{item.note ? ` · ${item.note}` : ""}</p>
              </div>
              <Button
                size="sm"
                icon={RotateCcw}
                onClick={async () => {
                  if (!(await confirm({ title: `Restore v${item.version}?`, message: "Its content replaces the current draft. The live version doesn't change until you publish.", confirmLabel: "Restore" }))) return;
                  try {
                    await cmsAdmin.restoreContentVersion(entry.id, item.version);
                    toast(`v${item.version} restored into the draft.`);
                    onClose();
                    onRestored();
                  } catch (error) {
                    toast(cmsError(error).message, "error");
                  }
                }}
              >
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

const ContentEditorPage = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { can } = useStudio();
  const { toast, confirm } = useFeedback();
  const { handler: mediaHandler, picker } = useMediaPicker();
  const isNew = !id;
  const [ctx, setCtx] = useState(null); // { entry, contentType, formSchema, formSource }
  const [loadError, setLoadError] = useState(null);
  const [values, setValues] = useState(null);
  const [slug, setSlug] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [noteFor, setNoteFor] = useState(null); // action needing a note
  const [note, setNote] = useState("");
  const revision = useRef(0);
  const canWrite = can("content.write");
  const archived = ctx?.entry?.status === "archived";

  // Unpublished entries' slugs follow the title on the server; mirror that
  // unless the admin is typing in the slug box.
  const slugEditing = useRef(false);
  const save = useCallback(
    async (data) => {
      const result = await cmsAdmin.saveContent(id, { data, revision: revision.current, autosave: true });
      revision.current = result.entry.revision;
      setCtx((current) => ({ ...current, entry: result.entry }));
      if (!slugEditing.current) setSlug(result.entry.slug);
      setErrors({});
    },
    [id],
  );
  const autosave = useAutosave({ value: values, save, delay: 2000, enabled: !isNew && canWrite && values !== null && !archived });
  const markSaved = autosave.markSaved;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      let data;
      if (isNew) {
        const typeId = params.get("type");
        if (!typeId) throw new Error("Choose a content type first.");
        const result = await cmsAdmin.newEntryContext(typeId);
        data = defaultDataFor(result.formSchema?.fields || []);
        setCtx({ ...result, entry: null });
        setSlug("");
      } else {
        const result = await cmsAdmin.getContent(id);
        revision.current = result.entry.revision;
        data = result.entry.draft?.data || {};
        setCtx(result);
        setSlug(result.entry.slug);
      }
      // Opening an entry must not count as an edit.
      markSaved(data);
      setValues(data);
      setErrors({});
    } catch (error) {
      setLoadError(cmsError(error, error.message || "Couldn't open this entry."));
    }
  }, [id, isNew, params, markSaved]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (autosave.error?.fieldErrors) setErrors(autosave.error.fieldErrors);
  }, [autosave.error]);

  useBeforeUnload(isNew ? Boolean(values && Object.keys(values).length) : autosave.dirty);

  const fields = ctx?.formSchema?.fields || [];
  const entry = ctx?.entry;

  const createEntry = async () => {
    setBusy("create");
    try {
      const result = await cmsAdmin.createContent({ contentTypeId: ctx.contentType.id, data: values, slug: slug || undefined });
      toast("Draft created.");
      navigate(`/form-builder/content/${result.entry.id}`, { replace: true });
    } catch (error) {
      const parsed = cmsError(error);
      if (parsed.fieldErrors) setErrors(parsed.fieldErrors);
      toast(parsed.message, "error");
    } finally {
      setBusy("");
    }
  };

  const saveNow = async () => {
    if (isNew) return createEntry();
    const ok = await autosave.saveNow();
    if (ok) toast("Draft saved.");
    return ok;
  };
  useHotkeys({ "mod+s": saveNow });

  const runAction = async (action, actionNote = "") => {
    // Publishing/review need a complete entry — check locally first for instant feedback.
    if (["publish", "submitReview"].includes(action)) {
      const check = validateData(fields, values, { enforceRequired: true });
      if (!check.valid) {
        setErrors(check.errors);
        toast("Complete the highlighted fields first.", "error");
        return;
      }
    }
    setBusy(action);
    try {
      if (autosave.dirty && !(await autosave.saveNow())) throw new Error("Save the draft first — it has problems.");
      const result = await cmsAdmin.contentAction(entry.id, action, actionNote);
      revision.current = result.entry.revision;
      setCtx((current) => ({ ...current, entry: result.entry }));
      if (action === "discardChanges") {
        setValues(result.entry.draft?.data || {});
        autosave.markSaved(result.entry.draft?.data || {});
        setSlug(result.entry.slug);
      }
      toast(
        {
          publish: "Published — it's live on Edeco.",
          unpublish: "Unpublished — removed from Edeco.",
          submitReview: "Sent for review.",
          archive: "Archived.",
          restore: "Restored as a draft.",
          discardChanges: "Draft changes discarded.",
        }[action],
      );
      setNoteFor(null);
      setNote("");
    } catch (error) {
      const parsed = cmsError(error, error.message);
      if (parsed.fieldErrors) setErrors(parsed.fieldErrors);
      toast(parsed.message, "error");
    } finally {
      setBusy("");
    }
  };

  const saveSlug = async () => {
    const next = toSlug(slug);
    if (!next || next === entry.slug) return setSlug(entry.slug);
    try {
      const result = await cmsAdmin.saveContent(entry.id, { data: values, slug: next, revision: revision.current });
      revision.current = result.entry.revision;
      setCtx((current) => ({ ...current, entry: result.entry }));
      setSlug(result.entry.slug);
      autosave.markSaved(values);
      toast(entry.published ? "URL updated — it changes on Edeco at the next publish." : "URL updated.");
    } catch (error) {
      toast(cmsError(error).message, "error");
      setSlug(entry.slug);
    }
  };

  const errorCount = Object.keys(errors).length;
  const statusHelp = useMemo(() => {
    if (!entry) return "New entries start as drafts. Nothing appears on Edeco until you publish.";
    return {
      draft: "Draft — not visible on Edeco.",
      review: "Waiting for review — not visible on Edeco yet.",
      published: entry.hasUnpublishedChanges ? "Live on Edeco. Your newer edits are saved as a draft until you publish again." : "Live on Edeco.",
      unpublished: "Taken off Edeco. Publish again to bring it back.",
      archived: "Archived — read-only and hidden from Edeco.",
    }[entry.status];
  }, [entry]);

  if (loadError) return <ErrorState message={loadError.message} onRetry={load} />;
  if (!ctx || values === null) return <PageLoader />;

  return (
    <MediaHandlerContext.Provider value={mediaHandler}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link to={`/form-builder/content?type=${ctx.contentType.id}`} aria-label="Back to content" className="rounded-sm p-1 text-slate-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-100 text-slate-600"><Icon name={ctx.contentType.icon} /></span>
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">{isNew ? `New ${ctx.contentType.name} entry` : entry.title}</h1>
          <p className="text-xs text-slate-500">{ctx.contentType.name}{entry ? ` · /explore/${ctx.contentType.slug}/${entry.slug}` : ""}</p>
        </div>
        {!isNew && <SaveIndicator state={autosave.state} dirty={autosave.dirty} />}
        {canWrite && !archived && (
          <Button icon={Save} loading={busy === "create"} onClick={saveNow}>{isNew ? "Save draft" : "Save"}</Button>
        )}
      </div>

      {ctx.formSource === "draft" && (
        <Alert tone="warning" className="mb-4" title="This content type's form isn't published yet">
          You can save drafts, but entries can only be published after the form is published.
        </Alert>
      )}
      {autosave.state === "conflict" && (
        <Alert tone="danger" className="mb-4" title="Someone else edited this entry">
          Your latest changes weren't saved. <button type="button" className="font-semibold underline" onClick={load}>Reload their version</button>
        </Alert>
      )}
      {errorCount > 0 && <Alert tone="danger" className="mb-4">{errorCount} field{errorCount === 1 ? " needs" : "s need"} attention.</Alert>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-5 sm:p-6">
          {fields.length ? (
            <DynamicFields fields={fields} values={values} onChange={setValues} errors={errors} disabled={!canWrite || archived} />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">This content type's form has no fields yet. <Link className="font-medium text-[#1F2853] underline" to={`/form-builder/types/${ctx.contentType.id}/form`}>Add fields</Link></p>
          )}
        </Card>

        <div className="space-y-4 lg:sticky lg:top-4">
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={entry?.status || "draft"} />
              {entry?.version > 0 && <span className="text-xs text-slate-500">v{entry.version} live {timeAgo(entry.published?.publishedAt)}</span>}
            </div>
            <p className="text-sm text-slate-600">{statusHelp}</p>
            {entry?.reviewNote && entry.status === "review" && <p className="rounded-sm bg-amber-50 px-3 py-2 text-xs text-amber-900">Note: {entry.reviewNote}</p>}

            {!isNew && (
              <div className="flex flex-col gap-2">
                {can("content.publish") && !archived && (
                  <Button variant="primary" icon={Rocket} loading={busy === "publish"} disabled={ctx.formSource === "draft" || (entry.status === "published" && !entry.hasUnpublishedChanges && !autosave.dirty)} onClick={() => runAction("publish")}>
                    {entry.status === "published" ? "Publish changes" : "Publish"}
                  </Button>
                )}
                {canWrite && ["draft", "unpublished"].includes(entry.status) && (
                  <Button icon={Send} loading={busy === "submitReview"} disabled={ctx.formSource === "draft"} onClick={() => setNoteFor("submitReview")}>Send for review</Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" icon={Eye} onClick={() => autosave.saveNow().then(() => setPreview("page"))}>Page</Button>
                  <Button size="sm" icon={Eye} onClick={() => autosave.saveNow().then(() => setPreview("card"))}>Card</Button>
                </div>
                {entry.published && entry.hasUnpublishedChanges && canWrite && !archived && (
                  <Button size="sm" variant="ghost" icon={Undo2} onClick={async () => (await confirm({ title: "Discard draft changes?", message: "The draft goes back to the live version. This can't be undone.", confirmLabel: "Discard", tone: "danger" })) && runAction("discardChanges")}>
                    Discard draft changes
                  </Button>
                )}
                {can("content.publish") && entry.status === "published" && (
                  <Button size="sm" variant="ghost" icon={EyeOff} onClick={async () => (await confirm({ title: "Unpublish?", message: "It disappears from Edeco until you publish again.", confirmLabel: "Unpublish" })) && runAction("unpublish")}>
                    Unpublish
                  </Button>
                )}
              </div>
            )}
          </Card>

          {!isNew && (
            <Card className="space-y-3 p-4">
              {/* The URL is generated from the title automatically; admins don't type it.
              <FormRow label="URL slug" hint={`/explore/${ctx.contentType.slug}/${toSlug(slug) || "…"}`}>
                <TextInput
                  value={slug}
                  disabled={!canWrite || archived}
                  onFocus={() => (slugEditing.current = true)}
                  onChange={(event) => setSlug(event.target.value)}
                  onBlur={() => {
                    slugEditing.current = false;
                    saveSlug();
                  }}
                />
              </FormRow>
              */}
              <FormRow label="Edeco URL" hint={entry.published ? "Fixed since the first publish so the link keeps working." : "Created from the title — it updates as the title changes, until the first publish."}>
                <p className="break-all rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[12.5px] text-slate-600">
                  /explore/{ctx.contentType.slug}/{slug}
                </p>
              </FormRow>
              <div className="space-y-1 text-xs text-slate-500">
                <p>Created {formatDateTime(entry.createdAt)} by {entry.createdBy?.name || "—"}</p>
                <p>Updated {formatDateTime(entry.updatedAt)} by {entry.updatedBy?.name || "—"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                <Button size="sm" variant="ghost" icon={History} onClick={() => setVersionsOpen(true)}>Versions</Button>
                {canWrite && (
                  <Button size="sm" variant="ghost" icon={Copy} onClick={() => cmsAdmin.duplicateContent(entry.id).then((result) => { toast("Duplicated as a draft."); navigate(`/form-builder/content/${result.entry.id}`); }).catch((error) => toast(cmsError(error).message, "error"))}>
                    Duplicate
                  </Button>
                )}
                {can("content.publish") && (
                  archived ? (
                    <Button size="sm" variant="ghost" icon={ArchiveRestore} onClick={() => runAction("restore")}>Restore</Button>
                  ) : (
                    <Button size="sm" variant="ghost" icon={Archive} onClick={async () => (await confirm({ title: "Archive this entry?", message: "It's hidden from Edeco and becomes read-only. You can restore it later.", confirmLabel: "Archive" })) && runAction("archive")}>Archive</Button>
                  )
                )}
                {can("content.delete") && (
                  <Button
                    size="sm"
                    variant="danger-ghost"
                    icon={Trash2}
                    onClick={async () => {
                      if (!(await confirm({ title: `Delete “${entry.title}”?`, message: "This permanently deletes the entry and removes it from Edeco. Consider archiving instead.", confirmLabel: "Delete", tone: "danger" }))) return;
                      cmsAdmin.deleteContent(entry.id).then(() => { toast("Deleted."); navigate(`/form-builder/content?type=${ctx.contentType.id}`); }).catch((error) => toast(cmsError(error).message, "error"));
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {picker}
      {entry && <VersionsModal open={versionsOpen} onClose={() => setVersionsOpen(false)} entry={entry} onRestored={load} />}
      {entry && <PreviewModal open={Boolean(preview)} onClose={() => setPreview(null)} contentTypeId={ctx.contentType.id} target={preview} initialContentId={entry.id} />}
      <Modal
        open={Boolean(noteFor)}
        onClose={() => setNoteFor(null)}
        title="Send for review"
        size="sm"
        footer={
          <>
            <Button onClick={() => setNoteFor(null)}>Cancel</Button>
            <Button variant="primary" loading={busy === "submitReview"} onClick={() => runAction(noteFor, note)}>Send</Button>
          </>
        }
      >
        <FormRow label="Note for the reviewer (optional)">
          <TextArea rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} />
        </FormRow>
      </Modal>
    </MediaHandlerContext.Provider>
  );
};

export default ContentEditorPage;
