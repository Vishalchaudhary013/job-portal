import React, { useCallback, useEffect, useLayoutEffect, useState, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useOpportunities } from "../../context/OpportunitiesContext";
import { CiLocationOn, CiSearch } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import {
  IoHomeOutline,
  IoLanguageSharp,
  IoLocationSharp,
  IoPlayCircleSharp,
} from "react-icons/io5";
import { FaLocationArrow, FaWhatsapp } from "react-icons/fa6";
import { Home } from "lucide-react";
import { IoMdPlay } from "react-icons/io";
import {
  LuCompass,
  LuLayers,
  LuTrendingUp,
  LuCalculator,
  LuClipboardCheck,
  // LuPercent,
  LuScale,
} from "react-icons/lu";
import logo from "../../assets/logo.png";
import { getCustomCategories } from "../../services/customCategoryAPI";
import { DEFAULT_JOB_CATEGORIES, DEFAULT_JOB_CITIES } from "../../features/job/utils/jobCategories";

// Both dropdowns land on the jobs listing with one filter pre-applied. The query
// keys are the listing's own (see backend/utils/opportunityFilterQuery.js):
// `department` narrows departmentCategory, `location` matches location /
// cityState / headquarters case-insensitively.
const jobFilterPath = (param, value) => `/job?${param}=${encodeURIComponent(value)}`;

// The two mega dropdowns in the header. `type` is the opportunityType the list
// is stored under in the custom-categories collection, so adding an entry is an
// admin action rather than a code change.
// Both menus lay out in 3 columns, but `columns` and `width` are per-menu
// because the entries differ. Category names run long, so that panel is the
// wider of the two and drops to 2 columns on narrower screens; the longest few
// ("Pharmacy / Clinic / Nursing / Medical") wrap to a second line at any width
// the header can give them, so the panel is sized for the rest of the list
// rather than for those. City names are one short word and need less again.
// The viewport term in each width is clearance for the panel being centred on
// its own link, which sits off the header's centre.
const JOB_MENUS = {
  categories: {
    type: "Jobs",
    title: "Jobs by Category",
    subtitle: "Find opportunities in your field",
    param: "department",
    fallback: DEFAULT_JOB_CATEGORIES,
    columns: "grid-cols-2 lg:grid-cols-3",
    width: "w-[min(100vw_-_10rem,600px)]",
  },
  cities: {
    type: "Job Cities",
    title: "Jobs by City",
    subtitle: "Discover opportunities in your preferred location",
    param: "location",
    fallback: DEFAULT_JOB_CITIES,
    columns: "grid-cols-3",
    width: "w-[min(100vw_-_10rem,470px)]",
  },
};

// The scroll viewport (max-h-[136px]) is cut to three rows of the 3-column
// grid, so the panel opens showing ~8-9 entries and the rest are reached by
// scrolling rather than making the panel as tall as the page behind it. The
// height leaves the next row part-visible at the cut on purpose — that sliver
// is what tells a reader there is more below.

// Both lists are flat and long enough to need scrolling, and neither the
// built-in constants nor the admin-added entries arrive in any order, so they
// are sorted for display — a reader scanning for one city or field has no other
// way in. Sorted here rather than at fetch time so the fallbacks get it too.
const sortMenuItems = (items) =>
  [...(items || [])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

// Degree tools shown in the "Tools" dropdown on the /degrees navbar.
const DEGREE_TOOLS = [
  { label: "Career Finder", to: "/career-finder", icon: LuCompass },
  { label: "My Education Stack", to: "/my-education-stack", icon: LuLayers },
  { label: "Career ROI Calculator", to: "/career-roi-calculator", icon: LuTrendingUp },
  { label: "Fees & EMI Calculator", to: "/fees-emi-calculator", icon: LuCalculator },
  // { label: "SGPA to Percentage", to: "/sgpa-to-percentage", icon: LuPercent },
  { label: "Am I Eligible?", to: "/am-i-eligible", icon: LuClipboardCheck },
  { label: "Compare Programs", to: "/compare", icon: LuScale },
];

const NavBar = () => {
  const [showExplore, setShowExplore] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Which mobile accordion is expanded, by opportunityType (null = none).
  const [openMobileJobMenu, setOpenMobileJobMenu] = useState(null);
  const [exploreLeftOffset, setExploreLeftOffset] = useState(0);
  const [activeLang, setActiveLang] = useState(() => {
    const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
    return match ? match[1] : "en";
  });
  const exploreButtonRef = useRef(null);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Entries for the two job dropdowns, keyed by opportunityType. The server list
  // is authoritative — it carries the built-ins plus whatever admins have added
  // — and the bundled constants are only what render until (or if) it arrives.
  const [jobMenuItems, setJobMenuItems] = useState(() =>
    Object.fromEntries(Object.values(JOB_MENUS).map((menu) => [menu.type, menu.fallback])),
  );
  const jobMenuFetchedAt = useRef({});

  // Refetched when a dropdown is opened, not just on mount, so an entry an admin
  // creates mid-session shows up without a reload. The 60s guard keeps repeated
  // hovers from firing a request each time.
  const loadJobMenu = useCallback((opportunityType) => {
    if (Date.now() - (jobMenuFetchedAt.current[opportunityType] || 0) < 60000) return;
    jobMenuFetchedAt.current[opportunityType] = Date.now();
    getCustomCategories(opportunityType)
      .then((response) => {
        const fetched = (response.data?.categories || []).map((c) => c.title).filter(Boolean);
        if (fetched.length) setJobMenuItems((prev) => ({ ...prev, [opportunityType]: fetched }));
      })
      .catch(() => {
        // Keep whatever is on screen and allow an immediate retry on next open.
        jobMenuFetchedAt.current[opportunityType] = 0;
      });
  }, []);

  useEffect(() => {
    Object.values(JOB_MENUS).forEach((menu) => loadJobMenu(menu.type));
  }, [loadJobMenu]);

  useEffect(() => {
    const updateOffset = () => {
      if (exploreButtonRef.current) {
        const rect = exploreButtonRef.current.getBoundingClientRect();
        setExploreLeftOffset(rect.left);
      }
    };

    if (showExplore) {
      updateOffset();
      window.addEventListener("resize", updateOffset);
    }

    return () => {
      window.removeEventListener("resize", updateOffset);
    };
  }, [showExplore]);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      setHeaderHeight(el.offsetHeight);
      document.documentElement.style.setProperty("--nav-height", `${el.offsetHeight}px`);
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => observer.disconnect();
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isImpersonating } = useOpportunities();

  const isAdmin = ["admin", "super_admin"].includes(user?.role);
  
  const dashboardPath =
    user?.role === "super_admin" && !isImpersonating
      ? "/super-admin-dashboard"
      : "/admin-dashboard";

  // The #google_translate_element host div + script bootstrap live in App.jsx so
  // they survive NavBar switching between its route-specific layouts. Google
  // Translate leaks a stray "Select Language" gadget if its host unmounts
  // mid-init (happened when navigating from the default nav into /degrees).

  const changeLanguage = (langCode) => {
    setActiveLang(langCode);
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = langCode;
     
      if (langCode === "en" && select.value !== "en") {
        select.value = "en";
      }
     
      select.dispatchEvent(new Event("change"));
    } else {
 
      if (langCode === "en") {
        document.cookie =
          "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" +
          window.location.hostname +
          "; path=/;";
      } else {
        document.cookie = `googtrans=/en/${langCode}; path=/;`;
        document.cookie = `googtrans=/en/${langCode}; domain=${window.location.hostname}; path=/;`;
      }
      window.location.reload();
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const resolveUserInitial = (user) => {
    const emailInitial = String(user?.email || "")
      .trim()
      .charAt(0);
    if (emailInitial) return emailInitial.toUpperCase();
    const nameInitial = String(user?.fullName || user?.name || "")
      .trim()
      .charAt(0);
    return nameInitial ? nameInitial.toUpperCase() : "U";
  };

  const userInitial = resolveUserInitial(user);

  // University profiles (/university/:id, its trust-score page, /university-profile/:name) are
  // reached from degree listings, so they keep the degree header too.
  const isDegreeRoute =
    location.pathname.startsWith("/degree") ||
    location.pathname.startsWith("/university/") ||
    location.pathname.startsWith("/university-profile/") ||
    ["/masters-degrees", "/integrated-degrees", "/post-graduate-programs", "/certificate-programs"].includes(
      location.pathname,
    );
  const isMasterClassRoute = location.pathname.startsWith("/master-class") || location.pathname.startsWith("/masterclass-program");
  // The job / internship / apprenticeship pages are part of the
  // career-services flow, so they carry that landing header too — both the
  // listing routes (`/job`) and the detail routes (`/job/:id`).
  const isOpportunityRoute =
    /^\/(?:jobs?|internships?|interships?|apprenticeships?)(?:\/[^/]+)?\/?$/.test(
      location.pathname,
    );
  // Portal: "/" is the career-services landing page, so it gets this header too.
  const isCareerServicesRoute =
    location.pathname === "/" ||
    location.pathname.startsWith("/career-services") || isOpportunityRoute;

  // Landing-page navbar for /career-services: career links on the left,
  // logo true-centered (absolute, independent of left/right content width),
  // auth actions on the right.
  // The default navbar is disabled, so every non-degree / non-master-class
  // route (not just isCareerServicesRoute) uses this one.
  // if (isCareerServicesRoute) {
  if (isCareerServicesRoute || (!isDegreeRoute && !isMasterClassRoute)) {
    // The centre of the header now carries just the two job entry points.
    // The previous set (Internship / Apprenticeship / Job / Career Fair) is kept
    // commented out below — Career Fair lives in its own deployment, so it was
    // flagged `external` and rendered as a plain <a>: a router <NavLink> would
    // treat the absolute URL as an in-app path and route to a 404.
    const CAREER_LINKS = [
      // `menu` attaches one of the JOB_MENUS mega dropdowns to the link.
      { label: "Jobs", to: "/jobs", menu: JOB_MENUS.categories },
      { label: "Jobs by City", to: "/jobs-by-city", menu: JOB_MENUS.cities },
      // { label: "Internship", to: "/internship" },
      // { label: "Apprenticeship", to: "/apprenticeship" },
      // { label: "Job", to: "/job" },
      // {
      //   label: "Career Fair",
      //   to: "https://career-fair-7agh2tz55-vishal-chaudharys-projects-57aced94.vercel.app/",
      //   external: true,
      // },
    ];

    return (
      <>
        <header ref={headerRef} className="top-0 fixed left-0 w-full z-50 bg-white ">
          <div className="relative w-full max-w-[1250px] px-4 md:px-6 mx-auto flex items-center justify-between py-1">
            {/* LEFT: logo */}
            
            <Link to="/" className="shrink-0 overflow-hidden">
              <img src={logo} alt="edeco logo" className="h-[52px] object-cover" />
            </Link> 
            {/* <div className="shrink-0 overflow-hidden">
              <img src={logo} alt="edeco logo" className="h-[52px] object-cover" />
            </div> */}

            {/* CENTER: career links, true-centered on the header. The nav is
                absolutely positioned, so it must not sit inside a flex wrapper
                that also holds visible siblings — they would land on top of
                the centred links. */}
            <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-10 md:flex">
              {CAREER_LINKS.map((link) =>
                link.external ? (
                  <a
                    key={link.to}
                    href={link.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap text-[15px] font-medium text-gray-700 transition-colors hover:text-red-600"
                  >
                    {link.label}
                  </a>
                ) : link.menu ? (
                  <div
                    key={link.to}
                    className="group relative"
                    onMouseEnter={() => loadJobMenu(link.menu.type)}
                  >
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-1 whitespace-nowrap text-[15px] font-medium transition-colors ${isActive ? "text-red-600" : "text-gray-700 hover:text-red-600"}`
                      }
                    >
                      {link.label}
                      <MdKeyboardArrowDown
                        size={18}
                        className="transition-transform duration-200 group-hover:-rotate-180"
                      />
                    </NavLink>

                    {/* The pt-3 is a hover bridge: it keeps the gap between the
                        link and the panel hoverable, so the panel doesn't close
                        while the pointer travels down into it. */}
                    <div
                      className={`invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 ${link.menu.width}`}
                    >
                      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-[0_20px_45px_-12px_rgba(31,40,83,0.28)]">
                        <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                          <h3 className="text-[17px] font-extrabold leading-tight text-[#1F2853]">
                            {link.menu.title}
                          </h3>
                          <p className="mt-0.5 text-[13px] text-gray-500">{link.menu.subtitle}</p>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto px-3 py-3">
                          <ul className={`grid gap-x-2 gap-y-0.5 ${link.menu.columns}`}>
                            {sortMenuItems(jobMenuItems[link.menu.type]).map((item) => (
                              <li key={item}>
                                <Link
                                  to={jobFilterPath(link.menu.param, item)}
                                  className="block rounded-lg px-3 py-2 text-[13.5px] leading-snug text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Link
                          to={link.to}
                          className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-6 py-3 text-[13px] font-semibold text-[#1F2853] transition-colors hover:text-red-600"
                        >
                          View all {link.label.toLowerCase()}
                          <span aria-hidden="true">&rarr;</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `whitespace-nowrap text-[15px] font-medium transition-colors ${isActive ? "text-red-600" : "text-gray-700 hover:text-red-600"}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ),
              )}
            </nav>

            {/* RIGHT: auth actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative group">
                  <button className="h-9 w-9 rounded-full bg-red-600 text-white text-2xl font-semibold flex items-center justify-center shadow-sm hover:ring-2 hover:ring-blue-100 transition-all">
                    {userInitial}
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100 py-2">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.fullName || user.email}
                      </p>
                    </div>
                    {isAdmin ? (
                      <Link
                        to={dashboardPath}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                      >
                        <i className="bi bi-grid-1x2"></i> Admin Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/student/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                        >
                          <i className="bi bi-person"></i> Profile
                        </Link>
                        <Link
                          to="/favorites"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                        >
                          <i className="bi bi-heart"></i> Favorites
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-50"
                    >
                      <i className="bi bi-box-arrow-right"></i> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[14px] sm:text-[15px] whitespace-nowrap font-semibold text-gray-700 hover:text-red-600"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/choose-signup"
                    className="text-white px-3 sm:px-4 py-1.5 rounded-full text-[14px] sm:text-[15px] whitespace-nowrap font-semibold bg-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Sign up
                  </Link>
                </>
              )}

              {/* Mobile menu trigger — lives in the right group so the bar reads
                  logo | account + menu instead of floating in the middle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 md:hidden"
              >
                <span className="relative flex h-4 w-4 flex-col items-center justify-center">
                  <span className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-200 ${mobileMenuOpen ? "rotate-45" : "-translate-y-[5px]"}`} />
                  <span className={`absolute h-[1.5px] w-4 bg-current transition-opacity duration-200 ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`} />
                  <span className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-200 ${mobileMenuOpen ? "-rotate-45" : "translate-y-[5px]"}`} />
                </span>
              </button>
            </div>
          </div>

          {/* Mobile drawer for career links */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 max-h-[calc(100vh-var(--nav-height,72px))] overflow-y-auto w-full bg-white shadow-xl border-t border-gray-100 flex flex-col px-6 py-4 gap-1 z-40">
              {CAREER_LINKS.map((link) =>
                link.external ? (
                  <a
                    key={link.to}
                    href={link.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 font-medium py-2 border-b border-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : link.menu ? (
                  // There is no hover on touch, so the list is an accordion
                  // under the link instead of a dropdown.
                  <div key={link.to} className="border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <Link
                        to={link.to}
                        className="flex-1 text-gray-800 font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                      <button
                        type="button"
                        aria-label={`${openMobileJobMenu === link.menu.type ? "Hide" : "Show"} ${link.menu.title}`}
                        aria-expanded={openMobileJobMenu === link.menu.type}
                        onClick={() => {
                          loadJobMenu(link.menu.type);
                          setOpenMobileJobMenu((open) => (open === link.menu.type ? null : link.menu.type));
                        }}
                        className="p-2 text-gray-500"
                      >
                        <MdKeyboardArrowDown
                          size={20}
                          className={`transition-transform duration-200 ${openMobileJobMenu === link.menu.type ? "-rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {openMobileJobMenu === link.menu.type && (
                      <div className="mb-3 rounded-xl bg-gray-50 px-3 py-3">
                        <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          {link.menu.title}
                        </p>
                        <ul className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                          {sortMenuItems(jobMenuItems[link.menu.type]).map((item) => (
                            <li key={item}>
                              <Link
                                to={jobFilterPath(link.menu.param, item)}
                                className="block rounded-lg px-2 py-1.5 text-[13px] leading-snug text-gray-600 active:bg-red-50 active:text-red-600"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-gray-800 font-medium py-2 border-b border-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          )}
        </header>
        <div style={{ height: headerHeight }} aria-hidden="true"></div>
      </>
    );
  }

  if (isMasterClassRoute) {
    return (
      <>
        <header ref={headerRef} className="top-0 fixed left-0 w-full z-50 bg-white   ">
          <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto flex items-center justify-between">
            {/* LEFT SECTION */}
            <Link to='/' className="overflow-hidden">
              <img src={logo} alt="edeco logo" className="object-cover h-[65px]"/>
            </Link>

            {/* MIDDLE SECTION
            <div className="hidden lg:flex items-center gap-8">
             
              <Link to="/master-classes/videos" className="text-[16px] font-medium text-gray-700 hover:text-red-600 transition-colors">
                Watch Videos
              </Link>
            </div> */}

            <div className="flex gap-4 items-center">
               <Link to="/master-classes/categories" className="text-[16px] font-medium text-gray-700 hover:text-red-600 transition-colors mr-2">
                Categories
              </Link>

              {user ? (
                <div className="relative group">
                  <button className="h-9 w-9 rounded-full bg-red-600 text-white text-2xl font-semibold flex items-center justify-center shadow-sm hover:ring-2 hover:ring-blue-100 transition-all">
                    {userInitial}
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100 py-2">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.fullName || user.email}
                      </p>
                    </div>
                    {isAdmin ? (
                      <Link
                        to={dashboardPath}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                      >
                        <i className="bi bi-grid-1x2"></i> Admin Dashboard
                      </Link>
                    ) : user?.role === "mentor" ? (
                      <Link
                        to="/mentor-dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                      >
                        <i className="bi bi-grid-1x2"></i> Mentor Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/student/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                        >
                          <i className="bi bi-person"></i> Profile
                        </Link>
                        <Link
                          to="/favorites"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                        >
                          <i className="bi bi-heart"></i> Favorites
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-50"
                    >
                      <i className="bi bi-box-arrow-right"></i> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-blue-700  px-4 py-2 rounded-lg text-[15px] font-semibold border border-blue-700   ml-2"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/mentor-signup"
                    className="text-blue-700  px-4 py-2 rounded-lg text-[15px] font-semibold border border-blue-700   ml-2"
                  >
                    Apply as Mentor
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <div style={{ height: headerHeight }} aria-hidden="true"></div>
      </>
    );
  }

  if (isDegreeRoute) {
    return (
      <>
        <header ref={headerRef} className="top-0 fixed left-0 w-full z-50 bg-white  ">
          <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto flex items-center justify-between">
            {/* LEFT SECTION */}

            <Link to='/' className="overflow-hidden ">
              <img src={logo} alt="" className="object-cover h-[60px] w-[px]"/>            
            </Link>
            {/* <div
              className="flex items-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="font-display font-extrabold tracking-tight leading-none text-[#1F2853] flex items-center">
                <img src={logo} alt="" className="h-15 rounded-full" />
               
              </div>
            </div> */}

           
            <div className="hidden lg:flex items-center gap-8">
              <Link to="/degree/online" className="text-[16px] font-medium text-gray-700 hover:text-red-600 transition-colors">
                Online Degree's
              </Link>
              <Link to="/degree/master" className="text-[16px] font-medium text-gray-700 hover:text-red-600 transition-colors">
                Master Degree's
              </Link>
              <Link to="/degree/bachelor" className="text-[16px] font-medium text-gray-700 hover:text-red-600 transition-colors">
                Bachelor Degree's
              </Link>

              <div className="relative group cursor-pointer">
                <span className="text-[16px] font-medium text-gray-700 group-hover:text-red-600 transition-colors flex items-center gap-1">
                  Tools <MdKeyboardArrowDown size={20} />
                </span>
                <div className="absolute top-full left-0 pt-3 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white shadow-xl rounded-lg border border-gray-100 py-2">
                    <p className="px-4 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Degree tools
                    </p>
                    {DEGREE_TOOLS.map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <Link
                          key={tool.to}
                          to={tool.to}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                        >
                          <ToolIcon className="h-4 w-4 shrink-0 text-[#1F2853]" />
                          {tool.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
               {/* <Link to="/degree/hybrid" className="text-[16px] font-medium text-gray-700 hover:text-red-600 transition-colors">
                Hybrid Degree
           
               <Link to="/degree/integrated" className="text-[16px] font-medium text-gray-700 hover:text-red-600 transition-colors">
                Industry Integrated Degree's
              </Link>
              {/* <div className="relative group cursor-pointer">
                <span className="text-[16px] font-medium text-gray-700 hover:text-red-600 transition-colors flex items-center gap-1">More
                  <MdKeyboardArrowDown size={20} />
                </span>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-xl rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/degrees?type=diploma" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Diploma Programs</Link>
                  <Link to="/degrees?type=certification" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Certifications</Link>
                </div>
              </div> */}
            </div>

          
            <div className="flex gap-4 items-center">
              {user ? (
                <div className="relative group">
                  <button className="h-9 w-9 rounded-full bg-red-600 text-white text-2xl font-semibold flex items-center justify-center shadow-sm hover:ring-2 hover:ring-blue-100 transition-all">
                    {userInitial}
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100 py-2">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.fullName || user.email}
                      </p>
                    </div>
                    {isAdmin ? (
                      <Link
                        to={dashboardPath}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                      >
                        <i className="bi bi-grid-1x2"></i> Admin Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/student/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                        >
                          <i className="bi bi-person"></i> Profile
                        </Link>
                        <Link
                          to="/favorites"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
                        >
                          <i className="bi bi-heart"></i> Favorites
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-50"
                    >
                      <i className="bi bi-box-arrow-right"></i> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[16px] font-semibold hover:underline text-gray-700"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/choose-signup"
                    className="text-white px-4 py-1 rounded-4xl text-[17px] font-semibold bg-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <div style={{ height: headerHeight }} aria-hidden="true"></div>
      </>
    );
  }

  // Default (Career Services / Degree Programs / Master Classes / Tools) navbar
  // disabled — those routes now fall back to the career-services navbar above.
  //   return (
  //     <>
  //       <header ref={headerRef} className="top-0 fixed left-0 w-full z-50 bg-white">
  //         {showExplore && (
  //           <div className="fixed left-0 right-0 bottom-0 z-40 bg-black/40 pointer-events-none" style={{ top: headerHeight }}></div>
  //         )}
  // 
  //         <div className="border-b border-gray-50 py-1">
  //           <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto ">
  //             {/* Below sm this row can't fit every pill at once, so the Events/
  //                 Locations/Whatsapp/Language cluster scrolls horizontally
  //                 (scrollbar-hide) instead of wrapping or clipping — the same
  //                 pattern the Hero search tabs use. The avatar/auth item stays
  //                 in its own, non-scrolling list: overflow-x-auto forces
  //                 overflow-y to clip too (CSS spec quirk), which was cutting off
  //                 the account dropdown when everything shared one scroller. */}
  //             <div className="flex justify-between items-center gap-2 text-[15px]">
  //               <ul className="hidden sm:block shrink-0">
  //                 <li>
  //                   {/* <Link to="/" className="text-[14px] font-semibold">
  //                     Home
  //                   </Link> */}
  //                 </li>
  //               </ul>
  //               <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 sm:gap-5">
  //               <ul className="flex min-w-0 items-center gap-2.5 sm:gap-5 overflow-x-auto scrollbar-hide flex-nowrap">
  //                 <li className="shrink-0">
  //                   <a
  //                 href="https://event-lfawf6ih5-vishal-chaudharys-projects-57aced94.vercel.app/"
  //                 className="text-[14px] sm:text-[16px] whitespace-nowrap cursor-pointer text-gray-700"
  //               >
  //                 Events
  //               </a>
  // 
  // 
  //                 </li>
  //                 <li className="group relative shrink-0 overflow-hidden rounded-lg p-[1.5px]">
  //                   {/* Rotating border */}
  //                   <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
  //                     <div className="absolute inset-[-150%] bg-red-600 group-hover:animate-spin"></div>
  //                   </div>
  // 
  //                   {/* Content */}
  //                   <button
  //                     onClick={() => navigate("/locate-us")}
  //                     className="relative z-10 bg-white shadow-sm rounded-lg py-1.5 px-2.5 sm:px-3 flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors outline-none whitespace-nowrap"
  //                   >
  //                     <IoLocationSharp size={16} />
  //                     <span className="pr-1 text-[13px] font-medium text-gray-800">
  //                       Our Locations
  //                     </span>
  //                   </button>
  //                 </li>
  // 
  //                 <li className="shrink-0">
  //                   <a
  //                     href="https://wa.me/+918219263983?text=Hello!%20I%20am%20exploring%20the%20edeco%20platform%20and%20I%20have%20a%20query."
  //                     target="_blank"
  //                     rel="noopener noreferrer"
  //                     className="flex items-center text-[13px] whitespace-nowrap text-green-800 gap-1.5 font-medium border border-green-400 rounded-lg px-2.5 sm:px-3 py-1 bg-green-200 hover:bg-green-300 transition-colors shadow-sm cursor-pointer"
  //                   >
  //                     <FaWhatsapp size={16} /> <span className="hidden sm:inline">Whatsapp</span>
  //                   </a>
  //                 </li>
  // 
  //                 <li className="flex shrink-0 items-center rounded-full bg-primary p-0.5 gap-0.5 shadow-sm">
  //                   <button
  //                     onClick={() => changeLanguage("en")}
  //                     className={`text-[12px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
  //                       activeLang === "en"
  //                         ? "bg-secondary text-white"
  //                         : "text-white/70 hover:text-white"
  //                     }`}
  //                   >
  //                     EN
  // 
  //                   </button>
  //                   <button
  //                     onClick={() => changeLanguage("hi")}
  //                     className={`px-2 py-0.5  rounded-full text-[12px] font-semibold transition-colors ${
  //                       activeLang === "hi"
  //                         ? "bg-secondary text-white"
  //                         : "text-white/70 hover:text-white"
  //                     }`}
  //                   >
  //                    हिं
  //                   </button>
  //                 </li>
  //               </ul>
  // 
  //               {/* Outside the scroller above so its dropdown/menu isn't clipped. */}
  //               <ul className="flex shrink-0 items-center">
  //                 <li className="flex shrink-0 gap-4 items-center">
  //                   {user ? (
  //                     <div className="relative group">
  //                       <button className="h-8 w-8 rounded-full bg-red-600 text-white text-xl font-semibold flex items-center justify-center shadow-sm hover:ring-2 hover:ring-blue-100 transition-all">
  //                         {userInitial}
  //                       </button>
  //                       <div className="absolute right-0 mt-2 w-56 bg-white shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100 py-2">
  //                         <div className="px-4 py-2 border-b border-gray-50 mb-1">
  //                           <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
  //                             Signed in as
  //                           </p>
  //                           <p className="text-sm font-bold text-gray-900 truncate">
  //                             {user.fullName || user.email}
  //                           </p>
  //                         </div>
  //                         {isAdmin ? (
  //                           <Link
  //                             to={dashboardPath}
  //                             className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
  //                           >
  //                             <i className="bi bi-grid-1x2"></i> Admin Dashboard
  //                           </Link>
  //                         ) : user?.role === "mentor" ? (
  //                           <Link
  //                             to="/mentor-dashboard"
  //                             className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
  //                           >
  //                             <i className="bi bi-grid-1x2"></i> Mentor Dashboard
  //                           </Link>
  //                         ) : (
  //                           <>
  //                             <Link
  //                               to="/student/dashboard"
  //                               className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
  //                             >
  //                               <i className="bi bi-person"></i> Profile
  //                             </Link>
  //                             <Link
  //                               to="/favorites"
  //                               className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-red-600 transition-colors"
  //                             >
  //                               <i className="bi bi-heart"></i> Favorites
  //                             </Link>
  //                           </>
  //                         )}
  //                         <button
  //                           onClick={handleLogout}
  //                           className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-50"
  //                         >
  //                           <i className="bi bi-box-arrow-right"></i> Sign Out
  //                         </button>
  //                       </div>
  //                     </div>
  //                   ) : (
  //                     <>
  //                       <Link
  //                         to="/login"
  //                         className="text-[14px] sm:text-[16px] whitespace-nowrap font-semibold hover:underline"
  //                       >
  //                         Log In
  //                       </Link>
  //                       <Link
  //                         to="/choose-signup"
  //                         className=" text-white px-3 sm:px-4 py-1 rounded-4xl text-[14px] sm:text-[17px] whitespace-nowrap font-semibold bg-red-600  transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
  //                       >
  //                         Sign up
  //                       </Link>
  //                     </>
  //                   )}
  //                 </li>
  //               </ul>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  // 
  //         <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto ">
  //           <div className="flex items-center justify-between h-[60px]">
  //             {/* LEFT SECTION */}
  //             <div className="flex items-center ">
  //               {/* LOGO */}
  //               {/* <div
  //                 className="flex items-center cursor-pointer"
  //                 onClick={() => {
  //                   if (window.location.pathname === "/") {
  // 
  //                   } else {
  //                     navigate("/");
  //                   }
  //                 }}
  //               >
  //                 <div className="font-display font-extrabold  tracking-tight leading-none transition-colors duration-300 text-[#1F2853] flex items-center">
  //                    <img src={logo} alt="edeco logo" className="h-15  rounded-full" />
  //                   <span className="text-3xl">edeco</span>
  //                 </div>
  //               </div> */}
  // 
  //               <Link to='/' className="w-24 sm:w-27 h-">
  //                <img src={logo} alt="" className=""/>
  //               </Link>
  // 
  //               {/*  EXPLORE DROPDOWN  */}
  //             </div>
  // 
  //             <div className="hidden lg:flex items-center mt-0.5">
  //               <div
  //                 className="group"
  //                 ref={exploreButtonRef}
  //                 // onMouseEnter={() => setShowExplore(true)}
  //                 // onMouseLeave={() => setShowExplore(false)}
  //               >
  //                 {/* EXPLORE BUTTON */}
  //                 <NavLink
  //                   to="/career-services"
  //                   className={({ isActive }) =>
  //                     `flex items-center gap-1 text-[16px] border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer hover:text-red-600 hover:bg-blue-50 ${isActive ? "text-red-600 bg-blue-50" : "text-gray-700"}`
  //                   }
  //                 >
  //                   Career Services
  //                 </NavLink>
  // 
  //                 {/* MEGA DROPDOWN */}
  //                 
  //                   {/* {showExplore && (
  //                     <div className="absolute left-0 top-full w-full bg-white shadow-xl border-t border-gray-100 z-50">
  //                       {/* HOVER BRIDGE (IMPORTANT – invisible) 
  //                       <div className="absolute -top-[20px] left-0 w-full h-[20px]"></div>
  // 
  //                       <div
  //                         className="w-full flex flex-col"
  //                         style={{ paddingLeft: `${exploreLeftOffset}px` }}
  //                       >
  //                         <div className="w-[880px]">
  //                           <div className="grid grid-cols-5 gap-5 p-7">
  //                             {/* COLUMN 1
  //                             <div>
  //                               <h4 className="font-semibold text-[14px] mb-3 text-gray-900">
  //                                 Internships
  //                               </h4>
  //                               <ul className="space-y-2 text-[13px] text-gray-600">
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Summer Internships
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Remote Internships
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Global Internships
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Paid Internships
  //                                 </li>
  //                               </ul>
  //                             </div>
  // 
  //                             {/* COLUMN 2 
  //                             <div>
  //                               <h4 className="font-semibold text-[14px] mb-3 text-gray-900">
  //                                 Apprenticeships
  //                               </h4>
  //                               <ul className="space-y-2 text-[13px] text-gray-600">
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Tech Apprenticeships
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Management Apprenticeships
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Finance Apprenticeships
  //                                 </li>
  //                               </ul>
  //                             </div>
  // 
  //                             {/* COLUMN 3 
  //                             <div>
  //                               <h4 className="font-semibold text-[14px] mb-3 text-gray-900">
  //                                 Jobs
  //                               </h4>
  //                               <ul className="space-y-2 text-[13px] text-gray-600">
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Full-time Roles
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Part-time Roles
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Fresher Jobs
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Remote Jobs
  //                                 </li>
  //                               </ul>
  //                             </div>
  // 
  //                             {/* COLUMN 4 
  //                             <div>
  //                               <h4 className="font-semibold text-[14px] mb-3 text-gray-900">
  //                                 Bootcamps
  //                               </h4>
  //                               <ul className="space-y-2 text-[13px] text-gray-600">
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Coding Bootcamps
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Data Science Bootcamps
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Design Bootcamps
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Marketing Bootcamps
  //                                 </li>
  //                               </ul>
  //                             </div>
  // 
  //                             {/* COLUMN 5 
  //                             <div>
  //                               <h4 className="font-semibold text-[14px] mb-3 text-gray-900">
  //                                 PG Programs
  //                               </h4>
  //                               <ul className="space-y-2 text-[13px] text-gray-600">
  //                                 <li className="hover:underline cursor-pointer">
  //                                   PG Diplomas
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Executive Programs
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Hybrid Programs
  //                                 </li>
  //                                 <li className="hover:underline cursor-pointer">
  //                                   Online Masters
  //                                 </li>
  //                               </ul>
  //                             </div>
  //                           </div>
  //                           {/* BOTTOM STRIP 
  //                           <div className="border-t border-gray-100 px-8 py-4 text-sm text-gray-600 bg-gray-50/50 w-[880px]">
  //                             Not sure where to begin?
  //                             <span className="text-red-600 ml-2 hover:underline cursor-pointer">
  //                               Browse all programs →
  //                             </span>
  //                           </div>
  //                         </div>
  //                       </div>
  //                     </div>
  //                   )} */}
  //                 
  //               </div>
  // 
  //               {/* DEGREES */}
  //               <NavLink
  //                 to="/degrees"
  //                 className={({ isActive }) =>
  //                   `text-[16px] border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer hover:bg-blue-50 hover:text-red-600 ${isActive ? "text-red-600 bg-blue-50" : "text-gray-700"}`
  //                 }
  //               >
  //                 Degree Programs
  //               </NavLink>
  // 
  //                <NavLink
  //                 to="/master-classes"
  //                 className={({ isActive }) =>
  //                   `text-[16px] border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer hover:bg-blue-50 hover:text-red-600 ${isActive ? "text-red-600 bg-blue-50" : "text-gray-700"}`
  //                 }
  //               >
  //                   Master Classes
  //               </NavLink>
  //               {/* <NavLink
  //                   to="/events"
  //                   className={({ isActive }) =>
  //                     `text-sm border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer
  //      hover:bg-blue-50 hover:text-red-600
  //      ${isActive ? "text-red-600 bg-blue-50" : "text-gray-700"}`
  //                   }
  //                 >
  //                   Events
  //                 </NavLink> */}
  // 
  //              
  // 
  //               <a
  //                 href="https://frontend-c9kuk4dfn-vishal-chaudharys-projects-57aced94.vercel.app/"
  //                 className="text-[16px] border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer hover:bg-blue-50 hover:text-red-600 text-gray-700"
  //               >
  //                 After K12
  //               </a>
  //               
  // 
  //               {/* <NavLink
  //                   to="/global-services"
  //                   className={({ isActive }) =>
  //                     `text-sm border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer
  //      hover:bg-blue-50 hover:text-red-600
  //      ${isActive ? "text-red-600 bg-blue-50" : "text-gray-700"}`
  //                   }
  //                 >
  //                   Global Services
  //                 </NavLink> */}
  // 
  //               <div className="relative group cursor-pointer">
  //                 <NavLink
  //                   to="/resources"
  //                   className={({ isActive }) =>
  //                     `text-[16px] border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer hover:bg-blue-50 hover:text-red-600 flex items-center gap-1 ${isActive ? "text-red-600 bg-blue-50" : "text-gray-700"}`
  //                   }
  //                 >
  //                   Resources <MdKeyboardArrowDown
  //                     size={20}
  //                     className="transition-transform duration-200 group-hover:-rotate-180"
  //                   />
  //                 </NavLink>
  //                 <div className="absolute top-full right-0 mt-2 w-60 bg-white shadow-xl rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
  //                   <a href="https://frontend-jfhdav2px-vishal-chaudharys-projects-57aced94.vercel.app/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Global Services</a>
  //                   <Link to="/resources?tab=webinars" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Webinars</Link>
  //                   <Link to="/resources?tab=events" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Events</Link>
  //                   <Link to="/resources?tab=short-videos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Short Videos</Link>
  //                   <Link to="/resources?tab=testimonials" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Student Testimonials</Link>
  //                   <Link to="/resources?tab=blogs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Blogs / Articles</Link>
  //                   <Link to="/resources?tab=faqs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">FAQs</Link>
  //                   <Link to="/resources?tab=news" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">News & Publications</Link>
  //                   <Link to="/resources?tab=gallery" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Gallery</Link>
  //                   <Link to="/resources?tab=instagram" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Instagram</Link>
  //                   <Link to="/resources?tab=linkedin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Linkedin</Link>
  // 
  //                   {/* <div className="relative group/sub">
  //                     <span className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 cursor-pointer">
  //                       Reviews
  //                       <MdKeyboardArrowDown size={16} className="-rotate-90" />
  //                     </span>
  //                     <div className="absolute left-full top-0 -mt-2 w-52 bg-white shadow-xl rounded-lg py-2 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50">
  //                       <Link to="/resources?tab=university-reviews" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">University Reviews</Link>
  //                     </div>
  //                   </div> */}
  // 
  //                   {/* <div className="relative group/sub">
  //                     <span className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 cursor-pointer">
  //                       Guidance Centers
  //                       <MdKeyboardArrowDown size={16} className="-rotate-90" />
  //                     </span>
  //                     <div className="absolute left-full top-0 -mt-2 w-52 bg-white shadow-xl rounded-lg py-2 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50">
  //                       <Link to="/resources?tab=course-guides" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Course Guides</Link>
  //                       <Link to="/resources?tab=career-guides" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Career Guides</Link>
  //                       <Link to="/resources?tab=admission-guides" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Admission Guides</Link>
  //                       <Link to="/resources?tab=fee-guides" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Fee Guides</Link>
  //                       <Link to="/resources?tab=exam-guides" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Exam Guides</Link>
  //                     </div>
  //                   </div> */}
  //                 </div>
  //               </div>
  // 
  //               <div className="relative group cursor-pointer">
  //                 <NavLink
  //                   to="/career-finder"
  //                   className={({ isActive }) =>
  //                     `text-[16px] border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer hover:bg-blue-50 hover:text-red-600 flex items-center gap-1 ${isActive ? "text-red-600 bg-blue-50" : "text-gray-700"}`
  //                   }
  //                 >
  //                   Tools <MdKeyboardArrowDown
  //                     size={20}
  //                     className="transition-transform duration-200 group-hover:-rotate-180"
  //                   />
  //                 </NavLink>
  //                 <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-slate-200 rounded-md py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
  //                   <Link to="/career-finder" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Career Finder</Link>
  //                   <Link to="/my-education-stack" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">My Education Stack</Link>
  //                   <Link to="/career-roi-calculator" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Career ROI Calculator</Link>
  //                   <Link to="/fees-emi-calculator" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Fees & EMI Calculator</Link>
  //                   {/* <Link to="/sgpa-to-percentage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">SGPA to Percentage</Link> */}
  //                   <Link to="/am-i-eligible" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Am I Eligible?</Link>
  //                   <Link to="/form-templates" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Form Templates</Link>
  //                   <Link to="/resume-builder" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Resume Builder</Link>
  //                   <Link to="/cover-letter-builder" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Cover Letter Builder</Link>
  //                   <Link to="/quiz" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Quiz</Link>
  //                   <Link to="/compare" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600">Compare Programs</Link>
  //                 </div>
  //               </div>
  //               {/* <NavLink
  //                   to="/more"
  //                   className={({ isActive }) =>
  //                     `text-sm border border-transparent px-[15px] py-[12px] rounded-[7px] cursor-pointer
  //      hover:bg-blue-50 hover:text-red-600
  //      ${isActive ? "text-red-600 bg-blue-50" : "text-gray-700"}`
  //                   }
  //                 >
  //                   More
  //                 </NavLink> */}
  //             </div>
  //             {/* RIGHT ACTIONS */}
  //             <div className="flex shrink-0 items-center gap-2">
  //               <div className="border border-black/10 bg-[#1F2853] text-white rounded-lg py-1.5 px-3 sm:px-5 flex items-center gap-1.5 whitespace-nowrap">
  //                 <IoMdPlay size={20} className="shrink-0" />
  //                 <span className="hidden sm:inline">Expert Consulting</span>
  //               </div>
  // 
  //               {/* The only way into Degree Programs / Master Classes / Resources /
  //                   Tools below `lg`, where the full link row above is hidden — the
  //                   drawer it opens has no other trigger. */}
  //               <button
  //                 type="button"
  //                 onClick={() => setMobileMenuOpen((open) => !open)}
  //                 aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
  //                 aria-expanded={mobileMenuOpen}
  //                 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 lg:hidden"
  //               >
  //                 <span className="relative flex h-4 w-4 flex-col items-center justify-center">
  //                   <span
  //                     className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-200 ${mobileMenuOpen ? "rotate-45" : "-translate-y-[5px]"}`}
  //                   />
  //                   <span
  //                     className={`absolute h-[1.5px] w-4 bg-current transition-opacity duration-200 ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`}
  //                   />
  //                   <span
  //                     className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-200 ${mobileMenuOpen ? "-rotate-45" : "translate-y-[5px]"}`}
  //                   />
  //                 </span>
  //               </button>
  //             </div>
  // 
  //             {/* Mobile Menu Drawer */}
  //             {mobileMenuOpen && (
  //               <div className="lg:hidden absolute top-full left-0 max-h-[calc(100vh-var(--nav-height,120px))] w-full overflow-y-auto bg-white shadow-xl border-t border-gray-100 flex flex-col px-6 py-4 gap-4 z-40">
  //                 <Link
  //                   to="/career-services"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Career Services
  //                 </Link>
  //                 <Link
  //                   to="/degrees"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Degree Programs
  //                 </Link>
  //                 <Link
  //                   to="/master-classes"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Master Classes
  //                 </Link>
  //                 <a
  //                   href="https://frontend-c9kuk4dfn-vishal-chaudharys-projects-57aced94.vercel.app/"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   After K12
  //                 </a>
  //                 <Link
  //                   to="/events"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Events
  //                 </Link>
  //                 <Link
  //                   to="/resources"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Resources
  //                 </Link>
  //                 <Link
  //                   to="/career-finder"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Career Finder
  //                 </Link>
  //                 <Link
  //                   to="/my-education-stack"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   My Education Stack
  //                 </Link>
  //                 <Link
  //                   to="/career-roi-calculator"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Career ROI Calculator
  //                 </Link>
  //                 <Link
  //                   to="/fees-emi-calculator"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Fees & EMI Calculator
  //                 </Link>
  //                 {/* <Link
  //                   to="/sgpa-to-percentage"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   SGPA to Percentage
  //                 </Link> */}
  //                 <Link
  //                   to="/am-i-eligible"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Am I Eligible?
  //                 </Link>
  //                 <Link
  //                   to="/form-templates"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Form Templates
  //                 </Link>
  //                 <Link
  //                   to="/resume-builder"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Resume Builder
  //                 </Link>
  //                 <Link
  //                   to="/cover-letter-builder"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Cover Letter Builder
  //                 </Link>
  //                 <Link
  //                   to="/quiz"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Quiz
  //                 </Link>
  //                 <Link
  //                   to="/compare"
  //                   className="text-gray-800 font-medium py-2 border-b border-gray-50"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   Compare Programs
  //                 </Link>
  //                 <Link
  //                   to="/more"
  //                   className="text-gray-800 font-medium py-2"
  //                   onClick={() => setMobileMenuOpen(false)}
  //                 >
  //                   More
  //                 </Link>
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       </header>
  // 
  //       <div style={{ height: headerHeight }} aria-hidden="true"></div>
  //     </>
  //   );
};

export default NavBar;
