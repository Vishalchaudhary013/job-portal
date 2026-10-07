import React from "react";
import { CiLocationOn } from "react-icons/ci";
import { LuDot } from "react-icons/lu";
import { getApprenticeshipTags } from "../utils/apprenticeshipCardData";

const ApprenticeshipDetailsHeader = ({ apprenticeship }) => {
  return (
    <div className="bg-white border border-[#EEF2FF] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {apprenticeship.logo ? (
            <img
              src={apprenticeship.logo}
              alt={apprenticeship.company}
              className="h-14 w-14 rounded-xl mt-1.5 object-cover border border-black/10"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl font-semibold">
              {String(apprenticeship.company || "I").trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-0.5 wrap-break-word">
              {apprenticeship.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-blue-700">{apprenticeship.company}</span>
              <LuDot />
              <span className="inline-flex items-center gap-1">
                <CiLocationOn />
                {apprenticeship.location || "N/A"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {getApprenticeshipTags(apprenticeship).map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprenticeshipDetailsHeader;
