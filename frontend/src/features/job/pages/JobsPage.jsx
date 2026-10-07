import OpportunityListingPage from "../../opportunity/pages/OpportunityListingPage";
import { JOB_FILTERS, JOB_SORT_OPTIONS } from "../../opportunity/filterConfig";

const JobPage = () => (
  <OpportunityListingPage
    opportunityType="Jobs"
    basePath="/job"
    typeLabel="Job"
    title="Explore Jobs"
    subtitle="Find the perfect job to kickstart your career."
    searchPlaceholder="Search by role, company, or skills..."
    filters={JOB_FILTERS}
    sortOptions={JOB_SORT_OPTIONS}
    emptyStateHint="We couldn't find jobs matching your selected filters. Try removing some filters or expanding your search."
  />
);

export default JobPage;
