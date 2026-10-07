import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, FilePlus2, LayoutTemplate, Pencil, Trash2 } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import DynamicFields from "../../inputs/DynamicFields";
import { SAMPLE_TEMPLATE_FIELDS } from "../../shared/layoutTemplates.js";
import { LAYOUT_TEMPLATE_KINDS, LayoutWireframe } from "../builder/LayoutTemplatePicker";
import { useStudio } from "../StudioContext";
import { useLoader } from "../hooks";
import { Button, Card, EmptyState, ErrorState, FormRow, IconButton, Modal, PageHeader, Select, Skeleton, Tabs, TextArea, TextInput, timeAgo, useFeedback } from "../ui";

// Built-in card and detail page layouts. Previews are drawn against a sample
// form; "Use in" opens a content type's builder with the template ready to
// apply against that type's real fields.
const LayoutLibrary = ({ kind }) => {
  const navigate = useNavigate();
  const { can } = useStudio();
  const [types, setTypes] = useState(null);
  const tab = kind === "card" ? "card" : "page";

  useEffect(() => {
    cmsAdmin
      .listTypes()
      .then((result) => setTypes((result.items || []).filter((type) => type.status !== "archived")))
      .catch(() => setTypes([]));
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {LAYOUT_TEMPLATE_KINDS[kind].list.map((template) => (
        <Card key={template.id} className="flex flex-col p-4">
          <div className={kind === "card" ? "mx-auto w-full max-w-[260px]" : ""}>
            <LayoutWireframe kind={kind} templateId={template.id} fields={SAMPLE_TEMPLATE_FIELDS} />
          </div>
          <p className="mt-4 font-semibold text-slate-900">{template.name}</p>
          <p className="mt-1 text-sm text-slate-600">{template.description}</p>
          {can("schema.write") && (
            <div className="mt-auto pt-4">
              <Select
                aria-label={`Use ${template.name} in a content type`}
                value=""
                disabled={!types?.length}
                onChange={(event) => event.target.value && navigate(`/form-builder/types/${event.target.value}/${tab}?template=${template.id}`)}
              >
                <option value="">{types === null ? "Loading content types…" : types.length ? "Use in a content type…" : "No content types yet"}</option>
                {(types || []).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </Select>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

// Templates: reusable field sets the team saved from their own forms (the
// library starts empty), plus built-in card and detail page layouts.
const TemplatesPage = () => {
  const navigate = useNavigate();
  const { can } = useStudio();
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.listTemplates(), []);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [params, setParams] = useSearchParams();
  const section = ["cards", "pages"].includes(params.get("section")) ? params.get("section") : "fields";
  const setSection = (next) => setParams(next === "fields" ? {} : { section: next }, { replace: true });

  const view = async (id) => {
    try {
      setViewing((await cmsAdmin.getTemplate(id)).template);
    } catch (viewError) {
      toast(cmsError(viewError).message, "error");
    }
  };

  return (
    <>
      {/* <PageHeader title="Templates" description="Field sets saved from existing forms. Use one as the starting point of a new form." /> */}
      <PageHeader title="Templates" description="Starting points for forms, cards and detail pages." />
      <Tabs
        className="mb-5"
        value={section}
        onChange={setSection}
        tabs={[
          { id: "fields", label: "Field sets" },
          { id: "cards", label: "Card layouts" },
          { id: "pages", label: "Detail page layouts" },
        ]}
      />
      {section === "cards" && (
        <>
          <p className="mb-4 text-sm text-slate-500">Ready-made cards for the listing page. Each one fills its slots from the content type's own fields; the preview uses a sample form.</p>
          <LayoutLibrary kind="card" />
        </>
      )}
      {section === "pages" && (
        <>
          <p className="mb-4 text-sm text-slate-500">Ready-made detail pages. Fields a layout doesn't place by name (long text, lists, tables, FAQ) get their own sections automatically.</p>
          <LayoutLibrary kind="page" />
        </>
      )}
      {section === "fields" && error && <ErrorState message={error.message} onRetry={reload} />}
      {section !== "fields" ? null : loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((n) => <Skeleton key={n} className="h-28" />)}</div>
      ) : !data?.items?.length ? (
        <EmptyState icon={LayoutTemplate} title="No templates yet" description="Open any form, go to its Settings and choose “Save form as template”." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.items.map((template) => (
            <Card key={template.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{template.name}</p>
                  <p className="text-xs text-slate-500">{template.fieldCount} fields · by {template.createdBy?.name || "unknown"} · {timeAgo(template.updatedAt)}</p>
                </div>
                <div className="flex">
                  <IconButton icon={Eye} label="Preview" onClick={() => view(template.id)} />
                  {can("schema.write") && <IconButton icon={Pencil} label="Rename" onClick={() => setEditing({ ...template })} />}
                  {can("schema.write") && (
                    <IconButton
                      icon={Trash2}
                      label="Delete"
                      tone="danger"
                      onClick={async () => {
                        if (!(await confirm({ title: `Delete “${template.name}”?`, message: "Forms created from it are not affected.", confirmLabel: "Delete", tone: "danger" }))) return;
                        cmsAdmin.deleteTemplate(template.id).then(() => { toast("Template deleted."); reload(); }).catch((deleteError) => toast(cmsError(deleteError).message, "error"));
                      }}
                    />
                  )}
                </div>
              </div>
              {template.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{template.description}</p>}
              {can("schema.write") && (
                <div className="mt-auto flex gap-2 pt-4">
                  <Button size="sm" icon={FilePlus2} onClick={() => navigate(`/form-builder/forms/new?kind=content&template=${template.id}`)}>New content type</Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/form-builder/forms/new?kind=response&template=${template.id}`)}>New response form</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing?.name} description="Read-only preview of the template's fields." size="lg">
        {viewing && <DynamicFields fields={viewing.fields} values={{}} onChange={() => {}} disabled />}
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit template"
        size="sm"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() =>
                cmsAdmin
                  .updateTemplate(editing.id, { name: editing.name, description: editing.description })
                  .then(() => { toast("Saved."); setEditing(null); reload(); })
                  .catch((updateError) => toast(cmsError(updateError).message, "error"))
              }
            >
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <FormRow label="Name"><TextInput value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></FormRow>
            <FormRow label="Description"><TextArea rows={3} value={editing.description || ""} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></FormRow>
          </div>
        )}
      </Modal>
    </>
  );
};

export default TemplatesPage;
