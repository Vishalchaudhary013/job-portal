import { createId } from "./ids.js";

// Presentation registries for the Card Builder and Detail Page Builder.
// Card/page schemas only store *configuration* — which fields appear, where and
// how — never content values. Every field reference is a stable field ID that
// Edeco resolves against the published form schema at render time.

// Icons are a closed vocabulary: Edeco maps each name to its own icon set, so
// the Form Builder never ships arbitrary markup to the portal.
export const ICON_NAMES = [
  "none", "location", "calendar", "clock", "money", "users", "briefcase", "tag", "star",
  "link", "info", "building", "globe", "book", "award", "mail", "phone", "check",
];

export const TONES = ["neutral", "primary", "success", "warning", "danger", "info"];

// Card

export const CARD_ZONES = [
  { id: "media", label: "Media", hint: "Top image or logo" },
  { id: "header", label: "Header", hint: "Badges, logo, small labels" },
  { id: "body", label: "Body", hint: "Title, description, details" },
  { id: "footer", label: "Footer", hint: "Metadata next to the action" },
];

// `accepts` lists the field types a display makes sense for ("*" = any).
export const CARD_DISPLAYS = {
  image: { label: "Image", accepts: ["image"], zones: ["media", "header", "body"] },
  logo: { label: "Logo / avatar", accepts: ["image"], zones: ["header", "body", "media"] },
  heading: { label: "Heading", accepts: ["text", "textarea", "number", "select", "radio", "email", "url", "phone"] },
  subheading: { label: "Subheading", accepts: ["text", "textarea", "select", "radio", "number", "date", "datetime"] },
  text: { label: "Text", accepts: ["*"] },
  badge: { label: "Badge", accepts: ["text", "select", "radio", "number", "checkbox", "date"] },
  tags: { label: "Tags", accepts: ["multiSelect", "checkbox", "select", "text", "repeater", "table"] },
  meta: { label: "Meta (icon + value)", accepts: ["*"] },
  price: { label: "Price / amount", accepts: ["number", "text"] },
  rating: { label: "Rating stars", accepts: ["rating", "number"] },
  date: { label: "Date", accepts: ["date", "datetime"] },
};

export const defaultDisplayFor = (fieldType) =>
  ({
    image: "image",
    multiSelect: "tags",
    rating: "rating",
    date: "date",
    datetime: "date",
    select: "badge",
    radio: "badge",
    richText: "text",
    textarea: "text",
  })[fieldType] || "text";

export const createCardElement = ({ fieldId = null, fieldType = "text", zone = "body", source = "field" } = {}) => ({
  id: createId("crd"),
  source, // "field" | "static"
  fieldId,
  text: "",
  zone,
  display: source === "static" ? "badge" : defaultDisplayFor(fieldType),
  label: "",
  showLabel: false,
  prefix: "",
  suffix: "",
  icon: "none",
  tone: "neutral",
  toneMap: {}, // value -> tone, e.g. { open: "success", closed: "danger" }
  lines: 2,
  visible: true,
  hideWhenEmpty: true,
});

export const createCardSchema = () => ({
  layout: "vertical", // vertical | horizontal
  elements: [],
  style: {
    padding: "md", // sm | md | lg
    align: "left", // left | center
    gap: "normal", // tight | normal | relaxed
    imageAspect: "16/9", // 16/9 | 4/3 | 1/1 | 3/2
    imageFit: "cover", // cover | contain
    radius: "sm", // fixed small radius (design system)
    shadow: "none", // no shadows (design system)
    border: true,
  },
  action: {
    type: "detail", // detail | fieldUrl | url | form | none
    label: "View details",
    url: "",
    fieldId: null,
    formSlug: "",
    newTab: false,
    style: "primary", // primary | secondary | link
    wholeCardClickable: true,
  },
});

// Detail page

export const PAGE_BLOCKS = {
  hero: {
    label: "Hero",
    icon: "PanelTop",
    description: "Title area with image, badges and key facts",
    defaults: { variant: "banner", titleFieldId: null, subtitleFieldId: null, imageFieldId: null, logoFieldId: null, badgeFieldIds: [], metaFieldIds: [], buttons: [] },
  },
  field: {
    label: "Single field",
    icon: "TextCursorInput",
    description: "Render one field automatically by its type",
    defaults: { fieldId: null },
  },
  fieldList: {
    label: "Field list",
    icon: "ListTree",
    description: "Label / value pairs or fact cards",
    defaults: { variant: "list", columns: 2, items: [] },
  },
  text: {
    label: "Text block",
    icon: "Type",
    description: "Static text written here",
    defaults: { content: "", tone: "normal" },
  },
  richText: {
    label: "Rich text",
    icon: "PilcrowSquare",
    description: "Formatted text from a field",
    defaults: { fieldId: null },
  },
  image: {
    label: "Image",
    icon: "Image",
    description: "An image field or a fixed image URL",
    defaults: { fieldId: null, url: "", alt: "", aspect: "auto", fit: "cover" },
  },
  gallery: {
    label: "Gallery",
    icon: "GalleryHorizontal",
    description: "Grid of images from a multi-image field",
    defaults: { fieldId: null, columns: 3 },
  },
  video: {
    label: "Video",
    icon: "Video",
    description: "Embed a video field",
    defaults: { fieldId: null },
  },
  list: {
    label: "List",
    icon: "List",
    description: "Bullets, checks or chips from a list-like field",
    defaults: { fieldId: null, variant: "bullets" },
  },
  table: {
    label: "Table",
    icon: "Table",
    description: "Table or repeater field as a table",
    defaults: { fieldId: null },
  },
  faq: {
    label: "FAQ",
    icon: "MessagesSquare",
    description: "Questions and answers",
    defaults: { fieldId: null, items: [] },
  },
  tabs: {
    label: "Tabs",
    icon: "Columns3",
    description: "Each child block becomes a tab",
    container: true,
    defaults: {},
  },
  accordion: {
    label: "Accordion",
    icon: "ChevronsUpDown",
    description: "Each child block becomes a collapsible panel",
    container: true,
    defaults: { openFirst: true },
  },
  group: {
    label: "Group",
    icon: "Boxes",
    description: "Box several blocks together",
    container: true,
    defaults: { columns: 1, boxed: true },
  },
  related: {
    label: "Related content",
    icon: "LayoutGrid",
    description: "Cards for other published entries",
    defaults: { limit: 3, matchFieldId: null },
  },
  buttons: {
    label: "Buttons / links",
    icon: "MousePointerClick",
    description: "Call-to-action buttons",
    defaults: { buttons: [], align: "left" },
  },
  divider: {
    label: "Divider",
    icon: "Minus",
    description: "A horizontal rule",
    defaults: {},
  },
};

export const BUTTON_ACTIONS = [
  { id: "url", label: "Fixed URL" },
  { id: "fieldUrl", label: "URL from a field" },
  { id: "form", label: "Open a response form" },
  { id: "share", label: "Share page" },
];

export const createPageButton = () => ({
  id: createId("btn"),
  label: "Learn more",
  action: "url",
  url: "",
  fieldId: null,
  formSlug: "",
  style: "primary",
  newTab: false,
});

export const createPageBlock = (type) => {
  const def = PAGE_BLOCKS[type];
  if (!def) throw new Error(`Unknown block type "${type}".`);
  return {
    id: createId("blk"),
    type,
    title: ["divider", "hero"].includes(type) ? "" : def.label,
    showTitle: !["divider", "hero", "buttons"].includes(type),
    area: "main", // main | sidebar
    visible: true,
    hideWhenEmpty: true,
    config: JSON.parse(JSON.stringify(def.defaults)),
    ...(def.container ? { children: [] } : {}),
  };
};

export const createPageSchema = () => ({
  layout: {
    width: "default", // narrow | default | wide
    sidebar: "none", // none | right | left
    background: "tinted", // plain | tinted
  },
  seo: { titleFieldId: null, descriptionFieldId: null, imageFieldId: null },
  blocks: [],
});

// Presentation (how Edeco lists/searches a content type)

export const createPresentationSettings = () => ({
  heading: "", // listing page heading (falls back to the content type name)
  intro: "", // short text under the heading
  titleFieldId: null, // which field is the entry's title (admin lists, SEO, slugs)
  slugFieldId: null, // which field the URL slug is generated from (defaults to title)
  listing: {
    view: "grid", // grid | list
    columns: 3, // 2 | 3 | 4
    pageSize: 12,
    searchable: true,
    searchableFieldIds: [],
    filterableFieldIds: [],
    sortFieldId: null, // null = newest published first
    sortDirection: "desc",
    emptyMessage: "Nothing here yet — check back soon.",
  },
  showInNavigation: false,
  navLabel: "",
  // Show entries on Edeco's own job pages (homepage cards, /jobs, detail
  // page) as that listing's records. target: "" | "Jobs" | "Internship" | "Apprenticeships";
  // fields: { slotId: fieldId } — see opportunityMapping.js.
  edecoListing: { target: "", fields: {} },
});

// Field IDs referenced by a card or page schema — used to warn when a form
// change would orphan a presentation reference.
export const referencedFieldIds = (cardSchema, pageSchema) => {
  const ids = new Set();
  const add = (id) => id && ids.add(id);
  (cardSchema?.elements || []).forEach((element) => add(element.fieldId));
  add(cardSchema?.action?.fieldId);
  const visitBlocks = (blocks = []) =>
    blocks.forEach((block) => {
      const config = block.config || {};
      ["fieldId", "titleFieldId", "subtitleFieldId", "imageFieldId", "logoFieldId", "matchFieldId"].forEach((name) => add(config[name]));
      (config.badgeFieldIds || []).forEach(add);
      (config.metaFieldIds || []).forEach(add);
      (config.items || []).forEach((item) => add(item.fieldId));
      (config.buttons || []).forEach((button) => add(button.fieldId));
      visitBlocks(block.children);
    });
  visitBlocks(pageSchema?.blocks);
  Object.values(pageSchema?.seo || {}).forEach(add);
  return ids;
};

// Shape checks for card/page/presentation drafts. They return a list of
// problems (empty = OK); they don't validate field references, because a
// reference to a field that was later removed must keep rendering as "empty"
// rather than block saving.
const MAX_CARD_ELEMENTS = 60;
const MAX_PAGE_BLOCKS = 150;
const MAX_BLOCK_DEPTH = 3;

export const validateCardSchema = (card) => {
  const problems = [];
  if (!card || typeof card !== "object") return ["Card configuration must be an object."];
  if (!Array.isArray(card.elements)) problems.push("Card elements must be a list.");
  else {
    if (card.elements.length > MAX_CARD_ELEMENTS) problems.push(`A card can have at most ${MAX_CARD_ELEMENTS} elements.`);
    const zones = CARD_ZONES.map((zone) => zone.id);
    card.elements.forEach((element, index) => {
      if (!element?.id) problems.push(`Card element ${index + 1} is missing an id.`);
      if (!zones.includes(element?.zone)) problems.push(`Card element ${index + 1} has an unknown zone.`);
      if (!CARD_DISPLAYS[element?.display]) problems.push(`Card element ${index + 1} has an unknown display.`);
    });
  }
  if (card.action && !["detail", "fieldUrl", "url", "form", "none"].includes(card.action.type)) problems.push("Unknown card action.");
  return problems;
};

export const validatePageSchema = (page) => {
  const problems = [];
  if (!page || typeof page !== "object") return ["Page configuration must be an object."];
  if (!Array.isArray(page.blocks)) return ["Page blocks must be a list."];
  let count = 0;
  const visit = (blocks, depth) => {
    if (depth > MAX_BLOCK_DEPTH) {
      problems.push(`Blocks can be nested at most ${MAX_BLOCK_DEPTH} levels deep.`);
      return;
    }
    blocks.forEach((block) => {
      count += 1;
      const def = PAGE_BLOCKS[block?.type];
      if (!def) problems.push(`Unknown block type "${block?.type}".`);
      if (!block?.id) problems.push("Every block needs an id.");
      if (Array.isArray(block?.children)) {
        if (!def?.container) problems.push(`"${def?.label || block?.type}" blocks can't contain other blocks.`);
        visit(block.children, depth + 1);
      }
    });
  };
  visit(page.blocks, 1);
  if (count > MAX_PAGE_BLOCKS) problems.push(`A page can have at most ${MAX_PAGE_BLOCKS} blocks.`);
  return problems;
};

export const validatePresentationSettings = (settings) => {
  if (!settings || typeof settings !== "object") return ["Presentation settings must be an object."];
  const problems = [];
  const pageSize = Number(settings.listing?.pageSize);
  if (settings.listing && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 48)) problems.push("Page size must be between 1 and 48.");
  return problems;
};
