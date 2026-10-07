// Conditional visibility. A field's `conditions` look like:
//   { logic: "all" | "any", rules: [{ fieldId, operator, value }] }
// Rules reference other fields by stable ID; the value is looked up in the
// field's own data scope first (siblings in a group/repeater item) and then in
// the entry's root data.

export const CONDITION_OPERATORS = [
  { id: "equals", label: "is", needsValue: true },
  { id: "notEquals", label: "is not", needsValue: true },
  { id: "contains", label: "contains", needsValue: true },
  { id: "notContains", label: "does not contain", needsValue: true },
  { id: "greaterThan", label: "is greater than", needsValue: true },
  { id: "lessThan", label: "is less than", needsValue: true },
  { id: "isEmpty", label: "is empty", needsValue: false },
  { id: "isNotEmpty", label: "is not empty", needsValue: false },
  { id: "isChecked", label: "is checked", needsValue: false },
  { id: "isNotChecked", label: "is not checked", needsValue: false },
];

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  value === false ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

const asComparable = (value) => (value === undefined || value === null ? "" : String(value).toLowerCase());

export const evaluateRule = (rule, actual) => {
  const expected = rule.value;
  switch (rule.operator) {
    case "equals":
      return Array.isArray(actual)
        ? actual.map(asComparable).includes(asComparable(expected))
        : asComparable(actual) === asComparable(expected);
    case "notEquals":
      return Array.isArray(actual)
        ? !actual.map(asComparable).includes(asComparable(expected))
        : asComparable(actual) !== asComparable(expected);
    case "contains":
      return Array.isArray(actual)
        ? actual.map(asComparable).includes(asComparable(expected))
        : asComparable(actual).includes(asComparable(expected));
    case "notContains":
      return Array.isArray(actual)
        ? !actual.map(asComparable).includes(asComparable(expected))
        : !asComparable(actual).includes(asComparable(expected));
    case "greaterThan":
      return Number(actual) > Number(expected);
    case "lessThan":
      return Number(actual) < Number(expected);
    case "isEmpty":
      return isBlank(actual);
    case "isNotEmpty":
      return !isBlank(actual);
    case "isChecked":
      return actual === true || (Array.isArray(actual) && actual.length > 0);
    case "isNotChecked":
      return !(actual === true || (Array.isArray(actual) && actual.length > 0));
    default:
      return true;
  }
};

// keyById: Map(fieldId -> key) for the whole schema (see buildKeyIndex).
export const isFieldVisible = (field, { scope = {}, root = {}, keyById }) => {
  const rules = field?.conditions?.rules || [];
  if (!rules.length) return true;

  const results = rules.map((rule) => {
    const key = keyById?.get(rule.fieldId);
    if (!key) return true; // referenced field was removed — don't hide on a dangling rule
    const actual = key in scope ? scope[key] : root[key];
    return evaluateRule(rule, actual);
  });

  return field.conditions.logic === "any" ? results.some(Boolean) : results.every(Boolean);
};
