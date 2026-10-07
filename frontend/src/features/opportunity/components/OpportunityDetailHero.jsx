import { IoMdShare } from "react-icons/io";
import {
  LuBriefcase,
  LuCalendarDays,
  LuClock,
  LuMapPin,
  LuUsers,
  LuWallet,
} from "react-icons/lu";
import {
  formatStipendPeriod,
  formatStipendText,
} from "../../job/utils/jobCardData";

// Hero band for the new job / internship / apprenticeship detail page.
//
// Reference design puts this on a dark navy band; here it sits on the same
// light #E9F6FF the career-services hero and Featured Jobs strip use, so the
// detail page reads as part of that landing flow. Everything else is drawn in
// the project palette from globals.css — navy `primary` (#1F2853) for the
// title/labels, coral `secondary` (#FF4E45) for the category chip and icons —
// never the reference's own blue/lime.
//
// The white summary card is built from a filtered cell list rather than a
// fixed 6-slot grid: opportunities routinely leave working hours, experience
// or openings blank, and a fixed grid left visible holes for those.

const EXPERIENCE_LABELS = {
  beginner: "0-1 Years",
  intermediate: "1-3 Years",
  advanced: "3+ Years",
  "1 years": "1 Year",
  "1 months": "1 Month",
};

const readableExperience = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return EXPERIENCE_LABELS[raw.toLowerCase()] || raw;
};

const readableDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const OpportunityDetailHero = ({ opportunity, typeLabel, onApply, onShare }) => {
  const item = opportunity || {};

  const stipendPeriod = formatStipendPeriod(item);
  const salary = [
    formatStipendText(item),
    stipendPeriod === "Compensation details" ? "" : stipendPeriod,
  ]
    .filter(Boolean)
    .join(" ");

  const category =
    item.departmentCategory || item.department || item.functionalRole || typeLabel;
  const postedOn = readableDate(item.createdAt || item.applicationsOpenDate);

  // Label/value pairs for the white card. Falsy values are dropped so the grid
  // never renders an empty cell.
  const cells = [
    {
      icon: LuCalendarDays,
      label: "Type:",
      value: item.workingHours || item.internshipType || item.jobType || item.workMode,
    },
    {
      icon: LuClock,
      label: item.duration ? "Duration:" : "Work mode:",
      value: item.duration || item.workMode,
    },
    // Only a job pays a salary; an internship or apprenticeship pays a stipend.
    {
      icon: LuWallet,
      label: typeLabel === "Job" ? "Offered salary:" : "Stipend:",
      value: salary,
    },
    {
      icon: LuMapPin,
      label: "Hiring location:",
      value: item.cityState || item.location,
    },
    {
      icon: LuBriefcase,
      label: "Experience:",
      value: readableExperience(item.experienceLevel),
    },
    { icon: LuUsers, label: "Openings:", value: item.openings },
  ].filter((cell) => Boolean(cell.value));

  return (
    <section style={{ backgroundColor: "#E9F6FF" }}>
      <div className="mx-auto w-full max-w-[1250px] px-4 py-12 md:px-6 md:py-16">
        <div className="text-center">
          {category && (
            <span className="inline-block rounded-sm bg-secondary px-4 py-1.5 text-[13px] font-semibold uppercase tracking-wide text-white">
              {category}
            </span>
          )}

          <h1 className="mt-5 text-[32px] font-extrabold leading-[1.1] tracking-tight text-primary sm:text-[42px] md:text-[54px]">
            {item.title || `${typeLabel} opening`}
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[15px] text-primary">
            {(item.cityState || item.location) && (
              <span className="flex items-center gap-2">
                <LuMapPin className="h-4 w-4 text-secondary" />
                {item.cityState || item.location}
              </span>
            )}
            {item.company && (
              <span className="flex items-center gap-2">
                <LuBriefcase className="h-4 w-4 text-secondary" />
                {item.company}
              </span>
            )}
            {postedOn && (
              <span className="flex items-center gap-2">
                <LuCalendarDays className="h-4 w-4 text-secondary" />
                <span className="text-slate-500">Post Date:</span>
                <span className="font-medium">{postedOn}</span>
              </span>
            )}
          </div>
        </div>

        {/* Summary card */}
        <div className="mt-10 rounded-sm bg-white px-6 py-8  md:px-10">
          <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {cells.map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-[15px] font-bold text-primary">{label}</span>
                </div>
                <p className="mt-1.5 text-[15px] text-black">{value}</p>
              </div>
            ))}

            {/* Own full-width row rather than another grid cell: the cell count
                varies with how much of the record is filled in, so as a cell the
                button landed wherever the flow happened to leave it (a lone
                third row under the first column, on a fully-filled record). */}
            <div className="col-span-full flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onShare}
                className="flex w-full items-center justify-center gap-2 rounded-sm border border-primary px-8 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/5 sm:w-auto"
              >
                <IoMdShare className="h-4 w-4" />
                Share
              </button>
              <button
                type="button"
                onClick={onApply}
                className="w-full rounded-sm bg-secondary px-10 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-secondary/90 sm:w-auto"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OpportunityDetailHero;
