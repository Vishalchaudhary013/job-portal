import registerIcon from "../../../assets/images/icon1.webp";
import applyIcon from "../../../assets/images/icon2.webp";
import resumeIcon from "../../../assets/images/icon3.webp";

// "How It Works" strip right under the hero — 3 steps, each a faint big
// number behind a colored rounded-sm ribbon (icon + title) with a
// description underneath. Flat design: rounded-sm everywhere, no shadows.
const STEPS = [
  {
    icon: registerIcon,
    title: ["Register", "Your Account"],
    description: "You need to create an account to find the best and preferred job.",
    color: "#4C7FE0",
  },
  {
    icon: applyIcon,
    title: ["Apply", "For Dream Job"],
    description: "You need to create an account to find the best and preferred job.",
    color: "#9B7BC4",
  },
  {
    icon: resumeIcon,
    title: ["Upload", "Your Resume"],
    description: "You need to create an account to find the best and preferred job.",
    color: "#4FC7A0",
  },
];

const HowItWorksSection = () => (
  <section className="bg-white">
    <div className="mx-auto max-w-[1250px] px-4 py-16 text-center md:px-6 md:py-20 ">
      <p className="text-[15px] font-bold text-[#4C7FE0]">Working Process</p>
      <h2 className="mt-1 text-[32px] font-extrabold text-[#1F2853] sm:text-[40px]">How It Works</h2>

      <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title.join(" ")} className="relative pt-9 text-left">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-5 -top-10 select-none text-[56px] font-extrabold leading-none text-slate-100"
            >
              {`0${i + 1}`}
            </span>

            <div
              className="relative ml-8 flex items-center gap-3 rounded-sm py-3 pl-3 pr-6"
              style={{ backgroundColor: step.color }}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-white">
                <img src={step.icon} alt="" className="h-9 w-9 object-contain" />
              </span>
              <p className="text-[16px] font-bold leading-snug text-white">
                {step.title[0]}
                <br />
                {step.title[1]}
              </p>
            </div>

            <p className="ml-8 mt-4 max-w-[260px] text-[14px] leading-relaxed text-slate-500">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
