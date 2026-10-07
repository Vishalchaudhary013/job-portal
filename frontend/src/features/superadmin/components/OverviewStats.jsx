import React from "react";
import { useAdminContext } from "../../admin/context/AdminContext";

const OverviewStats = () => {
  const { showOpportunityForm, isSuperStatsSection, directory } = useAdminContext();

  if (showOpportunityForm || !isSuperStatsSection) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 px-2 xl:grid-cols-4">
      <div className="rounded-lg border border-[#E2E8F0] p-4 bg-white">
        <p className="text-xs text-slate-500 tracking-widest font-semibold">
          TOTAL USERS
        </p>
        <p className="text-3xl mt-1 font-bold text-slate-800">
          {directory.counts?.users || 0}
        </p>
      </div>
      <div className="rounded-lg border border-[#E2E8F0] p-4 bg-white">
        <p className="text-xs text-slate-500 tracking-widest font-semibold">
          TOTAL ADMINS
        </p>
        <p className="text-3xl mt-1 font-bold text-slate-800">
          {directory.counts?.admins || 0}
        </p>
      </div>
      <div className="rounded-lg border border-[#E2E8F0] p-4 bg-white">
        <p className="text-xs text-slate-500 tracking-widest font-semibold">
          SUPER ADMINS
        </p>
        <p className="text-3xl mt-1 font-bold text-slate-800">
          {directory.counts?.superAdmins || 0}
        </p>
      </div>
      <div className="rounded-lg border border-[#E2E8F0] p-4 bg-white">
        <p className="text-xs text-slate-500 tracking-widest font-semibold">
          TOTAL ACCOUNTS
        </p>
        <p className="text-3xl mt-1 font-bold text-slate-800">
          {directory.counts?.total || 0}
        </p>
      </div>
      <div className="rounded-lg border border-[#E2E8F0] p-4 bg-white">
        <p className="text-xs text-slate-500 tracking-widest font-semibold">
          RESUMES BUILDER
        </p>
        <p className="text-3xl mt-1 font-bold text-slate-800">
          {directory.counts?.builderResumes || 0}
        </p>
       
      </div>
    </div>
  );
};

export default OverviewStats;
