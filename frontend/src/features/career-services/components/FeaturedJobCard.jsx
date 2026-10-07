import { Link } from "react-router-dom";
import { LuMapPin } from "react-icons/lu";
import { formatStipendText } from "../../internship/utils/internshipCardData";

const TYPE_BADGE = {
  Jobs: "Job",
  Internship: "Internship",
  Apprenticeships: "Apprenticeship",
  "Global Program": "Global Program",
};

const TYPE_PATH = {
  Jobs: "job",
  Internship: "internship",
  Apprenticeships: "apprenticeship",
  "Global Program": "global-program",
};

// Only a job pays a salary — an internship, apprenticeship or global program
// pays a stipend, so the label follows the type rather than saying "Salary"
// for all four.
const PAY_LABEL = {
  Jobs: "Salary",
  Internship: "Stipend",
  Apprenticeships: "Stipend",
  "Global Program": "Stipend",
};

const LOGO_TINTS = ["bg-secondary/15", "bg-primary/10", "bg-secondary/10", "bg-primary/15"];

const FeaturedJobCard = ({ item, tintIndex = 0 }) => (
  <Link
    to={`/${TYPE_PATH[item.type] ?? "job"}/${item.id}`}
    className="flex h-full flex-col gap-4 rounded-sm border border-black/30 p-5"
  >
    <div>
      <h3 className="text-[20px] font-bold leading-snug ">{item.title}</h3>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] ">
        <span className="rounded-sm bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {TYPE_BADGE[item.type] ?? "Job"}
        </span>
        <span>
          {PAY_LABEL[item.type] ?? "Salary"}: {formatStipendText(item)}
        </span>
      </div>
    </div>

    <div className="mt-auto flex items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md ${LOGO_TINTS[tintIndex % LOGO_TINTS.length]}`}
      >
        {item.logo ? (
          <img src={item.logo} alt={item.company} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[13px] font-bold ">
            {String(item.company || "E").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold ">{item.company}</p>
        {item.location && (
          <p className="flex items-center gap-1 text-[12px] ">
            <LuMapPin className="h-3 w-3 shrink-0" />
            {item.location}
          </p>
        )}
      </div>
    </div>
  </Link>
);

export default FeaturedJobCard;
