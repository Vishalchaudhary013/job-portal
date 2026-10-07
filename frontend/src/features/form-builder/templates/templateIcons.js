import {
  FiBook,
  FiAward,
  FiTool,
  FiLayers,
  FiBookOpen,
  FiCompass,
  FiFeather,
  FiFileText,
  FiLayout,
  FiBriefcase,
} from "react-icons/fi";

export const TEMPLATE_CATEGORY_ICONS = {
  "10th": FiBook,
  "12th": FiAward,
  iti: FiTool,
  diploma: FiLayers,
  bachelors: FiBookOpen,
  masters: FiCompass,
  phd: FiFeather,
  "job-application": FiBriefcase,
  custom: FiFileText,
};

export const TEMPLATE_ICON_MAP = {
  FiBook,
  FiAward,
  FiTool,
  FiLayers,
  FiBookOpen,
  FiCompass,
  FiFeather,
  FiFileText,
  FiBriefcase,
};

export const getTemplateIcon = (iconKey, category) => {
  return TEMPLATE_ICON_MAP[iconKey] || TEMPLATE_CATEGORY_ICONS[category] || FiFileText;
};

export const CATEGORY_LABELS = {
  all: "All",
  "10th": "10th Student",
  "12th": "12th Student",
  iti: "ITI Student",
  diploma: "Diploma Student",
  bachelors: "Bachelor's Student",
  masters: "Master's Student",
  phd: "PhD Student",
  "job-application": "Job Application",
  custom: "Custom",
};

export const SidebarTemplatesIcon = FiLayout;
