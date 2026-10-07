import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";

// Same FAQ content/accordion behavior as the home page's EdecoFaq, restyled
// to match this page's flat design: rounded-sm cards, no shadow (border
// only), coral accent instead of red.
const FAQS = [
  {
    question: "What is EDECO and how does it work?",
    answer:
      "EDECO is a career-focused platform that connects students with internships, training programs, and placement opportunities. Students enroll in structured programs, gain hands-on experience through real projects, and receive career support to become job-ready.",
  },
  {
    question: "Are EDECO internships and programs industry-oriented?",
    answer:
      "Yes. All EDECO programs are designed with an industry-first approach, focusing on practical skills, real-world projects, and current market requirements to ensure students are job-ready.",
  },
  {
    question: "Does EDECO provide placement or job assistance?",
    answer:
      "EDECO offers placement assistance through hiring drives, company collaborations, resume building, interview preparation, and career guidance for eligible and shortlisted candidates.",
  },
  {
    question: "Who can apply for EDECO internships and training programs?",
    answer:
      "EDECO programs are open to students, freshers, and early professionals from technical and non-technical backgrounds. Eligibility criteria may vary depending on the specific internship or program.",
  },
  {
    question: "Is the EDECO certificate valid and verifiable?",
    answer:
      "Yes. Upon successful completion of a program, students receive a verifiable EDECO certificate that validates their training, skills, and project experience.",
  },
  {
    question: "Are EDECO programs online or offline?",
    answer:
      "Most EDECO programs are conducted in online or hybrid mode, allowing students from different locations to participate. Specific programs may also include offline or campus-based activities.",
  },
];

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[900px] px-4 py-16 md:px-6 md:py-20">
        <div className="text-center">
          <p className="text-[15px] font-bold text-secondary">More Questions?</p>
          <h2 className="mt-1 text-[32px] font-extrabold text-primary sm:text-[40px]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="mt-8">
          {FAQS.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div key={faq.question} className="mb-3 rounded-sm border border-black/10 bg-white px-5">
                <button
                  type="button"
                  onClick={() => setActiveIndex(isOpen ? null : index)}
                  className="flex w-full items-center gap-4 py-4 text-left"
                >
                  <span className={`flex-1 text-[15px] font-semibold ${isOpen ? "text-secondary" : "text-primary"}`}>
                    {faq.question}
                  </span>
                  <LuChevronDown
                    className={`h-5 w-5 shrink-0 text-secondary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-4 text-[14px] leading-relaxed text-slate-500">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
