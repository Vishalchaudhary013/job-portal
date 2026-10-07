import React, { useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Eye, EyeOff, GitBranch, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import DynamicFields from "../../inputs/DynamicFields";
import { MediaHandlerContext } from "../../inputs/MediaInput";
import { FIELD_CATEGORIES, FIELD_TYPES, defaultDataFor, isContainer } from "../../shared/fieldTypes.js";
import { cloneField, createField, findField, flattenFields, insertFieldInTree, locateField, removeFieldFromTree, uniqueKey, updateFieldInTree } from "../../shared/schemaUtils.js";
import { validateData } from "../../shared/validation.js";
import Icon from "../Icon";
import { useHotkeys } from "../hooks";
import { Badge, Button, Drawer, EmptyState, IconButton, Modal, cx, useFeedback } from "../ui";
import FieldSettings from "./FieldSettings";

// The form builder: field library (left), the form canvas (centre) and the
// selected field's settings (right). Starts blank; the admin adds every field.
// Controlled: `fields` + `onChange(nextFields, { mergeKey })` — the parent owns
// undo/redo history and saving.

const replaceChildren = (fields, parentId, list) =>
  parentId ? updateFieldInTree(fields, parentId, { children: list }) : list;

// Fields sharing a data scope with `parentId` (sections are transparent;
// groups/repeaters start a new scope) — used to keep keys unique.
const scopeFields = (fields, parentId) => {
  let scopeOwner = parentId;
  while (scopeOwner) {
    const owner = findField(fields, scopeOwner);
    if (!owner || owner.type !== "section") break;
    scopeOwner = locateField(fields, owner.id)?.parentId || null;
  }
  const list = scopeOwner ? findField(fields, scopeOwner)?.children || [] : fields;
  const out = [];
  const collect = (items) =>
    items.forEach((item) => {
      out.push(item);
      if (item.type === "section") collect(item.children || []);
    });
  collect(list);
  return out;
};

const isInside = (field, targetId) => flattenFields([field]).some(({ field: item }) => item.id === targetId);

const Palette = ({ onAdd }) => {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a field type" aria-label="Find a field type" className="w-full rounded-sm border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-sm focus:border-[#1F2853] focus:bg-white focus:outline-none" />
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {FIELD_CATEGORIES.map((category) => {
          const items = Object.entries(FIELD_TYPES).filter(([type, def]) => def.category === category.id && (!q || def.label.toLowerCase().includes(q) || type.toLowerCase().includes(q)));
          if (!items.length) return null;
          return (
            <div key={category.id}>
              <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{category.label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map(([type, def]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAdd(type)}
                    className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-2 py-1.5 text-left text-[12.5px] font-medium text-slate-700 transition hover:border-[#1F2853]/40 hover:bg-[#1F2853]/5 hover:text-slate-900"
                  >
                    <Icon name={def.icon} size={14} className="shrink-0 text-slate-500" />
                    <span className="truncate">{def.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DropZone = ({ id, label }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cx("rounded-sm border border-dashed px-3 py-3 text-center text-xs transition", isOver ? "border-[#1F2853] bg-[#1F2853]/5 text-[#1F2853]" : "border-slate-300 text-slate-400")}>
      {label}
    </div>
  );
};

const FieldCard = ({ field, selectedId, onSelect, onDuplicate, onRemove, lockedFieldIds, problemsById, onAddInto, depth }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const def = FIELD_TYPES[field.type];
  const selected = selectedId === field.id;
  const problems = problemsById[field.id];

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cx("relative", isDragging && "z-10 opacity-60")}>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(field.id);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(field.id);
          }
        }}
        className={cx(
          "group flex items-start gap-2 rounded-sm border bg-white px-2 py-2.5 transition focus:outline-none",
          selected ? "border-[#1F2853]" : problems ? "border-red-300" : "border-slate-200 hover:border-slate-300",
          field.type === "section" && "bg-slate-50/80",
        )}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag ${field.label || def?.label}`}
          className="mt-0.5 cursor-grab rounded-sm p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-500">
          <Icon name={def?.icon} size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cx("truncate text-sm font-medium", field.type === "divider" ? "text-slate-400" : "text-slate-900")}>
              {field.type === "divider" ? "Divider" : field.label || <span className="italic text-slate-400">Untitled</span>}
            </span>
            {field.required && <span className="text-sm text-red-500" aria-label="required">*</span>}
            {field.conditions?.rules?.length > 0 && (
              <Badge tone="violet" className="!py-0">
                <GitBranch size={10} /> conditional
              </Badge>
            )}
            {lockedFieldIds.has(field.id) && <Badge tone="green" className="!py-0">published</Badge>}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-500">
            <span>{def?.label}</span>
            {field.key && <code className="rounded-sm bg-slate-100 px-1 font-mono text-[10.5px] text-slate-600">{field.key}</code>}
          </div>
          {problems && <p className="mt-1 text-[11.5px] text-red-600">{problems[0]}</p>}
        </div>
        <div className="flex items-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <IconButton icon={Copy} label="Duplicate" size={14} onClick={(event) => { event.stopPropagation(); onDuplicate(field.id); }} />
          <IconButton icon={Trash2} label="Delete" size={14} tone="danger" onClick={(event) => { event.stopPropagation(); onRemove(field.id); }} />
        </div>
      </div>

      {isContainer(field) && (
        <div className={cx("ml-5 mt-1.5 border-l-2 pl-3", field.type === "section" ? "border-slate-200" : "border-[#1F2853]/15")}>
          <FieldList
            list={field.children || []}
            parentId={field.id}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            lockedFieldIds={lockedFieldIds}
            problemsById={problemsById}
            onAddInto={onAddInto}
          />
          <button type="button" onClick={() => onAddInto(field.id)} className="mt-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-[#1F2853]">
            <Plus size={13} /> Add field to {field.type === "repeater" ? "each item" : `this ${field.type}`}
          </button>
        </div>
      )}
    </div>
  );
};

const FieldList = ({ list, parentId, depth = 0, ...props }) => (
  <SortableContext items={list.map((field) => field.id)} strategy={verticalListSortingStrategy}>
    <div className="space-y-1.5">
      {list.map((field) => (
        <FieldCard key={field.id} field={field} depth={depth} {...props} />
      ))}
      {!list.length && parentId && <DropZone id={`drop:${parentId}`} label="Drop fields here" />}
    </div>
  </SortableContext>
);

const FormPreview = ({ fields, open, onClose }) => {
  const [values, setValues] = useState(() => defaultDataFor(fields));
  const [errors, setErrors] = useState({});
  const mediaHandler = useMemo(() => ({ upload: async (file) => ({ url: URL.createObjectURL(file), name: file.name, mime: file.type, size: file.size }) }), []);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Form preview"
      description="Try the form exactly as people will fill it in. Nothing is saved."
      footer={
        <>
          <Button onClick={() => { setValues(defaultDataFor(fields)); setErrors({}); }}>Reset</Button>
          <Button variant="primary" onClick={() => setErrors(validateData(fields, values).errors)}>Check validation</Button>
        </>
      }
    >
      <MediaHandlerContext.Provider value={mediaHandler}>
        <DynamicFields fields={fields} values={values} onChange={setValues} errors={errors} />
      </MediaHandlerContext.Provider>
      {Object.keys(errors).length === 0 && <p className="mt-4 text-xs text-slate-400">Press “Check validation” to see required/format errors.</p>}
    </Modal>
  );
};

const FormSchemaBuilder = ({ fields, onChange, lockedFieldIds = new Set(), problemsById = {}, toolbar }) => {
  const { toast } = useFeedback();
  const [selectedId, setSelectedId] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const selected = selectedId ? findField(fields, selectedId) : null;
  const containers = useMemo(
    () =>
      flattenFields(fields)
        .filter(({ field }) => isContainer(field) && (!selected || !isInside(selected, field.id)))
        .map(({ field, depth }) => ({ id: field.id, label: field.label || FIELD_TYPES[field.type].label, depth })),
    [fields, selected],
  );

  const addField = (type, intoId = undefined) => {
    let parentId = null;
    let index = null;
    if (intoId !== undefined) parentId = intoId;
    else if (selected) {
      if (isContainer(selected)) parentId = selected.id;
      else {
        const location = locateField(fields, selected.id);
        parentId = location?.parentId || null;
        index = (location?.index ?? -1) + 1;
      }
    }
    // Repeaters/groups can't hold sections of their own nesting depth beyond 4 — the server enforces depth.
    const field = createField(type, scopeFields(fields, parentId));
    onChange(insertFieldInTree(fields, field, parentId, index));
    setSelectedId(field.id);
    setPaletteOpen(false);
  };

  const duplicate = (fieldId) => {
    const location = locateField(fields, fieldId);
    const original = findField(fields, fieldId);
    if (!location || !original) return;
    const copy = cloneField(original, scopeFields(fields, location.parentId));
    onChange(insertFieldInTree(fields, copy, location.parentId, location.index + 1));
    setSelectedId(copy.id);
  };

  const remove = (fieldId) => {
    const field = findField(fields, fieldId);
    onChange(removeFieldFromTree(fields, fieldId));
    if (selectedId && field && isInside(field, selectedId)) setSelectedId(null);
    toast(lockedFieldIds.has(fieldId) ? "Field removed. Existing content keeps its data — undo with Ctrl+Z." : "Field removed — undo with Ctrl+Z.", "info");
  };

  const moveInto = (fieldId, targetParentId) => {
    const field = findField(fields, fieldId);
    if (!field || (targetParentId && isInside(field, targetParentId))) return;
    const without = removeFieldFromTree(fields, fieldId);
    const moved = field.key ? { ...field, key: uniqueKey(field.key, scopeFields(without, targetParentId)) } : field;
    onChange(insertFieldInTree(without, moved, targetParentId, null));
  };

  const nudge = (direction) => {
    if (!selected) return;
    const location = locateField(fields, selected.id);
    const target = location.index + direction;
    if (target < 0 || target >= location.list.length) return;
    onChange(replaceChildren(fields, location.parentId, arrayMove(location.list, location.index, target)));
  };

  useHotkeys({
    "alt+arrowup": () => nudge(-1),
    "alt+arrowdown": () => nudge(1),
    "mod+d": () => selected && duplicate(selected.id),
    escape: () => setSelectedId(null),
  });

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = locateField(fields, active.id);
    if (!from) return;
    let toParent;
    let toIndex;
    if (String(over.id).startsWith("drop:")) {
      toParent = String(over.id).slice(5);
      toIndex = null;
    } else {
      const to = locateField(fields, over.id);
      if (!to) return;
      toParent = to.parentId;
      toIndex = to.index;
    }
    const moving = from.list[from.index];
    if (toParent && isInside(moving, toParent)) return; // can't drop a container into itself

    if (from.parentId === toParent) {
      onChange(replaceChildren(fields, toParent, arrayMove(from.list, from.index, toIndex ?? from.list.length - 1)));
      return;
    }
    const without = removeFieldFromTree(fields, moving.id);
    const moved = moving.key ? { ...moving, key: uniqueKey(moving.key, scopeFields(without, toParent)) } : moving;
    onChange(insertFieldInTree(without, moved, toParent, toIndex));
  };

  const valueFields = flattenFields(fields).filter(({ field }) => FIELD_TYPES[field.type]?.hasValue).length;
  const listProps = { selectedId, onSelect: setSelectedId, onDuplicate: duplicate, onRemove: remove, lockedFieldIds, problemsById, onAddInto: (id) => { setSelectedId(id); setPaletteOpen(true); } };

  const settingsPanel = selected && (
    <FieldSettings
      key={selected.id}
      field={selected}
      allFields={fields}
      lockedKey={lockedFieldIds.has(selected.id)}
      containers={containers.filter((container) => container.id !== locateField(fields, selected.id)?.parentId)}
      problems={problemsById[selected.id] || []}
      onChange={(patch, mergeKey) => onChange(updateFieldInTree(fields, selected.id, patch), { mergeKey: mergeKey ? `${selected.id}:${mergeKey}` : null })}
      onMove={(target) => moveInto(selected.id, target)}
    />
  );

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Palette onAdd={(type) => addField(type)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{valueFields} field{valueFields === 1 ? "" : "s"}</span>
            {toolbar}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" icon={Plus} className="lg:hidden" onClick={() => setPaletteOpen(true)}>Add field</Button>
            <Button size="sm" icon={previewOpen ? EyeOff : Eye} disabled={!fields.length} onClick={() => { setPreviewKey((n) => n + 1); setPreviewOpen(true); }}>
              Preview form
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6" onClick={() => setSelectedId(null)}>
          <div className="mx-auto max-w-2xl">
            {fields.length === 0 ? (
              <EmptyState
                icon={Plus}
                title="This form is blank"
                description="Add the fields you need from the field library. You decide every field, its key, validation and visibility."
                action={<Button variant="primary" icon={Plus} onClick={(event) => { event.stopPropagation(); setPaletteOpen(true); }}>Add your first field</Button>}
              />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <FieldList list={fields} parentId={null} {...listProps} />
              </DndContext>
            )}
            {fields.length > 0 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(null);
                  setPaletteOpen(true);
                }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 hover:border-[#1F2853] hover:text-[#1F2853]"
              >
                <Plus size={15} /> Add field
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-white xl:block">
        {settingsPanel || (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-slate-500">
            Select a field to edit its label, key, validation and visibility rules.
          </div>
        )}
      </aside>

      {/* Smaller screens: settings slide in as a drawer. */}
      <div className="xl:hidden">
        <Drawer open={Boolean(selected)} onClose={() => setSelectedId(null)} title="Field settings" width="max-w-sm">
          <div className="-mx-5 -my-4 h-full">{settingsPanel}</div>
        </Drawer>
      </div>

      <Modal open={paletteOpen} onClose={() => setPaletteOpen(false)} title="Add a field" description={selected && isContainer(selected) ? `Adding inside “${selected.label || "container"}”` : undefined} size="lg" bodyClassName="!p-0">
        <div className="h-[60vh]">
          <Palette onAdd={(type) => addField(type)} />
        </div>
      </Modal>

      {previewOpen && <FormPreview key={previewKey} fields={fields} open={previewOpen} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
};

export default FormSchemaBuilder;
