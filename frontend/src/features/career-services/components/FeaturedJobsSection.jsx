import { useMemo } from "react";
import SectionTitle from "../../../components/common/SectionTitle";
import FeaturedJobCard from "./FeaturedJobCard";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import { isJobOpen } from "../../job/utils/jobCardData";
import { isInternshipOpen } from "../../internship/utils/internshipCardData";
import { isApprenticeshipOpen } from "../../apprenticeship/utils/apprenticeshipCardData";

const OPEN_CHECK = {
  Jobs: isJobOpen,
  Internship: isInternshipOpen,
  Apprenticeships: isApprenticeshipOpen,
};

// "Explore Featured Jobs" strip below the hero, on the same light
// #E9F6FF background as the hero. Card visuals follow a reference design
// (dark bg, lime type badge, salary line, company row); the section
// header/"View All" reuse the site's own SectionTitle component (default
// light theme, since this strip's own background is light) so the pattern
// matches every other section on the site.
const FeaturedJobsSection = ({ limit = 6 }) => {
  const { opportunities } = useOpportunities();

  const featured = useMemo(() => {
    return opportunities
      .filter((item) => {
        const isOpenCheck = OPEN_CHECK[item.type];
        return isOpenCheck ? isOpenCheck(item) : false;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, limit);
  }, [opportunities, limit]);

  if (!featured.length) return null;

  return (
    <section className="bg-[#E9F6FF]">
      <div className="mx-auto max-w-[1250px] px-4 py-14 md:px-6">
        <SectionTitle
          title="Explore Featured Jobs"
          subtitle="Hand-picked internships, apprenticeships and jobs open right now"
          viewAllLink="/job"
        />
        {/* Phones: a left-to-right swipe row that snaps card by card, each card 85% wide so the
            next one peeks in. The row bleeds to the screen edge (-mx-4 px-4) so cards aren't
            clipped by the section padding. sm and up: the regular 2 / 3-column grid. */}
        <div className="scrollbar-hide -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {featured.map((item, i) => (
            <div key={item.id} className="w-[85%] shrink-0 snap-start sm:w-auto">
              <FeaturedJobCard item={item} tintIndex={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobsSection;
