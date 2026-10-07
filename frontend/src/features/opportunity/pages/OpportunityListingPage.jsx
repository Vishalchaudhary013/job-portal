import { useState } from "react";
import {
  LuSearch,
  LuList,
  LuLayoutGrid,
  LuSlidersHorizontal,
  LuTriangleAlert,
  LuArrowDownWideNarrow,
} from "react-icons/lu";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import {
  formatDeadlineStatus,
  formatStipendText,
} from "../../internship/utils/internshipCardData";
import { useOpportunityQuery } from "../useOpportunityQuery";
import { useDynamicFilterOptions } from "../useDynamicFilterOptions";
import OpportunityFilterSidebar from "../components/OpportunityFilterSidebar";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import ActiveFilterChips from "../components/ActiveFilterChips";
import OpportunityPagination from "../components/OpportunityPagination";
import OpportunityListCard from "../components/OpportunityListCard";
import OpportunityGridCard from "../components/OpportunityGridCard";

// Shared listing shell for Jobs / Internships / Apprenticeships. Filtering,
// sorting and pagination all run server-side; the URL holds the state.

const toList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(/\r?\n|,|\|/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const formatAbsoluteDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

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

const OpportunityListingPage = ({
  opportunityType,
  basePath,
  typeLabel,
  title,
  subtitle,
  searchPlaceholder,
  filters: filterConfig,
  sortOptions,
  emptyStateHint,
}) => {
  const { isInternshipSaved, toggleSavedInternship } = useOpportunities();
  const [viewMode, setViewMode] = useState("list");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Swaps in the admin-managed option lists for any filter that declares a
  // `categoryType`, so everything below — sidebar, drawer, chips and the URL
  // state in useOpportunityQuery — works off the same enriched config.
  const filters = useDynamicFilterOptions(filterConfig);

  const {
    items,
    pagination,
    facets,
    isLoading,
    error,
    selections,
    activeCount,
    sort,
    page,
    keywordDraft,
    setKeywordDraft,
    toggleValue,
    setRange,
    setText,
    applySelections,
    clearAll,
    setSort,
    setPage,
  } = useOpportunityQuery({ opportunityType, filters });

  const total = pagination?.total ?? 0;
  const resultNoun = opportunityType === "Jobs" ? "Job" : opportunityType === "Internship" ? "Internship" : "Apprenticeship";

  const handleShare = async (item) => {
    const detailUrl = `${window.location.origin}${basePath}/${item._id || item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title || typeLabel, url: detailUrl });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(detailUrl);
        window.alert("Link copied to clipboard");
        return;
      }
      window.prompt("Copy this link:", detailUrl);
    } catch {
      window.prompt("Copy this link:", detailUrl);
    }
  };

  // The API returns raw documents, so normalise `_id` to the `id` the cards use.
  const cardProps = (item) => {
    const id = item.id || item._id;
    return {
      item: { ...item, id },
      basePath,
      typeLabel,
      isSaved: isInternshipSaved(id),
      stipendLabel: formatStipendText(item),
      // Deduped: some postings repeat a skill, which rendered duplicate tags
      // and collided on the tag React key.
      skillsList: [...new Set(toList(item.skills))],
      experienceText: String(item.duration || item.experienceLevel || "Not specified").trim(),
      locationText: String(item.location || "Location not specified").trim(),
      deadlineLabel: formatDeadlineStatus(item.deadline),
      postedDateLabel: formatAbsoluteDate(item.createdAt || item.updatedAt),
      companyInitial: String(item.company || "E").trim().charAt(0).toUpperCase(),
      onShare: handleShare,
      onToggleSave: toggleSavedInternship,
    };
  };

  const applyDrawer = (draft) => {
    applySelections(draft);
    setDrawerOpen(false);
  };

  const removeChip = (filter, value) => {
    if (filter.kind === "range") setRange(filter, { min: "", max: "" });
    else if (filter.kind === "text") setText(filter, "");
    else toggleValue(filter, value);
  };

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-sm border border-black/10 p-1">
      <button
        type="button"
        onClick={() => setViewMode("list")}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
        className={`rounded-sm p-1.5 transition-colors ${
          viewMode === "list" ? "bg-secondary text-white" : "text-primary hover:text-secondary"
        }`}
      >
        <LuList className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setViewMode("grid")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
        className={`rounded-sm p-1.5 transition-colors ${
          viewMode === "grid" ? "bg-secondary text-white" : "text-primary hover:text-secondary"
        }`}
      >
        <LuLayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E9F6FF] py-10 md:py-14">
      <div className="mx-auto w-full max-w-[1250px] px-4 md:px-6">
        <h1 className="text-[32px] font-extrabold text-primary sm:text-[40px]">{title}</h1>
        <p className="mt-1 text-[15px] text-slate-500 sm:text-[16px]">{subtitle}</p>

        <div className="mt-8 rounded-sm border border-black/10 bg-white p-3">
          <label className="flex items-center gap-2 rounded-sm border border-black/10 px-3 py-3">
            <LuSearch className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-[14px] text-primary outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        {/* Mobile: filters move behind a drawer, sort stays inline. */}
        <div className="mt-3 flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-black/15 bg-white py-3 text-[14px] font-semibold text-primary"
          >
            <LuSlidersHorizontal className="h-4 w-4 text-secondary" />
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
          <div className="flex flex-1 items-center gap-2">
            <span className="flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-primary">
              <LuArrowDownWideNarrow className="h-4 w-4 shrink-0 text-secondary" />
              Sort
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort results"
              className="w-full min-w-0 cursor-pointer rounded-sm border border-black/15 bg-white px-2.5 py-3 text-[14px] text-primary outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <OpportunityFilterSidebar
            filters={filters}
            selections={selections}
            facets={facets}
            activeCount={activeCount}
            onToggle={toggleValue}
            onRange={setRange}
            onText={setText}
            onClearAll={clearAll}
          />

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-black/10 bg-white px-4 py-3">
              <p className="text-[14px] text-slate-500">
                {isLoading ? (
                  "Loading results…"
                ) : (
                  <>
                    <span className="font-bold text-primary">{total}</span>{" "}
                    {resultNoun}
                    {total === 1 ? "" : "s"} Found
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 lg:flex">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                    <LuArrowDownWideNarrow className="h-3.5 w-3.5 shrink-0 text-secondary" />
                    Sort
                  </span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    aria-label="Sort results"
                    className="cursor-pointer rounded-sm border border-black/10 px-2.5 py-1.5 text-[13px] font-medium text-primary outline-none"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {viewToggle}
              </div>
            </div>

            <ActiveFilterChips
              filters={filters}
              selections={selections}
              keyword={keywordDraft}
              onRemove={removeChip}
              onClearKeyword={() => setKeywordDraft("")}
              onClearAll={clearAll}
            />

            {error ? (
              <div className="rounded-sm border border-black/10 bg-white p-12 text-center">
                <LuTriangleAlert className="mx-auto mb-3 h-8 w-8 text-secondary" />
                <h2 className="text-[18px] font-bold text-primary">Couldn’t load results</h2>
                <p className="mt-1 text-[14px] text-slate-500">{error}</p>
              </div>
            ) : isLoading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "space-y-4"
                }
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-sm border border-black/10 bg-white p-12 text-center">
                <LuSearch className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <h2 className="text-[18px] font-bold text-primary">
                  No {resultNoun.toLowerCase()}s found
                </h2>
                <p className="mx-auto mt-1 max-w-sm text-[14px] text-slate-500">{emptyStateHint}</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 rounded-sm bg-secondary px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-secondary/90"
                >
                  Clear All Filters
                </button>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <OpportunityListCard key={item._id || item.id} {...cardProps(item)} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <OpportunityGridCard key={item._id || item.id} {...cardProps(item)} />
                ))}
              </div>
            )}

            {!isLoading && !error && (
              <OpportunityPagination
                page={page}
                totalPages={pagination?.totalPages || 1}
                onPageChange={setPage}
              />
            )}
          </div>
        </div>
      </div>

      <MobileFilterDrawer
        open={drawerOpen}
        filters={filters}
        selections={selections}
        facets={facets}
        resultCount={isLoading ? null : total}
        onClose={() => setDrawerOpen(false)}
        onApply={applyDrawer}
        onClearAll={clearAll}
      />
    </div>
  );
};

export default OpportunityListingPage;
