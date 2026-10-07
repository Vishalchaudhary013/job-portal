import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getCmsEntries, getCmsType } from "../../../services/cmsAPI";
import CmsFormModal from "../render/CmsFormModal";
import CmsListingView from "../render/CmsListingView";
import DynamicCardRenderer from "../render/DynamicCardRenderer";
import { buildFieldIndex } from "../render/resolve";
import useDocumentMeta from "./useDocumentMeta";

// /explore/:typeSlug — the live listing for any published content type. The
// page is drawn by CmsListingView (the Jobs page layout); this wrapper only
// keeps search / filters / sort / page in the URL and loads the data.
// The previous version is kept in CmsListingPage.v1.jsx.

const CmsListingPage = () => {
  const { typeSlug } = useParams();
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState(null);
  const [typeError, setTypeError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(params.get("q") || "");
  const [formTarget, setFormTarget] = useState(null);

  const q = params.get("q") || "";
  const page = Number(params.get("page")) || 1;
  const sort = params.get("sort") || "default";
  const filterIds = useMemo(() => (type?.filters || []).map((filter) => filter.fieldId), [type]);
  const selectionsKey = filterIds.map((id) => `${id}=${params.get(`f.${id}`) || ""}`).join("&");
  const selections = useMemo(
    () => Object.fromEntries(filterIds.map((id) => [id, (params.get(`f.${id}`) || "").split(",").filter(Boolean)])),
    [selectionsKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

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
    getCmsEntries(typeSlug, { q, page, sort, filters: selections })
      .then((data) => active && setResult(data))
      .catch(() => active && setResult({ items: [], pagination: { page: 1, totalPages: 1, total: 0 }, error: true }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [type, typeSlug, q, page, sort, selections]);

  // Debounced keyword -> URL.
  useEffect(() => {
    if (keyword === q) return undefined;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (keyword) next.set("q", keyword);
      else next.delete("q");
      next.delete("page");
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  const writeSelections = useCallback(
    (nextSelections) => {
      const next = new URLSearchParams(params);
      filterIds.forEach((id) => {
        const values = nextSelections[id] || [];
        if (values.length) next.set(`f.${id}`, values.join(","));
        else next.delete(`f.${id}`);
      });
      next.delete("page");
      setParams(next);
    },
    [params, setParams, filterIds],
  );

  const index = useMemo(() => buildFieldIndex(type?.formSchema), [type]);
  const presentation = type?.presentation || {};
  const listing = presentation.listing || {};
  useDocumentMeta({ title: type ? presentation.heading || type.contentType.name : undefined, description: presentation.intro || type?.contentType.description });

  if (typeError === "notfound") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#E9F6FF] px-4">
        <div className="max-w-md rounded-sm border border-black/10 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-primary">Page not found</h1>
          <p className="mt-2 text-slate-500">This section doesn't exist or isn't published.</p>
          <Link to="/" className="mt-5 inline-block rounded-sm bg-secondary px-5 py-2 font-semibold text-white">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <CmsListingView
        name={type?.contentType.name || ""}
        heading={presentation.heading}
        intro={presentation.intro || type?.contentType.description}
        searchable={listing.searchable !== false}
        emptyMessage={listing.emptyMessage}
        defaultView={listing.view}
        cmsFilters={type?.filters || []}
        items={result?.items || []}
        total={result?.pagination?.total ?? 0}
        totalPages={result?.pagination?.totalPages || 1}
        page={page}
        loading={!type || loading}
        error={typeError === "error" || result?.error ? "Something went wrong loading this page. Please refresh." : ""}
        keyword={keyword}
        onKeyword={setKeyword}
        selections={selections}
        onToggle={(filter, value) => {
          const current = selections[filter.param] || [];
          writeSelections({ ...selections, [filter.param]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
        }}
        onApplySelections={writeSelections}
        onClearAll={() => {
          setKeyword("");
          const next = new URLSearchParams(params);
          [...next.keys()].filter((key) => key.startsWith("f.") || key === "q" || key === "page").forEach((key) => next.delete(key));
          setParams(next);
        }}
        sort={sort}
        onSort={(value) => {
          const next = new URLSearchParams(params);
          if (value === "default") next.delete("sort");
          else next.set("sort", value);
          next.delete("page");
          setParams(next);
        }}
        onPage={(target) => {
          const next = new URLSearchParams(params);
          next.set("page", String(target));
          setParams(next);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        renderCard={(entry, variant) => (
          <DynamicCardRenderer
            key={entry.id}
            variant={variant}
            cardSchema={type.cardSchema}
            fieldIndex={index}
            entry={entry}
            typeSlug={type.contentType.slug}
            onFormAction={(formSlug, item) => setFormTarget({ formSlug, entry: item })}
          />
        )}
      />
      {formTarget && <CmsFormModal formSlug={formTarget.formSlug} entry={formTarget.entry} onClose={() => setFormTarget(null)} />}
    </>
  );
};

export default CmsListingPage;
