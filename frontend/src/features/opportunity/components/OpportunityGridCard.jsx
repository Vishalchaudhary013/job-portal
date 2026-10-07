import { Link, useNavigate } from "react-router-dom";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { LuMapPin } from "react-icons/lu";

// Grid-view card, laid out like the Featured Jobs card on the career-services
// page: title, then a type badge + salary line, then the company row. The
// save control is kept (top-right) since grid is a primary browsing view.
const OpportunityGridCard = ({
  item,
  basePath,
  typeLabel,
  isSaved,
  stipendLabel,
  locationText,
  companyInitial,
  onToggleSave,
}) => {
  const navigate = useNavigate();
  const detailPath = `${basePath}/${item.id}`;

  return (
    <article
      className="flex h-full cursor-pointer flex-col gap-4 rounded-sm border border-black/20 bg-white p-5 transition-colors hover:border-secondary/50"
      role="link"
      tabIndex={0}
      aria-label={`View details for ${item.title}`}
      onClick={() => navigate(detailPath)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(detailPath);
        }
      }}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <Link to={detailPath} className="text-[17px] font-bold leading-snug text-primary hover:text-secondary">
            {item.title}
          </Link>
          <button
            type="button"
            className="-mr-1 -mt-1 shrink-0 rounded-sm p-1.5 text-slate-400 transition-colors hover:text-secondary"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave(item.id);
            }}
            aria-label={isSaved ? "Remove from saved" : "Save"}
          >
            {isSaved ? (
              <BsBookmarkFill className="h-4 w-4 text-secondary" />
            ) : (
              <BsBookmark className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] text-primary">
          <span className="rounded-sm bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {typeLabel}
          </span>
          {/* Only a job pays a salary; the other types pay a stipend. Keyed off
              item.type, not typeLabel, since that is a display string. */}
          <span>
            {item.type === "Jobs" ? "Salary" : "Stipend"}: {stipendLabel}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-primary/10">
          {item.logo ? (
            <img src={item.logo} alt={item.company} className="h-full w-full object-contain" />
          ) : (
            <span className="text-[13px] font-bold text-primary">{companyInitial}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-primary">{item.company}</p>
          {locationText && (
            <p className="flex items-center gap-1 text-[12px] text-slate-500">
              <LuMapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{locationText}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

export default OpportunityGridCard;
