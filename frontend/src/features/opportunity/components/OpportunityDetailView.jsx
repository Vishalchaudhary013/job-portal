import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdShare } from "react-icons/io";
import ApplicationFormModal from "../../forms/components/ApplicationFormModal";
import ShareModal from "../../../components/common/ShareModal";
import SectionTitle from "../../../components/common/SectionTitle";
import FeaturedJobCard from "../../career-services/components/FeaturedJobCard";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import { isJobOpen } from "../../job/utils/jobCardData";
import { isInternshipOpen } from "../../internship/utils/internshipCardData";
import { isApprenticeshipOpen } from "../../apprenticeship/utils/apprenticeshipCardData";
import OpportunityDetailHero from "./OpportunityDetailHero";
import OpportunityDetailCompanyCard from "./OpportunityDetailCompanyCard";
import OpportunityDetailMedia from "./OpportunityDetailMedia";

// Shared detail view for Job / Internship / Apprenticeship, drawn from a
// reference design: a light hero band (#E9F6FF) with the summary card, a
// two-column description + sticky company rail, and a "You may also like"
// strip. Headings are the navy `primary`; the copy under each heading stays
// black, per the reference. Everything is bounded to the site's 1250px
// container so it lines up with the career-services landing page above it.
//
// One component for all three types on purpose: the three old detail pages
// were byte-for-byte copies of each other apart from the type string, and the
// same drift would repeat if this were forked three ways. Those old layouts
// are kept (commented out) in their own pages.

const OPEN_CHECK = {
  Jobs: isJobOpen,
  Internship: isInternshipOpen,
  Apprenticeships: isApprenticeshipOpen,
};

const TYPE_LABEL = {
  Jobs: "Job",
  Internship: "Internship",
  Apprenticeships: "Apprenticeship",
};

const LISTING_PATH = {
  Jobs: "/job",
  Internship: "/internship",
  Apprenticeships: "/apprenticeship",
};

// Description blocks in reading order; each is skipped when its field is empty.
const SECTIONS = [
  { key: "aboutProgram", heading: "About the Role" },
  { key: "description", heading: "Key Responsibilities" },
  { key: "minimumRequirements", heading: "Minimum Requirements" },
  { key: "preferredQualifications", heading: "Preferred Qualifications" },
  { key: "whatYouWillLearn", heading: "What You Will Learn" },
  { key: "incentivesBonuses", heading: "Incentives / Bonuses" },
];

const withBold = (value) =>
  String(value).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

const RichText = ({ content }) => {
  const str = String(content || "").trim();
  if (!str) return null;

  // Admin copy arrives either as HTML from the rich-text field or as plain
  // newline-separated lines; the latter reads as a bullet list.
  if (/<[a-z][\s\S]*>/i.test(str)) {
    return (
      <div
        className="mt-3 space-y-2 text-[15px] leading-relaxed text-black [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: withBold(str) }}
      />
    );
  }

  const lines = str.split("\n").filter((line) => line.trim() !== "");

  if (lines.length === 1) {
    return (
      <p
        className="mt-3 text-[15px] leading-relaxed text-black"
        dangerouslySetInnerHTML={{ __html: withBold(lines[0]) }}
      />
    );
  }

  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-black marker:text-black">
      {lines.map((line, index) => (
        <li key={index} dangerouslySetInnerHTML={{ __html: withBold(line) }} />
      ))}
    </ul>
  );
};

const BulletList = ({ items }) => (
  <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-black marker:text-black">
    {items.map((entry, index) => (
      <li key={`${entry}-${index}`}>{entry}</li>
    ))}
  </ul>
);

const OpportunityDetailView = ({ opportunity, type }) => {
  const navigate = useNavigate();
  const { opportunities, user } = useOpportunities();
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const typeLabel = TYPE_LABEL[type] || "Opportunity";
  const listingPath = LISTING_PATH[type] || "/job";

  const perks =
    (opportunity?.perks?.length ? opportunity.perks : opportunity?.benefits) || [];
  const selectionRounds = opportunity?.selectionRounds || [];
  const requiredSkills = opportunity?.requiredSkills?.length
    ? opportunity.requiredSkills
    : opportunity?.skills || [];

  // Same type first, then any other open opportunity, so the strip still
  // fills up on a type that only has this one listing.
  const related = useMemo(() => {
    const isOpen = (entry) => {
      const check = OPEN_CHECK[entry.type];
      return check ? check(entry) : false;
    };
    const pool = opportunities.filter(
      (entry) => entry.id !== opportunity?.id && isOpen(entry),
    );
    const sameType = pool.filter((entry) => entry.type === type);
    const rest = pool.filter((entry) => entry.type !== type);
    return [...sameType, ...rest].slice(0, 3);
  }, [opportunities, opportunity?.id, type]);

  const handleApply = () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setSelectedOpportunity(opportunity);
  };

  return (
    <>
      <OpportunityDetailHero
        opportunity={opportunity}
        typeLabel={typeLabel}
        onApply={handleApply}
        onShare={() => setIsShareModalOpen(true)}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1250px] px-4 py-14 md:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <h2 className="text-[28px] font-extrabold leading-tight text-primary sm:text-[34px]">
                {typeLabel} Description:
              </h2>

              {SECTIONS.map(({ key, heading }) =>
                opportunity?.[key] ? (
                  <div key={key} className="mt-7 first:mt-5">
                    <h3 className="text-[20px] font-bold text-primary sm:text-[24px]">
                      {heading}
                    </h3>
                    <RichText content={opportunity[key]} />
                  </div>
                ) : null,
              )}

              {requiredSkills.length > 0 && (
                <div className="mt-7">
                  <h3 className="text-[20px] font-bold text-primary sm:text-[24px]">
                    Required Skills
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {requiredSkills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-sm bg-primary/5 px-3 py-1.5 text-[14px] font-medium text-black"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {perks.length > 0 && (
                <div className="mt-7">
                  <h3 className="text-[20px] font-bold text-primary sm:text-[24px]">
                    What We Offer
                  </h3>
                  <BulletList items={perks} />
                </div>
              )}

              {selectionRounds.length > 0 && (
                <div className="mt-7">
                  <h3 className="text-[20px] font-bold text-primary sm:text-[24px]">
                    Interview Process
                  </h3>
                  <BulletList items={selectionRounds} />
                </div>
              )}

              {/* Office photos / video sit at the foot of the left-hand
                  description column, not full-bleed below it: across the whole
                  1250px container the tiles were huge and pushed "You may also
                  like" far down the page. */}
              <OpportunityDetailMedia opportunity={opportunity} />

              {/* <div className="mt-9 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-sm bg-secondary px-8 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-secondary/90"
                >
                  Apply Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-2 rounded-sm border border-primary px-6 py-3 text-[14px] font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  <IoMdShare />
                  Share
                </button>
              </div> */}
            </div>

            <OpportunityDetailCompanyCard opportunity={opportunity} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="">
          <div className="mx-auto w-full max-w-[1250px] px-4 py-14 md:px-6">
            <SectionTitle title="You may also like" viewAllLink={listingPath} />
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry, index) => (
                <FeaturedJobCard key={entry.id} item={entry} tintIndex={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ApplicationFormModal
        isOpen={Boolean(selectedOpportunity)}
        opportunityTitle={selectedOpportunity?.title}
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        eventTitle={opportunity?.title || typeLabel}
        shareUrl={window.location.href}
      />
    </>
  );
};

export default OpportunityDetailView;
