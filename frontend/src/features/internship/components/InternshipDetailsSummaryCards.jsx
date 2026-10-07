import React from "react";
import { CiCalendar } from "react-icons/ci";
import { IoBagOutline } from "react-icons/io5";
import {
  formatDeadlineLabel,
  formatDeadlineStatus,
  formatStipendPeriod,
  formatStipendText,
  resolveWorkMode,
} from "../utils/internshipCardData";

const InternshipDetailsSummaryCards = ({ internship }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white border border-[#EEF2FF] rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Stipend</p>
        <p className="text-lg font-semibold text-slate-900 mt-1">{formatStipendText(internship)}</p>
        <p className="text-xs text-slate-500 mt-1">{formatStipendPeriod(internship)}</p>
      </div>
      <div className="bg-white border border-[#EEF2FF] rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Apply by</p>
        <p className="text-lg font-semibold text-slate-900 mt-1">{formatDeadlineLabel(internship.deadline)}</p>
        <p className="text-xs text-rose-500 mt-1 uppercase">{formatDeadlineStatus(internship.deadline)}</p>
      </div>
      <div className="bg-white border border-[#EEF2FF] rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Start date</p>
        <p className="text-lg font-semibold text-slate-900 mt-1 inline-flex items-center gap-1">
          <CiCalendar />
          {internship.startDate
            ? new Date(internship.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "N/A"}
        </p>
      </div>
      <div className="bg-white border border-[#EEF2FF] rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Role type</p>
        <p className="text-lg font-semibold text-slate-900 mt-1 inline-flex items-center gap-1">
          <IoBagOutline />
          {resolveWorkMode(internship)}
        </p>
      </div>
    </div>
  );
};

export default InternshipDetailsSummaryCards;
