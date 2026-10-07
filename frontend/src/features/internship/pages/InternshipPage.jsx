import OpportunityListingPage from "../../opportunity/pages/OpportunityListingPage";
import { INTERNSHIP_FILTERS, INTERNSHIP_SORT_OPTIONS } from "../../opportunity/filterConfig";

const InternshipPage = () => (
  <OpportunityListingPage
    opportunityType="Internship"
    basePath="/internship"
    typeLabel="Internship"
    title="Explore Internships"
    subtitle="Gain real industry experience with hands-on internships."
    searchPlaceholder="Search by role, company, or skills..."
    filters={INTERNSHIP_FILTERS}
    sortOptions={INTERNSHIP_SORT_OPTIONS}
    emptyStateHint="Try changing your location, duration, stipend, or skills."
  />
);

export default InternshipPage;
