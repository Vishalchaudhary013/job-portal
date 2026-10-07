import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuMapPin, LuChevronDown, LuSearch, LuBriefcase, LuUsers, LuBuilding2 } from "react-icons/lu";
import OpportunitySuggestField from "./OpportunitySuggestField";
import logo1 from "../../../assets/logos/logo1.png";
import logo2 from "../../../assets/logos/logo2.png";
import logo3 from "../../../assets/logos/logo3.png";
import logo4 from "../../../assets/logos/logo4.png";
import logo5 from "../../../assets/logos/logo5.png";
import logo6 from "../../../assets/logos/logo6.png";
import logo7 from "../../../assets/logos/logo7.png";
import logo8 from "../../../assets/logos/logo8.png";

// Landing hero for /career-services — a full-bleed photo under a dark scrim,
// centred headline + one-row search bar + stat row, and a dark band of company
// logos along the bottom. Recreated from a reference design in edeco's own
// palette: every action and icon chip uses `secondary` from globals.css. It sits
// under the existing career-services NavBar (white, fixed) rather than
// replacing it.

// `type` is the value the /api/internships search expects (and the same one
// each listing page passes as `opportunityType`), so the title suggestions
// are drawn from exactly the set the form is about to navigate to.
const CATEGORIES = [
  { value: "job", label: "Job", to: "/job", type: "Jobs" },
  { value: "internship", label: "Internship", to: "/internship", type: "Internship" },
  { value: "apprenticeship", label: "Apprenticeship", to: "/apprenticeship", type: "Apprenticeships" },
];

const STATS = [
  { icon: LuBriefcase, value: "208K+", label: "Live Jobs" },
  { icon: LuUsers, value: "5M+", label: "Candidates" },
  { icon: LuBuilding2, value: "12K+", label: "Companies" },
];

const LOGOS = [logo1, logo2, logo3, logo4, logo5, logo6, logo7, logo8];

// Served from /public, so referenced by URL rather than imported.
const HERO_PHOTO = "/hero_students.png";

const CareerServicesHero = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [location, setLocation] = useState("");

  const selectedCategory = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];

  const handleSearch = (e) => {
    e.preventDefault();
    const to = selectedCategory.to;
    const params = new URLSearchParams();
    // `keyword`, not `search` — that's the param the listing page reads back
    // out of the URL (useOpportunityQuery) and forwards to the API.
    if (query.trim()) params.set("keyword", query.trim());
    if (location.trim()) params.set("location", location.trim());
    const qs = params.toString();
    navigate(qs ? `${to}?${qs}` : to);
  };

  return (
    // Fills the first screen below the fixed NavBar (its height is published as
    // --nav-height), with a floor so short laptop screens don't crush it.
    <section className="relative isolate flex min-h-[600px] flex-col overflow-hidden bg-primary lg:min-h-[calc(100svh_-_var(--nav-height,72px))]">
      {/* Background photo + scrim. The scrim is navy (primary), not pure black,
          so the hero stays on-brand while keeping the white copy readable. */}
      <img
        src={HERO_PHOTO}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_35%]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-primary/75" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-transparent to-black/50"
      />

      {/* Copy + search + stats, centred in the space above the logo band */}
      <div className="mx-auto flex w-full max-w-[1250px] flex-1 flex-col items-center justify-center px-4 py-16 text-center md:px-6 md:py-20">
        <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[46px] md:text-[56px]">
          Find Your Dream <span className="text-secondary">Job</span> Today!
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/80 sm:text-[17px]">
          Connecting Talent with Opportunity: Your Gateway to Career Success
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-9 flex w-full max-w-4xl flex-col overflow-visible rounded-md bg-white text-left sm:flex-row"
        >
          <OpportunitySuggestField
            id="hero-job-title"
            label="Search Job Title"
            placeholder="For eg: Delivery Executive"
            field="title"
            value={query}
            onChange={setQuery}
            opportunityType={selectedCategory.type}
            className="px-6 py-4 sm:flex sm:py-5"
          />

          <OpportunitySuggestField
            id="hero-location"
            label="Search City"
            placeholder="For eg: Mumbai, Bangalore"
            field="location"
            value={location}
            onChange={setLocation}
            opportunityType={selectedCategory.type}
            className="border-t border-slate-200 px-6 py-4 sm:flex-1 sm:border-l sm:border-t-0 sm:py-5"
            // trailingIcon={<LuMapPin className="h-4 w-4 shrink-0 text-slate-400" />}
          />

          {/* <label className="relative flex min-w-0 flex-col justify-center border-t border-slate-200 px-6 py-5 sm:flex-1 sm:border-l sm:border-t-0 sm:py-7">
            <span className="sr-only">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none bg-transparent pr-6 text-[14px] font-semibold leading-[1.4] text-primary outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <LuChevronDown className="pointer-events-none absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label> */}

          <button
            type="submit"
            className="flex shrink-0 items-center justify-center gap-2 rounded-b-md bg-secondary px-10 py-5 text-[15px] font-semibold text-white transition-colors hover:bg-secondary/90 sm:rounded-none sm:rounded-r-md"
          >
            <LuSearch className="h-[18px] w-[18px]" />
            Search {selectedCategory.label}
          </button>
        </form>

        <ul className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-20">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <li key={stat.label} className="flex items-center gap-4 text-left">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-white sm:h-16 sm:w-16">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <span>
                  <span className="block text-[24px] font-extrabold leading-none text-white sm:text-[30px]">{stat.value}</span>
                  <span className="mt-1.5 block text-[14px] text-white/75 sm:text-[16px]">{stat.label}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Company logos on a dark band. The PNGs are full-colour, so they're
          flattened to white (brightness-0 invert) to read as one set here. */}
      {/* <div className="bg-black/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1250px] items-center justify-between gap-x-10 overflow-x-auto px-4 py-6 scrollbar-hide md:px-6">
          {LOGOS.map((logo, i) => (
            <img
              key={i}
              src={logo}
              alt=""
              className="h-7 w-auto shrink-0 object-contain opacity-80 brightness-0 invert sm:h-8"
            />
          ))}
        </div>
      </div> */}
    </section>
  );
};

export default CareerServicesHero;
