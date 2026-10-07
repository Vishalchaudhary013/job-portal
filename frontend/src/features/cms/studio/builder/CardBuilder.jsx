import React, { useEffect, useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, LayoutTemplate, Plus, Settings2, Trash2, Type } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cmsAdmin } from "../../../../services/cmsAdminAPI";
import { FIELD_TYPES } from "../../shared/fieldTypes.js";
import { CARD_DISPLAYS, CARD_ZONES, ICON_NAMES, TONES, createCardElement, defaultDisplayFor } from "../../shared/presentation.js";
import { referenceableFields } from "../../shared/schemaUtils.js";
import { Button, EmptyState, FormRow, IconButton, Modal, Select, Tabs, TextInput, Toggle, cx } from "../ui";
import FieldPicker from "./FieldPicker";
import LayoutTemplatePicker, { LAYOUT_TEMPLATE_KINDS } from "./LayoutTemplatePicker";

// Card Builder: chooses which fields appear on an entry's card, where, and
// how. It stores only configuration (field IDs + display options) — never
// content. There is no live preview beside it on purpose; use Preview.

const displayAllowed = (display, fieldType, zone) => {
  const def = CARD_DISPLAYS[display];
  if (!def) return false;
  if (def.zones && !def.zones.includes(zone)) return false;
  return !fieldType || def.accepts.includes("*") || def.accepts.includes(fieldType);
};

const ElementRow = ({ element, refsById, selected, onSelect, onToggle, onRemove }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: element.id });
  const ref = element.fieldId ? refsById.get(element.fieldId) : null;
  const name = element.source === "static" ? `“${element.text || "Static text"}”` : ref ? ref.label || ref.key : "Removed field";
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        "group flex items-center gap-2 rounded-sm border bg-white px-2 py-2",
        selected ? "border-[#1F2853]" : "border-slate-200 hover:border-slate-300",
        element.visible === false && "opacity-60",
        isDragging && "z-10 opacity-60",
      )}
    >
      <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Drag ${name}`} className="cursor-grab rounded-sm p-0.5 text-slate-300 hover:text-slate-500">
        <GripVertical size={15} />
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className={cx("block truncate text-sm font-medium", !ref && element.source !== "static" ? "text-red-600" : "text-slate-800")}>{name}</span>
        <span className="text-[11.5px] text-slate-500">{CARD_DISPLAYS[element.display]?.label}</span>
      </button>
      <IconButton icon={element.visible === false ? EyeOff : Eye} label={element.visible === false ? "Show" : "Hide"} size={14} onClick={onToggle} />
      <IconButton icon={Trash2} label="Remove" size={14} tone="danger" onClick={onRemove} />
    </div>
  );
};

const ToneMapEditor = ({ element, fieldRef, onChange }) => {
  const options = fieldRef?.field?.options || [];
  if (!options.length) return null;
  return (
    <FormRow label="Colour by value" hint="Optional: a different badge colour per option.">
      <div className="space-y-1.5">
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{option.label}</span>
            <Select
              aria-label={`Colour for ${option.label}`}
              className="!w-32 !py-1 !text-xs"
              value={element.toneMap?.[option.value] || ""}
              onChange={(event) => {
                const toneMap = { ...(element.toneMap || {}) };
                if (event.target.value) toneMap[option.value] = event.target.value;
                else delete toneMap[option.value];
                onChange({ toneMap });
              }}
            >
              <option value="">Default</option>
              {TONES.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
            </Select>
          </div>
        ))}
      </div>
    </FormRow>
  );
};

const ElementSettings = ({ element, refs, onChange }) => {
  const ref = refs.find((item) => item.id === element.fieldId);
  const fieldType = element.source === "static" ? null : ref?.type;
  const displays = Object.entries(CARD_DISPLAYS).filter(([display]) => element.source === "static" ? ["badge", "text", "meta", "subheading"].includes(display) : displayAllowed(display, fieldType, element.zone));
  const usesIcon = ["meta", "badge", "date"].includes(element.display);
  const usesLines = ["heading", "subheading", "text", "tags"].includes(element.display);

  return (
    <div className="space-y-4">
      {element.source === "static" ? (
        <FormRow label="Text">
          <TextInput value={element.text} onChange={(event) => onChange({ text: event.target.value }, "text")} />
        </FormRow>
      ) : (
        <FormRow label="Field">
          <FieldPicker refs={refs} value={element.fieldId} allowEmpty={false} onChange={(fieldId) => {
            const next = refs.find((item) => item.id === fieldId);
            onChange({ fieldId, display: displayAllowed(element.display, next?.type, element.zone) ? element.display : defaultDisplayFor(next?.type) });
          }} />
        </FormRow>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Show as">
          <Select value={element.display} onChange={(event) => onChange({ display: event.target.value })}>
            {displays.map(([display, def]) => <option key={display} value={display}>{def.label}</option>)}
          </Select>
        </FormRow>
        <FormRow label="Zone">
          <Select value={element.zone} onChange={(event) => onChange({ zone: event.target.value })}>
            {CARD_ZONES.filter((zone) => displayAllowed(element.display, null, zone.id)).map((zone) => <option key={zone.id} value={zone.id}>{zone.label}</option>)}
          </Select>
        </FormRow>
      </div>

      {!["image", "logo"].includes(element.display) && (
        <>
          <Toggle label="Show a label" checked={Boolean(element.showLabel)} onChange={(showLabel) => onChange({ showLabel })} />
          {element.showLabel && (
            <FormRow label="Label" hint={ref ? `Leave empty to use “${ref.label}”.` : undefined}>
              <TextInput value={element.label} onChange={(event) => onChange({ label: event.target.value }, "label")} />
            </FormRow>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Prefix">
              <TextInput value={element.prefix} placeholder="e.g. ₹" onChange={(event) => onChange({ prefix: event.target.value }, "prefix")} />
            </FormRow>
            <FormRow label="Suffix">
              <TextInput value={element.suffix} placeholder="e.g. /month" onChange={(event) => onChange({ suffix: event.target.value }, "suffix")} />
            </FormRow>
          </div>
        </>
      )}

      {usesIcon && (
        <FormRow label="Icon">
          <Select value={element.icon || "none"} onChange={(event) => onChange({ icon: event.target.value })}>
            {ICON_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
          </Select>
        </FormRow>
      )}
      {element.display === "badge" && (
        <>
          <FormRow label="Badge colour">
            <Select value={element.tone || "neutral"} onChange={(event) => onChange({ tone: event.target.value })}>
              {TONES.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
            </Select>
          </FormRow>
          <ToneMapEditor element={element} fieldRef={ref} onChange={onChange} />
        </>
      )}
      {usesLines && (
        <FormRow label={element.display === "tags" ? "Max rows of tags" : "Max lines"}>
          <Select value={element.lines || 0} onChange={(event) => onChange({ lines: Number(event.target.value) })}>
            <option value={0}>No limit</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </FormRow>
      )}
      <Toggle label="Hide when empty" description="Skip this element on cards whose entry has no value." checked={element.hideWhenEmpty !== false} onChange={(hideWhenEmpty) => onChange({ hideWhenEmpty })} />
      {fieldType && <p className="text-xs text-slate-400">Source: {FIELD_TYPES[fieldType]?.label} field · key <code>{ref?.path}</code></p>}
    </div>
  );
};

const CardSettings = ({ value, refs, onChange, forms }) => {
  const style = value.style || {};
  const action = value.action || {};
  const setStyle = (patch) => onChange({ ...value, style: { ...style, ...patch } });
  const setAction = (patch, mergeKey) => onChange({ ...value, action: { ...action, ...patch } }, { mergeKey });
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Layout</p>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Direction">
            <Select value={value.layout || "vertical"} onChange={(event) => onChange({ ...value, layout: event.target.value })}>
              <option value="vertical">Image on top</option>
              <option value="horizontal">Image on the side</option>
            </Select>
          </FormRow>
          <FormRow label="Alignment">
            <Select value={style.align || "left"} onChange={(event) => setStyle({ align: event.target.value })}>
              <option value="left">Left</option>
              <option value="center">Centered</option>
            </Select>
          </FormRow>
          <FormRow label="Padding">
            <Select value={style.padding || "md"} onChange={(event) => setStyle({ padding: event.target.value })}>
              <option value="sm">Compact</option>
              <option value="md">Comfortable</option>
              <option value="lg">Spacious</option>
            </Select>
          </FormRow>
          <FormRow label="Spacing">
            <Select value={style.gap || "normal"} onChange={(event) => setStyle({ gap: event.target.value })}>
              <option value="tight">Tight</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
            </Select>
          </FormRow>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Image</p>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Shape">
            <Select value={style.imageAspect || "16/9"} onChange={(event) => setStyle({ imageAspect: event.target.value })}>
              <option value="16/9">Wide 16:9</option>
              <option value="3/2">Photo 3:2</option>
              <option value="4/3">Classic 4:3</option>
              <option value="1/1">Square</option>
            </Select>
          </FormRow>
          <FormRow label="Fit">
            <Select value={style.imageFit || "cover"} onChange={(event) => setStyle({ imageFit: event.target.value })}>
              <option value="cover">Fill (crop)</option>
              <option value="contain">Fit (no crop)</option>
            </Select>
          </FormRow>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Surface</p>
        {/* Corner radius and shadow are fixed by the design system (small radius,
            no shadows), so they are no longer per-card settings.
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Corners">
            <Select value={style.radius || "md"} onChange={(event) => setStyle({ radius: event.target.value })}>
              <option value="none">Square</option>
              <option value="sm">Slight</option>
              <option value="md">Rounded</option>
              <option value="lg">Very rounded</option>
            </Select>
          </FormRow>
          <FormRow label="Shadow">
            <Select value={style.shadow || "sm"} onChange={(event) => setStyle({ shadow: event.target.value })}>
              <option value="none">None</option>
              <option value="sm">Subtle</option>
              <option value="md">Raised</option>
            </Select>
          </FormRow>
        </div>
        */}
        <Toggle label="Border" checked={style.border !== false} onChange={(border) => setStyle({ border })} />
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Action</p>
        <FormRow label="When clicked">
          <Select value={action.type || "detail"} onChange={(event) => setAction({ type: event.target.value })}>
            <option value="detail">Open the detail page</option>
            <option value="fieldUrl">Open a link from a field</option>
            <option value="url">Open a fixed link</option>
            <option value="form">Open a response form</option>
            <option value="none">No action</option>
          </Select>
        </FormRow>
        {action.type !== "none" && (
          <>
            <FormRow label="Button text">
              <TextInput value={action.label || ""} onChange={(event) => setAction({ label: event.target.value }, "action-label")} />
            </FormRow>
            {action.type === "url" && (
              <FormRow label="URL">
                <TextInput value={action.url || ""} placeholder="https://" onChange={(event) => setAction({ url: event.target.value }, "action-url")} />
              </FormRow>
            )}
            {action.type === "fieldUrl" && (
              <FormRow label="Link field">
                <FieldPicker refs={refs} accepts={["url", "text", "file"]} value={action.fieldId} onChange={(fieldId) => setAction({ fieldId })} />
              </FormRow>
            )}
            {action.type === "form" && (
              <FormRow label="Response form" hint="Only published forms are listed.">
                <Select value={action.formSlug || ""} onChange={(event) => setAction({ formSlug: event.target.value })}>
                  <option value="">Choose a form…</option>
                  {forms.map((form) => <option key={form.slug} value={form.slug}>{form.name}</option>)}
                </Select>
              </FormRow>
            )}
            <FormRow label="Button style">
              <Select value={action.style || "primary"} onChange={(event) => setAction({ style: event.target.value })}>
                <option value="primary">Primary</option>
                <option value="accent">Accent</option>
                <option value="secondary">Outline</option>
                <option value="link">Text link</option>
              </Select>
            </FormRow>
            {["url", "fieldUrl"].includes(action.type) && <Toggle label="Open in a new tab" checked={Boolean(action.newTab)} onChange={(newTab) => setAction({ newTab })} />}
            {action.type === "detail" && <Toggle label="Whole card is clickable" checked={action.wholeCardClickable !== false} onChange={(wholeCardClickable) => setAction({ wholeCardClickable })} />}
          </>
        )}
      </div>
    </div>
  );
};

const CardBuilder = ({ value, onChange, formFields }) => {
  const refs = useMemo(() => referenceableFields(formFields || []), [formFields]);
  const refsById = useMemo(() => new Map(refs.map((ref) => [ref.id, ref])), [refs]);
  const [selectedId, setSelectedId] = useState(null);
  const [panel, setPanel] = useState("element");
  const [adding, setAdding] = useState(null); // zone id
  const [forms, setForms] = useState([]);
  // ?template=<id> (from the Templates library) opens the picker on that template.
  const [params, setParams] = useSearchParams();
  const requestedTemplate = LAYOUT_TEMPLATE_KINDS.card.list.some((template) => template.id === params.get("template")) ? params.get("template") : null;
  const [templateOpen, setTemplateOpen] = useState(Boolean(requestedTemplate));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const elements = value.elements || [];
  const selected = elements.find((element) => element.id === selectedId);

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
    setPanel("element");
    closeTemplates();
  };

  useEffect(() => {
    cmsAdmin.listForms({ status: "published" }).then((result) => setForms(result.items || [])).catch(() => setForms([]));
  }, []);

  const setElements = (next, options) => onChange({ ...value, elements: next }, options);
  const updateElement = (id, patch, mergeKey) => setElements(elements.map((element) => (element.id === id ? { ...element, ...patch } : element)), { mergeKey: mergeKey ? `${id}:${mergeKey}` : null });

  const addElement = (zone, ref) => {
    const element = ref ? createCardElement({ fieldId: ref.id, fieldType: ref.type, zone }) : createCardElement({ zone, source: "static" });
    if (ref && !displayAllowed(element.display, ref.type, zone)) {
      element.display = Object.keys(CARD_DISPLAYS).find((display) => displayAllowed(display, ref.type, zone)) || "text";
    }
    setElements([...elements, element]);
    setSelectedId(element.id);
    setPanel("element");
    setAdding(null);
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = elements.findIndex((element) => element.id === active.id);
    const to = elements.findIndex((element) => element.id === over.id);
    if (from < 0 || to < 0) return;
    const target = elements[to];
    const moved = arrayMove(elements, from, to).map((element) => (element.id === active.id ? { ...element, zone: target.zone } : element));
    setElements(moved);
  };

  if (!refs.length) {
    return (
      <div className="p-6">
        <EmptyState icon={Type} title="Add fields to the form first" description="Cards are built from the content type's fields. Once the form has fields, choose which ones appear on the card." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <div className="min-w-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm text-slate-500">
              Choose what each card shows. Edeco draws the card in its own design using these settings — use <span className="font-medium text-slate-700">Preview</span> to see it.
            </p>
            <Button size="sm" icon={LayoutTemplate} className="shrink-0" onClick={() => setTemplateOpen(true)}>Templates</Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="overflow-hidden rounded-sm border-2 border-dashed border-slate-300 bg-white">
              {CARD_ZONES.map((zone) => {
                const zoneElements = elements.filter((element) => element.zone === zone.id);
                return (
                  <section key={zone.id} className="border-b border-dashed border-slate-200 p-3 last:border-b-0">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{zone.label}</p>
                        <p className="text-[11px] text-slate-400">{zone.hint}</p>
                      </div>
                      <Button size="sm" variant="ghost" icon={Plus} onClick={() => setAdding(zone.id)}>Add</Button>
                    </div>
                    <SortableContext items={zoneElements.map((element) => element.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-1.5">
                        {zoneElements.map((element) => (
                          <ElementRow
                            key={element.id}
                            element={element}
                            refsById={refsById}
                            selected={selectedId === element.id}
                            onSelect={() => {
                              setSelectedId(element.id);
                              setPanel("element");
                            }}
                            onToggle={() => updateElement(element.id, { visible: element.visible === false })}
                            onRemove={() => {
                              setElements(elements.filter((item) => item.id !== element.id));
                              if (selectedId === element.id) setSelectedId(null);
                            }}
                          />
                        ))}
                        {!zoneElements.length && <p className="rounded-sm bg-slate-50 px-3 py-2 text-center text-xs text-slate-400">Empty</p>}
                      </div>
                    </SortableContext>
                  </section>
                );
              })}
            </div>
          </DndContext>
          {/* {!elements.length && <p className="mt-4 text-center text-sm text-slate-500">The card is empty. Add fields to any zone to start.</p>} */}
          {!elements.length && (
            <p className="mt-4 text-center text-sm text-slate-500">
              The card is empty. Add fields to any zone, or{" "}
              <button type="button" className="font-semibold text-[#1F2853] hover:underline" onClick={() => setTemplateOpen(true)}>start from a template</button>.
            </p>
          )}
        </div>
      </div>

      <aside className="w-full shrink-0 border-t border-slate-200 bg-white lg:w-80 lg:border-l lg:border-t-0">
        <Tabs
          className="px-2"
          value={panel}
          onChange={setPanel}
          tabs={[
            { id: "element", label: "Element" },
            { id: "card", label: "Card settings", icon: Settings2 },
          ]}
        />
        <div className="max-h-[50vh] overflow-y-auto p-4 lg:max-h-none lg:h-[calc(100%-45px)]">
          {panel === "card" ? (
            <CardSettings value={value} refs={refs} onChange={onChange} forms={forms} />
          ) : selected ? (
            <ElementSettings key={selected.id} element={selected} refs={refs} onChange={(patch, mergeKey) => updateElement(selected.id, patch, mergeKey)} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">Select an element to configure it, or open Card settings for layout, style and the click action.</p>
          )}
        </div>
      </aside>

      <Modal open={Boolean(adding)} onClose={() => setAdding(null)} title={`Add to ${CARD_ZONES.find((zone) => zone.id === adding)?.label || ""}`} size="md">
        <div className="space-y-1">
          {refs
            .filter((ref) => Object.keys(CARD_DISPLAYS).some((display) => displayAllowed(display, ref.type, adding)))
            .map((ref) => {
              const used = elements.some((element) => element.fieldId === ref.id);
              return (
                <button key={ref.id} type="button" onClick={() => addElement(adding, ref)} className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left hover:bg-slate-50">
                  <span>
                    <span className="block text-sm font-medium text-slate-800">{ref.label || ref.key}</span>
                    <span className="text-xs text-slate-500">{FIELD_TYPES[ref.type]?.label} · {ref.path}</span>
                  </span>
                  {used && <span className="text-xs text-slate-400">on card</span>}
                </button>
              );
            })}
          <button type="button" onClick={() => addElement(adding, null)} className="flex w-full items-center gap-2 rounded-sm border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-[#1F2853] hover:bg-slate-50">
            <Type size={15} /> Static text (same on every card)
          </button>
        </div>
      </Modal>

      <LayoutTemplatePicker
        open={templateOpen}
        onClose={closeTemplates}
        kind="card"
        formFields={formFields}
        initialId={requestedTemplate}
        hasContent={elements.length > 0}
        onApply={applyTemplate}
      />
    </div>
  );
};

export default CardBuilder;
