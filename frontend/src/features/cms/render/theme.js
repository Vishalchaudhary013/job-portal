// import {
//   FiAward,
//   FiBookOpen,
//   FiBriefcase,
//   FiCalendar,
//   FiCheckCircle,
//   FiClock,
//   FiGlobe,
//   FiInfo,
//   FiLink,
//   FiMail,
//   FiMapPin,
//   FiPhone,
//   FiStar,
//   FiTag,
//   FiUsers,
// } from "react-icons/fi";
// import { BiBuildings, BiRupee } from "react-icons/bi";
import {
  LuAward,
  LuBookOpen,
  LuBriefcaseBusiness,
  LuBuilding2,
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuGlobe,
  LuInfo,
  LuLink,
  LuMail,
  LuMapPin,
  LuPhone,
  LuStar,
  LuTag,
  LuUsers,
  LuWallet,
} from "react-icons/lu";

// Edeco's design vocabulary for Form Builder output. The Form Builder only
// picks names from these closed sets; how each looks is decided here — using
// the same icon set, colours and shapes as the Jobs / Internship pages, so
// Form Builder content is indistinguishable from the rest of the site.

// export const ICONS = {
//   location: FiMapPin, calendar: FiCalendar, clock: FiClock, money: BiRupee, users: FiUsers,
//   briefcase: FiBriefcase, tag: FiTag, star: FiStar, link: FiLink, info: FiInfo, building: BiBuildings,
//   globe: FiGlobe, book: FiBookOpen, award: FiAward, mail: FiMail, phone: FiPhone, check: FiCheckCircle,
// };
export const ICONS = {
  location: LuMapPin,
  calendar: LuCalendar,
  clock: LuClock,
  money: LuWallet,
  users: LuUsers,
  briefcase: LuBriefcaseBusiness,
  tag: LuTag,
  star: LuStar,
  link: LuLink,
  info: LuInfo,
  building: LuBuilding2,
  globe: LuGlobe,
  book: LuBookOpen,
  award: LuAward,
  mail: LuMail,
  phone: LuPhone,
  check: LuCircleCheck,
};

// When a hero/summary value has no icon configured, pick one from the field's
// type so the summary card still reads like the Jobs page's.
export const iconForField = (ref) => {
  if (!ref) return LuInfo;
  const hint = `${ref.key} ${ref.label}`.toLowerCase();
  if (ref.type === "date" || ref.type === "datetime") return LuCalendar;
  if (/(location|city|venue|address|place)/.test(hint)) return LuMapPin;
  if (/(salary|price|fee|stipend|cost|pay)/.test(hint)) return LuWallet;
  if (/(duration|time|hours)/.test(hint)) return LuClock;
  if (/(opening|seat|people|size|team)/.test(hint)) return LuUsers;
  if (/(company|employer|organi[sz]ation|host)/.test(hint)) return LuBuilding2;
  if (/(mode|format|remote)/.test(hint)) return LuGlobe;
  if (/(experience|level|type)/.test(hint)) return LuBriefcaseBusiness;
  return LuInfo;
};

// Badges follow the Jobs page: a filled coral chip; "soft" tones become the
// outlined variant (like FEATURED) so a second badge never competes.
// export const TONE_CLASSES = {
//   neutral: "bg-slate-100 text-slate-700",
//   primary: "bg-[#1F2853]/10 text-[#1F2853]",
//   success: "bg-emerald-100 text-emerald-700",
//   warning: "bg-amber-100 text-amber-800",
//   danger: "bg-red-100 text-red-700",
//   info: "bg-blue-100 text-blue-700",
// };
export const TONE_CLASSES = {
  neutral: "bg-secondary text-white",
  primary: "bg-secondary text-white",
  danger: "bg-secondary text-white",
  success: "border border-secondary/40 text-secondary",
  warning: "border border-secondary/40 text-secondary",
  info: "border border-secondary/40 text-secondary",
};

// Buttons as on the detail pages: coral fill for the main action, navy outline
// for secondary ones; uppercase, small radius, no shadow.
// export const BUTTON_CLASSES = {
//   primary: "bg-[#1F2853] text-white hover:bg-[#2a3670]",
//   secondary: "bg-white text-[#1F2853] border border-[#1F2853]/20 hover:bg-slate-50",
//   accent: "bg-[#FF4E45] text-white hover:bg-[#e8443c]",
//   link: "text-[#1F2853] underline-offset-4 hover:underline px-0",
// };
export const BUTTON_CLASSES = {
  primary: "bg-secondary text-white hover:bg-secondary/90",
  accent: "bg-secondary text-white hover:bg-secondary/90",
  secondary: "border border-primary text-primary hover:bg-primary/5",
  link: "px-0 text-primary underline-offset-4 hover:text-secondary hover:underline",
};

export const ASPECT_CLASSES = {
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
  auto: "",
};

export const PAD_CLASSES = { sm: "p-3", md: "p-4", lg: "p-6" };
export const GAP_CLASSES = { tight: "gap-1.5", normal: "gap-2.5", relaxed: "gap-4" };
export const RADIUS_CLASSES = { none: "rounded-sm", sm: "rounded-sm", md: "rounded-sm", lg: "rounded-sm" };
export const SHADOW_CLASSES = { none: "", sm: "", md: "" };

// The rich-text look used everywhere Form Builder HTML is shown — the same
// black 15px copy and disc lists as the job description on the Jobs pages.
// export const PROSE_CLASSES =
//   "text-[15px] leading-relaxed text-slate-700 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_a]:text-[#1F2853] [&_a]:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h4]:font-semibold [&_h4]:mt-3 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded-sm [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-sm [&_pre]:overflow-x-auto [&_hr]:my-4";
export const PROSE_CLASSES =
  "space-y-2 text-[15px] leading-relaxed text-black [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_li]:marker:text-black [&_a]:text-primary [&_a]:underline [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:text-primary [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-primary [&_h4]:font-bold [&_h4]:text-primary [&_blockquote]:border-l-4 [&_blockquote]:border-black/10 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded-sm [&_code]:bg-primary/5 [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-sm [&_pre]:bg-primary [&_pre]:p-3 [&_pre]:text-white [&_hr]:my-4 [&_hr]:border-black/10";
