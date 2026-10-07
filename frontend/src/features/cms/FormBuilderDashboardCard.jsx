import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiInbox, FiPlus } from "react-icons/fi";
import { getCmsDashboardStats } from "../../services/cmsAPI";

// Lightweight Form Builder summary for the Admin / Super Admin dashboards.
// No creation forms here — everything is created in the Form Builder itself.
const FormBuilderDashboardCard = () => {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getCmsDashboardStats()
      .then(setStats)
      .catch(() => setFailed(true));
  }, []);

  const tiles = [
    { label: "CONTENT TYPES", value: stats?.contentTypes, hint: stats ? `${stats.publishedTypes} live on site` : "" },
    { label: "PUBLISHED ENTRIES", value: stats?.content.published, hint: stats ? `${stats.content.drafts} drafts · ${stats.content.inReview} in review` : "" },
    { label: "RESPONSE FORMS", value: stats?.forms, hint: "published" },
    { label: "RESPONSES", value: stats?.submissions.total, hint: stats ? `${stats.submissions.new} new · ${stats.submissions.last7Days} this week` : "" },
  ];

  return (
    <div className="mx-2 rounded-sm border border-[#E2E8F0] bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-800">Form Builder</p>
          <p className="text-xs text-slate-500">Content types, cards, detail pages and responses — all managed in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/form-builder/forms/new?kind=content" className="inline-flex items-center gap-1.5 rounded-sm border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <FiPlus size={14} /> New content type
          </Link>
          <Link to="/form-builder/submissions" className="inline-flex items-center gap-1.5 rounded-sm border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <FiInbox size={14} /> Responses
          </Link>
          <Link to="/form-builder" className="inline-flex items-center gap-1.5 rounded-sm bg-[#1F2853] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2a3670]">
            Open Form Builder <FiArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      {failed ? (
        <p className="text-sm text-slate-500">Stats are unavailable right now — the Form Builder itself is still reachable.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-sm border border-[#E2E8F0] p-4">
              <p className="text-xs font-semibold tracking-widest text-slate-500">{tile.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">{stats ? tile.value ?? 0 : <span className="inline-block h-8 w-12 animate-pulse rounded-sm bg-slate-100" />}</p>
              {tile.hint && <p className="mt-0.5 text-xs text-slate-500">{tile.hint}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormBuilderDashboardCard;
