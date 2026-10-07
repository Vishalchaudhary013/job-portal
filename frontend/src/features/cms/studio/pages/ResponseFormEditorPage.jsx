import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, History, Inbox, Redo2, RotateCcw, Rocket, Save, Settings, Undo2 } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { validateSchemaDefinition } from "../../shared/schemaUtils.js";
import { useStudio } from "../StudioContext";
import FormSchemaBuilder from "../builder/FormSchemaBuilder";
import { useAutosave, useBeforeUnload, useHistoryState, useHotkeys, useLoader } from "../hooks";
import { Alert, Badge, Button, Card, ErrorState, FormRow, IconButton, Modal, PageLoader, SaveIndicator, Spinner, Tabs, TextArea, TextInput, Toggle, cx, formatDateTime, useFeedback } from "../ui";

// Editor for a response form (collects submissions from Edeco users).
// Same blank-canvas builder and draft -> publish -> version lifecycle as
// content types; Edeco only ever renders the published version.

const FormSettingsPanel = ({ value, onChange, form, onMetaSaved }) => {
  const { toast } = useFeedback();
  // const [meta, setMeta] = useState({ name: form.name, description: form.description, slug: form.slug });
  const [meta, setMeta] = useState({ name: form.name, description: form.description });
  const [statusText, setStatusText] = useState((value.statuses || []).join(", "));
  const set = (patch, mergeKey) => onChange({ ...value, ...patch }, { mergeKey });

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-slate-900">Details</h3>
        <FormRow label="Name">
          <TextInput value={meta.name} onChange={(event) => setMeta({ ...meta, name: event.target.value })} />
        </FormRow>
        <FormRow label="Description" hint="Shown above the form on Edeco.">
          <TextArea rows={2} value={meta.description} onChange={(event) => setMeta({ ...meta, description: event.target.value })} />
        </FormRow>
        {/* The slug is generated from the name automatically; admins don't type it.
        <FormRow label="Slug" hint={form.published?.version ? "Locked — Edeco cards and buttons link to it." : "Cards and page buttons open the form by this slug."}>
          <TextInput value={meta.slug} disabled={Boolean(form.published?.version)} onChange={(event) => setMeta({ ...meta, slug: event.target.value })} />
        </FormRow>
        */}
        <FormRow label="Form address" hint={form.published?.version ? "Fixed since the first publish — Edeco cards and buttons open the form by it." : "Created from the name and updated when the name changes, until the first publish."}>
          <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] text-slate-600">{form.slug}</p>
        </FormRow>
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() =>
              cmsAdmin
                .updateFormMeta(form.id, meta)
                .then(() => {
                  toast("Saved.");
                  onMetaSaved();
                })
                .catch((error) => toast(cmsError(error).message, "error"))
            }
          >
            Save details
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h3 className="font-semibold text-slate-900">Submission behaviour</h3>
          <p className="text-sm text-slate-500">Saved with the draft; takes effect when you publish.</p>
        </div>
        <FormRow label="Submit button text">
          <TextInput value={value.submitLabel || ""} onChange={(event) => set({ submitLabel: event.target.value }, "submitLabel")} />
        </FormRow>
        <FormRow label="Message after submitting">
          <TextArea rows={2} value={value.successMessage || ""} onChange={(event) => set({ successMessage: event.target.value }, "successMessage")} />
        </FormRow>
        <Toggle label="Require sign-in" description="Responses are tied to the student's Edeco account." checked={value.requireLogin !== false} onChange={(requireLogin) => set({ requireLogin })} />
        <Toggle label="Allow more than one response" description="Off: one response per person per item it was opened from." checked={Boolean(value.allowMultiple)} onChange={(allowMultiple) => set({ allowMultiple })} />
        <Toggle label="Closed" description="Stop accepting responses without unpublishing." checked={Boolean(value.closed)} onChange={(closed) => set({ closed })} />
        <FormRow label="Response statuses" hint="Comma-separated, in workflow order. The first one is given to new responses.">
          <TextInput
            value={statusText}
            onChange={(event) => setStatusText(event.target.value)}
            onBlur={() => set({ statuses: statusText.split(",").map((item) => item.trim()).filter(Boolean) })}
          />
        </FormRow>
      </Card>
    </div>
  );
};

const ResponseFormEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useStudio();
  const { toast, confirm } = useFeedback();
  const [tab, setTab] = useState("build");
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [impact, setImpact] = useState(null);
  const [note, setNote] = useState("");
  const [publishing, setPublishing] = useState(false);
  const revision = useRef(0);
  const queue = useRef(Promise.resolve());
  const schema = useHistoryState(null);
  const settings = useHistoryState(null);
  const canWrite = can("schema.write");

  const enqueue = useCallback((task) => {
    const next = queue.current.then(task, task);
    queue.current = next.catch(() => {});
    return next;
  }, []);
  const saveDraftPart = useCallback(
    (key, value) =>
      enqueue(async () => {
        const result = await cmsAdmin.saveFormDraft(id, { [key]: value, revision: revision.current, autosave: true });
        revision.current = result.form.revision;
        setForm(result.form);
      }),
    [id, enqueue],
  );
  const saveSchema = useCallback((value) => saveDraftPart("schema", value), [saveDraftPart]);
  const saveSettings = useCallback((value) => saveDraftPart("settings", value), [saveDraftPart]);
  const schemaSave = useAutosave({ value: schema.value, save: saveSchema, enabled: canWrite && schema.value !== null });
  const settingsSave = useAutosave({ value: settings.value, save: saveSettings, enabled: canWrite && settings.value !== null });

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await cmsAdmin.getForm(id);
      revision.current = result.form.revision;
      setForm(result.form);
      const nextSchema = result.form.draft?.schema || { fields: [] };
      const nextSettings = result.form.draft?.settings || {};
      schema.reset(nextSchema);
      settings.reset(nextSettings);
      schemaSave.markSaved(nextSchema);
      settingsSave.markSaved(nextSettings);
    } catch (error) {
      setLoadError(cmsError(error, "Couldn't load this form."));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [load]);

  const versions = useLoader(() => (tab === "versions" ? cmsAdmin.formVersions(id) : Promise.resolve(null)), [id, tab, form?.published?.version]);
  const schemaValue = schema.value;
  const fields = useMemo(() => schemaValue?.fields || [], [schemaValue]);
  const problems = useMemo(() => validateSchemaDefinition(fields), [fields]);
  const problemsById = useMemo(() => {
    const map = {};
    problems.forEach((problem) => problem.fieldId && (map[problem.fieldId] = [...(map[problem.fieldId] || []), problem.message]));
    return map;
  }, [problems]);
  const lockedFieldIds = useMemo(() => {
    const ids = new Set();
    const walk = (list = []) => list.forEach((field) => { ids.add(field.id); walk(field.children); });
    walk(form?.published?.schema?.fields);
    return ids;
  }, [form?.published?.schema]);

  const dirty = schemaSave.dirty || settingsSave.dirty;
  useBeforeUnload(dirty);
  const activeHistory = tab === "settings" ? settings : schema;
  const activeSave = tab === "settings" ? settingsSave : schemaSave;
  useHotkeys({
    "mod+z": () => activeHistory.undo(),
    "mod+shift+z": () => activeHistory.redo(),
    "mod+s": () => activeSave.saveNow().then((ok) => ok && toast("Draft saved.")),
  });

  const openPublish = async () => {
    setPublishOpen(true);
    setImpact(null);
    setNote("");
    try {
      await Promise.all([schemaSave.saveNow(), settingsSave.saveNow()]);
      setImpact((await cmsAdmin.formPublishImpact(id)).impact);
    } catch (error) {
      setImpact({ error: cmsError(error).message });
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await cmsAdmin.publishForm(id, note);
      toast("Form published.");
      setPublishOpen(false);
      await load();
    } catch (error) {
      const parsed = cmsError(error);
      toast(parsed.problems ? `${parsed.message} ${parsed.problems[0]}` : parsed.message, "error");
    } finally {
      setPublishing(false);
    }
  };

  if (loadError) return <div className="p-6"><ErrorState message={loadError.message} onRetry={load} /></div>;
  if (!form || schema.value === null || settings.value === null) return <PageLoader />;

  const conflict = schemaSave.state === "conflict" || settingsSave.state === "conflict";

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/form-builder/forms?tab=response" aria-label="Back to forms" className="rounded-sm p-1 text-slate-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
          <div className="mr-auto min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-slate-900">{form.name}</h1>
              <Badge tone={form.status === "published" ? "green" : form.status === "archived" ? "red" : "neutral"} dot>{form.status}</Badge>
              {form.published?.version > 0 && <Badge tone="navy">v{form.published.version} live</Badge>}
              {form.dirty && form.published?.version > 0 && <Badge tone="amber">draft changes</Badge>}
            </div>
            <p className="text-xs text-slate-500">Response form · slug <code>{form.slug}</code></p>
          </div>
          <SaveIndicator state={activeSave.state} dirty={activeSave.dirty} />
          <div className="flex">
            <IconButton icon={Undo2} label="Undo" disabled={!activeHistory.canUndo} onClick={activeHistory.undo} />
            <IconButton icon={Redo2} label="Redo" disabled={!activeHistory.canRedo} onClick={activeHistory.redo} />
          </div>
          {canWrite && <Button size="sm" icon={Save} onClick={() => activeSave.saveNow().then((ok) => ok && toast("Draft saved."))}>Save draft</Button>}
          {can("submissions.read") && <Button size="sm" icon={Inbox} onClick={() => navigate(`/form-builder/submissions?formId=${form.id}`)}>Responses</Button>}
          {can("schema.publish") && form.status === "published" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (!(await confirm({ title: "Unpublish this form?", message: "Edeco stops showing it. Responses already received are kept.", confirmLabel: "Unpublish" }))) return;
                await cmsAdmin.unpublishForm(id).then(() => { toast("Unpublished."); load(); }).catch((error) => toast(cmsError(error).message, "error"));
              }}
            >
              Unpublish
            </Button>
          )}
          {can("schema.publish") && <Button size="sm" variant="primary" icon={Rocket} disabled={conflict} onClick={openPublish}>Publish</Button>}
        </div>
        <Tabs
          className="mt-2 border-b-0"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "build", label: "Build" },
            { id: "settings", label: "Settings", icon: Settings },
            { id: "versions", label: "Versions", icon: History },
          ]}
        />
      </div>

      {conflict && (
        <Alert tone="danger" className="m-3 mb-0" title="Someone else changed this form">
          <button type="button" className="font-semibold underline" onClick={load}>Reload their version</button> — your unsaved edits will be lost.
        </Alert>
      )}

      <div className={cx("min-h-0 flex-1", tab === "build" ? "overflow-hidden" : "overflow-y-auto bg-slate-50")}>
        {tab === "build" && (
          <FormSchemaBuilder
            fields={fields}
            onChange={(next, options) => schema.set({ ...schema.value, fields: next }, options)}
            lockedFieldIds={lockedFieldIds}
            problemsById={problemsById}
            toolbar={problems.length > 0 && fields.length > 0 ? <Badge tone="amber">{problems.length} to fix</Badge> : null}
          />
        )}
        {tab === "settings" && <FormSettingsPanel value={settings.value} onChange={(next, options) => settings.set(next, options)} form={form} onMetaSaved={load} />}
        {tab === "versions" && (
          <div className="mx-auto max-w-3xl px-4 py-6">
            {versions.loading ? <Spinner /> : versions.error ? <ErrorState message={versions.error.message} onRetry={versions.reload} /> : !versions.data?.items?.length ? (
              <p className="rounded-sm border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">Not published yet.</p>
            ) : (
              <Card className="divide-y divide-slate-100">
                {versions.data.items.map((item) => (
                  <div key={item.version} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Badge tone={item.version === form.published?.version ? "green" : "neutral"}>v{item.version}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800">{item.note || <span className="text-slate-400">No note</span>}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)} · {item.publishedBy?.name}</p>
                    </div>
                    <Button
                      size="sm"
                      icon={RotateCcw}
                      onClick={async () => {
                        if (!(await confirm({ title: `Restore v${item.version} into the draft?`, message: "The live form doesn't change until you publish.", confirmLabel: "Restore" }))) return;
                        await cmsAdmin.restoreFormVersion(id, item.version).then(() => { toast("Restored into the draft."); load(); setTab("build"); }).catch((error) => toast(cmsError(error).message, "error"));
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>

      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish form"
        description="Edeco will use this version for new responses. Existing responses keep the version they were submitted with."
        footer={
          <>
            <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Rocket} loading={publishing} disabled={!impact || impact.error || impact.blocking?.length > 0 || problems.length > 0} onClick={publish}>Publish</Button>
          </>
        }
      >
        {!impact ? <Spinner /> : impact.error ? <Alert tone="danger">{impact.error}</Alert> : (
          <div className="space-y-3 text-sm text-slate-600">
            {problems.length > 0 && <Alert tone="danger" title="Fix these first"><ul className="list-disc pl-5">{problems.map((problem, i) => <li key={i}>{problem.message}</li>)}</ul></Alert>}
            <p>{impact.responses} response{impact.responses === 1 ? "" : "s"} received so far.</p>
            {impact.added.length > 0 && <p>New: {impact.added.map((field) => field.label).join(", ")}</p>}
            {impact.removed.length > 0 && <p>Removed: {impact.removed.map((field) => field.label).join(", ")} (old responses keep their answers)</p>}
            {impact.typeChanged.length > 0 && <p>Type changed: {impact.typeChanged.map((change) => change.label).join(", ")}</p>}
            {impact.blocking.map((message) => <Alert key={message} tone="danger">{message}</Alert>)}
            <FormRow label="Version note (optional)">
              <TextInput value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
            </FormRow>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResponseFormEditorPage;
