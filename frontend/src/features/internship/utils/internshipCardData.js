const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const resolveCurrencySymbol = (currency) => {
  const normalized = String(currency || "")
    .trim()
    .toUpperCase();

  if (normalized === "INR" || normalized === "RS") {
    return "₹";
  }

  if (normalized === "USD") {
    return "$";
  }

  if (normalized === "EUR") {
    return "€";
  }

  if (normalized === "GBP") {
    return "£";
  }

  return normalized ? `${normalized} ` : "₹";
};

const hasCurrencyIndicator = (value) =>
  /₹|\$|€|£|\bINR\b|\bUSD\b|\bEUR\b|\bGBP\b|\bRs\.?\b/i.test(
    String(value || ""),
  );

const hasUnpaidKeyword = (value) =>
  /\bunpaid\b|\bno\s*stipend\b|\bno\s*pay\b|\bwithout\s*stipend\b|\bfree\b|\bvolunteer\b/i.test(
    String(value || ""),
  );

const formatAmount = (value) => {
  const numericValue = Number(
    String(value || "")
      .replace(/,/g, "")
      .trim(),
  );

  if (!Number.isFinite(numericValue)) {
    return String(value || "");
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const isUnpaidInternship = (item) => {
  const stipendType = String(item?.stipendType || "")
    .trim()
    .toLowerCase();
  const stipendText = String(item?.stipend || "").trim();
  const details = item?.stipendDetails || {};
  const min = Number(details.min);
  const max = Number(details.max);
  const numericStipend = Number(stipendText.replace(/[^\d.]/g, ""));
  const hasExplicitNumericStipend =
    Number.isFinite(numericStipend) && numericStipend > 0;

  if (hasExplicitNumericStipend) {
    return false;
  }

  if (stipendType === "unpaid") {
    return true;
  }

  if (hasUnpaidKeyword(stipendText)) {
    return true;
  }

  if (stipendText === "0" || stipendText === "₹0" || stipendText === "$0") {
    return true;
  }

  if (Number.isFinite(min) && Number.isFinite(max) && min === 0 && max === 0) {
    return true;
  }

  return false;
};

export const resolveWorkMode = (item) => {
  const workMode = String(item?.workMode || "").trim();

  if (workMode) {
    return workMode;
  }

  const normalizedLocation = String(item?.location || "").toLowerCase();

  if (normalizedLocation.includes("remote")) {
    return "Remote";
  }

  if (normalizedLocation.includes("hybrid")) {
    return "Hybrid";
  }

  return "In Office";
};

export const getInternshipTags = (item) => {
  const explicitTags = normalizeArray(item?.frontendTags?.length ? item?.frontendTags : item?.cardTags);

  if (explicitTags.length) {
    return explicitTags;
  }

  const skillTags = normalizeArray(item?.skills).slice(0, 2);
  const durationTag = String(item?.duration || "").trim();

  return durationTag ? [...skillTags, durationTag] : skillTags;
};

export const formatStipendText = (item) => {
  if (isUnpaidInternship(item)) {
    return "No stipend";
  }

  const stipendText = String(item?.stipend || "").trim();
  const details = item?.stipendDetails || {};
  const min = Number(details.min);
  const max = Number(details.max);
  const symbol = resolveCurrencySymbol(details.currency || "INR");

  if (stipendText && stipendText.toLowerCase() !== "not disclosed") {
    const normalizedText = stipendText
      .replace(/\bINR\b/gi, "₹")
      .replace(/\bRs\.?\b/gi, "₹");

    const rangeMatches = normalizedText.match(/\d+(?:\.\d+)?/g) || [];
    const hasRangeSeparator = /\s[-–]\s|\bto\b/i.test(normalizedText);

    if (hasRangeSeparator && rangeMatches.length >= 2) {
      const lastMatch = rangeMatches[rangeMatches.length - 1];
      const lastMatchIndex = normalizedText.lastIndexOf(lastMatch);
      const rangeSuffix =
        lastMatchIndex >= 0
          ? normalizedText.slice(lastMatchIndex + lastMatch.length)
          : "";

      return `${symbol}${formatAmount(rangeMatches[rangeMatches.length - 1])}${rangeSuffix}`.trim();
    }

    const formattedText = normalizedText.replace(
      /(\d[\d,]*(?:\.\d+)?)/g,
      (match) => formatAmount(match),
    );

    if (hasCurrencyIndicator(normalizedText)) {
      return formattedText;
    }

    const matches = normalizedText.match(/\d+(?:\.\d+)?/g) || [];

    if (matches.length >= 2) {
      return `₹${formatAmount(matches[0])}`;
    }

    if (matches.length === 1) {
      return `₹${formatAmount(matches[0])}`;
    }

    if (normalizedText) {
      return normalizedText;
    }
  }

  if (Number.isFinite(min) && Number.isFinite(max) && (min > 0 || max > 0)) {
    return `${symbol}${formatAmount(max)}`;
  }

  return "Not disclosed";
};

export const formatStipendPeriod = (item) => {
  if (isUnpaidInternship(item)) {
    return "Unpaid internship";
  }

  const details = item?.stipendDetails || {};
  return (
    String(details.period || "Compensation details").trim() ||
    "Compensation details"
  );
};

export const formatDeadlineLabel = (deadline) => {
  if (!deadline) {
    return "N/A";
  }

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDeadlineStatus = (deadline) => {
  if (!deadline) {
    return "No deadline";
  }

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const daysLeft = Math.ceil((date.getTime() - today.getTime()) / 86400000);

  if (daysLeft < 0) {
    return "Closed";
  }

  if (daysLeft === 0) {
    return "Last day";
  }

  if (daysLeft === 1) {
    return "1 day left";
  }

  return `${daysLeft} days left`;
};

export const isInternshipOpen = (item) => {
  const deadline = item?.deadline;

  if (!deadline) {
    return true;
  }

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date.getTime() >= today.getTime();
};
