import { Link, useNavigate } from "react-router-dom";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { LuMapPin, LuShare2, LuUsers, LuCalendar, LuBriefcaseBusiness } from "react-icons/lu";

const OpportunityListCard = ({
  item,
  basePath,
  typeLabel,
  isSaved,
  stipendLabel,
  skillsList,
  experienceText,
  locationText,
  deadlineLabel,
  postedDateLabel,
  companyInitial,
  onShare,
  onToggleSave,
}) => {
  const navigate = useNavigate();
  const detailPath = `${basePath}/${item.id}`;
  const visibleTags = skillsList.slice(0, 4);
  const moreCount = Math.max(skillsList.length - visibleTags.length, 0);
  const applicantCount = Number(item.applicationCount || item.applicantsCount || 0);

  return (
    <article
      className="cursor-pointer rounded-sm border border-black/10 bg-white p-5 transition-colors hover:border-secondary/40"
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link to={detailPath} className="block truncate text-[19px] font-bold text-primary hover:text-secondary">
            {item.title}
          </Link>

          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <p className="truncate text-[14px] text-slate-500">{item.company || "Company"}</p>
            <span className="rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {item.jobType || item.internshipType || typeLabel}
            </span>
            {item.featuredListing && (
              <span className="rounded-sm border border-secondary/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
                Featured
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-500">
            <span className="font-semibold text-primary">{stipendLabel}</span>
            <span className="inline-flex items-center gap-1.5">
              <LuUsers className="h-3.5 w-3.5" />
              {applicantCount > 0 ? `${applicantCount} Applicants` : "Applications open"}
            </span>
            <span className="inline-flex items-center gap-1.5 truncate">
              <LuMapPin className="h-3.5 w-3.5" />
              {locationText}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LuBriefcaseBusiness className="h-3.5 w-3.5" />
              {experienceText}
            </span>
          </div>

          {visibleTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {visibleTags.map((tag) => (
                <span
                  key={`${item.id}-${tag}`}
                  className="rounded-sm border border-black/10 px-2.5 py-1 text-[12px] text-slate-600"
                >
                  {tag}
                </span>
              ))}
              {moreCount > 0 && (
                <span className="rounded-sm border border-black/10 px-2.5 py-1 text-[12px] text-slate-600">
                  +{moreCount}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-black/10 p-2">
          {item.logo ? (
            <img src={item.logo} alt={item.company} className="h-full w-full object-contain" />
          ) : (
            <span className="text-[20px] font-bold text-primary">{companyInitial}</span>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/10 pt-3">
        <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-500">
          <span>Posted {postedDateLabel}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <LuCalendar className="h-3.5 w-3.5" />
            {deadlineLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 text-primary">
          <button
            type="button"
            className="rounded-sm p-1.5 transition-colors hover:text-secondary"
            aria-label="Share"
            onClick={async (event) => {
              event.stopPropagation();
              await onShare(item);
            }}
          >
            <LuShare2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="rounded-sm p-1.5 transition-colors hover:text-secondary"
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
      </div>
    </article>
  );
};

export default OpportunityListCard;
