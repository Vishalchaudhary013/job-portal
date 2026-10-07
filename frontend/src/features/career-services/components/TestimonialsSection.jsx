import { FaStar } from "react-icons/fa";
import { LuQuote } from "react-icons/lu";

// "Clients Testimonials" — light #E9F6FF band (not the reference's dark
// navy card design) so it matches the rest of this page; flat cards:
// rounded-sm, no shadow, bordered instead. Avatars are initials in a
// tinted circle (no stock headshot assets available) rather than photos.
const TESTIMONIALS = [
  {
    quote:
      "This platform is a game-changer! We found the perfect candidate for our software engineering team in just a few days. The process was smooth, and the quality of applicants exceeded our expectations.",
    name: "Carly Wicker",
    role: "UI/UX Designer",
  },
  {
    quote:
      "We were struggling to find the right talent for our rapidly growing company. This site connected us with top professionals who perfectly fit our company culture and technical needs. Highly recommend!",
    name: "Robert Fox",
    role: "Businessman",
  },
  {
    quote:
      "The ease of use and the level of detail in the candidate profiles made our hiring process much more efficient. We've successfully filled several key positions using this platform.",
    name: "Barclay Cairo",
    role: "Teacher",
  },
  {
    quote:
      "The candidates we found here were highly skilled and ready to hit the ground running. The platform made it easy to narrow down our search and connect with the best talent.",
    name: "Stella Liapis",
    role: "Doctor",
  },
];

const TestimonialsSection = () => (
  <section className="bg-[#E9F6FF]">
    <div className="mx-auto max-w-[1250px] px-4 py-16 md:px-6 md:py-20">
      <h2 className="text-[32px] font-extrabold text-primary sm:text-[40px]">Clients Testimonials</h2>

      {/* Phones: a left-to-right swipe row that snaps card by card (85% wide so the next card
          peeks in), bleeding to the screen edge. sm and up: the 2-column grid. */}
      <div className="scrollbar-hide -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="relative w-[85%] shrink-0 snap-start overflow-hidden rounded-sm border border-black/10 bg-white p-6 sm:w-auto sm:p-7">
            <div className="flex gap-1 text-secondary">
              {Array.from({ length: 5 }).map((_, i) => (
                <FaStar key={i} className="h-4 w-4" />
              ))}
            </div>

            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>

            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[14px] font-bold text-primary">
                {t.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-primary">{t.name}</p>
                <p className="text-[13px] text-slate-500">{t.role}</p>
              </div>
            </div>

            <LuQuote className="pointer-events-none absolute bottom-4 right-4 h-9 w-9 text-secondary/15" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
