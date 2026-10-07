import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { getCmsTypes } from "../../../services/cmsAPI";
import useDocumentMeta from "./useDocumentMeta";

// /explore — every published content type, as created in the Form Builder.
const CmsIndexPage = () => {
  const [types, setTypes] = useState(null);
  const [error, setError] = useState("");
  useDocumentMeta({ title: "Explore" });

  useEffect(() => {
    getCmsTypes()
      .then((result) => setTypes(result.items || []))
      .catch(() => setError("Couldn't load this page. Please refresh."));
  }, []);

  return (
    <div className="min-h-[70vh] bg-[#EEF2FF] py-10">
      <div className="mx-auto w-full max-w-[1250px] px-4 md:px-6">
        <h1 className="text-[30px] font-semibold text-[#1F2853] sm:text-[36px]">Explore</h1>
        {error && <p className="mt-6 text-slate-600">{error}</p>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types === null &&
            [0, 1, 2].map((n) => <div key={n} className="h-32 animate-pulse rounded-sm bg-white" />)}
          {types?.map((type) => (
            <Link key={type.id} to={`/explore/${type.slug}`} className="group rounded-sm border border-[#E2E8F0] bg-white p-6 transition hover:-translate-y-0.5 ">
              <h2 className="text-lg font-semibold text-slate-900">{type.presentation?.heading || type.name}</h2>
              {type.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{type.description}</p>}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1F2853]">
                Browse <FiArrowRight className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
          {types?.length === 0 && <p className="text-slate-600">Nothing has been published yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default CmsIndexPage;
