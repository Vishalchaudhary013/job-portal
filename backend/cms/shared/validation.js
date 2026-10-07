import { buildKeyIndex } from "./schemaUtils.js";
import { isFieldVisible } from "./conditions.js";
import { fieldHasValue, getFieldType, isFieldValueEmpty } from "./fieldTypes.js";

// Validates entry data against a form schema.
//
//   validateData(fields, data, { enforceRequired })
//     -> { valid, errors: { "path.to.field": "message" } }
//
// enforceRequired=false is used for drafts: values that ARE present must still
// be well-formed, but missing required values are allowed until review/publish.
// Fields hidden by conditional visibility are skipped entirely.

const checkGenericRules = (field, value) => {
  const rules = field.validation || {};
  if (typeof value === "string") {
    const plain = field.type === "richText" ? value.replace(/<[^>]*>/g, "") : value;
    if (rules.minLength != null && plain.length < Number(rules.minLength)) return `Must be at least ${rules.minLength} characters.`;
    if (rules.maxLength != null && plain.length > Number(rules.maxLength)) return `Must be at most ${rules.maxLength} characters.`;
    if (rules.pattern) {
      try {
        if (!new RegExp(rules.pattern).test(value)) return rules.patternMessage || "Invalid format.";
      } catch {
        // invalid pattern is caught when the schema is saved
      }
    }
    if ((field.type === "date" || field.type === "datetime") && (rules.minDate || rules.maxDate)) {
      const time = Date.parse(value);
      if (rules.minDate && time < Date.parse(rules.minDate)) return `Must be on or after ${rules.minDate}.`;
      if (rules.maxDate && time > Date.parse(rules.maxDate)) return `Must be on or before ${rules.maxDate}.`;
    }
  }
  if (typeof value === "number") {
    if (rules.min != null && rules.min !== "" && value < Number(rules.min)) return `Must be at least ${rules.min}.`;
    if (rules.max != null && rules.max !== "" && value > Number(rules.max)) return `Must be at most ${rules.max}.`;
  }
  if (Array.isArray(value)) {
    if (rules.minItems != null && rules.minItems !== "" && value.length < Number(rules.minItems)) return `Add at least ${rules.minItems}.`;
    if (rules.maxItems != null && rules.maxItems !== "" && value.length > Number(rules.maxItems)) return `Add at most ${rules.maxItems}.`;
  }
  return null;
};

export const validateData = (fields = [], data = {}, { enforceRequired = true } = {}) => {
  const errors = {};
  const keyById = buildKeyIndex(fields);
  const root = data || {};

  const visitList = (list, scope, prefix) => {
    for (const field of list) {
      if (!isFieldVisible(field, { scope, root, keyById })) continue;

      if (field.type === "section") {
        visitList(field.children || [], scope, prefix);
        continue;
      }
      if (!fieldHasValue(field) || !field.key) continue;

      const path = prefix ? `${prefix}.${field.key}` : field.key;
      const value = scope?.[field.key];

      if (isFieldValueEmpty(field, value)) {
        if (enforceRequired && field.required) errors[path] = `${field.label || field.key} is required.`;
        continue;
      }

      const typeError = getFieldType(field.type)?.validate?.(value, field);
      if (typeError) {
        errors[path] = typeError;
        continue;
      }

      const ruleError = checkGenericRules(field, value);
      if (ruleError) {
        errors[path] = ruleError;
        continue;
      }

      if (field.type === "group") visitList(field.children || [], value, path);
      if (field.type === "repeater") {
        value.forEach((item, index) => visitList(field.children || [], item, `${path}.${index}`));
      }
      if (field.type === "table" && enforceRequired) {
        const requiredColumns = (field.columns || []).filter((column) => column.required);
        value.forEach((row, index) => {
          requiredColumns.forEach((column) => {
            if (row[column.key] === undefined || row[column.key] === "") {
              errors[`${path}.${index}.${column.key}`] = `${column.label} is required.`;
            }
          });
        });
      }
    }
  };

  visitList(fields, root, "");
  return { valid: Object.keys(errors).length === 0, errors };
};

// Collects media references from entry data — used for media usage tracking.
export const collectMediaRefs = (fields = [], data = {}) => {
  const refs = [];
  const visitList = (list, scope) => {
    for (const field of list) {
      if (field.type === "section") {
        visitList(field.children || [], scope);
        continue;
      }
      const value = scope?.[field.key];
      if (value == null) continue;
      if (["image", "file", "video"].includes(field.type)) {
        (Array.isArray(value) ? value : [value]).forEach((item) => item?.id && refs.push(String(item.id)));
      }
      if (field.type === "group") visitList(field.children || [], value);
      if (field.type === "repeater" && Array.isArray(value)) value.forEach((item) => visitList(field.children || [], item));
    }
  };
  visitList(fields, data);
  return [...new Set(refs)];
};
