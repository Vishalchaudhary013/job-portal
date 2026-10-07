import { useState } from "react";
import { LuChevronDown, LuSearch } from "react-icons/lu";
import { mergeFacetOptions } from "../filterConfig";

// Renders the collapsible filter sections from a config array. Shared by the
// desktop sidebar and the mobile drawer so both stay in step.

const OPTION_SEARCH_THRESHOLD = 8;

const FilterSection = ({ filter, selections, facets, onToggle, onRange, onText, isOpen, onHeaderClick }) => {
  const [optionQuery, setOptionQuery] = useState("");
  const value = selections[filter.param];

  const selectedCount =
    filter.kind === "range"
      ? value.min || value.max
        ? 1
        : 0
      : filter.kind === "text"
        ? value
          ? 1
          : 0
        : value.length;

  const options = filter.kind === "multi" || filter.kind === "single" ? mergeFacetOptions(filter, facets) : [];
  const showOptionSearch = filter.searchable && options.length > OPTION_SEARCH_THRESHOLD;
  const visibleOptions = optionQuery
    ? options.filter((option) => option.label.toLowerCase().includes(optionQuery.toLowerCase()))
    : options;

  return (
    <div className="border-b border-black/5 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onHeaderClick}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-primary">
          {filter.title}
          {selectedCount > 0 && (
            <span className="rounded-sm bg-secondary/10 px-1.5 py-0.5 text-[11px] font-bold normal-case tracking-normal text-secondary">
              {selectedCount}
            </span>
          )}
        </span>
        <LuChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="mt-3">
          {filter.kind === "text" && (
            <label className="flex items-center gap-2 rounded-sm border border-black/10 px-3 py-2">
              <LuSearch className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={value}
                onChange={(event) => onText(filter, event.target.value)}
                placeholder={filter.placeholder}
                className="w-full bg-transparent text-[13px] text-primary outline-none placeholder:text-slate-400"
              />
            </label>
          )}

          {filter.kind === "range" && (
            <div>
              {filter.presets?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {filter.presets.map((preset) => {
                    const active = value.min === preset.min && value.max === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onRange(filter, active ? { min: "", max: "" } : preset)}
                        className={`rounded-sm border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                          active
                            ? "border-secondary bg-secondary text-white"
                            : "border-black/10 text-slate-600 hover:border-secondary/50"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={value.min}
                  onChange={(event) => onRange(filter, { ...value, min: event.target.value })}
                  placeholder="Min"
                  className="w-full min-w-0 rounded-sm border border-black/10 px-2.5 py-2 text-[13px] text-primary outline-none placeholder:text-slate-400"
                />
                <span className="shrink-0 text-slate-400">—</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={value.max}
                  onChange={(event) => onRange(filter, { ...value, max: event.target.value })}
                  placeholder="Max"
                  className="w-full min-w-0 rounded-sm border border-black/10 px-2.5 py-2 text-[13px] text-primary outline-none placeholder:text-slate-400"
                />
              </div>
              {filter.unit && <p className="mt-1.5 text-[11px] text-slate-400">{filter.unit}</p>}
            </div>
          )}

          {(filter.kind === "multi" || filter.kind === "single") && (
            <div>
              {showOptionSearch && (
                <label className="mb-2.5 flex items-center gap-2 rounded-sm border border-black/10 px-2.5 py-1.5">
                  <LuSearch className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={optionQuery}
                    onChange={(event) => setOptionQuery(event.target.value)}
                    placeholder={`Search ${filter.title.toLowerCase()}`}
                    className="w-full bg-transparent text-[13px] text-primary outline-none placeholder:text-slate-400"
                  />
                </label>
              )}

              <div className="scrollbar-hide max-h-64 space-y-2.5 overflow-y-auto">
                {visibleOptions.length === 0 && (
                  <p className="text-[13px] text-slate-400">No matching options</p>
                )}
                {visibleOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2.5 text-[14px] text-slate-600"
                  >
                    <input
                      type={filter.kind === "single" ? "radio" : "checkbox"}
                      name={filter.kind === "single" ? filter.param : undefined}
                      checked={
                        filter.kind === "single"
                          ? value[0] === option.value
                          : value.includes(option.value)
                      }
                      onChange={() => onToggle(filter, option.value)}
                      className="h-4 w-4 shrink-0 rounded-sm accent-secondary"
                    />
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.count > 0 && (
                      <span className="shrink-0 text-[12px] text-slate-400">{option.count}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FilterPanel = ({ filters, selections, facets, onToggle, onRange, onText }) => {
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(filters.map((filter) => [filter.param, Boolean(filter.defaultOpen)])),
  );

  return (
    <div>
      {filters.map((filter) => (
        <FilterSection
          key={filter.param}
          filter={filter}
          selections={selections}
          facets={facets}
          onToggle={onToggle}
          onRange={onRange}
          onText={onText}
          isOpen={Boolean(openSections[filter.param])}
          onHeaderClick={() =>
            setOpenSections((previous) => ({ ...previous, [filter.param]: !previous[filter.param] }))
          }
        />
      ))}
    </div>
  );
};

export default FilterPanel;
