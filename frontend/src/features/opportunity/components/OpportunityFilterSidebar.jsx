import { LuSlidersHorizontal } from "react-icons/lu";
import FilterPanel from "./FilterPanel";

// Desktop filter rail. Selections apply immediately (the mobile drawer is the
// one that batches behind an Apply button).
const OpportunityFilterSidebar = ({
  filters,
  selections,
  facets,
  activeCount,
  onToggle,
  onRange,
  onText,
  onClearAll,
}) => (
  <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
    <div className="rounded-sm border border-black/10 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-primary">
          <LuSlidersHorizontal className="h-4 w-4 text-secondary" />
          Filters
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[12px] font-semibold text-secondary hover:underline"
          >
            Clear All ({activeCount})
          </button>
        )}
      </div>

      <div className="scrollbar-hide max-h-[calc(100vh-180px)] overflow-y-auto px-5 py-2">
        <FilterPanel
          filters={filters}
          selections={selections}
          facets={facets}
          onToggle={onToggle}
          onRange={onRange}
          onText={onText}
        />
      </div>
    </div>
  </aside>
);

export default OpportunityFilterSidebar;
