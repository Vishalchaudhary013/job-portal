import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Eye, FilePlus2, History, Redo2, RotateCcw, Rocket, Save, Settings, Undo2 } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { createCardSchema, createPageSchema, createPresentationSettings } from "../../shared/presentation.js";
import { validateSchemaDefinition } from "../../shared/schemaUtils.js";
import Icon, { CONTENT_TYPE_ICONS } from "../Icon";
import { useStudio } from "../StudioContext";
import CardBuilder from "../builder/CardBuilder";
import FormSchemaBuilder from "../builder/FormSchemaBuilder";
import PageBuilder from "../builder/PageBuilder";
import PresentationEditor from "../builder/PresentationEditor";
import { useAutosave, useBeforeUnload, useHistoryState, useHotkeys } from "../hooks";
import PreviewModal from "../preview/PreviewModal";
import { Alert, Badge, Button, Card, ErrorState, FormRow, IconButton, Modal, PageLoader, SaveIndicator, Select, Spinner, Tabs, TextArea, TextInput, cx, formatDateTime, useFeedback } from "../ui";

const KINDS = ["form", "card", "page", "presentation"];
const KIND_LABELS = { form: "Form", card: "Card", page: "Detail page", presentation: "Presentation" };
const DEFAULTS = {
  form: () => ({ fields: [] }),
  card: createCardSchema,
  page: createPageSchema,
  presentation: createPresentationSettings,
};

const PublishDialog = ({ open, onClose, type, dirtyKinds, onPublish, busy }) => {
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");
  const [impact, setImpact] = useState(null);
  const [impactError, setImpactError] = useState("");
  const formPublished = (type?.published?.form?.version || 0) > 0;

  useEffect(() => {
    if (!open) return;
    const initial = KINDS.filter((kind) => dirtyKinds.includes(kind) || !(type.published?.[kind]?.version > 0));
    setSelected(initial.length ? initial : []);
    setNote("");
    setImpact(null);
    setImpactError("");
    cmsAdmin.publishImpact(type.id).then((result) => setImpact(result.impact)).catch((error) => setImpactError(cmsError(error).message));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (kind) => setSelected((list) => (list.includes(kind) ? list.filter((item) => item !== kind) : [...list, kind]));
  const needsForm = !formPublished && selected.some((kind) => kind !== "form") && !selected.includes("form");
  const blocked = selected.includes("form") && impact?.blocking?.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publish to Edeco"
      description="Publishing creates a new version. Drafts you keep editing won't affect the live site until you publish again."
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Rocket} loading={busy} disabled={!selected.length || needsForm || blocked} onClick={() => onPublish(selected, note)}>
            Publish {selected.length ? selected.map((kind) => KIND_LABELS[kind].toLowerCase()).join(", ") : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {KINDS.map((kind) => {
            const version = type.published?.[kind]?.version || 0;
            const dirty = dirtyKinds.includes(kind);
            return (
              <label key={kind} className={cx("flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5", selected.includes(kind) ? "border-[#1F2853] bg-[#1F2853]/5" : "border-slate-200")}>
                <input type="checkbox" className="h-4 w-4 accent-[#1F2853]" checked={selected.includes(kind)} onChange={() => toggle(kind)} />
                <span className="flex-1 text-sm font-medium text-slate-800">{KIND_LABELS[kind]}</span>
                {version ? <Badge tone="green">live v{version}</Badge> : <Badge>never published</Badge>}
                {dirty && <Badge tone="amber">draft changes</Badge>}
              </label>
            );
          })}
        </div>
        {needsForm && <Alert tone="warning">Publish the form too — cards and pages render against the published form.</Alert>}

        {selected.includes("form") && (
          <div className="rounded-sm border border-slate-200 p-3 text-sm">
            <p className="mb-2 font-semibold text-slate-900">What changes for existing content</p>
            {impactError && <p className="text-red-600">{impactError}</p>}
            {!impact && !impactError && <Spinner size={16} />}
            {impact && (
              <ul className="space-y-1.5 text-slate-600">
                <li>{impact.entries} entr{impact.entries === 1 ? "y" : "ies"} use this content type ({impact.publishedEntries} published).</li>
                {impact.added.length > 0 && <li>New fields: {impact.added.map((field) => field.label).join(", ")}</li>}
                {impact.removed.length > 0 && <li>Removed: {impact.removed.map((field) => field.label).join(", ")} — existing data is kept, just no longer shown or edited.</li>}
                {impact.typeChanged.length > 0 && <li>Type changed: {impact.typeChanged.map((change) => `${change.label} (${change.from} → ${change.to})`).join(", ")} — existing values may need editing.</li>}
                {impact.becameRequired.length > 0 && <li>Now required: {impact.becameRequired.map((field) => field.label).join(", ")} — entries missing them must be completed before their next publish.</li>}
                {impact.orphanedReferences.length > 0 && <li>The card or page still points at {impact.orphanedReferences.length} removed field(s); those spots will show nothing.</li>}
                {impact.blocking.map((message) => <li key={message} className="font-medium text-red-600">{message}</li>)}
                {!impact.added.length && !impact.removed.length && !impact.typeChanged.length && !impact.becameRequired.length && <li>No field changes since the last publish.</li>}
              </ul>
            )}
          </div>
        )}
        <FormRow label="Version note (optional)">
          <TextInput value={note} onChange={(event) => setNote(event.target.value)} placeholder="What changed?" maxLength={500} />
        </FormRow>
      </div>
    </Modal>
  );
};

const VersionsPanel = ({ type, onRestored }) => {
  const { confirm, toast } = useFeedback();
  const [kind, setKind] = useState("form");
  const [state, setState] = useState({ loading: true, items: [], error: null });

  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true }));
    cmsAdmin
      .typeVersions(type.id, kind)
      .then((result) => setState({ loading: false, items: result.items, error: null }))
      .catch((error) => setState({ loading: false, items: [], error: cmsError(error).message }));
  }, [type.id, kind]);
  useEffect(load, [load]);

  const restore = async (version) => {
    const ok = await confirm({
      title: `Restore ${KIND_LABELS[kind].toLowerCase()} v${version}?`,
      message: "This replaces the current draft with that version. The live site doesn't change until you publish.",
      confirmLabel: "Restore to draft",
    });
    if (!ok) return;
    try {
      await cmsAdmin.restoreTypeVersion(type.id, kind, version);
      toast(`v${version} restored into the draft.`);
      onRestored();
    } catch (error) {
      toast(cmsError(error).message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">Published versions</h3>
        <Select className="!w-48" value={kind} onChange={(event) => setKind(event.target.value)} aria-label="Configuration">
          {KINDS.map((item) => <option key={item} value={item}>{KIND_LABELS[item]}</option>)}
        </Select>
      </div>
      {state.error && <ErrorState message={state.error} onRetry={load} />}
      {state.loading ? (
        <Spinner />
      ) : !state.items.length ? (
        <p className="rounded-sm border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">Nothing published yet. Each publish creates a version you can restore later.</p>
      ) : (
        <Card className="divide-y divide-slate-100">
          {state.items.map((item) => (
            <div key={item.version} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Badge tone={item.version === type.published?.[kind]?.version ? "green" : "neutral"}>v{item.version}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800">{item.note || <span className="text-slate-400">No note</span>}</p>
                <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)} · {item.publishedBy?.name || "Unknown"}</p>
              </div>
              {item.version === type.published?.[kind]?.version && <span className="text-xs font-medium text-emerald-700">Live</span>}
              <Button size="sm" icon={RotateCcw} onClick={() => restore(item.version)}>Restore</Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

const SettingsPanel = ({ type, onSaved }) => {
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const { can, refreshTypes } = useStudio();
  // const [meta, setMeta] = useState({ name: type.name, description: type.description, icon: type.icon, slug: type.slug });
  const [meta, setMeta] = useState({ name: type.name, description: type.description, icon: type.icon });
  const [saving, setSaving] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState(`${type.name} fields`);
  const everPublished = KINDS.some((kind) => type.published?.[kind]?.version);

  const saveMeta = async () => {
    setSaving(true);
    try {
      await cmsAdmin.updateTypeMeta(type.id, meta);
      toast("Saved.");
      refreshTypes();
      onSaved();
    } catch (error) {
      toast(cmsError(error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const run = async (action, success, after) => {
    try {
      const result = await action();
      toast(success);
      refreshTypes();
      after?.(result);
    } catch (error) {
      toast(cmsError(error).message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-slate-900">Details</h3>
        <FormRow label="Name">
          <TextInput value={meta.name} onChange={(event) => setMeta({ ...meta, name: event.target.value })} />
        </FormRow>
        <FormRow label="Description">
          <TextArea rows={2} value={meta.description} onChange={(event) => setMeta({ ...meta, description: event.target.value })} />
        </FormRow>
        {/* The URL slug is generated from the name automatically; admins don't type it.
        <FormRow label="URL slug" hint={everPublished ? "Locked after the first publish — live links depend on it." : "Used in Edeco URLs: /explore/<slug>"}>
          <TextInput value={meta.slug} disabled={everPublished} onChange={(event) => setMeta({ ...meta, slug: event.target.value })} />
        </FormRow>
        */}
        <FormRow label="Edeco URL" hint={everPublished ? "Fixed since the first publish so live links keep working." : "Created from the name and updated when the name changes, until the first publish."}>
          <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] text-slate-600">/explore/{type.slug}</p>
        </FormRow>
        <FormRow label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_TYPE_ICONS.map((name) => (
              <button key={name} type="button" aria-label={name} aria-pressed={meta.icon === name} onClick={() => setMeta({ ...meta, icon: name })} className={cx("flex h-9 w-9 items-center justify-center rounded-sm border", meta.icon === name ? "border-[#1F2853] bg-[#1F2853]/5 text-[#1F2853]" : "border-slate-200 text-slate-500 hover:bg-slate-50")}>
                <Icon name={name} size={16} />
              </button>
            ))}
          </div>
        </FormRow>
        <div className="flex justify-end">
          <Button variant="primary" loading={saving} onClick={saveMeta}>Save details</Button>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="font-semibold text-slate-900">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setTemplateOpen(true)}>Save form as template</Button>
          <Button onClick={() => run(() => cmsAdmin.duplicateType(type.id), "Duplicated.", (result) => navigate(`/form-builder/types/${result.contentType.id}/form`))}>Duplicate</Button>
          {can("schema.delete") && (
            <Button onClick={() => run(() => cmsAdmin.archiveType(type.id, type.status !== "archived"), type.status === "archived" ? "Restored." : "Archived — it no longer appears on Edeco.", onSaved)}>
              {type.status === "archived" ? "Unarchive" : "Archive"}
            </Button>
          )}
          {can("schema.delete") && (
            <Button
              variant="danger-ghost"
              onClick={async () => {
                const ok = await confirm({ title: `Delete “${type.name}”?`, message: "Only possible when it has no entries. Published versions are kept in history. This can't be undone.", confirmLabel: "Delete", tone: "danger" });
                if (ok) run(() => cmsAdmin.deleteType(type.id), "Deleted.", () => navigate("/form-builder/forms"));
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </Card>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Save as template"
        description="Reuse this form's fields when creating new forms."
        size="sm"
        footer={
          <>
            <Button onClick={() => setTemplateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => run(() => cmsAdmin.createTemplate({ name: templateName, fromContentTypeId: type.id }), "Template saved.", () => setTemplateOpen(false))}>Save template</Button>
          </>
        }
      >
        <FormRow label="Template name">
          <TextInput value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
        </FormRow>
      </Modal>
    </div>
  );
};

const ContentTypeWorkspace = () => {
  const { id, tab = "form" } = useParams();
  const navigate = useNavigate();
  const { can, refreshTypes } = useStudio();
  const { toast } = useFeedback();
  const [type, setType] = useState(null);
  const [publishedForm, setPublishedForm] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [serverProblems, setServerProblems] = useState(null);
  const revision = useRef(0);
  const queue = useRef(Promise.resolve());
  const canWrite = can("schema.write");

  const histories = { form: useHistoryState(null), card: useHistoryState(null), page: useHistoryState(null), presentation: useHistoryState(null) };

  // Saves are serialised so each one carries the latest revision.
  const enqueue = useCallback((task) => {
    const next = queue.current.then(task, task);
    queue.current = next.catch(() => {});
    return next;
  }, []);

  const saveKind = useCallback(
    (kind, value) =>
      enqueue(async () => {
        const result = await cmsAdmin.saveTypeDraft(id, { [kind]: value, revision: revision.current, autosave: true });
        revision.current = result.contentType.revision;
        setType(result.contentType);
      }),
    [id, enqueue],
  );
  const saveForm = useCallback((value) => saveKind("form", value), [saveKind]);
  const saveCard = useCallback((value) => saveKind("card", value), [saveKind]);
  const savePage = useCallback((value) => saveKind("page", value), [saveKind]);
  const savePresentation = useCallback((value) => saveKind("presentation", value), [saveKind]);

  const autosaves = {
    form: useAutosave({ value: histories.form.value, save: saveForm, enabled: canWrite && histories.form.value !== null }),
    card: useAutosave({ value: histories.card.value, save: saveCard, enabled: canWrite && histories.card.value !== null }),
    page: useAutosave({ value: histories.page.value, save: savePage, enabled: canWrite && histories.page.value !== null }),
    presentation: useAutosave({ value: histories.presentation.value, save: savePresentation, enabled: canWrite && histories.presentation.value !== null }),
  };

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await cmsAdmin.getType(id);
      const loaded = result.contentType;
      revision.current = loaded.revision;
      setType(loaded);
      setPublishedForm(result.publishedForm);
      KINDS.forEach((kind) => {
        const value = loaded.draft?.[kind] || DEFAULTS[kind]();
        histories[kind].reset(value);
        autosaves[kind].markSaved(value);
      });
    } catch (error) {
      setLoadError(cmsError(error, "Couldn't load this content type."));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const activeKind = KINDS.includes(tab) ? tab : null;
  const active = activeKind ? histories[activeKind] : null;
  const activeSave = activeKind ? autosaves[activeKind] : null;
  const anyDirty = KINDS.some((kind) => autosaves[kind].dirty);
  const conflict = KINDS.some((kind) => autosaves[kind].state === "conflict");
  useBeforeUnload(anyDirty);

  // Stable across renders (the preview modal re-runs when this changes).
  const autosavesRef = useRef(autosaves);
  useLayoutEffect(() => {
    autosavesRef.current = autosaves;
  });
  const flushAll = useCallback(async () => {
    const results = await Promise.all(KINDS.map((kind) => autosavesRef.current[kind].saveNow()));
    if (results.some((ok) => !ok)) throw new Error("Some changes couldn't be saved. Fix the problems shown and try again.");
  }, []);

  useHotkeys({
    "mod+z": () => active?.undo(),
    "mod+shift+z": () => active?.redo(),
    "mod+y": () => active?.redo(),
    "mod+s": () => activeSave?.saveNow().then((ok) => ok && toast("Draft saved.")),
  });

  const formValue = histories.form.value;
  const formFields = useMemo(() => formValue?.fields || [], [formValue]);
  const formProblems = useMemo(() => validateSchemaDefinition(formFields), [formFields]);
  const problemsById = useMemo(() => {
    const map = {};
    formProblems.forEach((problem) => {
      if (problem.fieldId) (map[problem.fieldId] = map[problem.fieldId] || []).push(problem.message);
    });
    return map;
  }, [formProblems]);
  const lockedFieldIds = useMemo(() => {
    const ids = new Set();
    const walk = (list = []) => list.forEach((field) => {
      ids.add(field.id);
      walk(field.children);
    });
    walk(publishedForm?.fields);
    return ids;
  }, [publishedForm]);

  const publish = async (kinds, note) => {
    setPublishing(true);
    setServerProblems(null);
    try {
      await flushAll();
      await cmsAdmin.publishType(id, kinds, note);
      toast(`Published ${kinds.map((kind) => KIND_LABELS[kind].toLowerCase()).join(", ")}.`);
      setPublishOpen(false);
      refreshTypes();
      await load();
    } catch (error) {
      const parsed = cmsError(error, error.message);
      toast(parsed.message, "error");
      if (parsed.problems) setServerProblems(parsed.problems);
    } finally {
      setPublishing(false);
    }
  };

  if (loadError) return <div className="p-6"><ErrorState message={loadError.message} onRetry={load} /></div>;
  if (!type || KINDS.some((kind) => histories[kind].value === null)) return <PageLoader />;

  const dirtyKinds = KINDS.filter((kind) => type.dirty?.[kind] || autosaves[kind].dirty);
  const tabs = [
    ...KINDS.map((kind) => ({
      id: kind,
      label: KIND_LABELS[kind],
      badge: dirtyKinds.includes(kind) ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Unpublished changes" /> : null,
    })),
    { id: "versions", label: "Versions", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const onChangeActive = (next, options) => active.set(next, options);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/form-builder/forms" aria-label="Back to forms" className="rounded-sm p-1 text-slate-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-100 text-slate-600"><Icon name={type.icon} /></span>
          <div className="min-w-0 mr-auto">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-slate-900">{type.name}</h1>
              <Badge tone={type.status === "published" ? "green" : type.status === "archived" ? "red" : "neutral"} dot>{type.status}</Badge>
            </div>
            <p className="text-xs text-slate-500">Content type · /explore/{type.slug}</p>
          </div>

          {activeKind && <SaveIndicator state={activeSave.state} dirty={activeSave.dirty} />}
          {activeKind && (
            <div className="flex">
              <IconButton icon={Undo2} label="Undo (Ctrl+Z)" disabled={!active.canUndo} onClick={active.undo} />
              <IconButton icon={Redo2} label="Redo (Ctrl+Shift+Z)" disabled={!active.canRedo} onClick={active.redo} />
            </div>
          )}
          {activeKind && canWrite && <Button size="sm" icon={Save} onClick={() => activeSave.saveNow().then((ok) => ok && toast("Draft saved."))}>Save draft</Button>}
          {(tab === "card" || tab === "page") && <Button size="sm" icon={Eye} onClick={() => setPreview(tab)}>Preview</Button>}
          {can("content.write") && type.published?.form?.version > 0 && (
            <Button size="sm" icon={FilePlus2} onClick={() => navigate(`/form-builder/content/new?type=${type.id}`)}>New entry</Button>
          )}
          {can("schema.publish") && (
            <Button size="sm" variant="primary" icon={Rocket} disabled={conflict} onClick={() => setPublishOpen(true)}>
              Publish{dirtyKinds.length ? ` (${dirtyKinds.length})` : ""}
            </Button>
          )}
        </div>
        <Tabs className="mt-2 border-b-0" tabs={tabs} value={tab} onChange={(next) => navigate(`/form-builder/types/${id}/${next}`)} />
      </div>

      {conflict && (
        <Alert tone="danger" className="m-3 mb-0" title="Someone else changed this content type">
          Your latest edits weren't saved to avoid overwriting theirs.{" "}
          <button type="button" className="font-semibold underline" onClick={load}>Reload their version</button> (your unsaved edits will be lost).
        </Alert>
      )}
      {activeKind && activeSave.state === "error" && (
        <Alert tone="danger" className="m-3 mb-0" title="Couldn't save">
          {activeSave.error?.message}
          {activeSave.error?.problems && <ul className="mt-1 list-disc pl-5">{activeSave.error.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>}
        </Alert>
      )}
      {serverProblems && (
        <Alert tone="danger" className="m-3 mb-0" title="Publishing was blocked">
          <ul className="list-disc pl-5">{serverProblems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
        </Alert>
      )}
      {tab === "form" && formProblems.length > 0 && formFields.length > 0 && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-900">
          <AlertTriangle size={14} /> {formProblems.length} thing{formProblems.length === 1 ? "" : "s"} to fix before the form can be published.
        </div>
      )}

      <div className={cx("min-h-0 flex-1", activeKind && activeKind !== "presentation" ? "overflow-hidden" : "overflow-y-auto bg-slate-50")}>
        {tab === "form" && (
          <FormSchemaBuilder
            fields={formFields}
            onChange={(fields, options) => onChangeActive({ ...histories.form.value, fields }, options)}
            lockedFieldIds={lockedFieldIds}
            problemsById={problemsById}
            toolbar={publishedForm ? <Badge tone="green">v{type.published.form.version} live</Badge> : <Badge>not published yet</Badge>}
          />
        )}
        {tab === "card" && <CardBuilder value={histories.card.value} onChange={onChangeActive} formFields={formFields} />}
        {tab === "page" && <PageBuilder value={histories.page.value} onChange={onChangeActive} formFields={formFields} />}
        {tab === "presentation" && <PresentationEditor value={histories.presentation.value} onChange={onChangeActive} formFields={formFields} contentType={type} />}
        {tab === "versions" && <VersionsPanel type={type} onRestored={load} />}
        {tab === "settings" && <SettingsPanel type={type} onSaved={load} />}
      </div>

      {publishOpen && <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} type={type} dirtyKinds={dirtyKinds} onPublish={publish} busy={publishing} />}
      <PreviewModal open={Boolean(preview)} onClose={() => setPreview(null)} contentTypeId={id} target={preview} beforePreview={flushAll} />
    </div>
  );
};

export default ContentTypeWorkspace;
