// Built-in "Jobs by Category" list shown on the portal and in the admin Job
// form's Department/Category dropdown.
//
// These are not an enum: `departmentCategory` on the opportunity schema stays a
// free string, and these titles are seeded into the CustomCategory collection
// (see customCategoryController.ensureDefaultCategories) so an admin can add any
// other category on top of them without a code change.
export const DEFAULT_JOB_CATEGORIES = [
  "House Keeping",
  "Technician",
  "Labourer",
  "Driver",
  "Delivery",
  "Retail / Counter Sales",
  "BPO / Customer Care",
  "Field Sales",
  "Engineer (Civil/Mechanical etc)",
  "Warehouse & Logistics",
  "Operations",
  "Digital Marketing",
  "Pharmacy / Clinic / Nursing / Medical",
  "Human Resource",
  "IT",
  "Marketing",
  "Teacher",
  "Procurement",
  "Creative Content",
  "Counsellor",
  "Sales",
  "Hospitality/Cook/Baker",
  "Automobile",
];

// Cities for the "Jobs by City" navbar dropdown. Stored in the same collection
// under their own opportunityType, so admins add a city exactly the way they add
// a category. A city links to the listing's `location` filter, which matches
// location / cityState / headquarters case-insensitively — nothing here has to
// line up with how a job's city was typed.
export const DEFAULT_JOB_CITIES = [
  "Bengaluru",
  "Varanasi",
  "Navi Mumbai",
  "Kolkata",
  "Thane",
  "Ranchi",
  "Pune",
  "Jaipur",
  "Raipur",
  "Noida",
  "Agra",
  "Tripura",
  "Chennai",
  "Bhubaneswar",
  "Nashik",
  "Mumbai",
  "Lucknow",
  "Kota",
  "Amritsar",
  "Bhadohi",
  "Visakhapatnam",
  "Hyderabad",
  "Ludhiana",
  "Jamshedpur",
];

// Keyed by the `opportunityType` a CustomCategory is stored under. "Jobs" is the
// opportunity type on the opportunity documents; "Job Cities" is a list of its
// own that no opportunity is typed with. Internship, Apprenticeships and the
// rest have no built-ins — their categories come purely from what admins create.
export const DEFAULT_CATEGORIES_BY_TYPE = {
  Jobs: DEFAULT_JOB_CATEGORIES,
  "Job Cities": DEFAULT_JOB_CITIES,
};
