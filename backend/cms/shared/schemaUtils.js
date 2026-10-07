import { KEY_PATTERN, createId } from "./ids.js";
import { FIELD_TYPES, fieldHasValue, getFieldType } from "./fieldTypes.js";

// Traversal

// Depth-first walk. `visit(field, { parent, depth, path })` where `path` is the
// dotted data path ("group.child") — sections don't add a path segment because
// their children live in the parent's data object.
export const walkFields = (fields = [], visit, ctx = { parent: null, depth: 0, path: "" }) => {
  for (const field of fields) {
    const ownPath = fieldHasValue(field) && field.key ? (ctx.path ? `${ctx.path}.${field.key}` : field.key) : ctx.path;
    visit(field, { ...ctx, path: ownPath });
    if (Array.isArray(field.children) && field.children.length) {
      const childPath = field.type === "section" ? ctx.path : field.type === "group" ? ownPath : `${ownPath}[]`;
      walkFields(field.children, visit, { parent: field, depth: ctx.depth + 1, path: childPath });
    }
  }
};

export const flattenFields = (fields = []) => {
  const out = [];
  walkFields(fields, (field, ctx) => out.push({ field, ...ctx }));
  return out;
};

export const buildKeyIndex = (fields = []) => {
  const keyById = new Map();
  walkFields(fields, (field) => {
    if (field.key) keyById.set(field.id, field.key);
  });
  return keyById;
};

export const findField = (fields = [], fieldId) => {
  let found = null;
  walkFields(fields, (field) => {
    if (!found && field.id === fieldId) found = field;
  });
  return found;
};

// Fields that cards and detail pages may reference: anything with a value that
// isn't inside a repeater (a repeater is referenced as a whole). Each entry
// carries its data `path` so renderers can read nested group values.
export const referenceableFields = (fields = []) =>
  flattenFields(fields)
    .filter(({ field, path }) => fieldHasValue(field) && field.key && !path.includes("[]"))
    .map(({ field, path }) => ({ id: field.id, key: field.key, path, label: field.label, type: field.type, field }));

export const getByPath = (data, path) => {
  if (!data || !path) return undefined;
  return path.split(".").reduce((acc, part) => (acc == null ? undefined : acc[part]), data);
};

// Mutation helpers (immutable; used by the builder)

const mapTree = (fields, fn) =>
  fields.map((field) => {
    const next = fn(field);
    if (next && Array.isArray(next.children)) {
      return { ...next, children: mapTree(next.children, fn) };
    }
    return next;
  });

export const updateFieldInTree = (fields, fieldId, patch) =>
  mapTree(fields, (field) => (field.id === fieldId ? { ...field, ...(typeof patch === "function" ? patch(field) : patch) } : field));

export const removeFieldFromTree = (fields, fieldId) =>
  fields
    .filter((field) => field.id !== fieldId)
    .map((field) => (Array.isArray(field.children) ? { ...field, children: removeFieldFromTree(field.children, fieldId) } : field));

// Returns { list, index } for the array that contains fieldId (null parent = root).
export const locateField = (fields, fieldId, parentId = null) => {
  const index = fields.findIndex((field) => field.id === fieldId);
  if (index !== -1) return { parentId, index, list: fields };
  for (const field of fields) {
    if (Array.isArray(field.children)) {
      const hit = locateField(field.children, fieldId, field.id);
      if (hit) return hit;
    }
  }
  return null;
};

export const insertFieldInTree = (fields, field, parentId = null, index = null) => {
  if (!parentId) {
    const next = [...fields];
    next.splice(index ?? next.length, 0, field);
    return next;
  }
  return fields.map((node) => {
    if (node.id === parentId) {
      const children = [...(node.children || [])];
      children.splice(index ?? children.length, 0, field);
      return { ...node, children };
    }
    if (Array.isArray(node.children)) return { ...node, children: insertFieldInTree(node.children, field, parentId, index) };
    return node;
  });
};

const existingKeysIn = (list) => new Set(list.map((field) => field.key).filter(Boolean));

export const uniqueKey = (base, siblings) => {
  const taken = existingKeysIn(siblings);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
};

export const createField = (type, siblings = []) => {
  const def = getFieldType(type);
  if (!def) throw new Error(`Unknown field type "${type}".`);
  const defaults = JSON.parse(JSON.stringify(def.defaults || {}));
  const field = {
    id: createId("fld"),
    type,
    label: def.hasValue ? def.label : type === "section" ? "New section" : "",
    required: false,
    helpText: "",
    ...defaults,
  };
  if (def.hasValue) field.key = uniqueKey(type === "richText" ? "content" : type, siblings);
  if (field.columns) field.columns = field.columns.map((column) => ({ ...column, id: createId("col") }));
  return field;
};

// Deep clone with fresh IDs (children, columns, options keep their values).
export const cloneField = (field, siblings = []) => {
  const copy = JSON.parse(JSON.stringify(field));
  const renew = (node) => {
    node.id = createId("fld");
    if (Array.isArray(node.columns)) node.columns = node.columns.map((column) => ({ ...column, id: createId("col") }));
    if (Array.isArray(node.children)) node.children.forEach(renew);
  };
  renew(copy);
  if (copy.key) copy.key = uniqueKey(`${copy.key}Copy`, siblings);
  if (copy.label) copy.label = `${copy.label} (copy)`;
  delete copy.conditions; // conditions pointed at the original's siblings
  return copy;
};

// Same fields, brand-new IDs (keys/labels unchanged). Condition rules are
// remapped to the new IDs so they keep pointing at the right siblings.
export const withFreshIds = (fields = []) => {
  const copy = JSON.parse(JSON.stringify(fields));
  const idMap = new Map();
  const renew = (node) => {
    const next = createId("fld");
    idMap.set(node.id, next);
    node.id = next;
    if (Array.isArray(node.columns)) node.columns = node.columns.map((column) => ({ ...column, id: createId("col") }));
    if (Array.isArray(node.children)) node.children.forEach(renew);
  };
  copy.forEach(renew);
  const remap = (node) => {
    if (node.conditions?.rules) {
      node.conditions.rules = node.conditions.rules.map((rule) => ({ ...rule, fieldId: idMap.get(rule.fieldId) || rule.fieldId }));
    }
    if (Array.isArray(node.children)) node.children.forEach(remap);
  };
  copy.forEach(remap);
  return copy;
};

// Schema definition validation (server + builder)

const MAX_FIELDS = 300;
const MAX_DEPTH = 4;

// Returns an array of { fieldId, message }. Empty = valid.
export const validateSchemaDefinition = (fields) => {
  const problems = [];
  if (!Array.isArray(fields)) return [{ fieldId: null, message: "Schema fields must be an array." }];

  const ids = new Set();
  let count = 0;

  const checkScope = (list, depth, scopeKeys) => {
    if (depth > MAX_DEPTH) {
      problems.push({ fieldId: null, message: `Fields can be nested at most ${MAX_DEPTH} levels deep.` });
      return;
    }
    for (const field of list) {
      count += 1;
      const def = FIELD_TYPES[field?.type];
      if (!field || typeof field !== "object" || !def) {
        problems.push({ fieldId: field?.id || null, message: `Unknown field type "${field?.type}".` });
        continue;
      }
      if (!field.id || typeof field.id !== "string") problems.push({ fieldId: null, message: "Every field needs an id." });
      else if (ids.has(field.id)) problems.push({ fieldId: field.id, message: "Duplicate field id." });
      else ids.add(field.id);

      if (def.hasValue) {
        if (!field.label || !String(field.label).trim()) problems.push({ fieldId: field.id, message: "Field label is required." });
        if (!KEY_PATTERN.test(field.key || "")) {
          problems.push({ fieldId: field.id, message: `"${field.label || field.type}" needs a key that starts with a letter and uses only letters, numbers or _.` });
        } else if (scopeKeys.has(field.key)) {
          problems.push({ fieldId: field.id, message: `Key "${field.key}" is used more than once.` });
        } else {
          scopeKeys.add(field.key);
        }
      }

      if (def.supports?.includes("options") && ["select", "multiSelect", "radio"].includes(field.type)) {
        const options = field.options || [];
        if (!options.length) problems.push({ fieldId: field.id, message: `"${field.label}" needs at least one option.` });
        const values = options.map((option) => String(option?.value ?? ""));
        if (values.some((value) => !value)) problems.push({ fieldId: field.id, message: `"${field.label}" has an option without a value.` });
        if (new Set(values).size !== values.length) problems.push({ fieldId: field.id, message: `"${field.label}" has duplicate option values.` });
      }

      if (field.type === "table") {
        const keys = (field.columns || []).map((column) => column.key);
        if (!keys.length) problems.push({ fieldId: field.id, message: `"${field.label}" needs at least one column.` });
        if (keys.some((key) => !KEY_PATTERN.test(key || ""))) problems.push({ fieldId: field.id, message: `"${field.label}" has a column with an invalid key.` });
        if (new Set(keys).size !== keys.length) problems.push({ fieldId: field.id, message: `"${field.label}" has duplicate column keys.` });
      }

      if (field.validation?.pattern) {
        try {
          new RegExp(field.validation.pattern);
        } catch {
          problems.push({ fieldId: field.id, message: `"${field.label}" has an invalid pattern.` });
        }
      }

      if (Array.isArray(field.children)) {
        // Section children share the parent's data scope; group/repeater start a new one.
        checkScope(field.children, depth + 1, field.type === "section" ? scopeKeys : new Set());
      }
    }
  };

  checkScope(fields, 0, new Set());
  if (count > MAX_FIELDS) problems.push({ fieldId: null, message: `A form can have at most ${MAX_FIELDS} fields.` });
  return problems;
};

// Schema diff (publish impact)

export const diffSchemas = (previousFields = [], nextFields = []) => {
  const prev = new Map(flattenFields(previousFields).map(({ field, path }) => [field.id, { field, path }]));
  const next = new Map(flattenFields(nextFields).map(({ field, path }) => [field.id, { field, path }]));
  const added = [];
  const removed = [];
  const typeChanged = [];
  const keyChanged = [];
  const becameRequired = [];

  for (const [id, { field }] of next) {
    const before = prev.get(id)?.field;
    if (!before) {
      if (fieldHasValue(field)) added.push(field);
      continue;
    }
    if (before.type !== field.type) typeChanged.push({ id, label: field.label, from: before.type, to: field.type });
    if (before.key && field.key && before.key !== field.key) keyChanged.push({ id, label: field.label, from: before.key, to: field.key });
    if (!before.required && field.required) becameRequired.push(field);
  }
  for (const [id, { field }] of prev) {
    if (!next.has(id) && fieldHasValue(field)) removed.push(field);
  }
  return { added, removed, typeChanged, keyChanged, becameRequired };
};
