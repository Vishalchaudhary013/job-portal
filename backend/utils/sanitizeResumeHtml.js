import sanitizeHtml from "sanitize-html";

// Authoritative server-side cleanup for the rich-text "Description" fields the
// resume builder now stores as HTML (Experience/Projects description,
// Professional Summary). `resumeData` is an unvalidated Mixed blob on the
// Mongoose model, so this is the one place that guarantees a student can't
// persist a <script>/onerror= payload that would later execute in their own
// (or an admin's) browser when the resume preview/PDF renders it.
const SANITIZE_OPTIONS = {
  allowedTags: ["b", "strong", "i", "em", "u", "s", "strike", "ul", "ol", "li", "a", "p", "br", "div", "span"],
  allowedAttributes: { a: ["href", "target", "rel"], span: ["style"], div: ["style"] },
  allowedStyles: {
    "*": {
      "text-align": [/^left$|^right$|^center$|^justify$/],
      color: [/^#[0-9a-f]{3,6}$/i, /^rgba?\([\d\s,.%]+\)$/i],
      "text-decoration": [/^underline$|^line-through$|^none$/],
      "background-color": [/^#[0-9a-f]{3,6}$/i, /^rgba?\([\d\s,.%]+\)$/i],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
};

const clean = (value) => (typeof value === "string" && value ? sanitizeHtml(value, SANITIZE_OPTIONS) : value);

// Mutates and returns the same resumeData object — only the fields the rich
// text editor actually writes to are touched, everything else (plain-string
// inputs, skill/achievement arrays, etc.) is left exactly as sent.
export const sanitizeResumeData = (resumeData) => {
  if (!resumeData || typeof resumeData !== "object") return resumeData;

  if (typeof resumeData.summary === "string") {
    resumeData.summary = clean(resumeData.summary);
  }

  if (Array.isArray(resumeData.experience)) {
    resumeData.experience.forEach((item) => {
      if (item && typeof item.description === "string") item.description = clean(item.description);
    });
  }

  if (Array.isArray(resumeData.projects)) {
    resumeData.projects.forEach((item) => {
      if (item && typeof item.description === "string") item.description = clean(item.description);
    });
  }

  return resumeData;
};

export default sanitizeResumeData;
