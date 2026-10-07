import OpportunityListingPage from "../../opportunity/pages/OpportunityListingPage";
import { INTERNSHIP_FILTERS, INTERNSHIP_SORT_OPTIONS } from "../../opportunity/filterConfig";

// Apprenticeships are training placements like internships, so they share the
// internship filter set rather than the career-shaped job one.
const ApprenticeshipPage = () => (
  <OpportunityListingPage
    opportunityType="Apprenticeships"
    basePath="/apprenticeship"
    typeLabel="Apprenticeship"
    title="Explore Apprenticeships"
    subtitle="Earn while you learn with structured apprenticeship programs."
    searchPlaceholder="Search by trade, company, or skills..."
    filters={INTERNSHIP_FILTERS}
    sortOptions={INTERNSHIP_SORT_OPTIONS}
    emptyStateHint="Try changing your location, duration, stipend, or skills."
  />
);

export default ApprenticeshipPage;
