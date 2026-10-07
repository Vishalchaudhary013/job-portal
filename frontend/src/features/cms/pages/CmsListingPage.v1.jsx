import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiFilter, FiSearch, FiX } from "react-icons/fi";
import { getCmsEntries, getCmsType } from "../../../services/cmsAPI";
import CmsFormModal from "../render/CmsFormModal";
import DynamicCardRenderer from "../render/DynamicCardRenderer";
import { buildFieldIndex } from "../render/resolve";
import useDocumentMeta from "./useDocumentMeta";

// /explore/:typeSlug — dynamic listing for any published content type.
// Search fields, filters, sorting, page size and card design all come from the
// type's published configuration; nothing here knows what the content is.

const GRID_COLUMNS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };

const readFilters = (params) => {
  const filters = {};
  for (const [key, value] of params.entries()) {
    const match = key.match(/^f\.(.+)$/);
    if (match && value) filters[match[1]] = value.split(",");
  }
  return filters;
};

const FilterGroup = ({ filter, selected, onToggle }) => (
  <div>
    <p className="mb-2 text-sm font-semibold text-slate-900">{filter.label}</p>
    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
      {filter.options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 accent-[#1F2853]" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
          {option.label}
        </label>
      ))}
      {!filter.options.length && <p className="text-xs text-slate-400">No options yet</p>}
    </div>
  </div>
);

const CmsListingPage = () => {
  const { typeSlug } = useParams();
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState(null);
  const [typeError, setTypeError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(params.get("q") || "");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [formTarget, setFormTarget] = useState(null);

  const q = params.get("q") || "";
  const page = Number(params.get("page")) || 1;
  const sort = params.get("sort") || "default";
  const filtersKey = [...params.entries()].filter(([key]) => key.startsWith("f.")).map(([k, v]) => `${k}=${v}`).join("&");
  const filters = useMemo(() => readFilters(params), [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setType(null);
    setTypeError("");
    getCmsType(typeSlug)
      .then(setType)
      .catch((error) => setTypeError(error?.response?.status === 404 ? "notfound" : "error"));
  }, [typeSlug]);

  useEffect(() => {
    if (!type) return undefined;
    let active = true;
    setLoading(true);
    getCmsEntries(typeSlug, { q, page, sort, filters })
      .then((data) => active && setResult(data))
      .catch(() => active && setResult({ items: [], pagination: { page: 1, totalPages: 1, total: 0 }, error: true }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [type, typeSlug, q, page, sort, filters]);

  // Debounced search into the URL.
  useEffect(() => {
    if (searchText === q) return undefined;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (searchText) next.set("q", searchText);
      else next.delete("q");
      next.delete("page");
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(
    (mutate) => {
      const next = new URLSearchParams(params);
      mutate(next);
      if (!next.has("pageKeep")) next.delete("page");
      next.delete("pageKeep");
      setParams(next);
    },
    [params, setParams],
  );

  const toggleFilter = (fieldId, value) =>
    update((next) => {
      const current = (next.get(`f.${fieldId}`) || "").split(",").filter(Boolean);
      const updated = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      if (updated.length) next.set(`f.${fieldId}`, updated.join(","));
      else next.delete(`f.${fieldId}`);
    });

  const goToPage = (target) =>
    update((next) => {
      next.set("page", String(target));
      next.set("pageKeep", "1");
    });

  const index = useMemo(() => buildFieldIndex(type?.formSchema), [type]);
  const presentation = type?.presentation || {};
  const listing = presentation.listing || {};
  const activeFilterCount = Object.values(filters).reduce((sum, list) => sum + list.length, 0);
  useDocumentMeta({ title: type ? presentation.heading || type.contentType.name : undefined, description: presentation.intro || type?.contentType.description });

  if (typeError === "notfound") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#EEF2FF] px-4">
        <div className="max-w-md rounded-sm bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
          <p className="mt-2 text-slate-600">This section doesn't exist or isn't published.</p>
          <Link to="/" className="mt-5 inline-block rounded-sm bg-[#1F2853] px-5 py-2 font-semibold text-white">Go home</Link>
        </div>
      </div>
    );
  }

  const filterPanel = (
    <div className="space-y-6">
      {(type?.filters || []).map((filter) => (
        <FilterGroup key={filter.fieldId} filter={filter} selected={filters[filter.fieldId] || []} onToggle={(value) => toggleFilter(filter.fieldId, value)} />
      ))}
      {activeFilterCount > 0 && (
        <button type="button" onClick={() => update((next) => [...next.keys()].filter((key) => key.startsWith("f.")).forEach((key) => next.delete(key)))} className="text-sm font-semibold text-[#FF4E45] hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
  const hasFilters = (type?.filters || []).length > 0;

  return (
    <div className="min-h-[70vh] bg-[#EEF2FF] pb-16">
      <div className="bg-[#E9F6FF]">
        <div className="mx-auto w-full max-w-[1250px] px-4 py-10 md:px-6">
          {type ? (
            <>
              <h1 className="text-[30px] font-semibold text-[#1F2853] sm:text-[38px]">{presentation.heading || type.contentType.name}</h1>
              {(presentation.intro || type.contentType.description) && <p className="mt-2 max-w-3xl text-[16px] text-slate-700">{presentation.intro || type.contentType.description}</p>}
            </>
          ) : (
            <div className="h-10 w-64 animate-pulse rounded-sm bg-white/70" />
          )}
          {listing.searchable !== false && (
            <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-sm border border-[#E2E8F0] bg-white px-4 py-2.5 ">
              <FiSearch className="text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search…"
                aria-label="Search"
                className="w-full bg-transparent text-[15px] outline-none"
              />
              {searchText && (
                <button type="button" aria-label="Clear search" onClick={() => setSearchText("")} className="text-slate-400 hover:text-slate-700">
                  <FiX />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1250px] px-4 pt-8 md:px-6">
        <div className={`grid items-start gap-6 ${hasFilters ? "lg:grid-cols-[250px_minmax(0,1fr)]" : ""}`}>
          {hasFilters && <aside className="hidden rounded-sm border border-[#E2E8F0] bg-white p-5 lg:block">{filterPanel}</aside>}

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">{result ? `${result.pagination.total} result${result.pagination.total === 1 ? "" : "s"}` : " "}</p>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button type="button" onClick={() => setMobileFilters(true)} className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium lg:hidden">
                    <FiFilter /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
                  </button>
                )}
                <select
                  aria-label="Sort"
                  value={sort}
                  onChange={(event) => update((next) => (event.target.value === "default" ? next.delete("sort") : next.set("sort", event.target.value)))}
                  className="rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="default">Recommended</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">A–Z</option>
                </select>
              </div>
            </div>

            {typeError === "error" || result?.error ? (
              <div className="rounded-sm bg-white p-10 text-center text-slate-600">Something went wrong loading this page. Please refresh.</div>
            ) : loading || !type ? (
              <div className={`grid gap-4 ${GRID_COLUMNS[listing.columns] || GRID_COLUMNS[3]}`}>
                {Array.from({ length: 6 }, (_, n) => <div key={n} className="h-64 animate-pulse rounded-sm bg-white" />)}
              </div>
            ) : result?.items.length ? (
              <div className={`grid gap-4 ${listing.view === "list" ? "grid-cols-1" : GRID_COLUMNS[listing.columns] || GRID_COLUMNS[3]}`}>
                {result.items.map((entry) => (
                  <DynamicCardRenderer
                    key={entry.id}
                    cardSchema={type.cardSchema}
                    fieldIndex={index}
                    entry={entry}
                    typeSlug={type.contentType.slug}
                    onFormAction={(formSlug, item) => setFormTarget({ formSlug, entry: item })}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-sm bg-white p-10 text-center text-slate-600">
                {q || activeFilterCount ? "No results match your search." : listing.emptyMessage || "Nothing here yet."}
              </div>
            )}

            {result && result.pagination.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="rounded-sm border border-slate-300 bg-white p-2 disabled:opacity-40" aria-label="Previous page">
                  <FiChevronLeft />
                </button>
                <span className="px-3 text-sm text-slate-700">
                  Page {page} of {result.pagination.totalPages}
                </span>
                <button type="button" disabled={page >= result.pagination.totalPages} onClick={() => goToPage(page + 1)} className="rounded-sm border border-slate-300 bg-white p-2 disabled:opacity-40" aria-label="Next page">
                  <FiChevronRight />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/40 lg:hidden" onClick={() => setMobileFilters(false)}>
          <div className="h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-lg font-semibold">Filters</p>
              <button type="button" onClick={() => setMobileFilters(false)} aria-label="Close filters"><FiX size={20} /></button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}

      {formTarget && <CmsFormModal formSlug={formTarget.formSlug} entry={formTarget.entry} onClose={() => setFormTarget(null)} />}
    </div>
  );
};

export default CmsListingPage;
