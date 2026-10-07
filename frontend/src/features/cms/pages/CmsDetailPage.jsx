import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ShareModal from "../../../components/common/ShareModal";
import { getCmsEntry, getCmsType } from "../../../services/cmsAPI";
import CmsFormModal from "../render/CmsFormModal";
import DynamicDetailPageRenderer from "../render/DynamicDetailPageRenderer";
import { buildFieldIndex, formatValue, readField } from "../render/resolve";
import useDocumentMeta from "./useDocumentMeta";

// /explore/:typeSlug/:entrySlug — dynamic detail page for any published entry.
const CmsDetailPage = () => {
  const { typeSlug, entrySlug } = useParams();
  const [state, setState] = useState({ status: "loading" });
  const [formTarget, setFormTarget] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    Promise.all([getCmsType(typeSlug), getCmsEntry(typeSlug, entrySlug)])
      .then(([type, { entry }]) => active && setState({ status: "ready", type, entry }))
      .catch((error) => active && setState({ status: error?.response?.status === 404 ? "notfound" : "error" }));
    return () => {
      active = false;
    };
  }, [typeSlug, entrySlug]);

  const seo = useMemo(() => {
    if (state.status !== "ready") return {};
    const index = buildFieldIndex(state.type.formSchema);
    const config = state.type.pageSchema?.seo || {};
    const text = (id) => {
      const { ref, value } = readField(index, state.entry.data, id);
      return ref ? formatValue(ref, value) : "";
    };
    return { title: text(config.titleFieldId) || state.entry.title, description: text(config.descriptionFieldId) || state.type.contentType.description };
  }, [state]);
  useDocumentMeta(seo);

  if (state.status === "loading") {
    return (
      <div className="min-h-[70vh] bg-[#EEF2FF]">
        <div className="h-56 animate-pulse bg-[#E9F6FF]" />
        <div className="mx-auto max-w-[1250px] space-y-4 px-4 pt-6 md:px-6">
          {[0, 1, 2].map((n) => <div key={n} className="h-40 animate-pulse rounded-sm bg-white" />)}
        </div>
      </div>
    );
  }

  if (state.status !== "ready") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#EEF2FF] px-4">
        <div className="max-w-md rounded-sm bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{state.status === "notfound" ? "Not found" : "Something went wrong"}</h1>
          <p className="mt-2 text-slate-600">{state.status === "notfound" ? "This page may have been removed or is no longer available." : "Please refresh the page."}</p>
          <Link to={`/explore/${typeSlug}`} className="mt-5 inline-block rounded-sm bg-[#1F2853] px-5 py-2 font-semibold text-white">Back</Link>
        </div>
      </div>
    );
  }

  const { type, entry } = state;
  return (
    <>
      <DynamicDetailPageRenderer
        pageSchema={type.pageSchema}
        formSchema={type.formSchema}
        cardSchema={type.cardSchema}
        entry={entry}
        contentType={type.contentType}
        onFormAction={(formSlug, item) => setFormTarget({ formSlug, entry: item })}
        onShare={() => setShareOpen(true)}
      />
      {formTarget && <CmsFormModal formSlug={formTarget.formSlug} entry={formTarget.entry} onClose={() => setFormTarget(null)} />}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} eventTitle={entry.title} shareUrl={window.location.href} />
    </>
  );
};

export default CmsDetailPage;
