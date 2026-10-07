import React from "react";
import { CiLocationOn } from "react-icons/ci";
import { FiBookmark, FiExternalLink } from "react-icons/fi";

const ApprenticeshipDetailsAbout = ({
  apprenticeship,
  isSaved,
  mapSearchUrl,
  mapEmbedUrl,
  onApply,
  onToggleSave,
}) => {
  return (
    <aside className="space-y-4 xl:sticky xl:top-6">
      <div className="bg-white border border-[#EEF2FF] rounded-2xl p-4">
        <button
          type="button"
          onClick={onApply}
          className="w-full py-3 rounded-lg bg-[#1F2853] hover:bg-[#162040] text-white font-semibold"
        >
          Apply Now
        </button>
        <button
          type="button"
          onClick={onToggleSave}
          className="w-full mt-3 py-2.5 rounded-lg border border-[#E2E8F0] text-slate-700 font-medium inline-flex items-center justify-center gap-2"
          aria-label={isSaved ? "Unsave apprenticeship" : "Save apprenticeship"}
        >
          <FiBookmark className={isSaved ? "text-[#1F2853]" : ""} />
          {isSaved ? "Saved" : "Save for later"}
        </button>
      </div>

      <div className="bg-white border border-[#EEF2FF] rounded-2xl p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">About the Company</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Department</span>
            <span className="text-slate-800 font-medium text-right">{apprenticeship.department || "N/A"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Functional role</span>
            <span className="text-slate-800 font-medium text-right">{apprenticeship.functionalRole || "N/A"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Type</span>
            <span className="text-slate-800 font-medium text-right">{apprenticeship.companyType || "N/A"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Size</span>
            <span className="text-slate-800 font-medium text-right">{apprenticeship.companySize || "N/A"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Founded</span>
            <span className="text-slate-800 font-medium text-right">{apprenticeship.foundedYear || "N/A"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Industry</span>
            <span className="text-slate-800 font-medium text-right">{apprenticeship.industry || "N/A"}</span>
          </div>
        </div>

        {apprenticeship.website && (
          <a
            href={apprenticeship.website}
            target="_blank"
            rel="noreferrer"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#E2E8F0] text-[#1F2853] font-semibold"
          >
            Visit Website
            <FiExternalLink />
          </a>
        )}
      </div>

      <div className="bg-white border border-[#EEF2FF] rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-slate-700 text-sm font-medium inline-flex items-center gap-1">
            <CiLocationOn />
            Global HQ: {apprenticeship.location || "N/A"}
          </p>
          <a
            href={mapSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#1F2853] hover:underline whitespace-nowrap"
          >
            Open in Maps
          </a>
        </div>

        <div className="mt-3 h-36 rounded-xl border border-[#EEF2FF] overflow-hidden bg-white">
          <iframe
            title="Company location map"
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>
      </div>
    </aside>
  );
};

export default ApprenticeshipDetailsAbout;
