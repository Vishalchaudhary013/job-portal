import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from "lucide-react";
import { CONDITION_OPERATORS } from "../../shared/conditions.js";
import { FIELD_TYPES, fieldHasValue } from "../../shared/fieldTypes.js";
import { KEY_PATTERN, createId, toKey, toSlug } from "../../shared/ids.js";
import { flattenFields } from "../../shared/schemaUtils.js";
import Icon from "../Icon";
import { FormRow, IconButton, Select, Tabs, TextArea, TextInput, Toggle, fieldClass } from "../ui";

// Right-hand panel of the form builder: every setting of the selected field.
// Settings are grouped into tabs and only the ones the field type supports
// are shown (progressive disclosure).

const supports = (field, capability) => FIELD_TYPES[field.type]?.supports?.includes(capability);
const numberOrNull = (raw) => (raw === "" || raw === null || raw === undefined ? null : Number(raw));

const OptionsEditor = ({ field, onChange }) => {
  const options = field.options || [];
  const update = (next) => onChange({ options: next });
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");

  return (
    <FormRow label={field.type === "checkbox" ? "Options (leave empty for a single yes/no checkbox)" : "Options"}>
      {bulk ? (
        <div className="space-y-2">
          <TextArea rows={6} value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder={"One option per line\nLabel|value (value optional)"} />
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs font-semibold text-[#1F2853] hover:underline"
              onClick={() => {
                const next = bulkText
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [label, value] = line.split("|").map((part) => part.trim());
                    return { label, value: value || toSlug(label) || label };
                  });
                update(next);
                setBulk(false);
              }}
            >
              Apply
            </button>
            <button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => setBulk(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-1">
              <TextInput
                aria-label={`Option ${index + 1} label`}
                className="!py-1.5"
                value={option.label}
                onChange={(event) => {
                  const label = event.target.value;
                  // Keep value in step with the label until it's been edited by hand.
                  const autoValue = option.value === toSlug(option.label) || !option.value;
                  update(options.map((item, i) => (i === index ? { ...item, label, ...(autoValue ? { value: toSlug(label) || label } : {}) } : item)));
                }}
              />
              <TextInput
                aria-label={`Option ${index + 1} value`}
                className="!w-28 !py-1.5 font-mono !text-xs"
                value={option.value}
                onChange={(event) => update(options.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)))}
              />
              <IconButton icon={ArrowUp} label="Move up" size={14} disabled={index === 0} onClick={() => {
                const next = [...options];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                update(next);
              }} />
              <IconButton icon={Trash2} label="Remove option" size={14} tone="danger" onClick={() => update(options.filter((_, i) => i !== index))} />
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F2853] hover:underline" onClick={() => update([...options, { label: `Option ${options.length + 1}`, value: `option-${options.length + 1}` }])}>
              <Plus size={13} /> Add option
            </button>
            <button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => {
              setBulkText(options.map((option) => (option.value === toSlug(option.label) ? option.label : `${option.label}|${option.value}`)).join("\n"));
              setBulk(true);
            }}>
              Bulk edit
            </button>
          </div>
        </div>
      )}
    </FormRow>
  );
};

const ColumnsEditor = ({ field, onChange }) => {
  const columns = field.columns || [];
  const update = (next) => onChange({ columns: next });
  return (
    <FormRow label="Columns">
      <div className="space-y-1.5">
        {columns.map((column, index) => (
          <div key={column.id || index} className="flex items-center gap-1">
            <TextInput
              aria-label="Column label"
              className="!py-1.5"
              value={column.label}
              onChange={(event) => {
                const label = event.target.value;
                update(columns.map((item, i) => (i === index ? { ...item, label, key: item.key === toKey(item.label) || !item.key ? toKey(label) : item.key } : item)));
              }}
            />
            <Select aria-label="Column type" className="!w-24 !py-1.5 !text-xs" value={column.type} onChange={(event) => update(columns.map((item, i) => (i === index ? { ...item, type: event.target.value } : item)))}>
              <option value="text">Text</option>
              <option value="number">Number</option>
            </Select>
            <IconButton icon={Trash2} label="Remove column" size={14} tone="danger" onClick={() => update(columns.filter((_, i) => i !== index))} />
          </div>
        ))}
        <button type="button" className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-[#1F2853] hover:underline" onClick={() => update([...columns, { id: createId("col"), key: `column${columns.length + 1}`, label: `Column ${columns.length + 1}`, type: "text" }])}>
          <Plus size={13} /> Add column
        </button>
      </div>
    </FormRow>
  );
};

const DefaultValueInput = ({ field, onChange }) => {
  const value = field.defaultValue ?? "";
  const set = (next) => onChange({ defaultValue: next === "" ? undefined : next });
  if (["select", "radio"].includes(field.type)) {
    return (
      <Select value={value} onChange={(event) => set(event.target.value)}>
        <option value="">No default</option>
        {(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
    );
  }
  if (field.type === "checkbox" && !field.options?.length) {
    return <Toggle label="Checked by default" checked={field.defaultValue === true} onChange={(checked) => onChange({ defaultValue: checked || undefined })} />;
  }
  if (field.type === "number" || field.type === "rating") {
    return <TextInput type="number" value={value} onChange={(event) => set(numberOrNull(event.target.value) ?? "")} />;
  }
  if (field.type === "date") return <TextInput type="date" value={value} onChange={(event) => set(event.target.value)} />;
  if (field.type === "color") return <TextInput value={value} placeholder="#1F2853" onChange={(event) => set(event.target.value)} />;
  if (["checkbox", "multiSelect"].includes(field.type)) return null;
  return <TextInput value={value} onChange={(event) => set(event.target.value)} />;
};

const ConditionsEditor = ({ field, allFields, onChange }) => {
  const conditions = field.conditions || { logic: "all", rules: [] };
  // Any other value field outside this field's own subtree can drive it.
  const ownIds = new Set(flattenFields([field]).map(({ field: item }) => item.id));
  const candidates = flattenFields(allFields).filter(({ field: item }) => fieldHasValue(item) && item.key && !ownIds.has(item.id) && !["repeater", "group", "table", "faq", "image", "file", "richText"].includes(item.type));
  const update = (patch) => onChange({ conditions: { ...conditions, ...patch } });
  const setRule = (index, patch) => update({ rules: conditions.rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)) });

  if (!candidates.length) return <p className="text-sm text-slate-500">Add another field first — visibility rules compare against other fields' answers.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Show this field only when…</p>
      {conditions.rules.length > 1 && (
        <Select value={conditions.logic} onChange={(event) => update({ logic: event.target.value })} aria-label="Match">
          <option value="all">All rules match</option>
          <option value="any">Any rule matches</option>
        </Select>
      )}
      {conditions.rules.map((rule, index) => {
        const source = candidates.find(({ field: item }) => item.id === rule.fieldId)?.field;
        const operator = CONDITION_OPERATORS.find((item) => item.id === rule.operator);
        return (
          <div key={index} className="space-y-1.5 rounded-sm border border-slate-200 bg-slate-50/60 p-2.5">
            <div className="flex items-center gap-1">
              <Select aria-label="Field" value={rule.fieldId || ""} onChange={(event) => setRule(index, { fieldId: event.target.value, value: "" })}>
                <option value="">Choose a field…</option>
                {candidates.map(({ field: item }) => <option key={item.id} value={item.id}>{item.label || item.key}</option>)}
              </Select>
              <IconButton icon={Trash2} label="Remove rule" size={14} tone="danger" onClick={() => update({ rules: conditions.rules.filter((_, i) => i !== index) })} />
            </div>
            <Select aria-label="Operator" value={rule.operator} onChange={(event) => setRule(index, { operator: event.target.value })}>
              {CONDITION_OPERATORS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </Select>
            {operator?.needsValue &&
              (source?.options?.length ? (
                <Select aria-label="Value" value={rule.value ?? ""} onChange={(event) => setRule(index, { value: event.target.value })}>
                  <option value="">Choose…</option>
                  {source.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              ) : (
                <TextInput aria-label="Value" placeholder="Value" value={rule.value ?? ""} onChange={(event) => setRule(index, { value: event.target.value })} />
              ))}
          </div>
        );
      })}
      <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F2853] hover:underline" onClick={() => update({ rules: [...conditions.rules, { fieldId: "", operator: "equals", value: "" }] })}>
        <Plus size={13} /> Add rule
      </button>
      {conditions.rules.length > 0 && <p className="text-xs text-slate-500">Hidden fields are skipped by validation, even if required.</p>}
    </div>
  );
};

const FieldSettings = ({ field, allFields, onChange, lockedKey, containers, onMove, problems = [] }) => {
  const [tab, setTab] = useState("general");
  const def = FIELD_TYPES[field.type];
  const validation = field.validation || {};
  const settings = field.settings || {};
  const setValidation = (patch) => onChange({ validation: { ...validation, ...patch } }, `v-${Object.keys(patch)[0]}`);
  const setSettings = (patch) => onChange({ settings: { ...settings, ...patch } }, `s-${Object.keys(patch)[0]}`);
  const keyIsAuto = useMemo(() => field.key === toKey(field.label), [field.key, field.label]);

  const hasValidation = ["length", "pattern", "range", "items", "dateRange", "accept", "fileSize"].some((capability) => supports(field, capability));
  const tabs = [
    { id: "general", label: "General" },
    ...(hasValidation ? [{ id: "validation", label: "Validation" }] : []),
    { id: "logic", label: "Logic", badge: field.conditions?.rules?.length ? <span className="rounded-sm bg-[#1F2853] px-1.5 text-[10px] text-white">{field.conditions.rules.length}</span> : null },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-slate-100 text-slate-600">
          <Icon name={def?.icon} size={15} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{field.label || def?.label}</p>
          <p className="text-xs text-slate-500">{def?.label}</p>
        </div>
      </div>
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="px-2" />

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {problems.length > 0 && (
          <ul className="space-y-1 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-700">
            {problems.map((problem, index) => <li key={index}>{problem}</li>)}
          </ul>
        )}

        {tab === "general" && (
          <>
            <FormRow label={field.type === "section" ? "Section title" : "Label"}>
              <TextInput
                value={field.label || ""}
                onChange={(event) => {
                  const label = event.target.value;
                  // The key follows the label until it's edited by hand (or published).
                  onChange({ label, ...(def?.hasValue && keyIsAuto && !lockedKey ? { key: toKey(label) || field.key } : {}) }, "label");
                }}
              />
            </FormRow>

            {def?.hasValue && (
              <FormRow
                label="Key"
                hint={lockedKey ? "Locked — this field is published and existing content is stored under this key." : "Used in the API and by Edeco. Letters, numbers and _."}
                error={field.key && !KEY_PATTERN.test(field.key) ? "Start with a letter; use only letters, numbers and _." : null}
              >
                <div className="relative">
                  <TextInput className="pr-8 font-mono !text-[13px]" value={field.key || ""} disabled={lockedKey} onChange={(event) => onChange({ key: event.target.value.replace(/[^a-zA-Z0-9_]/g, "") }, "key")} />
                  {lockedKey && <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
                </div>
              </FormRow>
            )}

            {(def?.hasValue || field.type === "section") && (
              <FormRow label={field.type === "section" ? "Description" : "Help text"}>
                <TextInput value={field.helpText || ""} onChange={(event) => onChange({ helpText: event.target.value }, "helpText")} />
              </FormRow>
            )}

            {supports(field, "placeholder") && (
              <FormRow label="Placeholder">
                <TextInput value={field.placeholder || ""} onChange={(event) => onChange({ placeholder: event.target.value }, "placeholder")} />
              </FormRow>
            )}

            {supports(field, "options") && <OptionsEditor field={field} onChange={(patch) => onChange(patch, "options")} />}
            {supports(field, "columns") && <ColumnsEditor field={field} onChange={(patch) => onChange(patch, "columns")} />}

            {supports(field, "defaultValue") && (field.type !== "checkbox" || !field.options?.length) && (
              <FormRow label="Default value">
                <DefaultValueInput field={field} onChange={(patch) => onChange(patch, "default")} />
              </FormRow>
            )}

            {supports(field, "unit") && (
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Unit / suffix">
                  <TextInput value={settings.unit || ""} placeholder="e.g. months" onChange={(event) => setSettings({ unit: event.target.value })} />
                </FormRow>
                <FormRow label="Step">
                  <TextInput type="number" value={settings.step ?? ""} placeholder="any" onChange={(event) => setSettings({ step: numberOrNull(event.target.value) })} />
                </FormRow>
              </div>
            )}
            {supports(field, "ratingMax") && (
              <FormRow label="Number of stars">
                <Select value={settings.max || 5} onChange={(event) => setSettings({ max: Number(event.target.value) })}>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </FormRow>
            )}
            {field.type === "textarea" && (
              <FormRow label="Visible rows">
                <TextInput type="number" min={2} max={20} value={settings.rows || 4} onChange={(event) => setSettings({ rows: Number(event.target.value) || 4 })} />
              </FormRow>
            )}
            {supports(field, "itemLabel") && (
              <FormRow label="Item name" hint='Shown as "Add …" and on each entry.'>
                <TextInput value={settings.itemLabel || ""} placeholder="Item" onChange={(event) => setSettings({ itemLabel: event.target.value })} />
              </FormRow>
            )}
            {supports(field, "multiple") && <Toggle label="Allow multiple files" checked={Boolean(settings.multiple)} onChange={(checked) => setSettings({ multiple: checked })} />}

            {def?.hasValue && <Toggle label="Required" description="Must be filled before review, publish or submit." checked={Boolean(field.required)} onChange={(checked) => onChange({ required: checked })} />}

            {def?.hasValue && !["group", "repeater", "table", "faq", "richText"].includes(field.type) && (
              <FormRow label="Width">
                <Select value={field.width || "full"} onChange={(event) => onChange({ width: event.target.value })}>
                  <option value="full">Full width</option>
                  <option value="half">Half width</option>
                </Select>
              </FormRow>
            )}
            {field.type === "divider" && <p className="text-sm text-slate-500">A divider has no settings — it just separates fields visually.</p>}
          </>
        )}

        {tab === "validation" && (
          <>
            {supports(field, "length") && (
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Min length">
                  <TextInput type="number" min={0} value={validation.minLength ?? ""} onChange={(event) => setValidation({ minLength: numberOrNull(event.target.value) })} />
                </FormRow>
                <FormRow label="Max length">
                  <TextInput type="number" min={0} value={validation.maxLength ?? ""} onChange={(event) => setValidation({ maxLength: numberOrNull(event.target.value) })} />
                </FormRow>
              </div>
            )}
            {supports(field, "range") && (
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Minimum">
                  <TextInput type="number" value={validation.min ?? ""} onChange={(event) => setValidation({ min: numberOrNull(event.target.value) })} />
                </FormRow>
                <FormRow label="Maximum">
                  <TextInput type="number" value={validation.max ?? ""} onChange={(event) => setValidation({ max: numberOrNull(event.target.value) })} />
                </FormRow>
              </div>
            )}
            {supports(field, "items") && (
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Min items">
                  <TextInput type="number" min={0} value={validation.minItems ?? ""} onChange={(event) => setValidation({ minItems: numberOrNull(event.target.value) })} />
                </FormRow>
                <FormRow label="Max items">
                  <TextInput type="number" min={0} value={validation.maxItems ?? ""} onChange={(event) => setValidation({ maxItems: numberOrNull(event.target.value) })} />
                </FormRow>
              </div>
            )}
            {supports(field, "dateRange") && (
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Earliest">
                  <TextInput type="date" value={validation.minDate ?? ""} onChange={(event) => setValidation({ minDate: event.target.value || null })} />
                </FormRow>
                <FormRow label="Latest">
                  <TextInput type="date" value={validation.maxDate ?? ""} onChange={(event) => setValidation({ maxDate: event.target.value || null })} />
                </FormRow>
              </div>
            )}
            {supports(field, "pattern") && (
              <>
                <FormRow label="Pattern (regular expression)" hint="Advanced. Leave empty for no pattern check.">
                  <TextInput className="font-mono !text-[13px]" value={validation.pattern || ""} placeholder="^[A-Z]{3}-\d+$" onChange={(event) => setValidation({ pattern: event.target.value })} />
                </FormRow>
                {validation.pattern && (
                  <FormRow label="Message when the pattern doesn't match">
                    <TextInput value={validation.patternMessage || ""} onChange={(event) => setValidation({ patternMessage: event.target.value })} />
                  </FormRow>
                )}
              </>
            )}
            {supports(field, "accept") && (
              <FormRow label="Allowed file types" hint="Comma-separated MIME types, e.g. image/png,application/pdf or image/*">
                <TextInput className="font-mono !text-[13px]" value={validation.accept || ""} onChange={(event) => setValidation({ accept: event.target.value })} />
              </FormRow>
            )}
            {supports(field, "fileSize") && (
              <FormRow label="Max file size (MB)">
                <TextInput type="number" min={1} max={20} value={validation.maxFileSizeMB ?? ""} onChange={(event) => setValidation({ maxFileSizeMB: numberOrNull(event.target.value) })} />
              </FormRow>
            )}
          </>
        )}

        {tab === "logic" && <ConditionsEditor field={field} allFields={allFields} onChange={(patch) => onChange(patch, "conditions")} />}

        {tab === "advanced" && (
          <>
            {/* The field ID is internal (cards, pages and rules reference it) and
                isn't shown to admins.
            <FormRow label="Field ID" hint="Permanent. Cards, pages and rules point at this ID, so labels and order can change freely.">
              <input readOnly value={field.id} className={`${fieldClass} bg-slate-50 font-mono !text-xs text-slate-500`} onFocus={(event) => event.target.select()} />
            </FormRow>
            */}
            {containers.length > 0 && (
              <FormRow label="Move to" hint="Place this field inside a section, group or repeater.">
                <Select value="" onChange={(event) => event.target.value && onMove(event.target.value === "__root" ? null : event.target.value)}>
                  <option value="">Choose a destination…</option>
                  <option value="__root">Top level</option>
                  {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {"— ".repeat(container.depth)}
                      {container.label}
                    </option>
                  ))}
                </Select>
              </FormRow>
            )}
            <div className="flex gap-2 text-xs text-slate-500">
              <ArrowDown size={13} className="mt-0.5" />
              Tip: drag fields by their handle to reorder, or use Alt+↑ / Alt+↓ on a selected field.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FieldSettings;
