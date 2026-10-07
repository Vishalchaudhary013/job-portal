import logo1 from "../../../assets/logos/logo1.png";
import logo2 from "../../../assets/logos/logo2.png";
import logo3 from "../../../assets/logos/logo3.png";
import logo4 from "../../../assets/logos/logo4.png";
import logo5 from "../../../assets/logos/logo5.png";
import logo6 from "../../../assets/logos/logo6.png";
import logo7 from "../../../assets/logos/logo7.png";
import logo8 from "../../../assets/logos/logo8.png";
import logo9 from "../../../assets/logos/logo9.png";
import logo10 from "../../../assets/logos/logo10.png";
import logo11 from "../../../assets/logos/logo11.png";
import logo12 from "../../../assets/logos/logo12.png";
import logo13 from "../../../assets/logos/logo13.jpg";
import logo14 from "../../../assets/logos/logo14.png";
import logo15 from "../../../assets/logos/logo15.png";
import logo16 from "../../../assets/logos/logo16.png";

// "Get hired in top companies" band right under the hero — an eyebrow +
// heading, then all real company logos in two continuously scrolling,
// full-width rows moving in opposite directions (row 1 left -> right via
// .animate-left, row 2 right -> left via .animate-right — the shared
// keyframes in globals.css, same as UniversityMarquee) and a stat strip
// underneath. Flat design: rounded-sm, no shadows.
const LOGOS = [
  logo1, logo2, logo3, logo4, logo5, logo6, logo7, logo8,
  logo9, logo10, logo11, logo12, logo13, logo14, logo15, logo16,
];

// Second row shows the same logos in reverse so the two lines never look
// like a mirrored copy of each other while sliding past.
const LOGOS_REVERSED = [...LOGOS].reverse();

const STATS = [
  { value: "5M+", label: "Registered candidates" },
  { value: "9K+", label: "Open job positions" },
  { value: "2M+", label: "Success stories shared" },
];

const CompaniesStrip = () => (
  <section className="bg-[#E9F6FF] pb-5 md:pb-10">
    <div className="mx-auto max-w-[1250px] px-4 pt-16 md:px-6 md:pt-20">
      <div className="text-center">
        <p className="text-[15px] font-bold text-[#4C7FE0]">Top Companies</p>
        <h2 className="mt-1 text-[32px] font-extrabold text-[#1F2853] sm:text-[40px]">
          Get hired in top companies
        </h2>
      </div>
    </div>

    {/* ROW 1 → */}
    <div className="mt-12 overflow-hidden">
      <div className="flex w-max min-w-full animate-left items-center gap-x-14 py-2">
        {[...LOGOS, ...LOGOS].map((logo, i) => (
          <img key={`r1-${i}`} src={logo} alt="" className="h-10 w-auto shrink-0 object-contain sm:h-12" />
        ))}
      </div>
    </div>

    {/* ROW 2 ← */}
    <div className="mt-6 mb-6 overflow-hidden">
      <div className="flex w-max min-w-full animate-right items-center gap-x-14 py-2">
        {[...LOGOS_REVERSED, ...LOGOS_REVERSED].map((logo, i) => (
          <img key={`r2-${i}`} src={logo} alt="" className="h-10 w-auto shrink-0 object-contain sm:h-12" />
        ))}
      </div>
    </div>

    {/* <div className="mx-auto max-w-[1250px] px-4 md:px-6 ">
      <div className="relative z-20 mx-auto -mb-25 mt-14 max-w-3xl rounded-sm bg-secondary px-8 py-8">
        <div className="grid grid-cols-3 divide-x divide-white/25 text-center">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-2">
              <p className="text-[26px] font-extrabold text-white sm:text-[32px]">{stat.value}</p>
              <p className="mt-1 text-[13px] text-white/80 sm:text-[14px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div> */}
  </section>
);

export default CompaniesStrip;
