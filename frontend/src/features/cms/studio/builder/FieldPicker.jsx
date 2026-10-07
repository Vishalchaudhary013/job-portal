import React from "react";
import { FIELD_TYPES } from "../../shared/fieldTypes.js";
import { Select } from "../ui";

// Dropdown of the form's referenceable fields (anything with a value that
// isn't inside a repeater). `accepts` limits it to suitable field types.
const FieldPicker = ({ refs, value, onChange, accepts = ["*"], placeholder = "Choose a field…", allowEmpty = true, ...props }) => {
  const allowed = refs.filter((ref) => accepts.includes("*") || accepts.includes(ref.type));
  const missing = value && !refs.some((ref) => ref.id === value);
  return (
    <Select value={value || ""} onChange={(event) => onChange(event.target.value || null)} {...props}>
      {allowEmpty && <option value="">{placeholder}</option>}
      {missing && <option value={value}>Removed field</option>}
      {allowed.map((ref) => (
        <option key={ref.id} value={ref.id}>
          {ref.path.includes(".") ? `${ref.path.split(".").slice(0, -1).join(" › ")} › ` : ""}
          {ref.label || ref.key} — {FIELD_TYPES[ref.type]?.label}
        </option>
      ))}
    </Select>
  );
};

export default FieldPicker;
