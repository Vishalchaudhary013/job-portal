import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  // LuChevronLeft,
  LuChevronRight,
  LuBriefcase,
  LuCar,
  LuChefHat,
  LuClipboardList,
  LuCode,
  LuCog,
  LuGraduationCap,
  LuHardHat,
  LuHeadphones,
  LuMegaphone,
  LuMessagesSquare,
  LuPackage,
  LuPalette,
  LuShoppingBag,
  LuSprayCan,
  LuStethoscope,
  LuTrendingUp,
  LuUsers,
  LuWarehouse,
  LuWorkflow,
  LuWrench,
} from "react-icons/lu";
import { getCustomCategories } from "../../../services/customCategoryAPI";
import { DEFAULT_JOB_CATEGORIES } from "../../job/utils/jobCategories";

// Category grid: the same job categories the navbar's "Jobs" dropdown lists,
// capped at twelve so the grid lands on three even rows of four. Cards stay
// flat — no shadow, rounded-sm like the rest of the site. The carousel
// (auto-advance + prev/next arrows) it replaced is kept commented out below in
// case we go back to a single scrolling row.
//
// Twelve of four, so a short list doesn't leave a ragged last row and a long
// one doesn't run down the page — the "View All" link covers the remainder.
const CATEGORY_LIMIT = 12;

// Icons are matched on keywords in the title rather than held in a parallel
// list, because the categories are admin-editable: a fixed list would lose its
// icon the first time someone renames an entry or adds one. First match wins,
// so the specific patterns sit above the general ones — "Technician" has to be
// tested before the /tech/ in the IT pattern, and "Retail / Counter Sales"
// before /sales/.
const CATEGORY_ICONS = [
  [/house\s*keep|cleaning|janitor/i, LuSprayCan],
  [/driver|automobile|cab\b/i, LuCar],
  [/delivery|courier/i, LuPackage],
  [/warehouse|logistic/i, LuWarehouse],
  [/technician|electric|plumb|repair/i, LuWrench],
  [/labour|labor|construction|mason|welder/i, LuHardHat],
  [/retail|counter|shop/i, LuShoppingBag],
  [/bpo|customer|call\s*cent|telecall/i, LuHeadphones],
  [/pharmac|clinic|nurs|medical|health|doctor/i, LuStethoscope],
  [/engineer/i, LuCog],
  [/marketing|advertis/i, LuMegaphone],
  [/sales|business\s*development/i, LuTrendingUp],
  [/human\s*resource|\bhr\b|recruit/i, LuUsers],
  [/\bit\b|software|develop|program|tech/i, LuCode],
  [/teach|tutor|faculty|education|trainer/i, LuGraduationCap],
  [/hospitality|cook|baker|chef|kitchen|hotel/i, LuChefHat],
  [/creative|content|design|media/i, LuPalette],
  [/counsell|counsel|advisor/i, LuMessagesSquare],
  [/procure|purchas|supply/i, LuClipboardList],
  [/operation|admin/i, LuWorkflow],
];

const iconFor = (title) =>
  CATEGORY_ICONS.find(([pattern]) => pattern.test(title))?.[1] ?? LuBriefcase;

// Same listing filter the navbar dropdown uses: `department` narrows
// departmentCategory (see backend/utils/opportunityFilterQuery.js).
const categoryPath = (title) => `/job?department=${encodeURIComponent(title)}`;

// const VISIBLE = 4;
// const AUTO_ADVANCE_MS = 30000;
// const MAX_INDEX = CATEGORIES.length - VISIBLE;

const PopularCategorySection = () => {
  // The server list is authoritative — it carries the built-ins plus whatever
  // admins have added — and the bundled constants are only what renders until
  // (or if) it arrives, so the grid is never empty and never blocks on the
  // request. Same arrangement as the navbar's Jobs dropdown.
  const [categories, setCategories] = useState(() =>
    DEFAULT_JOB_CATEGORIES.slice(0, CATEGORY_LIMIT),
  );

  useEffect(() => {
    getCustomCategories("Jobs")
      .then((response) => {
        const titles = (response.data?.categories || []).map((c) => c.title).filter(Boolean);
        if (titles.length) setCategories(titles.slice(0, CATEGORY_LIMIT));
      })
      // Leave the bundled categories on screen rather than emptying the grid.
      .catch(() => {});
  }, []);

  // const [index, setIndex] = useState(0);

  // const goNext = () => setIndex((i) => (i >= MAX_INDEX ? 0 : i + 1));
  // const goPrev = () => setIndex((i) => (i <= 0 ? MAX_INDEX : i - 1));

  // useEffect(() => {
  //   const id = setInterval(goNext, AUTO_ADVANCE_MS);
  //   return () => clearInterval(id);
  // }, []);

  return (
    <section className="overflow-hidden bg-">
     <div className="bg-[#E9F6FF]">
       <div className="mx-auto max-w-[1250px] px-4 py-14 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 className="text-[28px] font-extrabold  sm:text-[34px]">Hire from 50+ Job Categories</h2>
          <Link
            to="/job"
            className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide "
          >
            View All
            <LuChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Phones: one left-to-right swipe row that snaps card by card (75% wide so the next
            card peeks in), bleeding to the screen edge. sm and up: the 3 / 4-column grid. */}
        <div className="scrollbar-hide -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {categories.map((title) => {
            const Icon = iconFor(title);
            return (
              <Link
                key={title}
                to={categoryPath(title)}
                className="flex w-[75%] shrink-0 snap-start items-center gap-3 border border-black/30 rounded-sm bg-white px-4 py-5 transition-colors hover:border-secondary sm:w-auto"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-secondary/10 text-secondary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-primary">{title}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">More than 312 open positions</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Prev/next carousel controls — kept for reference now that the
            categories render as a static two-row grid.
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous categories"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white"
            >
              <LuChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next categories"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white"
            >
              <LuChevronRight className="h-5 w-5" />
            </button>
          </div>

          <Link
            to="/job"
            className="rounded-sm bg-secondary px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-secondary/90"
          >
            All Categories
          </Link>
        </div>
        */}
      </div>
     </div>
    </section>
  );
};

export default PopularCategorySection;
