import React, { useEffect, useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Eye, EyeOff, GripVertical, LayoutTemplate, PanelTop, Plus, Settings2, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cmsAdmin } from "../../../../services/cmsAdminAPI";
import { createId } from "../../shared/ids.js";
import { BUTTON_ACTIONS, ICON_NAMES, PAGE_BLOCKS, createPageBlock, createPageButton } from "../../shared/presentation.js";
import { referenceableFields } from "../../shared/schemaUtils.js";
import Icon from "../Icon";
import { Badge, Button, FormRow, IconButton, Modal, Select, Tabs, TextArea, TextInput, Toggle, cx } from "../ui";
import FieldPicker from "./FieldPicker";
import LayoutTemplatePicker, { LAYOUT_TEMPLATE_KINDS } from "./LayoutTemplatePicker";

// Detail Page Builder: the page starts blank; the admin composes it from
// blocks that map to form fields (or hold static text/links). Only structure
// and field mapping are stored — Edeco renders it in its own design.

const BLOCK_GROUPS = [
  { label: "Structure", types: ["hero", "tabs", "accordion", "group", "divider"] },
  { label: "Content", types: ["field", "fieldList", "richText", "text", "image", "gallery", "video", "list", "table", "faq"] },
  { label: "Actions", types: ["buttons", "related"] },
];

const FIELD_ACCEPTS = {
  field: ["*"],
  richText: ["richText", "textarea"],
  image: ["image"],
  gallery: ["image"],
  video: ["video", "url"],
  list: ["multiSelect", "checkbox", "select", "radio", "repeater", "table", "textarea", "text", "richText"],
  table: ["table", "repeater"],
  faq: ["faq"],
};

// Tree helpers for blocks (containers hold `children`).
const findBlock = (blocks, id) => {
  for (const block of blocks) {
    if (block.id === id) return block;
    const hit = block.children && findBlock(block.children, id);
    if (hit) return hit;
  }
  return null;
};
const locateBlock = (blocks, id, parentId = null) => {
  const index = blocks.findIndex((block) => block.id === id);
  if (index !== -1) return { parentId, index, list: blocks };
  for (const block of blocks) {
    const hit = block.children && locateBlock(block.children, id, block.id);
    if (hit) return hit;
  }
  return null;
};
const mapBlocks = (blocks, fn) => blocks.map((block) => {
  const next = fn(block);
  return next.children ? { ...next, children: mapBlocks(next.children, fn) } : next;
});
const removeBlock = (blocks, id) => blocks.filter((block) => block.id !== id).map((block) => (block.children ? { ...block, children: removeBlock(block.children, id) } : block));
const setChildren = (blocks, parentId, list) => (parentId ? mapBlocks(blocks, (block) => (block.id === parentId ? { ...block, children: list } : block)) : list);
const cloneBlock = (block) => ({
  ...JSON.parse(JSON.stringify(block)),
  id: createId("blk"),
  ...(block.children ? { children: block.children.map(cloneBlock) } : {}),
  ...(block.config?.buttons ? { config: { ...JSON.parse(JSON.stringify(block.config)), buttons: block.config.buttons.map((button) => ({ ...button, id: createId("btn") })) } } : {}),
});

const MultiFieldPicker = ({ refs, value = [], onChange, label, accepts }) => (
  <FormRow label={label}>
    <div className="space-y-1.5">
      {value.map((id, index) => (
        <div key={`${id}-${index}`} className="flex items-center gap-1">
          <FieldPicker refs={refs} accepts={accepts} value={id} allowEmpty={false} onChange={(next) => onChange(value.map((item, i) => (i === index ? next : item)))} />
          <IconButton icon={Trash2} label="Remove" size={14} tone="danger" onClick={() => onChange(value.filter((_, i) => i !== index))} />
        </div>
      ))}
      <FieldPicker refs={refs} accepts={accepts} value="" placeholder="+ Add a field" onChange={(next) => next && onChange([...value, next])} />
    </div>
  </FormRow>
);

const ButtonsEditor = ({ buttons = [], refs, forms, onChange }) => {
  const update = (index, patch) => onChange(buttons.map((button, i) => (i === index ? { ...button, ...patch } : button)));
  return (
    <FormRow label="Buttons">
      <div className="space-y-2">
        {buttons.map((button, index) => (
          <div key={button.id} className="space-y-2 rounded-sm border border-slate-200 bg-slate-50/60 p-2.5">
            <div className="flex items-center gap-1">
              <TextInput aria-label="Button text" value={button.label} onChange={(event) => update(index, { label: event.target.value })} />
              <IconButton icon={Trash2} label="Remove button" size={14} tone="danger" onClick={() => onChange(buttons.filter((_, i) => i !== index))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select aria-label="Action" value={button.action} onChange={(event) => update(index, { action: event.target.value })}>
                {BUTTON_ACTIONS.map((action) => <option key={action.id} value={action.id}>{action.label}</option>)}
              </Select>
              <Select aria-label="Style" value={button.style} onChange={(event) => update(index, { style: event.target.value })}>
                <option value="primary">Primary</option>
                <option value="accent">Accent</option>
                <option value="secondary">Outline</option>
                <option value="link">Text link</option>
              </Select>
            </div>
            {button.action === "url" && <TextInput aria-label="URL" placeholder="https://" value={button.url} onChange={(event) => update(index, { url: event.target.value })} />}
            {button.action === "fieldUrl" && <FieldPicker refs={refs} accepts={["url", "text", "file"]} value={button.fieldId} onChange={(fieldId) => update(index, { fieldId })} />}
            {button.action === "form" && (
              <Select aria-label="Form" value={button.formSlug} onChange={(event) => update(index, { formSlug: event.target.value })}>
                <option value="">Choose a published form…</option>
                {forms.map((form) => <option key={form.slug} value={form.slug}>{form.name}</option>)}
              </Select>
            )}
            {["url", "fieldUrl"].includes(button.action) && <Toggle label="Open in a new tab" checked={Boolean(button.newTab)} onChange={(newTab) => update(index, { newTab })} />}
          </div>
        ))}
        <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F2853] hover:underline" onClick={() => onChange([...buttons, createPageButton()])}>
          <Plus size={13} /> Add button
        </button>
      </div>
    </FormRow>
  );
};

const BlockSettings = ({ block, refs, forms, onChange, hasSidebar, nested }) => {
  const config = block.config || {};
  const setConfig = (patch, mergeKey) => onChange({ config: { ...config, ...patch } }, mergeKey);
  const def = PAGE_BLOCKS[block.type];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{def.description}</p>

      {block.type !== "hero" && block.type !== "divider" && (
        <>
          <FormRow label={nested ? "Tab / panel title" : "Section title"}>
            <TextInput value={block.title || ""} onChange={(event) => onChange({ title: event.target.value }, "title")} />
          </FormRow>
          {!nested && <Toggle label="Show title" checked={Boolean(block.showTitle)} onChange={(showTitle) => onChange({ showTitle })} />}
        </>
      )}

      {block.type === "hero" && (
        <>
          <FormRow label="Style">
            <Select value={config.variant || "banner"} onChange={(event) => setConfig({ variant: event.target.value })}>
              <option value="banner">Banner (tinted band)</option>
              <option value="split">Split (image beside text)</option>
              <option value="simple">Simple (no band)</option>
            </Select>
          </FormRow>
          <FormRow label="Title" hint="Empty = the entry's title.">
            <FieldPicker refs={refs} value={config.titleFieldId} placeholder="Entry title" onChange={(titleFieldId) => setConfig({ titleFieldId })} />
          </FormRow>
          <FormRow label="Subtitle">
            <FieldPicker refs={refs} value={config.subtitleFieldId} placeholder="None" onChange={(subtitleFieldId) => setConfig({ subtitleFieldId })} />
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Image">
              <FieldPicker refs={refs} accepts={["image"]} value={config.imageFieldId} placeholder="None" onChange={(imageFieldId) => setConfig({ imageFieldId })} />
            </FormRow>
            <FormRow label="Logo">
              <FieldPicker refs={refs} accepts={["image"]} value={config.logoFieldId} placeholder="None" onChange={(logoFieldId) => setConfig({ logoFieldId })} />
            </FormRow>
          </div>
          <MultiFieldPicker label="Badges" refs={refs} accepts={["text", "select", "radio", "number", "date", "multiSelect"]} value={config.badgeFieldIds} onChange={(badgeFieldIds) => setConfig({ badgeFieldIds })} />
          <MultiFieldPicker label="Key facts" refs={refs} accepts={["*"]} value={config.metaFieldIds} onChange={(metaFieldIds) => setConfig({ metaFieldIds })} />
          <ButtonsEditor buttons={config.buttons} refs={refs} forms={forms} onChange={(buttons) => setConfig({ buttons })} />
        </>
      )}

      {FIELD_ACCEPTS[block.type] && (
        <FormRow label="Field">
          <FieldPicker refs={refs} accepts={FIELD_ACCEPTS[block.type]} value={config.fieldId} placeholder={block.type === "faq" || block.type === "image" ? "None (use static content)" : "Choose a field…"} onChange={(fieldId) => setConfig({ fieldId })} />
        </FormRow>
      )}

      {block.type === "fieldList" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Style">
              <Select value={config.variant || "list"} onChange={(event) => setConfig({ variant: event.target.value })}>
                <option value="list">Label – value rows</option>
                <option value="cards">Fact cards</option>
              </Select>
            </FormRow>
            {config.variant === "cards" && (
              <FormRow label="Columns">
                <Select value={config.columns || 2} onChange={(event) => setConfig({ columns: Number(event.target.value) })}>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </Select>
              </FormRow>
            )}
          </div>
          <FormRow label="Fields">
            <div className="space-y-2">
              {(config.items || []).map((item, index) => (
                <div key={item.id} className="space-y-1.5 rounded-sm border border-slate-200 bg-slate-50/60 p-2">
                  <div className="flex items-center gap-1">
                    <FieldPicker refs={refs} value={item.fieldId} allowEmpty={false} onChange={(fieldId) => setConfig({ items: config.items.map((it, i) => (i === index ? { ...it, fieldId } : it)) })} />
                    <IconButton icon={Trash2} label="Remove" size={14} tone="danger" onClick={() => setConfig({ items: config.items.filter((_, i) => i !== index) })} />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <TextInput aria-label="Label" placeholder="Label (optional)" className="!py-1.5" value={item.label || ""} onChange={(event) => setConfig({ items: config.items.map((it, i) => (i === index ? { ...it, label: event.target.value } : it)) }, `item-${item.id}`)} />
                    <Select aria-label="Icon" className="!py-1.5" value={item.icon || "none"} onChange={(event) => setConfig({ items: config.items.map((it, i) => (i === index ? { ...it, icon: event.target.value } : it)) })}>
                      {ICON_NAMES.map((name) => <option key={name} value={name}>{name === "none" ? "No icon" : name}</option>)}
                    </Select>
                  </div>
                </div>
              ))}
              <FieldPicker refs={refs} value="" placeholder="+ Add a field" onChange={(fieldId) => fieldId && setConfig({ items: [...(config.items || []), { id: createId("itm"), fieldId, label: "", icon: "none" }] })} />
            </div>
          </FormRow>
        </>
      )}

      {block.type === "text" && (
        <>
          <FormRow label="Text" hint="The same on every entry.">
            <TextArea rows={5} value={config.content || ""} onChange={(event) => setConfig({ content: event.target.value }, "content")} />
          </FormRow>
          <FormRow label="Tone">
            <Select value={config.tone || "normal"} onChange={(event) => setConfig({ tone: event.target.value })}>
              <option value="normal">Normal</option>
              <option value="muted">Muted</option>
              <option value="callout">Callout</option>
            </Select>
          </FormRow>
        </>
      )}

      {block.type === "image" && !config.fieldId && (
        <>
          <FormRow label="Image URL">
            <TextInput value={config.url || ""} placeholder="https://" onChange={(event) => setConfig({ url: event.target.value }, "url")} />
          </FormRow>
          <FormRow label="Alt text">
            <TextInput value={config.alt || ""} onChange={(event) => setConfig({ alt: event.target.value }, "alt")} />
          </FormRow>
        </>
      )}
      {block.type === "image" && (
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Shape">
            <Select value={config.aspect || "auto"} onChange={(event) => setConfig({ aspect: event.target.value })}>
              <option value="auto">Original</option>
              <option value="16/9">16:9</option>
              <option value="21/9">Panorama</option>
              <option value="4/3">4:3</option>
              <option value="1/1">Square</option>
            </Select>
          </FormRow>
          <FormRow label="Fit">
            <Select value={config.fit || "cover"} onChange={(event) => setConfig({ fit: event.target.value })}>
              <option value="cover">Fill</option>
              <option value="contain">Fit</option>
            </Select>
          </FormRow>
        </div>
      )}
      {block.type === "gallery" && (
        <FormRow label="Columns">
          <Select value={config.columns || 3} onChange={(event) => setConfig({ columns: Number(event.target.value) })}>
            {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </FormRow>
      )}
      {block.type === "list" && (
        <FormRow label="Style">
          <Select value={config.variant || "bullets"} onChange={(event) => setConfig({ variant: event.target.value })}>
            <option value="bullets">Bullets</option>
            <option value="numbered">Numbered</option>
            {/* Edeco uses plain bullets for points; check marks were removed.
            <option value="checks">Check marks</option>
            */}
            <option value="chips">Chips</option>
          </Select>
        </FormRow>
      )}
      {block.type === "faq" && !config.fieldId && (
        <FormRow label="Questions (same on every entry)">
          <div className="space-y-2">
            {(config.items || []).map((item, index) => (
              <div key={index} className="space-y-1.5 rounded-sm border border-slate-200 p-2">
                <div className="flex gap-1">
                  <TextInput aria-label="Question" placeholder="Question" value={item.question} onChange={(event) => setConfig({ items: config.items.map((it, i) => (i === index ? { ...it, question: event.target.value } : it)) }, `faq-q-${index}`)} />
                  <IconButton icon={Trash2} label="Remove" size={14} tone="danger" onClick={() => setConfig({ items: config.items.filter((_, i) => i !== index) })} />
                </div>
                <TextArea rows={2} aria-label="Answer" placeholder="Answer" value={item.answer} onChange={(event) => setConfig({ items: config.items.map((it, i) => (i === index ? { ...it, answer: event.target.value } : it)) }, `faq-a-${index}`)} />
              </div>
            ))}
            <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F2853] hover:underline" onClick={() => setConfig({ items: [...(config.items || []), { question: "", answer: "" }] })}>
              <Plus size={13} /> Add question
            </button>
          </div>
        </FormRow>
      )}
      {block.type === "group" && (
        <>
          <FormRow label="Columns">
            <Select value={config.columns || 1} onChange={(event) => setConfig({ columns: Number(event.target.value) })}>
              <option value={1}>One column</option>
              <option value={2}>Two columns</option>
            </Select>
          </FormRow>
          <Toggle label="Box each block" checked={config.boxed !== false} onChange={(boxed) => setConfig({ boxed })} />
        </>
      )}
      {block.type === "accordion" && <Toggle label="Open the first panel" checked={config.openFirst !== false} onChange={(openFirst) => setConfig({ openFirst })} />}
      {block.type === "related" && (
        <>
          <FormRow label="How many">
            <Select value={config.limit || 3} onChange={(event) => setConfig({ limit: Number(event.target.value) })}>
              {[2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Prefer entries with the same…" hint="Optional. Falls back to the newest entries.">
            <FieldPicker refs={refs} accepts={["select", "radio", "multiSelect", "text", "checkbox"]} value={config.matchFieldId} placeholder="Newest first" onChange={(matchFieldId) => setConfig({ matchFieldId })} />
          </FormRow>
        </>
      )}
      {block.type === "buttons" && (
        <>
          <ButtonsEditor buttons={config.buttons} refs={refs} forms={forms} onChange={(buttons) => setConfig({ buttons })} />
          <FormRow label="Alignment">
            <Select value={config.align || "left"} onChange={(event) => setConfig({ align: event.target.value })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </FormRow>
        </>
      )}

      {def.container && <p className="rounded-sm bg-slate-50 px-3 py-2 text-xs text-slate-500">Add blocks inside it with “Add block here” in the outline. {block.type === "tabs" ? "Each child's title becomes a tab." : block.type === "accordion" ? "Each child's title becomes a panel heading." : ""}</p>}

      <div className="space-y-3 border-t border-slate-100 pt-4">
        {!nested && block.type !== "hero" && hasSidebar && (
          <FormRow label="Area">
            <Select value={block.area || "main"} onChange={(event) => onChange({ area: event.target.value })}>
              <option value="main">Main column</option>
              <option value="sidebar">Sidebar</option>
            </Select>
          </FormRow>
        )}
        <Toggle label="Visible" checked={block.visible !== false} onChange={(visible) => onChange({ visible })} />
        {block.type !== "hero" && <Toggle label="Hide when empty" description="Skip this block for entries without a value." checked={block.hideWhenEmpty !== false} onChange={(hideWhenEmpty) => onChange({ hideWhenEmpty })} />}
      </div>
    </div>
  );
};

const PageSettings = ({ value, refs, onChange }) => {
  const layout = value.layout || {};
  const seo = value.seo || {};
  const setLayout = (patch) => onChange({ ...value, layout: { ...layout, ...patch } });
  const setSeo = (patch) => onChange({ ...value, seo: { ...seo, ...patch } });
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Layout</p>
        <FormRow label="Width">
          <Select value={layout.width || "default"} onChange={(event) => setLayout({ width: event.target.value })}>
            <option value="narrow">Narrow (reading)</option>
            <option value="default">Standard</option>
            <option value="wide">Wide</option>
          </Select>
        </FormRow>
        <FormRow label="Sidebar">
          <Select value={layout.sidebar || "none"} onChange={(event) => setLayout({ sidebar: event.target.value })}>
            <option value="none">No sidebar</option>
            <option value="right">Sidebar on the right</option>
            <option value="left">Sidebar on the left</option>
          </Select>
        </FormRow>
        <FormRow label="Background">
          <Select value={layout.background || "tinted"} onChange={(event) => setLayout({ background: event.target.value })}>
            <option value="tinted">Tinted</option>
            <option value="plain">White</option>
          </Select>
        </FormRow>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search engines</p>
        <FormRow label="Page title from">
          <FieldPicker refs={refs} value={seo.titleFieldId} placeholder="Entry title" onChange={(titleFieldId) => setSeo({ titleFieldId })} />
        </FormRow>
        <FormRow label="Description from">
          <FieldPicker refs={refs} accepts={["text", "textarea", "richText"]} value={seo.descriptionFieldId} placeholder="Content type description" onChange={(descriptionFieldId) => setSeo({ descriptionFieldId })} />
        </FormRow>
        <FormRow label="Share image from">
          <FieldPicker refs={refs} accepts={["image"]} value={seo.imageFieldId} placeholder="None" onChange={(imageFieldId) => setSeo({ imageFieldId })} />
        </FormRow>
      </div>
    </div>
  );
};

const BlockRow = ({ block, depth, selectedId, onSelect, onDuplicate, onRemove, onToggle, onAddInto }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const def = PAGE_BLOCKS[block.type];
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cx(isDragging && "z-10 opacity-60")}>
      <div
        className={cx(
          "group flex items-center gap-2 rounded-sm border bg-white px-2 py-2",
          selectedId === block.id ? "border-[#1F2853]" : "border-slate-200 hover:border-slate-300",
          block.visible === false && "opacity-60",
        )}
      >
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Drag ${def.label}`} className="cursor-grab rounded-sm p-0.5 text-slate-300 hover:text-slate-500">
          <GripVertical size={15} />
        </button>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-500">
          <Icon name={def.icon} size={13} />
        </span>
        <button type="button" onClick={() => onSelect(block.id)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium text-slate-800">{block.title || def.label}</span>
          <span className="text-[11.5px] text-slate-500">{def.label}</span>
        </button>
        <div className="flex opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <IconButton icon={block.visible === false ? EyeOff : Eye} label={block.visible === false ? "Show" : "Hide"} size={14} onClick={() => onToggle(block.id)} />
          <IconButton icon={Copy} label="Duplicate" size={14} onClick={() => onDuplicate(block.id)} />
          <IconButton icon={Trash2} label="Delete" size={14} tone="danger" onClick={() => onRemove(block.id)} />
        </div>
      </div>
      {def.container && (
        <div className="ml-5 mt-1.5 border-l-2 border-[#1F2853]/15 pl-3">
          <BlockList blocks={block.children || []} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onDuplicate={onDuplicate} onRemove={onRemove} onToggle={onToggle} onAddInto={onAddInto} />
          <button type="button" onClick={() => onAddInto(block.id)} className="mt-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-[#1F2853]">
            <Plus size={13} /> Add block here
          </button>
        </div>
      )}
    </div>
  );
};

const BlockList = ({ blocks, depth = 0, ...props }) => (
  <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
    <div className="space-y-1.5">
      {blocks.map((block) => <BlockRow key={block.id} block={block} depth={depth} {...props} />)}
    </div>
  </SortableContext>
);

const PageBuilder = ({ value, onChange, formFields }) => {
  const refs = useMemo(() => referenceableFields(formFields || []), [formFields]);
  const [selectedId, setSelectedId] = useState(null);
  const [panel, setPanel] = useState("block");
  const [adding, setAdding] = useState(null); // { parentId, area }
  const [forms, setForms] = useState([]);
  // ?template=<id> (from the Templates library) opens the picker on that template.
  const [params, setParams] = useSearchParams();
  const requestedTemplate = LAYOUT_TEMPLATE_KINDS.page.list.some((template) => template.id === params.get("template")) ? params.get("template") : null;
  const [templateOpen, setTemplateOpen] = useState(Boolean(requestedTemplate));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const blocks = value.blocks || [];

  const closeTemplates = () => {
    setTemplateOpen(false);
    if (params.has("template")) {
      const next = new URLSearchParams(params);
      next.delete("template");
      setParams(next, { replace: true });
    }
  };
  const applyTemplate = (schema) => {
    onChange(schema);
    setSelectedId(null);
    setPanel("block");
    closeTemplates();
  };
  const hasSidebar = value.layout?.sidebar && value.layout.sidebar !== "none";
  const selected = selectedId ? findBlock(blocks, selectedId) : null;
  const selectedNested = selected ? Boolean(locateBlock(blocks, selected.id)?.parentId) : false;

  useEffect(() => {
    cmsAdmin.listForms({ status: "published" }).then((result) => setForms(result.items || [])).catch(() => setForms([]));
  }, []);

  const setBlocks = (next, options) => onChange({ ...value, blocks: next }, options);

  const addBlock = (type) => {
    const block = createPageBlock(type);
    if (adding?.parentId) {
      setBlocks(mapBlocks(blocks, (item) => (item.id === adding.parentId ? { ...item, children: [...(item.children || []), { ...block, showTitle: false }] } : item)));
    } else {
      setBlocks([...blocks, { ...block, area: adding?.area || "main" }]);
    }
    setSelectedId(block.id);
    setPanel("block");
    setAdding(null);
  };

  const actions = {
    selectedId,
    onSelect: (id) => {
      setSelectedId(id);
      setPanel("block");
    },
    onDuplicate: (id) => {
      const location = locateBlock(blocks, id);
      const copy = cloneBlock(location.list[location.index]);
      const list = [...location.list];
      list.splice(location.index + 1, 0, copy);
      setBlocks(setChildren(blocks, location.parentId, list));
      setSelectedId(copy.id);
    },
    onRemove: (id) => {
      setBlocks(removeBlock(blocks, id));
      if (selectedId === id) setSelectedId(null);
    },
    onToggle: (id) => setBlocks(mapBlocks(blocks, (block) => (block.id === id ? { ...block, visible: block.visible === false } : block))),
    onAddInto: (parentId) => setAdding({ parentId }),
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = locateBlock(blocks, active.id);
    const to = locateBlock(blocks, over.id);
    if (!from || !to || from.parentId !== to.parentId) return; // reorder within the same list
    let list = arrayMove(from.list, from.index, to.index);
    // Dragging between the main/sidebar groups moves the block to that area.
    if (!from.parentId) list = list.map((block) => (block.id === active.id ? { ...block, area: to.list[to.index].area || "main" } : block));
    setBlocks(setChildren(blocks, from.parentId, list));
  };

  const groups = [
    { id: "hero", label: "Top", hint: "Hero blocks render full-width above everything", items: blocks.filter((block) => block.type === "hero") },
    { id: "main", label: hasSidebar ? "Main column" : "Page body", items: blocks.filter((block) => block.type !== "hero" && (!hasSidebar || block.area !== "sidebar")) },
    ...(hasSidebar ? [{ id: "sidebar", label: "Sidebar", items: blocks.filter((block) => block.type !== "hero" && block.area === "sidebar") }] : []),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <div className="min-w-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm text-slate-500">
              Build the detail page from blocks. Order, areas and field mapping are yours; Edeco handles the design. Use <span className="font-medium text-slate-700">Preview</span> to see it.
            </p>
            <Button size="sm" icon={LayoutTemplate} className="shrink-0" onClick={() => setTemplateOpen(true)}>Templates</Button>
          </div>
          {!blocks.length && (
            <div className="rounded-sm border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <PanelTop className="mx-auto mb-3 text-slate-400" />
              <p className="font-semibold text-slate-900">This page is blank</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Until you add blocks, Edeco shows a simple list of every field. Start with a hero, then add sections.</p>
              {/* <Button className="mt-4" variant="primary" icon={Plus} onClick={() => setAdding({ area: "main" })}>Add first block</Button> */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="primary" icon={LayoutTemplate} onClick={() => setTemplateOpen(true)}>Start from a template</Button>
                <Button icon={Plus} onClick={() => setAdding({ area: "main" })}>Add first block</Button>
              </div>
            </div>
          )}
          {blocks.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              {groups.map((group) => (
                <section key={group.id} className="rounded-sm border border-slate-200 bg-white/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{group.label}</p>
                      {group.hint && <p className="text-[11px] text-slate-400">{group.hint}</p>}
                    </div>
                    <Button size="sm" variant="ghost" icon={Plus} onClick={() => setAdding({ area: group.id === "sidebar" ? "sidebar" : "main" })}>Add block</Button>
                  </div>
                  {group.items.length ? <BlockList blocks={group.items} {...actions} /> : <p className="rounded-sm bg-slate-50 px-3 py-2 text-center text-xs text-slate-400">Empty</p>}
                </section>
              ))}
            </DndContext>
          )}
        </div>
      </div>

      <aside className="w-full shrink-0 border-t border-slate-200 bg-white lg:w-80 lg:border-l lg:border-t-0">
        <Tabs className="px-2" value={panel} onChange={setPanel} tabs={[{ id: "block", label: "Block" }, { id: "page", label: "Page settings", icon: Settings2 }]} />
        <div className="max-h-[50vh] overflow-y-auto p-4 lg:h-[calc(100%-45px)] lg:max-h-none">
          {panel === "page" ? (
            <PageSettings value={value} refs={refs} onChange={onChange} />
          ) : selected ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Badge tone="navy">{PAGE_BLOCKS[selected.type].label}</Badge>
              </div>
              <BlockSettings
                key={selected.id}
                block={selected}
                refs={refs}
                forms={forms}
                hasSidebar={hasSidebar}
                nested={selectedNested}
                onChange={(patch, mergeKey) => setBlocks(mapBlocks(blocks, (block) => (block.id === selected.id ? { ...block, ...patch } : block)), { mergeKey: mergeKey ? `${selected.id}:${mergeKey}` : null })}
              />
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">Select a block to map fields and set its options, or open Page settings for layout and SEO.</p>
          )}
        </div>
      </aside>

      <Modal open={Boolean(adding)} onClose={() => setAdding(null)} title={adding?.parentId ? "Add a block inside" : "Add a block"} size="lg">
        <div className="space-y-5">
          {BLOCK_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.types
                  .filter((type) => !(adding?.parentId && type === "hero"))
                  .map((type) => (
                    <button key={type} type="button" onClick={() => addBlock(type)} className="flex items-start gap-3 rounded-sm border border-slate-200 px-3 py-2.5 text-left transition hover:border-[#1F2853]/40 hover:bg-[#1F2853]/5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-600">
                        <Icon name={PAGE_BLOCKS[type].icon} size={15} />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-slate-900">{PAGE_BLOCKS[type].label}</span>
                        <span className="block text-xs text-slate-500">{PAGE_BLOCKS[type].description}</span>
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <LayoutTemplatePicker
        open={templateOpen}
        onClose={closeTemplates}
        kind="page"
        formFields={formFields}
        initialId={requestedTemplate}
        hasContent={blocks.length > 0}
        onApply={applyTemplate}
      />
    </div>
  );
};

export default PageBuilder;
