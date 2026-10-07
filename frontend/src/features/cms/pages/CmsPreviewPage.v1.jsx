import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../../../components/layout/Footer";
import NavBar from "../../../components/layout/NavBar";
import { getCmsPreview } from "../../../services/cmsAPI";
import DynamicCardRenderer from "../render/DynamicCardRenderer";
import DynamicDetailPageRenderer from "../render/DynamicDetailPageRenderer";
import useDocumentMeta from "./useDocumentMeta";

// /cms-preview?token=… — renders UNPUBLISHED card/page configuration with the
// exact same renderers as the live pages. Only reachable with a short-lived
// token signed by the server; nothing here can publish or change anything.
// The Form Builder embeds this page in an iframe sized to desktop/tablet/mobile.

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

  if (state.status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EEF2FF] px-4">
        {state.status === "loading" ? (
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1F2853] border-t-transparent" />
        ) : (
          <p className="max-w-sm text-center text-slate-600">{state.message}</p>
        )}
      </div>
    );
  }

  const { data } = state;
  const banner = (
    <div className="sticky top-0 z-[80] bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
      Preview · not published · {data.entry.status === "sample" ? "sample data" : `entry: ${data.entry.title}`}
    </div>
  );

  if (data.target === "card") {
    const columns = Number(data.presentation?.listing?.columns) || 3;
    return (
      <div className="min-h-screen bg-[#EEF2FF]">
        {banner}
        <div className="mx-auto w-full max-w-[1250px] px-4 py-10 md:px-6">
          <div className={`grid gap-4 ${data.presentation?.listing?.view === "list" ? "grid-cols-1" : columns >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            <DynamicCardRenderer cardSchema={data.cardSchema} formSchema={data.formSchema} entry={data.entry} typeSlug={data.contentType.slug} disableLinks />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {banner}
      <NavBar />
      <DynamicDetailPageRenderer
        pageSchema={data.pageSchema}
        formSchema={data.formSchema}
        cardSchema={data.cardSchema}
        entry={data.entry}
        contentType={data.contentType}
        related={data.related}
        disableLinks
      />
      <Footer />
    </>
  );
};

export default CmsPreviewPage;
