import React from "react";
import { Link } from "react-router-dom";
import {
  FaLinkedinIn,
  FaInstagram,
  FaXTwitter,
  FaYoutube,
  FaFacebookF,
} from "react-icons/fa6";
import { FiMail, FiMapPin } from "react-icons/fi";
import logo from "../../assets/logoo.png";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Internships", to: "/internship" },
      { label: "Apprenticeships", to: "/apprenticeship" },
      { label: "Jobs", to: "/jobs" },
      { label: "Global Programs", to: "/global-program" },
      { label: "Master Classes", to: "/master-classes" },
    ],
  },
  {
    title: "Programs",
    links: [
      { label: "All Degree Programs", to: "/degrees" },
      { label: "Bachelor's Degrees", to: "/degree/bachelor" },
      { label: "Master's Degrees", to: "/degree/master" },
      { label: "Online Degrees", to: "/degree/online" },
      { label: "Compare Programs", to: "/compare" },
      { label: "Universities", to: "/universities" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Career Finder", to: "/career-finder" },
      { label: "Career ROI Calculator", to: "/career-roi-calculator" },
      { label: "Fees & EMI Calculator", to: "/fees-emi-calculator" },
      // { label: "SGPA to Percentage", to: "/sgpa-to-percentage" },
      { label: "Am I Eligible?", to: "/am-i-eligible" },
      { label: "Resume Builder", to: "/resume-builder" },
      { label: "Skill Assessment", to: "/quiz" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog & Articles", to: "/resources?tab=blogs" },
      { label: "Webinars", to: "/resources?tab=webinars" },
      { label: "Events", to: "/resources?tab=events" },
      { label: "Student Testimonials", to: "/resources?tab=testimonials" },
      { label: "FAQs", to: "/resources?tab=faqs" },
      { label: "Gallery", to: "/resources?tab=gallery" },
    ],
  },
];

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/edeco", Icon: FaLinkedinIn },
  { label: "Instagram", href: "https://www.instagram.com/edeco", Icon: FaInstagram },
  { label: "X", href: "https://x.com/edeco", Icon: FaXTwitter },
  { label: "YouTube", href: "https://www.youtube.com/@edeco", Icon: FaYoutube },
  { label: "Facebook", href: "https://www.facebook.com/edeco", Icon: FaFacebookF },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className=" bg-[#1F2853] text-white">
      <div className="mx-auto w-full max-w-[1250px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_3fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center" aria-label="Edeco home">
              <img src={logo} alt="Edeco" className="h-[56px] w-auto brightness-0 invert" />
            </Link>

            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-white/60">
              Connecting students with global opportunities, the right programs and
              career-defining internships — all in one place.
            </p>

            <div className="mt-6 space-y-2 text-[13.5px] text-white/60">
              <a
                href="mailto:hello@edeco.com"
                className="flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <FiMail className="shrink-0 text-[15px]" />
                hello@edeco.com
              </a>
              <Link
                to="/locate-us"
                className="flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <FiMapPin className="shrink-0 text-[15px]" />
                Find our offices
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Icon className="text-[15px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-white/90">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-[13.5px] text-white/60 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Edeco. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy-policy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="transition-colors hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
