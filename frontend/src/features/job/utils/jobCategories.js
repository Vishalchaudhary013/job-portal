// Fallback copy of the backend's built-in job categories
// (backend/constants/jobCategories.js). The live list comes from
// GET /api/custom-categories?opportunityType=Jobs, which also carries whatever
// categories admins have added since; this is only what renders if that request
// fails, so the Department/Category dropdown is never empty.
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

// Same arrangement for the "Jobs by City" dropdown: the live list comes from
// GET /api/custom-categories?opportunityType=Job%20Cities, this is the fallback.
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
