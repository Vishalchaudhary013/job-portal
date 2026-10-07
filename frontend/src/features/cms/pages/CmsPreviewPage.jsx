import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../../../components/layout/Footer";
import NavBar from "../../../components/layout/NavBar";
import { getCmsPreview } from "../../../services/cmsAPI";
import CmsListingView from "../render/CmsListingView";
import DynamicCardRenderer from "../render/DynamicCardRenderer";
import DynamicDetailPageRenderer from "../render/DynamicDetailPageRenderer";
import { buildFieldIndex, formatValue, getByPathSafe } from "../render/resolve";
import useDocumentMeta from "./useDocumentMeta";
import SectionTitle from "../../../components/common/SectionTitle";
import { mapOpportunityFromApi } from "../../../context/OpportunitiesContext";
import FeaturedJobCard from "../../career-services/components/FeaturedJobCard";
import OpportunityDetailView from "../../opportunity/components/OpportunityDetailView";
import { mapEntryToOpportunity } from "../shared/opportunityMapping.js";

// /cms-preview?token=… — renders UNPUBLISHED card/page configuration through
// the very same page components the live site uses:
//   card preview -> the full listing page (CmsListingView) with draft cards
//   page preview -> the full detail page (DynamicDetailPageRenderer)
// both inside the normal navbar + footer, so what the admin sees here is
// exactly what students will see. Only reachable with a short-lived signed
// token; nothing here can publish. The previous version is kept in
// CmsPreviewPage.v1.jsx.

const PAGE_SIZE = 12;

// Search / filter / sort the preview's draft entries in the browser, the same
// way the server does for the live listing.
const useLocalListing = (data) => {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const filters = useMemo(() => data?.filters || [], [data]);
  const [selections, setSelections] = useState({});
  const index = useMemo(() => buildFieldIndex(data?.formSchema), [data]);

  const items = useMemo(() => {
    if (!data) return [];
    const listing = data.presentation?.listing || {};
    const needle = keyword.trim().toLowerCase();
    let list = data.items || [];
    if (needle) {
      const searchIds = listing.searchableFieldIds || [];
      list = list.filter((item) => {
        const haystack = [item.title, ...searchIds.map((id) => {
          const ref = index.get(id);
          return ref ? formatValue(ref, getByPathSafe(item.data, ref.path)) : "";
        })].join(" ").toLowerCase();
        return haystack.includes(needle);
      });
    }
    filters.forEach((filter) => {
      const chosen = selections[filter.fieldId] || [];
      if (!chosen.length) return;
      list = list.filter((item) => {
        const value = getByPathSafe(item.data, filter.path);
        const values = (Array.isArray(value) ? value : [value]).map((entry) => String(entry).toLowerCase());
        return chosen.some((option) => values.includes(String(option).toLowerCase()));
      });
    });
    if (sort === "title") list = [...list].sort((a, b) => String(a.title).localeCompare(String(b.title)));
    if (sort === "oldest") list = [...list].reverse();
    return list;
  }, [data, keyword, filters, selections, sort, index]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  return {
    keyword,
    setKeyword: (value) => {
      setKeyword(value);
      setPage(1);
    },
    sort,
    setSort,
    page: Math.min(page, totalPages),
    setPage,
    selections: Object.fromEntries(filters.map((filter) => [filter.fieldId, selections[filter.fieldId] || []])),
    setSelections: (next) => {
      setSelections(next);
      setPage(1);
    },
    pageItems: items.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE),
    total: items.length,
    totalPages,
    index,
  };
};

const CmsPreviewPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState({ status: "loading" });
  useDocumentMeta({ title: "Preview", robots: "noindex, nofollow" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "This preview link is incomplete." });
      return;
    }
    getCmsPreview(token)
      .then((data) => setState({ status: "ready", data }))
      .catch((error) => setState({ status: "error", message: error?.response?.data?.message || "This preview link is invalid or has expired." }));
  }, [token]);

  const data = state.status === "ready" ? state.data : null;
  const listing = useLocalListing(data);

  if (state.status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E9F6FF] px-4">
        {state.status === "loading" ? (
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <p className="max-w-sm text-center text-slate-500">{state.message}</p>
        )}
      </div>
    );
  }

  const banner = (
    <div className="sticky top-0 z-[80] bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
      Preview · not published · {data.entry.status === "sample" ? "sample data" : `entry: ${data.entry.title}`}
    </div>
  );

  // Connected to Edeco's job pages: preview with Edeco's own job components,
  // fed by the same mapping the server uses to list the entry.
  const listingTarget = data.presentation?.edecoListing?.target;
  if (listingTarget) {
    const toOpportunity = (item) =>
      mapOpportunityFromApi({
        ...mapEntryToOpportunity({ fields: data.formSchema?.fields || [], data: item.data, mapping: data.presentation.edecoListing.fields || {}, target: listingTarget }),
        _id: item.id,
        createdAt: item.publishedAt || new Date().toISOString(),
      });
    return (
      <>
        {banner}
        <NavBar />
        {/* Links inside the preview would leave it; keep the admin on the page. */}
        <div onClickCapture={(event) => event.target.closest("a") && event.preventDefault()}>
          {data.target === "card" ? (
            <section className="bg-[#E9F6FF]">
              <div className="mx-auto max-w-[1250px] px-4 py-14 md:px-6">
                <SectionTitle title="Explore Featured Jobs" subtitle="Hand-picked internships, apprenticeships and jobs open right now" viewAllLink="/job" />
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {(data.items?.length ? data.items : [data.entry]).map((item, index) => (
                    <FeaturedJobCard key={item.id} item={toOpportunity(item)} tintIndex={index} />
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <OpportunityDetailView opportunity={toOpportunity(data.entry)} type={listingTarget} />
          )}
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {banner}
      <NavBar />
      {/* Card preview shows the cards themselves (grid cards), not the whole listing page.
      {data.target === "card" ? ( */}
      {data.target === "card" ? (
        <section className="bg-[#E9F6FF]">
          <div className="mx-auto max-w-[1250px] px-4 py-14 md:px-6">
            <SectionTitle title={data.presentation?.heading || data.contentType.name} subtitle={data.presentation?.intro} viewAllLink="#" hideViewAll />
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(data.items?.length ? data.items : [data.entry]).map((item) => (
                <DynamicCardRenderer key={item.id} variant="grid" cardSchema={data.cardSchema} fieldIndex={listing.index} entry={item} typeSlug={data.contentType.slug} disableLinks />
              ))}
            </div>
          </div>
        </section>
      ) : data.target === "listing" ? (
        <CmsListingView
          name={data.contentType.name}
          heading={data.presentation?.heading}
          intro={data.presentation?.intro || data.contentType.description}
          searchable={data.presentation?.listing?.searchable !== false}
          emptyMessage={data.presentation?.listing?.emptyMessage}
          defaultView={data.presentation?.listing?.view}
          cmsFilters={data.filters || []}
          items={listing.pageItems}
          total={listing.total}
          totalPages={listing.totalPages}
          page={listing.page}
          keyword={listing.keyword}
          onKeyword={listing.setKeyword}
          selections={listing.selections}
          onToggle={(filter, value) => {
            const current = listing.selections[filter.param] || [];
            listing.setSelections({ ...listing.selections, [filter.param]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
          }}
          onApplySelections={listing.setSelections}
          onClearAll={() => {
            listing.setKeyword("");
            listing.setSelections({});
          }}
          sort={listing.sort}
          onSort={listing.setSort}
          onPage={listing.setPage}
          renderCard={(entry, variant) => (
            <DynamicCardRenderer key={entry.id} variant={variant} cardSchema={data.cardSchema} fieldIndex={listing.index} entry={entry} typeSlug={data.contentType.slug} disableLinks />
          )}
        />
      ) : (
        <DynamicDetailPageRenderer
          pageSchema={data.pageSchema}
          formSchema={data.formSchema}
          cardSchema={data.cardSchema}
          entry={data.entry}
          contentType={data.contentType}
          related={data.related}
          disableLinks
        />
      )}
      <Footer />
    </>
  );
};

export default CmsPreviewPage;
