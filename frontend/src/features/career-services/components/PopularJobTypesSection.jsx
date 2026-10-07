import { Link } from "react-router-dom";
import {
  LuLaptop,
  LuBookOpen,
  LuGraduationCap,
  LuRocket,
  LuUserRound,
  LuClock,
  LuArrowUpRight,
} from "react-icons/lu";

// Shortcut tiles into the jobs listing for the searches people arrive with
// already in mind ("I finished 12th", "I need something part-time") rather than
// by field or city, which the category and city menus already cover.
//
// Every `to` is a real listing filter: the params are the ones
// backend/utils/opportunityFilterQuery.js maps (workMode, educationLevel,
// experience, jobType) and the values are the exact strings from
// features/opportunity/filterConfig.js — the backend matches them as anchored
// case-insensitive regexes, so an invented value would quietly return nothing.
const JOB_TYPES = [
  {
    icon: LuLaptop,
    title: "Work from home jobs",
    description: "Work remotely from home at your convenience",
    to: "/job?workMode=Remote",
  },
  {
    icon: LuBookOpen,
    title: "10th pass jobs",
    description: "Great jobs available for 10th pass candidates",
    to: "/job?educationLevel=10th",
  },
  {
    icon: LuGraduationCap,
    title: "12th pass jobs",
    description: "Exciting opportunities for 12th pass freshers",
    to: "/job?educationLevel=12th",
  },
  {
    icon: LuRocket,
    title: "Fresher jobs",
    description: "Start your career journey with fresher jobs",
    to: "/job?experience=Fresher",
  },
  {
    // There is no hiring-preference value for this, so it falls back to a
    // keyword search across title / description / role. Worth replacing with a
    // real filter value if one is ever added to the Hiring Preference list.
    icon: LuUserRound,
    title: "Jobs for women",
    description: "Exclusive job openings designed especially for women",
    to: "/job?keyword=Women",
  },
  {
    icon: LuClock,
    title: "Part-time jobs",
    description: "Flexible part-time jobs with good earning potential",
    to: "/job?jobType=Part-time",
  },
];

const PopularJobTypesSection = () => {
  return (
    <section>
      <div className="mx-auto max-w-[1250px] px-4 py-14 md:px-8">
        <h2 className="text-[28px] font-extrabold text-primary sm:text-[34px]">Popular job types</h2>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {JOB_TYPES.map(({ icon: Icon, title, description, to }) => (
            <div
              key={title}
              className="flex flex-col items-start rounded-sm border border-black/30 bg-white px-5 py-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-primary">{title}</h3>
              {/* The margin sits on the description, not the button, because the
                  button uses mt-auto to line up across a row when one card's
                  description wraps to a second line — and mt-auto would leave
                  no gap at all on whichever card is the tallest. */}
              <p className="mb-6 mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>
              <Link
                to={to}
                className="mt-auto inline-flex items-center gap-1.5 rounded-sm border border-primary px-6 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-secondary hover:text-white hover:border-secondary"
              >
                View
                <LuArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularJobTypesSection;
