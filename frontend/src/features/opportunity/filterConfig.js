import { DEFAULT_JOB_CATEGORIES } from "../job/utils/jobCategories";

// Filter definitions for the listing pages. Jobs and Internships share the
// same UI components but keep entirely separate option sets.
//
// Each entry:
//   param       query-string key, also the URL parameter (see useOpportunityQuery)
//   title       section heading
//   kind        "multi" (checkbox list) | "single" (one value) | "range" | "text"
//   options     canonical choices; dynamic values from the API facets are
//               merged in on top so real data always shows up
//   facetKey    which facet bucket from the API supplies counts/extra values
//   searchable  render a search box above the list (long lists only)
//   categoryType  opportunityType whose admin-managed categories replace
//               `options` at runtime (useDynamicFilterOptions); `options` is
//               then just the fallback until that request lands

const yearOptions = () => {
  const current = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => {
    const year = String(current - 3 + index);
    return { value: year, label: year };
  });
};

const DATE_POSTED = {
  param: "datePosted",
  title: "Date Posted",
  kind: "single",
  facetKey: null,
  options: [
    { value: "24h", label: "Last 24 hours" },
    { value: "3d", label: "Last 3 days" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
  ],
};

const DEADLINE = {
  param: "deadline",
  title: "Application Deadline",
  kind: "single",
  facetKey: null,
  options: [
    { value: "today", label: "Closing today" },
    { value: "3d", label: "Closing in 3 days" },
    { value: "7d", label: "Closing in 7 days" },
    { value: "30d", label: "Closing in 30 days" },
  ],
};

const COMPANY_TYPE = {
  param: "companyType",
  title: "Company Type",
  kind: "multi",
  facetKey: "companyType",
  options: [
    { value: "Startup", label: "Startup" },
    { value: "MNC", label: "MNC" },
    { value: "Agency", label: "Agency" },
    { value: "Government", label: "Government" },
    { value: "Non-profit", label: "Non-profit" },
  ],
};

const SKILLS = {
  param: "skills",
  title: "Skills",
  kind: "multi",
  facetKey: "skills",
  searchable: true,
  options: [
    { value: "JavaScript", label: "JavaScript" },
    { value: "React", label: "React" },
    { value: "Node.js", label: "Node.js" },
    { value: "Python", label: "Python" },
    { value: "Java", label: "Java" },
    { value: "SQL", label: "SQL" },
    { value: "MongoDB", label: "MongoDB" },
    { value: "AWS", label: "AWS" },
    { value: "Docker", label: "Docker" },
    { value: "Git", label: "Git" },
    { value: "Figma", label: "Figma" },
  ],
};

const GRADUATION_YEAR = {
  param: "graduationYear",
  title: "Graduation Year",
  kind: "multi",
  facetKey: "graduationYear",
  options: yearOptions(),
};

const DEGREE = {
  param: "degree",
  title: "Degree",
  kind: "multi",
  facetKey: "degree",
  searchable: true,
  options: [
    { value: "B.Tech", label: "B.Tech" },
    { value: "BCA", label: "BCA" },
    { value: "MCA", label: "MCA" },
    { value: "MBA", label: "MBA" },
    { value: "B.Sc", label: "B.Sc" },
    { value: "M.Tech", label: "M.Tech" },
    { value: "B.Com", label: "B.Com" },
    { value: "BBA", label: "BBA" },
  ],
};

const LOCATION = {
  param: "location",
  title: "Location",
  kind: "text",
  facetKey: "location",
  placeholder: "Search city, state or country",
};

export const JOB_FILTERS = [
  {
    param: "jobType",
    title: "Job Type",
    kind: "multi",
    facetKey: "jobType",
    defaultOpen: true,
    options: [
      { value: "Full-time", label: "Full-time" },
      { value: "Part-time", label: "Part-time" },
      { value: "Contract", label: "Contract" },
      { value: "Freelance", label: "Freelance" },
      { value: "Temporary", label: "Temporary" },
    ],
  },
  {
    param: "workMode",
    title: "Work Mode",
    kind: "multi",
    facetKey: "workMode",
    defaultOpen: true,
    options: [
      { value: "On-site", label: "On-site" },
      { value: "Hybrid", label: "Hybrid" },
      { value: "Remote", label: "Remote" },
      { value: "In Office", label: "In Office" },
    ],
  },
  { ...LOCATION, defaultOpen: true },
  {
    param: "experience",
    title: "Experience Level",
    kind: "multi",
    facetKey: "experienceLevel",
    defaultOpen: true,
    options: [
      { value: "Fresher", label: "Fresher" },
      { value: "Entry-level", label: "Entry-level" },
      { value: "Mid-level", label: "Mid-level" },
      { value: "Senior", label: "Senior" },
      { value: "Lead", label: "Lead" },
    ],
  },
  {
    param: "salary",
    title: "Salary Range",
    kind: "range",
    minParam: "salaryMin",
    maxParam: "salaryMax",
    unit: "₹ per month",
    defaultOpen: true,
    presets: [
      { label: "Under ₹25K", min: "", max: "25000" },
      { label: "₹25K – ₹50K", min: "25000", max: "50000" },
      { label: "₹50K – ₹1L", min: "50000", max: "100000" },
      { label: "₹1L+", min: "100000", max: "" },
    ],
  },
  {
    param: "role",
    title: "Job Role",
    kind: "multi",
    facetKey: "functionalRole",
    searchable: true,
    options: [
      { value: "Software Engineer", label: "Software Engineer" },
      { value: "Frontend Developer", label: "Frontend Developer" },
      { value: "Backend Developer", label: "Backend Developer" },
      { value: "Full Stack Developer", label: "Full Stack Developer" },
      { value: "Mobile Developer", label: "Mobile Developer" },
      { value: "Data Analyst", label: "Data Analyst" },
      { value: "Data Scientist", label: "Data Scientist" },
      { value: "DevOps Engineer", label: "DevOps Engineer" },
      { value: "UI/UX Designer", label: "UI/UX Designer" },
      { value: "Product Manager", label: "Product Manager" },
      { value: "Marketing", label: "Marketing" },
      { value: "Sales", label: "Sales" },
      { value: "HR", label: "HR" },
    ],
  },
  SKILLS,
  {
    param: "department",
    title: "Department",
    kind: "multi",
    facetKey: "department",
    searchable: true,
    // Options come from the admin-managed job categories rather than this file
    // — see useDynamicFilterOptions. The list below is only the fallback shown
    // until that request lands, so it mirrors the backend's built-in set.
    categoryType: "Jobs",
    options: DEFAULT_JOB_CATEGORIES.map((title) => ({ value: title, label: title })),
  },
  {
    param: "industry",
    title: "Industry",
    kind: "multi",
    facetKey: "industry",
    options: [
      { value: "IT / Software", label: "IT / Software" },
      { value: "FinTech", label: "FinTech" },
      { value: "Healthcare", label: "Healthcare" },
      { value: "E-commerce", label: "E-commerce" },
      { value: "EdTech", label: "EdTech" },
      { value: "SaaS", label: "SaaS" },
      { value: "Gaming", label: "Gaming" },
      { value: "Manufacturing", label: "Manufacturing" },
      { value: "Consulting", label: "Consulting" },
    ],
  },
  {
    param: "educationLevel",
    title: "Education Level",
    kind: "multi",
    facetKey: "educationLevel",
    options: [
      { value: "10th", label: "10th" },
      { value: "12th", label: "12th" },
      { value: "Diploma", label: "Diploma" },
      { value: "Bachelor's", label: "Bachelor's" },
      { value: "Master's", label: "Master's" },
      { value: "PhD", label: "PhD" },
    ],
  },
  DEGREE,
  GRADUATION_YEAR,
  DATE_POSTED,
  DEADLINE,
  {
    param: "companySize",
    title: "Company Size",
    kind: "multi",
    facetKey: "companySize",
    options: [
      { value: "1-10", label: "1 – 10" },
      { value: "11-50", label: "11 – 50" },
      { value: "51-200", label: "51 – 200" },
      { value: "201-500", label: "201 – 500" },
      { value: "500+", label: "500+" },
    ],
  },
  COMPANY_TYPE,
  {
    param: "hiringPreference",
    title: "Hiring Preference",
    kind: "multi",
    facetKey: "hiringPreference",
    options: [
      { value: "Fresher Friendly", label: "Fresher Friendly" },
      { value: "No Experience Required", label: "No Experience Required" },
      { value: "Actively Hiring", label: "Actively Hiring" },
      { value: "Urgent Hiring", label: "Urgent Hiring" },
    ],
  },
  {
    param: "noticePeriod",
    title: "Notice Period",
    kind: "multi",
    facetKey: "noticePeriod",
    options: [
      { value: "Immediate", label: "Immediate" },
      { value: "15 days", label: "15 days" },
      { value: "30 days", label: "30 days" },
      { value: "60 days", label: "60 days" },
      { value: "90 days", label: "90 days" },
    ],
  },
  {
    param: "relocation",
    title: "Relocation",
    kind: "multi",
    facetKey: "relocation",
    options: [
      { value: "Relocation Assistance", label: "Relocation Assistance" },
      { value: "No Relocation Required", label: "No Relocation Required" },
    ],
  },
  {
    param: "benefits",
    title: "Benefits",
    kind: "multi",
    facetKey: "benefits",
    options: [
      { value: "Health Insurance", label: "Health Insurance" },
      { value: "Paid Leave", label: "Paid Leave" },
      { value: "PF", label: "PF" },
      { value: "Stock Options", label: "Stock Options" },
      { value: "Flexible Hours", label: "Flexible Hours" },
      { value: "Visa Sponsorship", label: "Visa Sponsorship" },
    ],
  },
];

export const INTERNSHIP_FILTERS = [
  {
    param: "internshipType",
    title: "Internship Type",
    kind: "multi",
    facetKey: "workingHours",
    defaultOpen: true,
    options: [
      { value: "Full-time", label: "Full-time" },
      { value: "Part-time", label: "Part-time" },
    ],
  },
  {
    param: "workMode",
    title: "Work Mode",
    kind: "multi",
    facetKey: "workMode",
    defaultOpen: true,
    options: [
      { value: "Remote", label: "Remote" },
      { value: "Hybrid", label: "Hybrid" },
      { value: "On-site", label: "On-site" },
      { value: "In Office", label: "In Office" },
    ],
  },
  { ...LOCATION, defaultOpen: true },
  {
    param: "stipend",
    title: "Stipend",
    kind: "range",
    minParam: "stipendMin",
    maxParam: "stipendMax",
    unit: "₹ per month",
    defaultOpen: true,
    presets: [
      { label: "Unpaid", min: "", max: "0" },
      { label: "₹1K – ₹5K", min: "1000", max: "5000" },
      { label: "₹5K – ₹10K", min: "5000", max: "10000" },
      { label: "₹10K – ₹25K", min: "10000", max: "25000" },
      { label: "₹25K – ₹50K", min: "25000", max: "50000" },
      { label: "₹50K+", min: "50000", max: "" },
    ],
  },
  {
    param: "duration",
    title: "Internship Duration",
    kind: "multi",
    facetKey: null,
    defaultOpen: true,
    options: [
      { value: "1", label: "1 Month" },
      { value: "2", label: "2 Months" },
      { value: "3", label: "3 Months" },
      { value: "6", label: "6 Months" },
      { value: "12", label: "12 Months" },
    ],
  },
  {
    param: "role",
    title: "Internship Role",
    kind: "multi",
    facetKey: "functionalRole",
    searchable: true,
    options: [
      { value: "Software Development", label: "Software Development" },
      { value: "Web Development", label: "Web Development" },
      { value: "Mobile Development", label: "Mobile Development" },
      { value: "Data Science", label: "Data Science" },
      { value: "AI/ML", label: "AI/ML" },
      { value: "UI/UX", label: "UI/UX" },
      { value: "Product", label: "Product" },
      { value: "Marketing", label: "Marketing" },
      { value: "Sales", label: "Sales" },
      { value: "HR", label: "HR" },
      { value: "Finance", label: "Finance" },
      { value: "Content Writing", label: "Content Writing" },
    ],
  },
  SKILLS,
  {
    param: "experienceRequired",
    title: "Experience Required",
    kind: "multi",
    facetKey: "experienceLevel",
    options: [
      { value: "No Experience", label: "No Experience" },
      { value: "Beginner", label: "Beginner" },
      { value: "0-1 Year", label: "0 – 1 Year" },
      { value: "1-2 Years", label: "1 – 2 Years" },
    ],
  },
  {
    param: "educationLevel",
    title: "Education Level",
    kind: "multi",
    facetKey: "educationLevel",
    options: [
      { value: "12th", label: "12th" },
      { value: "Diploma", label: "Diploma" },
      { value: "Bachelor's", label: "Bachelor's" },
      { value: "Master's", label: "Master's" },
    ],
  },
  DEGREE,
  {
    param: "fieldOfStudy",
    title: "Field of Study",
    kind: "multi",
    facetKey: "fieldOfStudy",
    searchable: true,
    options: [
      { value: "Computer Science", label: "Computer Science" },
      { value: "Information Technology", label: "Information Technology" },
      { value: "Mechanical", label: "Mechanical" },
      { value: "Civil", label: "Civil" },
      { value: "Electronics", label: "Electronics" },
      { value: "Business", label: "Business" },
      { value: "Design", label: "Design" },
      { value: "Marketing", label: "Marketing" },
    ],
  },
  GRADUATION_YEAR,
  {
    param: "yearOfStudy",
    title: "Year of Study",
    kind: "multi",
    facetKey: "yearOfStudy",
    options: [
      { value: "1st Year", label: "1st Year" },
      { value: "2nd Year", label: "2nd Year" },
      { value: "3rd Year", label: "3rd Year" },
      { value: "Final Year", label: "Final Year" },
      { value: "Graduate", label: "Graduate" },
    ],
  },
  {
    param: "startDate",
    title: "Start Date",
    kind: "single",
    facetKey: null,
    options: [
      { value: "immediately", label: "Immediately" },
      { value: "1month", label: "Within 1 month" },
      { value: "3months", label: "Within 3 months" },
    ],
  },
  DATE_POSTED,
  DEADLINE,
  {
    param: "ppo",
    title: "PPO / Full-Time Opportunity",
    kind: "multi",
    facetKey: "ppoStatus",
    options: [
      { value: "PPO Available", label: "PPO Available" },
      { value: "Full-time conversion possible", label: "Full-time conversion possible" },
      { value: "No PPO", label: "No PPO" },
    ],
  },
  {
    param: "paid",
    title: "Paid / Unpaid",
    kind: "single",
    facetKey: null,
    options: [
      { value: "paid", label: "Paid" },
      { value: "unpaid", label: "Unpaid" },
    ],
  },
  COMPANY_TYPE,
  {
    param: "perks",
    title: "Additional Benefits",
    kind: "multi",
    facetKey: "perks",
    searchable: true,
    options: [
      { value: "Certificate", label: "Certificate" },
      { value: "Letter of Recommendation", label: "Letter of Recommendation" },
      { value: "Flexible Hours", label: "Flexible Hours" },
      { value: "Training", label: "Training" },
      { value: "Mentorship", label: "Mentorship" },
      { value: "Accommodation", label: "Accommodation" },
      { value: "Travel Allowance", label: "Travel Allowance" },
    ],
  },
];

export const JOB_SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "salary_desc", label: "Salary: High to Low" },
  { value: "salary_asc", label: "Salary: Low to High" },
  { value: "deadline", label: "Deadline: Soonest" },
];

export const INTERNSHIP_SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "stipend_desc", label: "Stipend: High to Low" },
  { value: "stipend_asc", label: "Stipend: Low to High" },
  { value: "deadline", label: "Deadline: Soonest" },
];

// Every query key a listing page owns — used to clear/serialise URL state.
export const filterParamKeys = (filters) =>
  filters.flatMap((filter) =>
    filter.kind === "range" ? [filter.minParam, filter.maxParam] : [filter.param],
  );

// Canonical options merged with whatever the API facets actually contain, so
// real admin-entered values show up even when they aren't in the list above.
export const mergeFacetOptions = (filter, facets) => {
  const facetValues = (filter.facetKey && facets?.[filter.facetKey]) || [];
  const counts = new Map(facetValues.map((entry) => [String(entry.value).toLowerCase(), entry.count]));
  const seen = new Set();

  const base = (filter.options || []).map((option) => {
    seen.add(option.value.toLowerCase());
    return { ...option, count: counts.get(option.value.toLowerCase()) ?? 0 };
  });

  const extras = facetValues
    .filter((entry) => !seen.has(String(entry.value).toLowerCase()))
    .slice(0, 12)
    .map((entry) => ({ value: entry.value, label: entry.value, count: entry.count }));

  return [...base, ...extras];
};
