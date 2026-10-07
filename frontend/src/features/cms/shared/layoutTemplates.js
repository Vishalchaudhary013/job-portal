// GENERATED from backend/cms/shared — do not edit here. Run `npm run sync:cms-shared` in backend/.
import { createId } from "./ids.js";
import { CARD_DISPLAYS, createCardElement, createCardSchema, createPageBlock, createPageButton, createPageSchema, defaultDisplayFor } from "./presentation.js";
import { referenceableFields } from "./schemaUtils.js";

// Built-in layout templates for the Card Builder and the Detail Page Builder.
//
// Card and page schemas point at field IDs, and those differ for every form,
// so a template never stores IDs. It names *roles* ("title", "location",
// "price") that are matched against the content type's own fields when the
// template is applied: first by words in each field's key and label, then by
// field type. A role with no matching field is left out, so every template
// works with any form, and the admin can adjust the result afterwards.

// Roles

const wordsOf = (ref) => `${ref.key} ${ref.label}`.toLowerCase().replace(/[^a-z]/g, "");
const isChoiceList = (ref) => ref.type === "multiSelect" || (ref.type === "checkbox" && (ref.field?.options || []).length > 0);
// A logo stretched into a wide cover crops badly, so covers never fall back to one.
const isNotLogo = (ref) => !/logo|avatar|icon|headshot/.test(wordsOf(ref));
// Plain-text fields holding one item per line ("Required skills") read better as a list.
const LIST_WORDS = /skill|tag|topic|keyword|benefit|perk|requirement|eligib|outcome|learn|responsib|dut/;
const isLineList = (ref) => ref.type === "textarea" && LIST_WORDS.test(wordsOf(ref));

// `fallback: true` lets a role take the first unused field of an accepted type
// when no field's key/label contains one of its hints.
export const LAYOUT_ROLES = {
  title: { label: "Title", types: ["text"], hints: ["title", "heading", "name", "role", "position"], fallback: true },
  subtitle: { label: "Organisation / author", types: ["text", "select"], hints: ["company", "employer", "organis", "organiz", "host", "author", "brand", "provider", "university", "institute", "school", "instructor"] },
  logo: { label: "Logo / avatar", types: ["image"], hints: ["logo", "avatar", "profile", "headshot", "icon"] },
  image: { label: "Cover image", types: ["image"], hints: ["cover", "banner", "thumbnail", "image", "photo", "picture", "hero"], fallback: true, accepts: isNotLogo },
  category: { label: "Type / category", types: ["select", "radio"], hints: ["category", "type", "kind", "department", "genre"], fallback: true },
  mode: { label: "Mode / format", types: ["select", "radio"], hints: ["mode", "format", "remote", "delivery"] },
  location: { label: "Location", types: ["text", "select"], hints: ["location", "city", "venue", "address", "place", "where"] },
  date: { label: "Date", types: ["date", "datetime"], hints: ["deadline", "start", "apply", "date", "when", "published"], fallback: true },
  price: { label: "Price / salary", types: ["text", "number"], hints: ["salary", "stipend", "price", "fee", "cost", "pay", "ctc", "amount"] },
  experience: { label: "Experience / level", types: ["select", "radio", "text"], hints: ["experience", "level", "seniority"] },
  count: { label: "Openings / seats", types: ["number"], hints: ["opening", "vacanc", "seat", "capacity", "spots"] },
  summary: { label: "Summary", types: ["textarea", "richText"], hints: ["summary", "excerpt", "intro", "overview", "description", "about", "bio"], fallback: true },
  tags: { label: "Tags", types: ["multiSelect", "checkbox"], hints: ["skill", "tag", "topic", "keyword", "interest"], fallback: true, accepts: isChoiceList },
  rating: { label: "Rating", types: ["rating"], hints: ["rating", "score"], fallback: true },
  link: { label: "Link", types: ["url"], hints: ["apply", "register", "website", "link", "url"], fallback: true },
};

const roleAccepts = (role, ref) => role.types.includes(ref.type) && (!role.accepts || role.accepts(ref));

// Resolves the given roles against a form. Hint matches are assigned first
// for every role (in the order given), fallbacks second, so a broad fallback
// never steals a field another role names explicitly.
export const matchRoles = (fields = [], roleIds = []) => {
  const refs = referenceableFields(fields);
  const used = new Set();
  const matches = {};
  roleIds.forEach((roleId) => {
    const role = LAYOUT_ROLES[roleId];
    if (!role) return;
    for (const hint of role.hints) {
      const ref = refs.find((item) => !used.has(item.id) && roleAccepts(role, item) && wordsOf(item).includes(hint));
      if (ref) {
        matches[roleId] = ref;
        used.add(ref.id);
        return;
      }
    }
  });
  roleIds.forEach((roleId) => {
    const role = LAYOUT_ROLES[roleId];
    if (!role?.fallback || matches[roleId]) return;
    const ref = refs.find((item) => !used.has(item.id) && roleAccepts(role, item));
    if (ref) {
      matches[roleId] = ref;
      used.add(ref.id);
    }
  });
  return { refs, matches, used };
};

// Card templates

const displayFits = (display, fieldType, zone) => {
  const def = CARD_DISPLAYS[display];
  if (!def || (def.zones && !def.zones.includes(zone))) return false;
  return def.accepts.includes("*") || def.accepts.includes(fieldType);
};

// One card element for a matched field (null when the role wasn't matched).
// Falls back to a display the field type supports in that zone.
const cardElement = (ref, zone, display, patch = {}) => {
  if (!ref) return null;
  const base = createCardElement({ fieldId: ref.id, fieldType: ref.type, zone });
  const chosen = displayFits(display, ref.type, zone)
    ? display
    : [defaultDisplayFor(ref.type), "text"].find((candidate) => displayFits(candidate, ref.type, zone)) || "text";
  return { ...base, display: chosen, ...patch };
};

const cardSchema = ({ layout = "vertical", style = {}, action = {}, elements }) => {
  const base = createCardSchema();
  return {
    ...base,
    layout,
    style: { ...base.style, ...style },
    action: { ...base.action, ...action },
    elements: elements.filter(Boolean),
  };
};

export const CARD_TEMPLATES = [
  {
    id: "job-listing",
    name: "Job listing",
    description: "Logo and type badges up top, title and company, then location, pay and experience. Built for jobs, internships and other openings.",
    roles: ["title", "subtitle", "logo", "category", "mode", "location", "price", "experience", "date", "tags"],
    build: (m) =>
      cardSchema({
        style: { padding: "md", gap: "normal" },
        action: { type: "detail", label: "View details", style: "primary", wholeCardClickable: true },
        elements: [
          cardElement(m.logo, "header", "logo"),
          cardElement(m.category, "header", "badge", { tone: "primary" }),
          cardElement(m.mode, "header", "badge"),
          cardElement(m.title, "body", "heading", { lines: 2 }),
          cardElement(m.subtitle, "body", "subheading", { lines: 1 }),
          cardElement(m.location, "body", "meta", { icon: "location" }),
          cardElement(m.price, "body", "meta", { icon: "money" }),
          cardElement(m.experience, "body", "meta", { icon: "briefcase" }),
          cardElement(m.tags, "body", "tags", { lines: 1 }),
          cardElement(m.date, "footer", "date", { icon: "calendar", showLabel: true }),
        ],
      }),
  },
  {
    id: "event",
    name: "Event",
    description: "Cover image with type and format badges, then the date, venue and price. Suits webinars, workshops and meetups.",
    roles: ["title", "image", "category", "mode", "date", "location", "price", "count"],
    build: (m) =>
      cardSchema({
        style: { padding: "md", imageAspect: "16/9", imageFit: "cover" },
        action: { type: "detail", label: "View event", style: "primary", wholeCardClickable: true },
        elements: [
          cardElement(m.image, "media", "image"),
          cardElement(m.category, "header", "badge", { tone: "primary" }),
          cardElement(m.mode, "header", "badge"),
          cardElement(m.title, "body", "heading", { lines: 2 }),
          cardElement(m.date, "body", "meta", { icon: "calendar" }),
          cardElement(m.location, "body", "meta", { icon: "location" }),
          cardElement(m.price, "footer", "price"),
          cardElement(m.count, "footer", "meta", { icon: "users", showLabel: true }),
        ],
      }),
  },
  {
    id: "article",
    name: "Article / blog post",
    description: "Photo on top, a category badge, the headline and a short excerpt, with the author and date underneath.",
    roles: ["title", "image", "category", "summary", "subtitle", "date"],
    build: (m) =>
      cardSchema({
        style: { padding: "md", gap: "relaxed", imageAspect: "3/2", imageFit: "cover" },
        action: { type: "detail", label: "Read more", style: "link", wholeCardClickable: true },
        elements: [
          cardElement(m.image, "media", "image"),
          cardElement(m.category, "header", "badge", { tone: "info" }),
          cardElement(m.title, "body", "heading", { lines: 2 }),
          cardElement(m.summary, "body", "text", { lines: 3 }),
          cardElement(m.subtitle, "footer", "meta", { icon: "users" }),
          cardElement(m.date, "footer", "date", { icon: "calendar" }),
        ],
      }),
  },
  {
    id: "compact-row",
    name: "Compact row",
    description: "Logo beside the text in one short row. Fits many results on screen; works well in a list view.",
    roles: ["title", "subtitle", "logo", "location", "date", "price"],
    build: (m) =>
      cardSchema({
        layout: "horizontal",
        style: { padding: "sm", gap: "tight", imageAspect: "1/1", imageFit: "contain" },
        action: { type: "detail", label: "View", style: "link", wholeCardClickable: true },
        elements: [
          cardElement(m.logo, "media", "logo"),
          cardElement(m.title, "body", "heading", { lines: 1 }),
          cardElement(m.subtitle, "body", "subheading", { lines: 1 }),
          cardElement(m.location, "body", "meta", { icon: "location" }),
          cardElement(m.date, "footer", "date", { icon: "calendar" }),
          cardElement(m.price, "footer", "price"),
        ],
      }),
  },
  {
    id: "profile",
    name: "Profile",
    description: "Centered avatar, name and organisation, a short bio and tags. For mentors, speakers, alumni or partners.",
    roles: ["title", "logo", "subtitle", "summary", "tags", "location"],
    build: (m) =>
      cardSchema({
        style: { padding: "lg", align: "center", gap: "normal" },
        action: { type: "detail", label: "View profile", style: "secondary", wholeCardClickable: true },
        elements: [
          cardElement(m.logo, "header", "logo"),
          cardElement(m.title, "body", "heading", { lines: 1 }),
          cardElement(m.subtitle, "body", "subheading", { lines: 1 }),
          cardElement(m.location, "body", "meta", { icon: "location" }),
          cardElement(m.summary, "body", "text", { lines: 3 }),
          cardElement(m.tags, "footer", "tags", { lines: 1 }),
        ],
      }),
  },
  {
    id: "course",
    name: "Course / product",
    description: "Image, title, rating and a two-line summary, with the price and seats in the footer next to the button.",
    roles: ["title", "image", "category", "rating", "summary", "price", "count"],
    build: (m) =>
      cardSchema({
        style: { padding: "md", imageAspect: "4/3", imageFit: "cover" },
        action: { type: "detail", label: "Learn more", style: "accent", wholeCardClickable: true },
        elements: [
          cardElement(m.image, "media", "image"),
          cardElement(m.category, "header", "badge", { tone: "primary" }),
          cardElement(m.title, "body", "heading", { lines: 2 }),
          cardElement(m.rating, "body", "rating"),
          cardElement(m.summary, "body", "text", { lines: 2 }),
          cardElement(m.price, "footer", "price"),
          cardElement(m.count, "footer", "meta", { icon: "users", showLabel: true }),
        ],
      }),
  },
];

// Detail page templates

const LONG_TYPES = ["richText", "textarea"];
const FACT_TYPES = ["text", "number", "select", "radio", "date", "datetime", "email", "phone", "url", "rating"];
const TABLE_TYPES = ["table", "repeater"];

const iconFor = (ref) => {
  const words = wordsOf(ref);
  if (ref.type === "date" || ref.type === "datetime") return "calendar";
  if (ref.type === "email") return "mail";
  if (ref.type === "phone") return "phone";
  if (ref.type === "url") return "link";
  if (/location|city|venue|address|place/.test(words)) return "location";
  if (/salary|stipend|price|fee|cost|pay|ctc|amount/.test(words)) return "money";
  if (/opening|vacanc|seat|capacity|spots/.test(words)) return "users";
  if (/experience|level|seniority/.test(words)) return "briefcase";
  if (/duration|hour|time/.test(words)) return "clock";
  if (/company|employer|organis|organiz|industry/.test(words)) return "building";
  if (/type|category|kind|department|mode|format/.test(words)) return "tag";
  return "info";
};

const pageBlock = (type, config = {}, extra = {}) => {
  const block = createPageBlock(type);
  return { ...block, ...extra, config: { ...block.config, ...config } };
};

const factItems = (refs) => refs.map((ref) => ({ id: createId("itm"), fieldId: ref.id, label: "", icon: iconFor(ref) }));

// Splits the fields a template didn't place by role into the kinds of blocks
// that show them, keeping form order.
const leftovers = ({ refs, used }) => {
  const rest = refs.filter((ref) => !used.has(ref.id));
  return {
    long: rest.filter((ref) => LONG_TYPES.includes(ref.type) && !isLineList(ref)),
    facts: rest.filter((ref) => FACT_TYPES.includes(ref.type)),
    lists: rest.filter((ref) => isChoiceList(ref) || isLineList(ref)),
    tables: rest.filter((ref) => TABLE_TYPES.includes(ref.type)),
    faqs: rest.filter((ref) => ref.type === "faq"),
    videos: rest.filter((ref) => ref.type === "video"),
    images: rest.filter((ref) => ref.type === "image"),
  };
};

// Blocks for long-form content: rich text, lists, tables, video and FAQ, each
// titled with its field's label.
const contentBlocks = ({ long, lists, tables, videos, faqs }, { summary, summaryTitle = "About" } = {}) => [
  ...(summary ? [pageBlock("richText", { fieldId: summary.id }, { title: summaryTitle })] : []),
  ...long.map((ref) => pageBlock("richText", { fieldId: ref.id }, { title: ref.label || "Details" })),
  ...lists.map((ref) => pageBlock("list", { fieldId: ref.id, variant: /skill|tag|topic|keyword/.test(wordsOf(ref)) ? "chips" : "bullets" }, { title: ref.label || "List" })),
  ...tables.map((ref) => pageBlock("table", { fieldId: ref.id }, { title: ref.label || "Table" })),
  ...videos.map((ref) => pageBlock("video", { fieldId: ref.id }, { title: ref.label || "Video" })),
  ...faqs.map((ref) => pageBlock("faq", { fieldId: ref.id }, { title: ref.label || "Frequently asked questions" })),
];

const heroButtons = (m, linkLabel) => [
  ...(m.link ? [{ ...createPageButton(), label: linkLabel, action: "fieldUrl", fieldId: m.link.id, style: "primary", newTab: true }] : []),
  { ...createPageButton(), label: "Share", action: "share", style: "secondary" },
];

const ids = (...refs) => refs.filter(Boolean).map((ref) => ref.id);

const pageSchema = ({ layout, m, blocks }) => {
  const base = createPageSchema();
  return {
    ...base,
    layout: { ...base.layout, ...layout },
    seo: { titleFieldId: m.title?.id || null, descriptionFieldId: m.summary?.id || null, imageFieldId: (m.image || m.logo)?.id || null },
    blocks,
  };
};

export const PAGE_TEMPLATES = [
  {
    id: "job-details",
    name: "Job details",
    description: "Hero with logo, badges and key facts, the role description in the main column, an overview box in the sidebar, then similar openings.",
    roles: ["title", "subtitle", "logo", "category", "mode", "location", "price", "date", "experience", "count", "summary", "link"],
    build: (m, rest) =>
      pageSchema({
        m,
        layout: { width: "default", sidebar: "right", background: "tinted" },
        blocks: [
          pageBlock("hero", {
            variant: "banner",
            titleFieldId: m.title?.id || null,
            subtitleFieldId: m.subtitle?.id || null,
            logoFieldId: m.logo?.id || null,
            badgeFieldIds: ids(m.category, m.mode),
            metaFieldIds: ids(m.location, m.price, m.date),
            buttons: heroButtons(m, "Apply"),
          }),
          ...contentBlocks(rest, { summary: m.summary, summaryTitle: "About the role" }),
          pageBlock("fieldList", { variant: "list", items: factItems([m.experience, m.count, m.location, m.price, m.date, ...rest.facts].filter(Boolean)) }, { title: "Overview", area: "sidebar" }),
          pageBlock("related", { limit: 3, matchFieldId: m.category?.id || null }, { title: "Similar openings" }),
        ],
      }),
  },
  {
    id: "event-details",
    name: "Event details",
    description: "Wide banner with the cover image, date and venue; agenda and speakers as tables; event facts and a register button in the sidebar.",
    roles: ["title", "image", "category", "mode", "date", "location", "price", "count", "summary", "link"],
    build: (m, rest) =>
      pageSchema({
        m,
        layout: { width: "wide", sidebar: "right", background: "tinted" },
        blocks: [
          pageBlock("hero", {
            variant: "banner",
            titleFieldId: m.title?.id || null,
            imageFieldId: m.image?.id || null,
            badgeFieldIds: ids(m.category, m.mode),
            metaFieldIds: ids(m.date, m.location),
            buttons: heroButtons(m, "Register"),
          }),
          ...contentBlocks(rest, { summary: m.summary, summaryTitle: "About the event" }),
          pageBlock("fieldList", { variant: "list", items: factItems([m.date, m.location, m.price, m.count, ...rest.facts].filter(Boolean)) }, { title: "Event details", area: "sidebar" }),
          ...(m.link ? [pageBlock("buttons", { buttons: [{ ...createPageButton(), label: "Register", action: "fieldUrl", fieldId: m.link.id, style: "primary", newTab: true }], align: "left" }, { area: "sidebar" })] : []),
          pageBlock("related", { limit: 3, matchFieldId: m.category?.id || null }, { title: "More events" }),
        ],
      }),
  },
  {
    id: "article",
    name: "Article",
    description: "A narrow reading column: simple header with author and date, a full-width image, the body text, then related posts.",
    roles: ["title", "subtitle", "image", "category", "date", "summary"],
    build: (m, rest) =>
      pageSchema({
        m,
        layout: { width: "narrow", sidebar: "none", background: "plain" },
        blocks: [
          pageBlock("hero", {
            variant: "simple",
            titleFieldId: m.title?.id || null,
            subtitleFieldId: m.subtitle?.id || null,
            badgeFieldIds: ids(m.category),
            metaFieldIds: ids(m.date),
            buttons: [],
          }),
          ...(m.image ? [pageBlock("image", { fieldId: m.image.id, aspect: "16/9", fit: "cover" }, { showTitle: false })] : []),
          ...contentBlocks(rest, { summary: m.summary, summaryTitle: "" }).map((block, index) => (index === 0 && m.summary ? { ...block, showTitle: false } : block)),
          ...(rest.images.length ? [pageBlock("gallery", { fieldId: rest.images[0].id, columns: 3 }, { title: rest.images[0].label || "Gallery" })] : []),
          pageBlock("divider"),
          pageBlock("related", { limit: 3, matchFieldId: m.category?.id || null }, { title: "Read next" }),
        ],
      }),
  },
  {
    id: "tabbed-overview",
    name: "Tabbed overview",
    description: "Banner, an at-a-glance strip of fact cards, then every long section in its own tab. Keeps long pages short.",
    roles: ["title", "subtitle", "logo", "image", "category", "summary", "link"],
    build: (m, rest) => {
      const sections = contentBlocks(rest, { summary: m.summary, summaryTitle: "Overview" }).map((block) => ({ ...block, showTitle: false }));
      return pageSchema({
        m,
        layout: { width: "default", sidebar: "none", background: "tinted" },
        blocks: [
          pageBlock("hero", {
            variant: m.image ? "split" : "banner",
            titleFieldId: m.title?.id || null,
            subtitleFieldId: m.subtitle?.id || null,
            imageFieldId: m.image?.id || null,
            logoFieldId: m.logo?.id || null,
            badgeFieldIds: ids(m.category),
            metaFieldIds: [],
            buttons: heroButtons(m, "Visit"),
          }),
          ...(rest.facts.length ? [pageBlock("fieldList", { variant: "cards", columns: 3, items: factItems(rest.facts.slice(0, 6)) }, { title: "At a glance" })] : []),
          ...(sections.length ? [{ ...pageBlock("tabs", {}, { title: "Details", showTitle: false }), children: sections }] : []),
          ...(rest.facts.length > 6 ? [pageBlock("fieldList", { variant: "list", items: factItems(rest.facts.slice(6)) }, { title: "More details" })] : []),
          pageBlock("related", { limit: 3, matchFieldId: m.category?.id || null }, { title: "You may also like" }),
        ],
      });
    },
  },
  {
    id: "fact-sheet",
    name: "Fact sheet",
    description: "Plain header and every short field as a label and value list, followed by the long sections and FAQ. A safe default for any form.",
    roles: ["title", "subtitle", "category", "summary"],
    build: (m, rest) =>
      pageSchema({
        m,
        layout: { width: "narrow", sidebar: "none", background: "plain" },
        blocks: [
          pageBlock("hero", {
            variant: "simple",
            titleFieldId: m.title?.id || null,
            subtitleFieldId: m.subtitle?.id || null,
            badgeFieldIds: ids(m.category),
            metaFieldIds: [],
            buttons: [],
          }),
          ...(rest.facts.length ? [pageBlock("fieldList", { variant: "list", items: factItems(rest.facts) }, { title: "Details" })] : []),
          ...contentBlocks(rest, { summary: m.summary, summaryTitle: "Overview" }),
        ],
      }),
  },
];

// Applying

const applyTemplate = (list, templateId, fields) => {
  const template = list.find((item) => item.id === templateId);
  if (!template) throw new Error(`Unknown template "${templateId}".`);
  const matched = matchRoles(fields, template.roles);
  return {
    schema: template.build(matched.matches, leftovers(matched)),
    // What each role was matched to, for the "this template will use" summary.
    matches: template.roles.map((roleId) => ({ role: roleId, label: LAYOUT_ROLES[roleId].label, field: matched.matches[roleId] || null })),
  };
};

export const applyCardTemplate = (templateId, fields) => applyTemplate(CARD_TEMPLATES, templateId, fields);
export const applyPageTemplate = (templateId, fields) => applyTemplate(PAGE_TEMPLATES, templateId, fields);

// A representative form used to draw the template previews in the Templates
// library, where no content type has been chosen yet.
export const SAMPLE_TEMPLATE_FIELDS = [
  { id: "smp_title", key: "title", label: "Title", type: "text" },
  { id: "smp_org", key: "company", label: "Company", type: "text" },
  { id: "smp_logo", key: "logo", label: "Logo", type: "image" },
  { id: "smp_cover", key: "coverImage", label: "Cover image", type: "image" },
  { id: "smp_type", key: "type", label: "Type", type: "select", options: [{ label: "Full-time", value: "full-time" }] },
  { id: "smp_mode", key: "mode", label: "Mode", type: "radio", options: [{ label: "Remote", value: "remote" }] },
  { id: "smp_location", key: "location", label: "Location", type: "text" },
  { id: "smp_date", key: "date", label: "Date", type: "date" },
  { id: "smp_price", key: "price", label: "Price", type: "text" },
  { id: "smp_level", key: "experience", label: "Experience", type: "select", options: [{ label: "Fresher", value: "fresher" }] },
  { id: "smp_seats", key: "seats", label: "Seats", type: "number" },
  { id: "smp_rating", key: "rating", label: "Rating", type: "rating" },
  { id: "smp_link", key: "website", label: "Website", type: "url" },
  { id: "smp_summary", key: "description", label: "Description", type: "richText" },
  { id: "smp_details", key: "details", label: "Details", type: "richText" },
  { id: "smp_tags", key: "tags", label: "Tags", type: "multiSelect", options: [{ label: "Design", value: "design" }] },
  { id: "smp_agenda", key: "agenda", label: "Agenda", type: "table", columns: [{ id: "col_a", key: "time", label: "Time" }, { id: "col_b", key: "item", label: "Item" }] },
  { id: "smp_faq", key: "faq", label: "FAQ", type: "faq" },
];
