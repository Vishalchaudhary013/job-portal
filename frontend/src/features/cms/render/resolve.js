import { resolveAssetUrl } from "../../../services/apiClient";
import { getByPath, referenceableFields } from "../shared/schemaUtils.js";

// Turns (form schema + entry data + field id) into display-ready values.
// Card and page schemas reference fields by stable ID; this is the one place
// that maps an ID to its current key/path and formats the value for display.

export const buildFieldIndex = (formSchema) => {
  const index = new Map();
  referenceableFields(formSchema?.fields || []).forEach((ref) => index.set(ref.id, ref));
  return index;
};

// Dotted-path read ("group.child") that tolerates missing data.
export const getByPathSafe = (data, path) => (path ? getByPath(data || {}, path) : undefined);

export const readField = (index, data, fieldId) => {
  const ref = fieldId ? index.get(fieldId) : null;
  if (!ref) return { ref: null, value: undefined };
  return { ref, value: getByPath(data, ref.path) };
};

export const isBlank = (value) =>
  value === undefined ||
  value === null ||
  value === false ||
  (typeof value === "string" && value.replace(/<[^>]*>/g, "").trim() === "") ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === "object" && !Array.isArray(value) && "url" in value && !value.url);

const optionLabel = (field, value) => field?.options?.find((option) => String(option.value) === String(value))?.label ?? String(value);

export const formatDate = (value, withTime = false) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
};

export const formatNumber = (value, field) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  const text = number.toLocaleString("en-IN");
  const unit = field?.settings?.unit;
  return unit ? `${text} ${unit}` : text;
};

// Plain-text rendering of any value (badges, meta rows, headings).
export const formatValue = (ref, value) => {
  if (isBlank(value)) return "";
  const field = ref?.field;
  switch (ref?.type) {
    case "select":
    case "radio":
      return optionLabel(field, value);
    case "multiSelect":
      return (Array.isArray(value) ? value : [value]).map((item) => optionLabel(field, item)).join(", ");
    case "checkbox":
      if (!field?.options?.length) return value === true ? "Yes" : "No";
      return (Array.isArray(value) ? value : [value]).map((item) => optionLabel(field, item)).join(", ");
    case "date":
      return formatDate(value);
    case "datetime":
      return formatDate(value, true);
    case "number":
      return formatNumber(value, field);
    case "rating":
      return `${value}/${field?.settings?.max || 5}`;
    case "richText":
      return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    case "image":
    case "file":
      return Array.isArray(value) ? `${value.length} file${value.length === 1 ? "" : "s"}` : value?.name || "";
    case "repeater":
    case "table":
    case "faq":
      return Array.isArray(value) ? `${value.length} item${value.length === 1 ? "" : "s"}` : "";
    case "group":
      return "";
    default:
      if (Array.isArray(value)) return value.join(", ");
      if (typeof value === "object") return value.url || "";
      return String(value);
  }
};

// Values that make sense as a list of short strings (tags, bullet lists).
export const toList = (ref, value) => {
  if (isBlank(value)) return [];
  const field = ref?.field;
  switch (ref?.type) {
    case "multiSelect":
    case "checkbox":
    case "select":
    case "radio":
      return (Array.isArray(value) ? value : [value]).filter((item) => item !== true && item !== false).map((item) => optionLabel(field, item));
    case "repeater": {
      const first = (field?.children || []).find((child) => child.key && ["text", "textarea", "select", "number"].includes(child.type));
      return Array.isArray(value) && first ? value.map((item) => formatValue({ type: first.type, field: first }, item?.[first.key])).filter(Boolean) : [];
    }
    case "table": {
      const first = field?.columns?.[0]?.key;
      return Array.isArray(value) && first ? value.map((row) => String(row?.[first] ?? "")).filter(Boolean) : [];
    }
    case "textarea":
    case "text":
      return String(value)
        .split(/\r?\n|,(?![^(]*\))/)
        .map((item) => item.trim())
        .filter(Boolean);
    case "richText":
      return [...String(value).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => match[1].replace(/<[^>]*>/g, "").trim()).filter(Boolean);
    default:
      return Array.isArray(value) ? value.map(String) : [formatValue(ref, value)].filter(Boolean);
  }
};

export const mediaList = (value) => (Array.isArray(value) ? value : value ? [value] : []).filter((item) => item?.url);

export const mediaSrc = (item) => resolveAssetUrl(item?.url || "");

export const isSafeHref = (href) => /^(https?:|mailto:|tel:|\/)/i.test(String(href || ""));

// Detail page URL for an entry on the portal.
export const entryPath = (typeSlug, entry) => `/explore/${typeSlug}/${entry.slug}`;
