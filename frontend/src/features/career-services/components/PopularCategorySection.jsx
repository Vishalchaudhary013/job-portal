import { Link } from "react-router-dom";
import {
  // LuChevronLeft,
  LuChevronRight,
  LuUsers,
  LuShoppingBag,
  LuMegaphone,
  LuCode,
  LuPalette,
  LuWallet,
  LuHeadphones,
  LuUserCog,
} from "react-icons/lu";

// Category grid: all eight categories laid out in two rows of four (two
// columns on small screens). Cards stay flat — no shadow, rounded-sm like the
// rest of the site. The carousel (auto-advance + prev/next arrows) it replaced
// is kept commented out below in case we go back to a single scrolling row.
const CATEGORIES = [
  { icon: LuUsers, title: "Management" },
  { icon: LuShoppingBag, title: "Sales" },
  { icon: LuMegaphone, title: "Digital Marketing" },
  { icon: LuCode, title: "Programing" },
  { icon: LuPalette, title: "Design" },
  { icon: LuWallet, title: "Finance" },
  { icon: LuHeadphones, title: "Customer Service" },
  { icon: LuUserCog, title: "Human Resources" },
];

// const VISIBLE = 4;
// const AUTO_ADVANCE_MS = 30000;
// const MAX_INDEX = CATEGORIES.length - VISIBLE;

const PopularCategorySection = () => {
  // const [index, setIndex] = useState(0);

  // const goNext = () => setIndex((i) => (i >= MAX_INDEX ? 0 : i + 1));
  // const goPrev = () => setIndex((i) => (i <= 0 ? MAX_INDEX : i - 1));

  // useEffect(() => {
  //   const id = setInterval(goNext, AUTO_ADVANCE_MS);
  //   return () => clearInterval(id);
  // }, []);

  return (
    <section className="overflow-hidden bg-">
      <div className="mx-auto max-w-[1250px] px-4 py-14 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 className="text-[28px] font-extrabold  sm:text-[34px]">Popular category</h2>
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
          {CATEGORIES.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="flex w-[75%] shrink-0 snap-start items-center gap-3 border border-black/30 rounded-sm bg-white px-4 py-5 sm:w-auto"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-secondary/10 text-secondary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-primary">{title}</p>
                <p className="mt-0.5 text-[12px] text-slate-500">More than 312 open positions</p>
              </div>
            </div>
          ))}
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
    </section>
  );
};

export default PopularCategorySection;
