import { LuX } from "react-icons/lu";

// Chips for every applied filter. Each chip removes only its own value; the
// range chip clears both bounds since they read as one selection.
const formatRange = ({ min, max }) => {
  if (min && max) return `₹${Number(min).toLocaleString("en-IN")} – ₹${Number(max).toLocaleString("en-IN")}`;
  if (min) return `₹${Number(min).toLocaleString("en-IN")}+`;
  if (max === "0") return "Unpaid";
  return `Up to ₹${Number(max).toLocaleString("en-IN")}`;
};

const buildChips = (filters, selections) =>
  filters.flatMap((filter) => {
    const value = selections[filter.param];

    if (filter.kind === "range") {
      if (!value?.min && !value?.max) return [];
      return [{ key: `${filter.param}`, label: formatRange(value), filter, value: null }];
    }

    if (filter.kind === "text") {
      return value ? [{ key: filter.param, label: value, filter, value: null }] : [];
    }

    return (value || []).map((entry) => {
      const option = (filter.options || []).find((item) => item.value === entry);
      return {
        key: `${filter.param}:${entry}`,
        label: option?.label || entry,
        filter,
        value: entry,
      };
    });
  });

const ActiveFilterChips = ({ filters, selections, keyword, onRemove, onClearKeyword, onClearAll }) => {
  const chips = buildChips(filters, selections);
  if (!chips.length && !keyword) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-semibold text-primary">Filters:</span>

      {keyword && (
        <button
          type="button"
          onClick={onClearKeyword}
          className="flex items-center gap-1.5 rounded-sm border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[12px] font-medium text-secondary"
        >
          <span className="max-w-[180px] truncate">“{keyword}”</span>
          <LuX className="h-3.5 w-3.5 shrink-0" />
        </button>
      )}

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.filter, chip.value)}
          className="flex items-center gap-1.5 rounded-sm border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[12px] font-medium text-secondary"
        >
          <span className="max-w-[180px] truncate">{chip.label}</span>
          <LuX className="h-3.5 w-3.5 shrink-0" />
        </button>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-[12px] font-semibold text-slate-500 underline hover:text-secondary"
      >
        Clear All
      </button>
    </div>
  );
};

export default ActiveFilterChips;
