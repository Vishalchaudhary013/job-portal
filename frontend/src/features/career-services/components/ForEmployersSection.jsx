import { Link } from "react-router-dom";
import { LuPhoneCall, LuSearchCheck, LuBadgeCheck, LuMegaphone, LuArrowUpRight } from "react-icons/lu";

// The one section on the landing page aimed at the hiring side rather than the
// candidate side, so it ends on the employer branch of the signup chooser
// (/signup?type=employer — the same destination ChooseSignup's Employer card
// uses) rather than the generic /choose-signup.

// Served from /public, so referenced by URL rather than imported.
const EMPLOYER_PHOTO = "/employer_hiring.png";

const EMPLOYER_FEATURES = [
  {
    icon: LuPhoneCall,
    title: "Instant Candidate Leads",
    description: "Get direct calls from interested candidates",
  },
  {
    icon: LuSearchCheck,
    title: "Pre-Screened Candidates",
    description: "Role based pre-screening helps filter the right candidates",
  },
  {
    icon: LuBadgeCheck,
    title: "Identity verified candidates",
    description: "Get candidates with identity and address pre-verified",
  },
  {
    icon: LuMegaphone,
    title: "Hiring across India",
    description: "Post jobs and hire candidates across India",
  },
];

const ForEmployersSection = () => {
  return (
    <section className="">
      <div className="mx-auto max-w-[1250px] px-4 py-14 md:px-8">
        <h2 className="text-center text-[28px] font-extrabold text-primary sm:text-[34px]">
          For Employers
        </h2>
        <p className="mt-2 text-center text-[15px] text-slate-600 sm:text-[17px]">
          Leverage the expertise of <span className="font-semibold text-secondary">edeco</span> to
          power your hiring
        </p>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* A fixed aspect ratio rather than a natural height, so the photo and
              the feature list stay the same height as the column widths change. */}
          <img
            src={EMPLOYER_PHOTO}
            alt=""
            aria-hidden="true"
            className="aspect-[4/3] w-full rounded-sm object-cover"
          />

          <div>
            <ul className="space-y-7">
              {EMPLOYER_FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold text-primary">{title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              to="/signup?type=employer"
              className="mt-10 inline-flex items-center gap-2 rounded-sm border border-primary px-8 py-3 text-[15px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Start hiring
              <LuArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForEmployersSection;
