import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import FilterPanel from "./FilterPanel";

// Mobile bottom sheet. Unlike the desktop rail this stages changes locally and
// only writes them to the URL on Apply, so a phone doesn't fire a request per
// tap. Staged state is seeded from the live selections each time it opens.
const MobileFilterDrawer = ({
  open,
  filters,
  selections,
  facets,
  resultCount,
  onClose,
  onApply,
  onClearAll,
}) => {
  const [draft, setDraft] = useState(selections);

  useEffect(() => {
    if (open) setDraft(selections);
  }, [open, selections]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const draftCount = filters.reduce((total, filter) => {
    const value = draft[filter.param];
    if (filter.kind === "range") return total + (value?.min || value?.max ? 1 : 0);
    if (filter.kind === "text") return total + (value ? 1 : 0);
    return total + (value?.length || 0);
  }, 0);

  const toggleDraft = (filter, optionValue) =>
    setDraft((previous) => {
      if (filter.kind === "single") {
        const current = previous[filter.param]?.[0];
        return { ...previous, [filter.param]: current === optionValue ? [] : [optionValue] };
      }
      const current = previous[filter.param] || [];
      return {
        ...previous,
        [filter.param]: current.includes(optionValue)
          ? current.filter((entry) => entry !== optionValue)
          : [...current, optionValue],
      };
    });

  const setDraftRange = (filter, range) =>
    setDraft((previous) => ({ ...previous, [filter.param]: range }));

  const setDraftText = (filter, value) =>
    setDraft((previous) => ({ ...previous, [filter.param]: value }));

  const clearDraft = () =>
    setDraft(
      Object.fromEntries(
        filters.map((filter) => [
          filter.param,
          filter.kind === "range" ? { min: "", max: "" } : filter.kind === "text" ? "" : [],
        ]),
      ),
    );

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-sm bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
          <h2 className="text-[16px] font-bold text-primary">
            Filters{draftCount > 0 && <span className="text-secondary"> ({draftCount})</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="rounded-sm p-1.5 text-slate-500 hover:text-secondary"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-2">
          <FilterPanel
            filters={filters}
            selections={draft}
            facets={facets}
            onToggle={toggleDraft}
            onRange={setDraftRange}
            onText={setDraftText}
          />
        </div>

        <div className="flex items-center gap-3 border-t border-black/10 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              clearDraft();
              onClearAll();
            }}
            className="flex-1 rounded-sm border border-black/15 py-3 text-[14px] font-semibold text-primary"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 rounded-sm bg-secondary py-3 text-[14px] font-semibold text-white"
          >
            Apply{resultCount !== null ? ` (${resultCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterDrawer;
