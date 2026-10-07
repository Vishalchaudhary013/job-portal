import React, { useMemo } from "react";
import { ArrowDown, ArrowUp, Plus, Star, Trash2 } from "lucide-react";
import { isFieldVisible } from "../shared/conditions.js";
import { fieldHasValue } from "../shared/fieldTypes.js";
import { buildKeyIndex } from "../shared/schemaUtils.js";
import MediaInput from "./MediaInput";
import RichTextEditor from "./RichTextEditor";

// Renders any form schema as inputs. Used by the admin content editor, the
// builder's form preview and the student-facing response forms, so a field
// type behaves the same everywhere.
//
//   <DynamicFields fields values onChange errors />
// `errors` is keyed by dotted data path ("fee.amount", "items.0.title").

export const inputClass = (invalid) =>
  `w-full rounded-sm border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 ${
    invalid ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-[#1F2853]"
  }`;

const toNumberOrEmpty = (raw) => (raw === "" ? undefined : Number(raw));

const ChoiceList = ({ field, value, onChange, disabled, multiple }) => {
  const selected = multiple ? (Array.isArray(value) ? value.map(String) : []) : [String(value ?? "")];
  return (
    <div className={`grid gap-2 ${(field.options || []).length > 4 ? "sm:grid-cols-2" : ""}`}>
      {(field.options || []).map((option) => {
        const checked = selected.includes(String(option.value));
        return (
          <label key={option.value} className={`flex cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2 text-sm transition ${checked ? "border-[#1F2853] bg-[#1F2853]/5" : "border-slate-200 hover:border-slate-300"}`}>
            <input
              type={multiple ? "checkbox" : "radio"}
              name={field.id}
              disabled={disabled}
              checked={checked}
              onChange={() => {
                if (!multiple) return onChange(option.value);
                const next = checked ? selected.filter((item) => item !== String(option.value)) : [...selected, String(option.value)];
                onChange(next);
              }}
              className="h-4 w-4 accent-[#1F2853]"
            />
            <span className="text-slate-800">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};

const RatingInput = ({ field, value, onChange, disabled }) => {
  const max = Number(field.settings?.max) || 5;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={field.label}>
      {Array.from({ length: max }, (_, index) => index + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} of ${max}`}
          disabled={disabled}
          onClick={() => onChange(value === n ? undefined : n)}
          className="rounded-sm p-0.5 text-slate-300 hover:text-amber-400 disabled:cursor-default"
        >
          <Star size={22} className={n <= (value || 0) ? "fill-amber-400 text-amber-400" : ""} />
        </button>
      ))}
      {value ? <span className="ml-2 text-sm text-slate-500">{value}/{max}</span> : null}
    </div>
  );
};

const TableInput = ({ field, value, onChange, disabled }) => {
  const rows = Array.isArray(value) ? value : [];
  const columns = field.columns || [];
  const setCell = (rowIndex, key, cell) => onChange(rows.map((row, i) => (i === rowIndex ? { ...row, [key]: cell } : row)));
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-sm border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.id || column.key} className="px-3 py-2 text-left font-medium text-slate-600">{column.label}</th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-100">
                {columns.map((column) => (
                  <td key={column.id || column.key} className="p-1.5">
                    <input
                      type={column.type === "number" ? "number" : "text"}
                      disabled={disabled}
                      value={row?.[column.key] ?? ""}
                      onChange={(event) => setCell(rowIndex, column.key, column.type === "number" ? toNumberOrEmpty(event.target.value) : event.target.value)}
                      className="w-full min-w-[120px] rounded-sm border border-transparent px-2 py-1.5 hover:border-slate-200 focus:border-[#1F2853] focus:outline-none"
                    />
                  </td>
                ))}
                <td className="p-1.5 text-center">
                  {!disabled && (
                    <button type="button" aria-label="Remove row" onClick={() => onChange(rows.filter((_, i) => i !== rowIndex))} className="rounded-sm p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-4 text-center text-xs text-slate-400">No rows yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <button type="button" onClick={() => onChange([...rows, {}])} className="inline-flex items-center gap-1 text-sm font-medium text-[#1F2853] hover:underline">
          <Plus size={14} /> Add row
        </button>
      )}
    </div>
  );
};

const FaqInput = ({ value, onChange, disabled, invalid }) => {
  const items = Array.isArray(value) ? value : [];
  const update = (index, patch) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-sm border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center gap-2">
            <input
              className={inputClass(invalid)}
              placeholder="Question"
              disabled={disabled}
              value={item.question || ""}
              onChange={(event) => update(index, { question: event.target.value })}
            />
            {!disabled && (
              <button type="button" aria-label="Remove question" onClick={() => onChange(items.filter((_, i) => i !== index))} className="rounded-sm p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            )}
          </div>
          <textarea
            rows={3}
            className={inputClass(invalid)}
            placeholder="Answer"
            disabled={disabled}
            value={(item.answer || "").replace(/<[^>]*>/g, "")}
            onChange={(event) => update(index, { answer: event.target.value })}
          />
        </div>
      ))}
      {!disabled && (
        <button type="button" onClick={() => onChange([...items, { question: "", answer: "" }])} className="inline-flex items-center gap-1 text-sm font-medium text-[#1F2853] hover:underline">
          <Plus size={14} /> Add question
        </button>
      )}
    </div>
  );
};

const RepeaterInput = ({ field, value, onChange, disabled, errors, path, root, keyIndex }) => {
  const items = Array.isArray(value) ? value : [];
  const itemLabel = field.settings?.itemLabel || "Item";
  const max = Number(field.validation?.maxItems) || Infinity;
  const move = (from, to) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-sm border border-slate-200 bg-slate-50/40">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {itemLabel} {index + 1}
            </span>
            {!disabled && (
              <div className="flex items-center gap-0.5">
                <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded-sm p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30">
                  <ArrowUp size={14} />
                </button>
                <button type="button" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, index + 1)} className="rounded-sm p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30">
                  <ArrowDown size={14} />
                </button>
                <button type="button" aria-label={`Remove ${itemLabel}`} onClick={() => onChange(items.filter((_, i) => i !== index))} className="rounded-sm p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="p-3">
            <DynamicFields
              fields={field.children || []}
              values={item || {}}
              onChange={(next) => onChange(items.map((existing, i) => (i === index ? next : existing)))}
              errors={errors}
              pathPrefix={`${path}.${index}`}
              root={root}
              keyIndex={keyIndex}
              disabled={disabled}
            />
          </div>
        </div>
      ))}
      {!disabled && items.length < max && (
        <button
          type="button"
          onClick={() => onChange([...items, {}])}
          className="inline-flex items-center gap-1.5 rounded-sm border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-[#1F2853] hover:border-[#1F2853] hover:bg-[#1F2853]/5"
        >
          <Plus size={15} /> Add {itemLabel.toLowerCase()}
        </button>
      )}
    </div>
  );
};

// One registry entry per field type. To support a new type: add it to
// shared/fieldTypes.js, then add its control here.
const CONTROLS = {
  text: ({ field, value, onChange, disabled, invalid, id }) => (
    <input id={id} type="text" className={inputClass(invalid)} placeholder={field.placeholder} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} maxLength={field.validation?.maxLength || undefined} />
  ),
  email: ({ field, value, onChange, disabled, invalid, id }) => (
    <input id={id} type="email" autoComplete="email" className={inputClass(invalid)} placeholder={field.placeholder} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
  ),
  phone: ({ field, value, onChange, disabled, invalid, id }) => (
    <input id={id} type="tel" autoComplete="tel" className={inputClass(invalid)} placeholder={field.placeholder} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
  ),
  url: ({ field, value, onChange, disabled, invalid, id }) => (
    <input id={id} type="url" className={inputClass(invalid)} placeholder={field.placeholder || "https://"} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
  ),
  number: ({ field, value, onChange, disabled, invalid, id }) => (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className={inputClass(invalid)}
        placeholder={field.placeholder}
        disabled={disabled}
        min={field.validation?.min ?? undefined}
        max={field.validation?.max ?? undefined}
        step={field.settings?.step || "any"}
        value={value ?? ""}
        onChange={(e) => onChange(toNumberOrEmpty(e.target.value))}
      />
      {field.settings?.unit && <span className="shrink-0 text-sm text-slate-500">{field.settings.unit}</span>}
    </div>
  ),
  textarea: ({ field, value, onChange, disabled, invalid, id }) => (
    <textarea id={id} rows={Number(field.settings?.rows) || 4} className={inputClass(invalid)} placeholder={field.placeholder} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} maxLength={field.validation?.maxLength || undefined} />
  ),
  richText: ({ field, value, onChange, disabled, invalid, id }) => <RichTextEditor id={id} value={value} onChange={onChange} placeholder={field.placeholder} disabled={disabled} invalid={invalid} />,
  select: ({ field, value, onChange, disabled, invalid, id }) => (
    <select id={id} className={inputClass(invalid)} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)}>
      <option value="">{field.placeholder || "Select…"}</option>
      {(field.options || []).map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  ),
  multiSelect: (props) => <ChoiceList {...props} multiple />,
  radio: (props) => <ChoiceList {...props} multiple={false} />,
  checkbox: (props) =>
    props.field.options?.length ? (
      <ChoiceList {...props} multiple />
    ) : (
      <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-800">
        <input type="checkbox" id={props.id} className="h-4 w-4 accent-[#1F2853]" disabled={props.disabled} checked={props.value === true} onChange={(e) => props.onChange(e.target.checked)} />
        {props.field.placeholder || "Yes"}
      </label>
    ),
  date: ({ field, value, onChange, disabled, invalid, id }) => (
    <input id={id} type="date" className={inputClass(invalid)} disabled={disabled} min={field.validation?.minDate || undefined} max={field.validation?.maxDate || undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} />
  ),
  datetime: ({ value, onChange, disabled, invalid, id }) => (
    <input id={id} type="datetime-local" className={inputClass(invalid)} disabled={disabled} value={value ? String(value).slice(0, 16) : ""} onChange={(e) => onChange(e.target.value || undefined)} />
  ),
  color: ({ value, onChange, disabled, invalid, id }) => (
    <div className="flex items-center gap-2">
      <input type="color" aria-label="Pick colour" disabled={disabled} value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#1f2853"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded-sm border border-slate-300 bg-white p-1" />
      <input id={id} type="text" className={`${inputClass(invalid)} max-w-[140px] font-mono`} placeholder="#1F2853" disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  ),
  rating: (props) => <RatingInput {...props} />,
  image: (props) => <MediaInput {...props} />,
  file: (props) => <MediaInput {...props} />,
  video: ({ field, value, onChange, disabled, invalid, id }) => (
    <input id={id} type="url" className={inputClass(invalid)} placeholder={field.placeholder || "YouTube, Vimeo or .mp4 link"} disabled={disabled} value={typeof value === "string" ? value : value?.url ?? ""} onChange={(e) => onChange(e.target.value)} />
  ),
  table: (props) => <TableInput {...props} />,
  faq: (props) => <FaqInput {...props} />,
  repeater: (props) => <RepeaterInput {...props} />,
};

const FieldShell = ({ field, id, error, children }) => (
  <div className={field.width === "half" ? "sm:col-span-1" : "sm:col-span-2"}>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">
      {field.label}
      {field.required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
    </label>
    {children}
    {field.helpText && !error && <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>}
    {error && <p className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p>}
  </div>
);

const DynamicFields = ({ fields = [], values = {}, onChange, errors = {}, pathPrefix = "", root, keyIndex, disabled = false }) => {
  const index = useMemo(() => keyIndex || buildKeyIndex(fields), [keyIndex, fields]);
  const rootData = root || values;

  const setValue = (key, next) => {
    const copy = { ...values };
    if (next === undefined) delete copy[key];
    else copy[key] = next;
    onChange(copy);
  };

  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      {fields.map((field) => {
        if (!isFieldVisible(field, { scope: values, root: rootData, keyById: index })) return null;

        if (field.type === "divider") return <hr key={field.id} className="border-slate-200 sm:col-span-2" />;

        if (field.type === "section") {
          return (
            <fieldset key={field.id} className="space-y-4 sm:col-span-2">
              {(field.label || field.helpText) && (
                <legend className="w-full border-b border-slate-200 pb-2">
                  {field.label && <span className="text-base font-semibold text-slate-900">{field.label}</span>}
                  {field.helpText && <span className="mt-0.5 block text-sm text-slate-500">{field.helpText}</span>}
                </legend>
              )}
              <DynamicFields fields={field.children || []} values={values} onChange={onChange} errors={errors} pathPrefix={pathPrefix} root={rootData} keyIndex={index} disabled={disabled} />
            </fieldset>
          );
        }

        if (!fieldHasValue(field) || !field.key) return null;
        const path = pathPrefix ? `${pathPrefix}.${field.key}` : field.key;
        const id = `f-${field.id}${pathPrefix ? `-${pathPrefix.replace(/\W/g, "-")}` : ""}`;
        const error = errors[path];

        if (field.type === "group") {
          return (
            <FieldShell key={field.id} field={field} id={id} error={error}>
              <div className="rounded-sm border border-slate-200 p-4">
                <DynamicFields
                  fields={field.children || []}
                  values={values[field.key] || {}}
                  onChange={(next) => setValue(field.key, next)}
                  errors={errors}
                  pathPrefix={path}
                  root={rootData}
                  keyIndex={index}
                  disabled={disabled}
                />
              </div>
            </FieldShell>
          );
        }

        const Control = CONTROLS[field.type];
        if (!Control) return null;
        return (
          <FieldShell key={field.id} field={field} id={id} error={error}>
            <Control
              id={id}
              field={field}
              value={values[field.key]}
              onChange={(next) => setValue(field.key, next)}
              disabled={disabled}
              invalid={Boolean(error)}
              errors={errors}
              path={path}
              root={rootData}
              keyIndex={index}
            />
          </FieldShell>
        );
      })}
    </div>
  );
};

export default DynamicFields;
