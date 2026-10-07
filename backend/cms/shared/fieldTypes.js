// Field type registry — the single source of truth for what a field type is,
// what it stores, which settings the builder exposes for it and how a value is
// validated. The builder palette, the content editor, server-side validation
// and sample-data generation all read from here.
//
// Adding a field type = adding one entry here (+ an input component in the
// client's field input registry). Nothing else switches on type names.

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) {
    if ("url" in value) return !value.url;
    return Object.keys(value).length === 0;
  }
  return false;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9()\-\s.]{6,20}$/;
const COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isHttpUrl = (value) => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// Media values are references, never blobs: { id?, url, alt?, name?, mime?, size? }.
// Relative "/uploads/..." URLs come from the Form Builder's own media store.
const isMediaRef = (value) =>
  isPlainObject(value) &&
  typeof value.url === "string" &&
  (isHttpUrl(value.url) || value.url.startsWith("/"));

const optionValues = (field) => (field.options || []).map((option) => String(option.value));

const checkMediaValue = (value, field, noun) => {
  const items = field.settings?.multiple ? value : [value];
  if (field.settings?.multiple && !Array.isArray(value)) return `${noun} list is invalid.`;
  if (items.some((item) => !isMediaRef(item))) return `${noun} is invalid.`;
  return null;
};

const sampleText = (field) => field.placeholder || `Sample ${String(field.label || "text").toLowerCase()}`;
const sampleImage = (seed) => ({
  url: `https://picsum.photos/seed/${encodeURIComponent(seed || "edeco")}/800/450`,
  alt: "Sample image",
});

export const FIELD_CATEGORIES = [
  { id: "basic", label: "Basic" },
  { id: "choice", label: "Choice" },
  { id: "date", label: "Date & time" },
  { id: "media", label: "Media" },
  { id: "structured", label: "Structured" },
  { id: "layout", label: "Layout" },
];

// `supports` drives which settings the builder shows in the field panel.
// `container`: "section" (layout only, children share the parent data object),
// "group" (children stored in a nested object), "repeater" (array of objects).
export const FIELD_TYPES = {
  text: {
    label: "Text",
    icon: "Type",
    category: "basic",
    hasValue: true,
    supports: ["placeholder", "defaultValue", "length", "pattern"],
    validate: (value) => (typeof value === "string" ? null : "Must be text."),
    sample: sampleText,
  },
  textarea: {
    label: "Textarea",
    icon: "AlignLeft",
    category: "basic",
    hasValue: true,
    supports: ["placeholder", "defaultValue", "length"],
    defaults: { settings: { rows: 4 } },
    validate: (value) => (typeof value === "string" ? null : "Must be text."),
    sample: (field) => `${sampleText(field)}. This is placeholder copy used only for previews.`,
  },
  richText: {
    label: "Rich text",
    icon: "PilcrowSquare",
    category: "basic",
    hasValue: true,
    supports: ["length"],
    validate: (value) => (typeof value === "string" ? null : "Must be formatted text."),
    sample: (field) =>
      `<p><strong>${field.label || "Rich text"}</strong> preview content.</p><ul><li>First point</li><li>Second point</li></ul>`,
  },
  number: {
    label: "Number",
    icon: "Hash",
    category: "basic",
    hasValue: true,
    supports: ["placeholder", "defaultValue", "range", "unit"],
    validate: (value) => (typeof value === "number" && Number.isFinite(value) ? null : "Must be a number."),
    sample: (field) => field.validation?.min ?? 1200,
  },
  email: {
    label: "Email",
    icon: "Mail",
    category: "basic",
    hasValue: true,
    supports: ["placeholder", "defaultValue"],
    validate: (value) => (typeof value === "string" && EMAIL_RE.test(value) ? null : "Enter a valid email address."),
    sample: () => "hello@example.com",
  },
  phone: {
    label: "Phone",
    icon: "Phone",
    category: "basic",
    hasValue: true,
    supports: ["placeholder", "defaultValue"],
    validate: (value) => (typeof value === "string" && PHONE_RE.test(value) ? null : "Enter a valid phone number."),
    sample: () => "+91 98765 43210",
  },
  url: {
    label: "URL",
    icon: "Link",
    category: "basic",
    hasValue: true,
    supports: ["placeholder", "defaultValue"],
    validate: (value) => (isHttpUrl(value) ? null : "Enter a valid http(s) URL."),
    sample: () => "https://example.com",
  },
  select: {
    label: "Select",
    icon: "ChevronDownSquare",
    category: "choice",
    hasValue: true,
    supports: ["placeholder", "defaultValue", "options"],
    defaults: { options: [{ label: "Option 1", value: "option-1" }, { label: "Option 2", value: "option-2" }] },
    validate: (value, field) =>
      optionValues(field).includes(String(value)) ? null : "Choose one of the listed options.",
    sample: (field) => field.options?.[0]?.value ?? "",
  },
  multiSelect: {
    label: "Multi select",
    icon: "ListChecks",
    category: "choice",
    hasValue: true,
    supports: ["options", "items"],
    defaults: { options: [{ label: "Option 1", value: "option-1" }, { label: "Option 2", value: "option-2" }] },
    validate: (value, field) => {
      if (!Array.isArray(value)) return "Choose from the listed options.";
      const allowed = optionValues(field);
      return value.every((item) => allowed.includes(String(item))) ? null : "Choose from the listed options.";
    },
    sample: (field) => (field.options || []).slice(0, 2).map((option) => option.value),
  },
  radio: {
    label: "Radio",
    icon: "CircleDot",
    category: "choice",
    hasValue: true,
    supports: ["defaultValue", "options"],
    defaults: { options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }] },
    validate: (value, field) =>
      optionValues(field).includes(String(value)) ? null : "Choose one of the listed options.",
    sample: (field) => field.options?.[0]?.value ?? "",
  },
  // Without options: a single yes/no checkbox (boolean). With options: a
  // checkbox group (array of option values).
  checkbox: {
    label: "Checkbox",
    icon: "SquareCheck",
    category: "choice",
    hasValue: true,
    supports: ["options", "defaultValue"],
    defaults: { options: [] },
    validate: (value, field) => {
      if (!field.options?.length) return typeof value === "boolean" ? null : "Must be checked or unchecked.";
      if (!Array.isArray(value)) return "Choose from the listed options.";
      const allowed = optionValues(field);
      return value.every((item) => allowed.includes(String(item))) ? null : "Choose from the listed options.";
    },
    // An unchecked single checkbox is "empty" for required-ness.
    isEmpty: (value, field) => (!field.options?.length ? value !== true : isEmptyValue(value)),
    sample: (field) => (field.options?.length ? [field.options[0].value] : true),
  },
  date: {
    label: "Date",
    icon: "Calendar",
    category: "date",
    hasValue: true,
    supports: ["defaultValue", "dateRange"],
    validate: (value) =>
      typeof value === "string" && DATE_RE.test(value) && !Number.isNaN(Date.parse(value))
        ? null
        : "Enter a valid date.",
    sample: () => new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
  },
  datetime: {
    label: "Date & time",
    icon: "CalendarClock",
    category: "date",
    hasValue: true,
    supports: ["defaultValue", "dateRange"],
    validate: (value) =>
      typeof value === "string" && !Number.isNaN(Date.parse(value)) ? null : "Enter a valid date and time.",
    sample: () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16),
  },
  image: {
    label: "Image",
    icon: "Image",
    category: "media",
    hasValue: true,
    supports: ["multiple", "accept", "fileSize", "items"],
    defaults: { validation: { accept: "image/jpeg,image/png,image/webp,image/gif", maxFileSizeMB: 5 } },
    validate: (value, field) => checkMediaValue(value, field, "Image"),
    sample: (field) =>
      field.settings?.multiple ? [sampleImage(`${field.id}-1`), sampleImage(`${field.id}-2`), sampleImage(`${field.id}-3`)] : sampleImage(field.id),
  },
  file: {
    label: "File",
    icon: "Paperclip",
    category: "media",
    hasValue: true,
    supports: ["multiple", "accept", "fileSize", "items"],
    defaults: { validation: { accept: "application/pdf", maxFileSizeMB: 10 } },
    validate: (value, field) => checkMediaValue(value, field, "File"),
    sample: () => ({ url: "https://example.com/sample.pdf", name: "sample.pdf", mime: "application/pdf" }),
  },
  video: {
    label: "Video",
    icon: "Video",
    category: "media",
    hasValue: true,
    supports: ["placeholder"],
    // A YouTube/Vimeo/mp4 link, or an uploaded video media reference.
    validate: (value) => (isHttpUrl(value) || isMediaRef(value) ? null : "Enter a valid video URL."),
    sample: () => "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  color: {
    label: "Color",
    icon: "Palette",
    category: "basic",
    hasValue: true,
    supports: ["defaultValue"],
    validate: (value) => (typeof value === "string" && COLOR_RE.test(value) ? null : "Enter a hex colour like #1F2853."),
    sample: () => "#1F2853",
  },
  rating: {
    label: "Rating",
    icon: "Star",
    category: "choice",
    hasValue: true,
    supports: ["defaultValue", "ratingMax"],
    defaults: { settings: { max: 5 } },
    validate: (value, field) => {
      const max = Number(field.settings?.max) || 5;
      return typeof value === "number" && value >= 0 && value <= max ? null : `Rating must be between 0 and ${max}.`;
    },
    sample: (field) => Math.min(4, Number(field.settings?.max) || 5),
  },
  table: {
    label: "Table",
    icon: "Table",
    category: "structured",
    hasValue: true,
    supports: ["columns", "items"],
    defaults: {
      columns: [
        { id: "col_a", key: "column1", label: "Column 1", type: "text" },
        { id: "col_b", key: "column2", label: "Column 2", type: "text" },
      ],
    },
    validate: (value, field) => {
      if (!Array.isArray(value) || value.some((row) => !isPlainObject(row))) return "Table rows are invalid.";
      const numeric = (field.columns || []).filter((column) => column.type === "number").map((column) => column.key);
      const bad = value.some((row) =>
        numeric.some((key) => row[key] !== undefined && row[key] !== "" && !Number.isFinite(Number(row[key]))),
      );
      return bad ? "Number columns must contain numbers." : null;
    },
    sample: (field) =>
      [1, 2].map((n) =>
        Object.fromEntries((field.columns || []).map((column) => [column.key, column.type === "number" ? n * 100 : `${column.label} ${n}`])),
      ),
  },
  repeater: {
    label: "Repeater",
    icon: "Rows3",
    category: "structured",
    hasValue: true,
    container: "repeater",
    supports: ["items", "itemLabel"],
    defaults: { children: [], settings: { itemLabel: "Item" } },
    validate: (value) => (Array.isArray(value) && value.every(isPlainObject) ? null : "Repeater items are invalid."),
    sample: null, // generated from children
  },
  group: {
    label: "Group",
    icon: "Boxes",
    category: "structured",
    hasValue: true,
    container: "group",
    supports: [],
    defaults: { children: [] },
    validate: (value) => (isPlainObject(value) ? null : "Group value is invalid."),
    sample: null,
  },
  faq: {
    label: "FAQ",
    icon: "MessagesSquare",
    category: "structured",
    hasValue: true,
    supports: ["items"],
    validate: (value) =>
      Array.isArray(value) &&
      value.every((item) => isPlainObject(item) && typeof item.question === "string" && typeof item.answer === "string")
        ? null
        : "Each FAQ needs a question and an answer.",
    sample: () => [
      { question: "Sample question one?", answer: "Sample answer used for previews." },
      { question: "Sample question two?", answer: "Another sample answer." },
    ],
  },
  section: {
    label: "Section",
    icon: "PanelTop",
    category: "layout",
    hasValue: false,
    container: "section",
    supports: [],
    defaults: { children: [] },
  },
  divider: {
    label: "Divider",
    icon: "Minus",
    category: "layout",
    hasValue: false,
    supports: [],
  },
};

export const getFieldType = (type) => FIELD_TYPES[type] || null;

export const fieldHasValue = (field) => Boolean(getFieldType(field?.type)?.hasValue);

export const isContainer = (field) => Boolean(getFieldType(field?.type)?.container);

export const isFieldValueEmpty = (field, value) => {
  const def = getFieldType(field.type);
  return def?.isEmpty ? def.isEmpty(value, field) : isEmptyValue(value);
};

// Builds the sample value for preview-with-sample-data. Containers recurse.
export const sampleValueFor = (field) => {
  const def = getFieldType(field.type);
  if (!def?.hasValue) return undefined;
  if (field.type === "group") return sampleDataFor(field.children || []);
  if (field.type === "repeater") return [sampleDataFor(field.children || []), sampleDataFor(field.children || [])];
  return def.sample ? def.sample(field) : undefined;
};

export const sampleDataFor = (fields = []) => {
  const data = {};
  for (const field of fields) {
    if (field.type === "section") {
      Object.assign(data, sampleDataFor(field.children || []));
      continue;
    }
    if (!fieldHasValue(field) || !field.key) continue;
    data[field.key] = sampleValueFor(field);
  }
  return data;
};

// Default values for a brand-new entry.
export const defaultDataFor = (fields = []) => {
  const data = {};
  for (const field of fields) {
    if (field.type === "section") {
      Object.assign(data, defaultDataFor(field.children || []));
      continue;
    }
    if (!fieldHasValue(field) || !field.key) continue;
    if (field.type === "group") {
      data[field.key] = defaultDataFor(field.children || []);
    } else if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== "") {
      data[field.key] = field.defaultValue;
    }
  }
  return data;
};
