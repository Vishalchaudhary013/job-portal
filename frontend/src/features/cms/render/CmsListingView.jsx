import React, { useMemo, useState } from "react";
import { LuArrowDownWideNarrow, LuLayoutGrid, LuList, LuSearch, LuSlidersHorizontal, LuTriangleAlert } from "react-icons/lu";
import ActiveFilterChips from "../../opportunity/components/ActiveFilterChips";
import MobileFilterDrawer from "../../opportunity/components/MobileFilterDrawer";
import OpportunityFilterSidebar from "../../opportunity/components/OpportunityFilterSidebar";
import OpportunityPagination from "../../opportunity/components/OpportunityPagination";

// The listing page for any Form Builder content type, in the SAME layout as
// the Jobs / Internship listing (OpportunityListingPage) — and built from the
// same filter sidebar, mobile drawer, filter chips and pagination components,
// so the two can't drift apart. Purely presentational: the live page feeds it
// from the API, the Form Builder preview feeds it draft data.

export const SORT_OPTIONS = [
  { value: "default", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "A–Z" },
];

// Form Builder filters -> the config / facet shapes the Jobs filter UI uses.
export const toOpportunityFilters = (cmsFilters = []) => ({
  filters: cmsFilters.map((filter) => ({
    param: filter.fieldId,
    title: filter.label,
    kind: "multi",
    facetKey: filter.fieldId,
    defaultOpen: true,
    options: (filter.options || []).map(({ label, value }) => ({ label, value: String(value) })),
  })),
  facets: Object.fromEntries(cmsFilters.map((filter) => [filter.fieldId, (filter.options || []).map(({ value, count }) => ({ value: String(value), count: count || 0 }))])),
});

const singular = (name = "") => (/ies$/i.test(name) ? name.replace(/ies$/i, "y") : /s$/i.test(name) ? name.slice(0, -1) : name);

const CardSkeleton = () => (
  <div className="animate-pulse rounded-sm border border-black/10 bg-white p-5">
    <div className="h-4 w-1/2 rounded-sm bg-slate-200" />
    <div className="mt-3 h-3 w-1/3 rounded-sm bg-slate-100" />
    <div className="mt-4 flex gap-2">
      <div className="h-6 w-20 rounded-sm bg-slate-100" />
      <div className="h-6 w-24 rounded-sm bg-slate-100" />
    </div>
    <div className="mt-4 h-3 w-2/3 rounded-sm bg-slate-100" />
  </div>
);

const CmsListingView = ({
  name,
  heading,
  intro,
  searchable = true,
  emptyMessage,
  defaultView = "list",
  cmsFilters,
  items,
  total,
  totalPages,
  page,
  loading = false,
  error = "",
  keyword,
  onKeyword,
  selections,
  onToggle,
  onApplySelections,
  onClearAll,
  sort,
  onSort,
  onPage,
  renderCard,
}) => {
  const [viewMode, setViewMode] = useState(defaultView === "grid" ? "grid" : "list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { filters, facets } = useMemo(() => toOpportunityFilters(cmsFilters), [cmsFilters]);
  const activeCount = Object.values(selections || {}).reduce((sum, list) => sum + (list?.length || 0), 0);
  const noun = total === 1 ? singular(name) : name;
  const hasFilters = filters.length > 0;

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-sm border border-black/10 p-1">
      {[
        { id: "list", icon: LuList, label: "List view" },
        { id: "grid", icon: LuLayoutGrid, label: "Grid view" },
      ].map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setViewMode(id)}
          aria-label={label}
          aria-pressed={viewMode === id}
          className={`rounded-sm p-1.5 transition-colors ${viewMode === id ? "bg-secondary text-white" : "text-primary hover:text-secondary"}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );

  const sortSelect = (className) => (
    <select value={sort} onChange={(event) => onSort(event.target.value)} aria-label="Sort results" className={className}>
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-h-screen bg-[#E9F6FF] py-10 md:py-14">
      <div className="mx-auto w-full max-w-[1250px] px-4 md:px-6">
        <h1 className="text-[32px] font-extrabold text-primary sm:text-[40px]">{heading || name}</h1>
        {intro && <p className="mt-1 text-[15px] text-slate-500 sm:text-[16px]">{intro}</p>}

        {searchable && (
          <div className="mt-8 rounded-sm border border-black/10 bg-white p-3">
            <label className="flex items-center gap-2 rounded-sm border border-black/10 px-3 py-3">
              <LuSearch className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(event) => onKeyword(event.target.value)}
                placeholder={`Search ${String(name || "").toLowerCase()}…`}
                className="w-full bg-transparent text-[14px] text-primary outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        )}

        {/* Mobile: filters move behind a drawer, sort stays inline. */}
        <div className="mt-3 flex items-center gap-2 lg:hidden">
          {hasFilters && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-black/15 bg-white py-3 text-[14px] font-semibold text-primary"
            >
              <LuSlidersHorizontal className="h-4 w-4 text-secondary" />
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
          )}
          <div className="flex flex-1 items-center gap-2">
            <span className="flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-primary">
              <LuArrowDownWideNarrow className="h-4 w-4 shrink-0 text-secondary" />
              Sort
            </span>
            {sortSelect("w-full min-w-0 cursor-pointer rounded-sm border border-black/15 bg-white px-2.5 py-3 text-[14px] text-primary outline-none")}
          </div>
        </div>

        <div className={`mt-6 grid grid-cols-1 items-start gap-6 ${hasFilters ? "lg:grid-cols-[280px_minmax(0,1fr)]" : ""}`}>
          {hasFilters && (
            <OpportunityFilterSidebar
              filters={filters}
              selections={selections}
              facets={facets}
              activeCount={activeCount}
              onToggle={onToggle}
              onRange={() => {}}
              onText={() => {}}
              onClearAll={onClearAll}
            />
          )}

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-black/10 bg-white px-4 py-3">
              <p className="text-[14px] text-slate-500">
                {loading ? (
                  "Loading results…"
                ) : (
                  <>
                    <span className="font-bold text-primary">{total}</span> {noun} Found
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 lg:flex">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                    <LuArrowDownWideNarrow className="h-3.5 w-3.5 shrink-0 text-secondary" />
                    Sort
                  </span>
                  {sortSelect("cursor-pointer rounded-sm border border-black/10 px-2.5 py-1.5 text-[13px] font-medium text-primary outline-none")}
                </div>
                {viewToggle}
              </div>
            </div>

            <ActiveFilterChips
              filters={filters}
              selections={selections}
              keyword={keyword}
              onRemove={(filter, value) => onToggle(filter, value)}
              onClearKeyword={() => onKeyword("")}
              onClearAll={onClearAll}
            />

            {error ? (
              <div className="rounded-sm border border-black/10 bg-white p-12 text-center">
                <LuTriangleAlert className="mx-auto mb-3 h-8 w-8 text-secondary" />
                <h2 className="text-[18px] font-bold text-primary">Couldn’t load results</h2>
                <p className="mt-1 text-[14px] text-slate-500">{error}</p>
              </div>
            ) : loading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                {Array.from({ length: 6 }, (_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-sm border border-black/10 bg-white p-12 text-center">
                <LuSearch className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <h2 className="text-[18px] font-bold text-primary">No {String(name || "results").toLowerCase()} found</h2>
                <p className="mx-auto mt-1 max-w-sm text-[14px] text-slate-500">{keyword || activeCount ? "Try different keywords or remove some filters." : emptyMessage}</p>
                {(keyword || activeCount > 0) && (
                  <button type="button" onClick={onClearAll} className="mt-5 rounded-sm bg-secondary px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-secondary/90">
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-4">{items.map((entry) => renderCard(entry, "list"))}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((entry) => renderCard(entry, "grid"))}</div>
            )}

            {!loading && !error && <OpportunityPagination page={page} totalPages={totalPages} onPageChange={onPage} />}
          </div>
        </div>
      </div>

      {hasFilters && (
        <MobileFilterDrawer
          open={drawerOpen}
          filters={filters}
          selections={selections}
          facets={facets}
          resultCount={loading ? null : total}
          onClose={() => setDrawerOpen(false)}
          onApply={(draft) => {
            onApplySelections(draft);
            setDrawerOpen(false);
          }}
          onClearAll={onClearAll}
        />
      )}
    </div>
  );
};

export default CmsListingView;
