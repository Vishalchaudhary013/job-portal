import jsPDF from "jspdf";

/**
 * Render one TemplateResponse to a PDF that mirrors how the form was built:
 * fields flow in the same 1- / 2-column layout (`field.width === "half"` ⇒ half width),
 * with the question label on top and the submitted answer underneath.
 *
 * Text-based (not a screenshot) so the output stays selectable, searchable and
 * paginates cleanly across pages.
 */

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 15;
const MARGIN_TOP = 18;
const MARGIN_BOTTOM = 16;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const COL_GAP = 8;
const HALF_W = (CONTENT_W - COL_GAP) / 2;

const LABEL_LH = 4.6; // mm per line at 10pt
const VALUE_LH = 4.6;
const LABEL_VALUE_GAP = 1.6;
const ROW_GAP = 6;
const SIG_H = 20;

// Layout-only fields never carry an answer.
const SKIP_TYPES = ["bannerUpload", "pdfUpload", "carouselUpload"];

const basename = (p) => {
  const s = String(p || "");
  return s.split("/").pop() || s;
};

const isSignatureDataUrl = (v) => typeof v === "string" && v.startsWith("data:image");

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") {
    if (value.label) return String(value.label);
    if (value.fileName) return String(value.fileName);
    if (value.cells && typeof value.cells === "object") {
      // table field — flatten to "row: a, b, c" lines
      return Object.values(value.cells)
        .map((row) => Object.values(row || {}).filter(Boolean).join(", "))
        .filter(Boolean)
        .join("\n");
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const formatDateTime = (d) => {
  try {
    return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
};

const safeFileName = (name) =>
  (name || "response").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_") || "response";

// Pull the stored answer for a field, tolerating id- or name-keyed storage.
const answerFor = (field, response, index) => {
  const keys = [field.id, field.name, String(index)].filter(Boolean);
  for (const k of keys) {
    if (response?.files && response.files[k] != null) return { filePath: response.files[k] };
  }
  for (const k of keys) {
    if (response?.data && response.data[k] !== undefined) return { raw: response.data[k] };
  }
  return {};
};

// Measure a single cell so a row can be sized to its tallest column and
// page breaks can be decided before anything is drawn.
const measureCell = (pdf, field, response, index) => {
  const width = field.width === "half" ? HALF_W : CONTENT_W;
  const label = (field.label || field.name || `Field ${index + 1}`) + (field.required ? " *" : "");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  const labelLines = pdf.splitTextToSize(label, width);

  const { filePath, raw } = answerFor(field, response, index);
  let valueLines = [];
  let signature = null;

  if (filePath) {
    pdf.setFont("helvetica", "normal");
    valueLines = pdf.splitTextToSize(basename(filePath), width);
  } else if (isSignatureDataUrl(raw)) {
    signature = raw;
  } else {
    pdf.setFont("helvetica", "normal");
    valueLines = pdf.splitTextToSize(formatValue(raw), width);
  }

  const height =
    labelLines.length * LABEL_LH +
    LABEL_VALUE_GAP +
    (signature ? SIG_H : valueLines.length * VALUE_LH);

  return { width, labelLines, valueLines, signature, height };
};

const drawCell = (pdf, cell, x, top) => {
  let y = top;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(17, 24, 39);
  cell.labelLines.forEach((line) => {
    pdf.text(line, x, y, { baseline: "top" });
    y += LABEL_LH;
  });

  y += LABEL_VALUE_GAP;
  pdf.setTextColor(55, 65, 81);

  if (cell.signature) {
    try {
      pdf.addImage(cell.signature, "PNG", x, y, Math.min(60, cell.width), SIG_H, undefined, "FAST");
    } catch {
      pdf.setFont("helvetica", "italic");
      pdf.text("[signature]", x, y, { baseline: "top" });
    }
    return;
  }

  pdf.setFont("helvetica", "normal");
  cell.valueLines.forEach((line) => {
    pdf.text(line, x, y, { baseline: "top" });
    y += VALUE_LH;
  });
};

export const exportTemplateResponsePdf = (template, response) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const fields = (template?.fields || []).filter((f) => !SKIP_TYPES.includes(f.type));

  let y = MARGIN_TOP;

  // ---- Header ----
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.splitTextToSize(template?.name || "Form response", CONTENT_W).forEach((line) => {
    pdf.text(line, MARGIN_X, y, { baseline: "top" });
    y += 7;
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Submitted ${formatDateTime(response?.createdAt)}`, MARGIN_X, y, { baseline: "top" });
  y += 6;

  pdf.setDrawColor(226, 232, 240);
  pdf.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
  y += 6;

  // ---- Fields, flowed into rows of at most 12 grid units ----
  const flushRow = (cells) => {
    if (!cells.length) return;
    const rowHeight = Math.max(...cells.map((c) => c.height));

    if (y + rowHeight > PAGE_H - MARGIN_BOTTOM) {
      pdf.addPage();
      y = MARGIN_TOP;
    }

    cells.forEach((cell, i) => {
      const x = cell.width === CONTENT_W ? MARGIN_X : MARGIN_X + i * (HALF_W + COL_GAP);
      drawCell(pdf, cell, x, y);
    });

    y += rowHeight + ROW_GAP;
  };

  let row = [];
  let rowUnits = 0;

  fields.forEach((field, index) => {
    const units = field.width === "half" ? 6 : 12;
    if (rowUnits + units > 12) {
      flushRow(row);
      row = [];
      rowUnits = 0;
    }
    row.push(measureCell(pdf, field, response, index));
    rowUnits += units;
  });
  flushRow(row);

  pdf.save(`${safeFileName(template?.name)}-response.pdf`);
};
