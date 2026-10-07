import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FilePlus2, FormInput, Layers } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { toSlug } from "../../shared/ids.js";
import Icon, { CONTENT_TYPE_ICONS } from "../Icon";
import { useStudio } from "../StudioContext";
import { Alert, Button, Card, FormRow, PageHeader, Select, TextArea, TextInput, cx } from "../ui";

// Create a form. It always starts BLANK — unless the admin explicitly picks
// one of their own saved templates.
const CreateFormPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshTypes } = useStudio();
  const [kind, setKind] = useState(params.get("kind") === "response" ? "response" : "content");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("FileText");
  const [templateId, setTemplateId] = useState(params.get("template") || "");
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cmsAdmin.listTemplates().then((result) => setTemplates(result.items || [])).catch(() => setTemplates([]));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      // const body = { name, slug: slug || toSlug(name), description, templateId: templateId || undefined };
      // The server generates the slug from the name.
      void slug;
      const body = { name, description, templateId: templateId || undefined };
      if (kind === "content") {
        const result = await cmsAdmin.createType({ ...body, icon });
        refreshTypes();
        navigate(`/form-builder/types/${result.contentType.id}/form`);
      } else {
        const result = await cmsAdmin.createForm(body);
        navigate(`/form-builder/forms/${result.form.id}`);
      }
    } catch (createError) {
      setError(cmsError(createError, "Couldn't create the form.").message);
    } finally {
      setSaving(false);
    }
  };

  const kinds = [
    { id: "content", icon: Layers, title: "Content type", text: "Design the form admins use to create content, then how entries appear as cards and detail pages on Edeco." },
    { id: "response", icon: FormInput, title: "Response form", text: "A form Edeco users fill in. Responses arrive under Submissions, with who sent them and from where." },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create form" description="Every form starts blank — you add exactly the fields you need." />
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {kinds.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={kind === item.id}
              onClick={() => setKind(item.id)}
              className={cx("rounded-sm border-2 bg-white p-4 text-left transition", kind === item.id ? "border-[#1F2853]" : "border-slate-200 hover:border-slate-300")}
            >
              <item.icon size={20} className={kind === item.id ? "text-[#1F2853]" : "text-slate-400"} />
              <p className="mt-2 font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.text}</p>
            </button>
          ))}
        </div>

        <Card className="space-y-4 p-5">
          <FormRow
            label="Name"
            htmlFor="cf-name"
            hint={kind === "content" ? `Edeco URL is created from the name: /explore/${toSlug(name) || "…"}` : `Form address is created from the name: ${toSlug(name) || "…"}`}
          >
            <TextInput
              id="cf-name"
              required
              autoFocus
              maxLength={120}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugTouched) setSlug(toSlug(event.target.value));
              }}
            />
          </FormRow>
          {/* The URL slug is generated from the name automatically; admins don't type it.
          <FormRow label="URL slug" htmlFor="cf-slug" hint={kind === "content" ? `Edeco URL: /explore/${slug || "…"}` : "Used to attach the form to cards and buttons."}>
            <TextInput
              id="cf-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(toSlug(event.target.value));
              }}
            />
          </FormRow>
          */}
          <FormRow label="Description" htmlFor="cf-description">
            <TextArea id="cf-description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormRow>
          {kind === "content" && (
            <FormRow label="Icon">
              <div className="flex flex-wrap gap-1.5">
                {CONTENT_TYPE_ICONS.map((iconName) => (
                  <button key={iconName} type="button" aria-label={iconName} aria-pressed={icon === iconName} onClick={() => setIcon(iconName)} className={cx("flex h-9 w-9 items-center justify-center rounded-sm border", icon === iconName ? "border-[#1F2853] bg-[#1F2853]/5 text-[#1F2853]" : "border-slate-200 text-slate-500 hover:bg-slate-50")}>
                    <Icon name={iconName} size={16} />
                  </button>
                ))}
              </div>
            </FormRow>
          )}
          <FormRow label="Start from" hint={templates.length ? "Templates are field sets your team saved earlier." : "No templates saved yet — save any form as a template from its settings."}>
            <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)} disabled={!templates.length}>
              <option value="">Blank form</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name} ({template.fieldCount} fields)</option>)}
            </Select>
          </FormRow>
        </Card>

        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" variant="primary" icon={FilePlus2} loading={saving} disabled={!name.trim()}>
            Create and open builder
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateFormPage;
