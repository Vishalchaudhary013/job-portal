import sanitizeHtml from "sanitize-html";
import { fieldHasValue } from "../shared/fieldTypes.js";
import { cleanJson } from "../utils/http.js";

const RICH_TEXT_OPTIONS = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre", "hr"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: "a",
      attribs: { ...attribs, rel: "noopener noreferrer", ...(attribs.target ? { target: "_blank" } : {}) },
    }),
  },
};

export const sanitizeRichText = (html) => sanitizeHtml(String(html || ""), RICH_TEXT_OPTIONS);

const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return value;
};

const PLAIN = (value) => (typeof value === "string" ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }) : value);

const MEDIA_KEYS = ["id", "url", "alt", "name", "mime", "size", "width", "height"];
const cleanMedia = (value) => {
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(MEDIA_KEYS.filter((key) => value[key] !== undefined).map((key) => [key, key === "alt" || key === "name" ? PLAIN(value[key]) : value[key]]));
};

// Copies ONLY keys defined by the schema out of `input`, normalising each value
// for its type (rich text sanitised, plain text stripped of tags, numbers
// coerced, media refs reduced to known keys). Values for fields that no longer
// exist in the schema are carried over from `previous` so a schema change never
// destroys existing data.
export const sanitizeEntryData = (fields = [], input = {}, previous = null) => {
  const source = cleanJson(input) || {};

  const visit = (list, scope) => {
    const out = {};
    for (const field of list) {
      if (field.type === "section") {
        Object.assign(out, visit(field.children || [], scope));
        continue;
      }
      if (!fieldHasValue(field) || !field.key || !(field.key in (scope || {}))) continue;
      let value = scope[field.key];
      if (value === null || value === undefined) continue;

      switch (field.type) {
        case "richText":
          value = typeof value === "string" ? sanitizeRichText(value) : value;
          break;
        case "text":
        case "textarea":
        case "email":
        case "phone":
        case "url":
        case "date":
        case "datetime":
        case "color":
        case "select":
        case "radio":
          value = PLAIN(value);
          break;
        case "number":
        case "rating":
          value = toNumber(value);
          break;
        case "multiSelect":
          value = Array.isArray(value) ? value.map(PLAIN) : value;
          break;
        case "checkbox":
          value = Array.isArray(value) ? value.map(PLAIN) : value;
          break;
        case "image":
        case "file":
          value = Array.isArray(value) ? value.map(cleanMedia) : cleanMedia(value);
          break;
        case "video":
          value = typeof value === "string" ? PLAIN(value) : cleanMedia(value);
          break;
        case "faq":
          value = Array.isArray(value)
            ? value.map((item) => ({ question: PLAIN(item?.question ?? ""), answer: typeof item?.answer === "string" ? sanitizeRichText(item.answer) : "" }))
            : value;
          break;
        case "table":
          value = Array.isArray(value)
            ? value.map((row) =>
                Object.fromEntries(
                  (field.columns || []).map((column) => [column.key, column.type === "number" ? toNumber(row?.[column.key]) : PLAIN(row?.[column.key] ?? "")]),
                ),
              )
            : value;
          break;
        case "group":
          value = value && typeof value === "object" && !Array.isArray(value) ? visit(field.children || [], value) : value;
          break;
        case "repeater":
          value = Array.isArray(value) ? value.map((item) => (item && typeof item === "object" ? visit(field.children || [], item) : item)) : value;
          break;
        default:
          break;
      }
      out[field.key] = value;
    }
    return out;
  };

  const data = visit(fields, source);

  if (previous && typeof previous === "object") {
    const known = new Set();
    const collect = (list) =>
      list.forEach((field) => {
        if (field.type === "section") collect(field.children || []);
        else if (field.key) known.add(field.key);
      });
    collect(fields);
    for (const [key, value] of Object.entries(previous)) {
      if (!known.has(key) && !(key in data)) data[key] = value;
    }
  }

  return data;
};
