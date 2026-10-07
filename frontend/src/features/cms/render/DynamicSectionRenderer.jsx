import React, { useState } from "react";
import { IoMdShare } from "react-icons/io";
import { LuBriefcase, LuCalendarDays, LuChevronDown } from "react-icons/lu";
import DynamicFieldRenderer, { DataTable, FaqList, VideoEmbed } from "./DynamicFieldRenderer";
import { formatDate, formatValue, isBlank, isSafeHref, mediaList, mediaSrc, readField, toList } from "./resolve";
import { BUTTON_CLASSES, ICONS, PROSE_CLASSES, iconForField } from "./theme";

// Renders one detail-page block from the admin-built page schema, in the SAME
// design as the Jobs / Internship detail page (OpportunityDetailView):
// hero band + white summary card, navy section headings over black copy,
// a bordered sticky sidebar card. The previous implementation is kept in
// DynamicSectionRenderer.v1.jsx.
//   ctx = { index, entry, typeSlug, formSchema, cardSchema, related?, onFormAction, onShare, disableLinks }

export const PageButton = ({ button, ctx, block = false }) => {
  const style = BUTTON_CLASSES[button.style] || BUTTON_CLASSES.primary;
  const className = `flex items-center justify-center gap-2 rounded-sm px-8 py-3.5 text-[14px] font-semibold uppercase tracking-wide transition-colors ${style} ${block ? "w-full" : "w-full sm:w-auto"}`;

  if (button.action === "share") {
    return (
      <button type="button" className={className} onClick={() => !ctx.disableLinks && ctx.onShare?.()}>
        <IoMdShare className="h-4 w-4" /> {button.label || "Share"}
      </button>
    );
  }
  if (button.action === "form") {
    if (!button.formSlug) return null;
    return (
      <button type="button" className={className} onClick={() => !ctx.disableLinks && ctx.onFormAction?.(button.formSlug, ctx.entry)}>
        {button.label || "Apply Now"}
      </button>
    );
  }
  let href = button.url;
  if (button.action === "fieldUrl") {
    const { value } = readField(ctx.index, ctx.entry.data, button.fieldId);
    href = typeof value === "string" ? value : value?.url;
  }
  if (!isSafeHref(href)) return null;
  return (
    <a href={ctx.disableLinks ? undefined : href} target={button.newTab ? "_blank" : undefined} rel="noopener noreferrer" className={className}>
      {button.label || "Open"}
    </a>
  );
};

// Hero band + white summary card — OpportunityDetailHero layout.
export const Hero = ({ block, ctx }) => {
  const config = block.config || {};
  const read = (id) => readField(ctx.index, ctx.entry.data, id);
  const titleField = config.titleFieldId ? read(config.titleFieldId) : null;
  const title = titleField?.ref ? formatValue(titleField.ref, titleField.value) || ctx.entry.title : ctx.entry.title;
  const subtitle = config.subtitleFieldId ? read(config.subtitleFieldId) : null;
  const badges = (config.badgeFieldIds || []).map(read).filter(({ ref, value }) => ref && !isBlank(value));
  const category = badges[0];
  const cells = [
    ...badges.slice(1),
    ...(config.metaFieldIds || []).map(read).filter(({ ref, value }) => ref && !isBlank(value)),
  ];
  const image = mediaList(read(config.imageFieldId).value)[0];
  const postedOn = ctx.entry.publishedAt ? formatDate(ctx.entry.publishedAt) : "";
  const location = cells.find(({ ref }) => /(location|city|venue|address)/i.test(`${ref.key} ${ref.label}`));
  const buttons = config.buttons || [];

  return (
    <section style={{ backgroundColor: "#E9F6FF" }}>
      <div className="mx-auto w-full max-w-[1250px] px-4 py-12 md:px-6 md:py-16">
        <div className="text-center">
          {category && (
            <span className="inline-block rounded-sm bg-secondary px-4 py-1.5 text-[13px] font-semibold uppercase tracking-wide text-white">
              {formatValue(category.ref, category.value)}
            </span>
          )}
          <h1 className="mt-5 text-[32px] font-extrabold leading-[1.1] tracking-tight text-primary sm:text-[42px] md:text-[54px]">{title}</h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[15px] text-primary">
            {location && (
              <span className="flex items-center gap-2">
                {React.createElement(ICONS.location, { className: "h-4 w-4 text-secondary" })}
                {formatValue(location.ref, location.value)}
              </span>
            )}
            {subtitle?.ref && !isBlank(subtitle.value) && (
              <span className="flex items-center gap-2">
                <LuBriefcase className="h-4 w-4 text-secondary" />
                {formatValue(subtitle.ref, subtitle.value)}
              </span>
            )}
            {postedOn && (
              <span className="flex items-center gap-2">
                <LuCalendarDays className="h-4 w-4 text-secondary" />
                <span className="text-slate-500">Post Date:</span>
                <span className="font-medium">{postedOn}</span>
              </span>
            )}
          </div>
        </div>

        {image && <img src={mediaSrc(image)} alt={image.alt || ""} className="mt-10 aspect-[21/9] w-full rounded-sm object-cover" />}

        {(cells.length > 0 || buttons.length > 0) && (
          <div className="mt-10 rounded-sm bg-white px-6 py-8 md:px-10">
            <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {cells.map(({ ref, value }) => {
                const Icon = iconForField(ref);
                return (
                  <div key={ref.id} className="text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-[15px] font-bold text-primary">{ref.label}:</span>
                    </div>
                    <p className="mt-1.5 text-[15px] text-black">{formatValue(ref, value)}</p>
                  </div>
                );
              })}
              {buttons.length > 0 && (
                <div className="col-span-full flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {buttons.map((button) => (
                    <PageButton key={button.id} button={button} ctx={ctx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const TabsBlock = ({ block, ctx }) => {
  const children = (block.children || []).filter((child) => child.visible !== false && !blockIsEmpty(child, ctx));
  const [active, setActive] = useState(0);
  if (!children.length) return null;
  const current = children[Math.min(active, children.length - 1)];
  return (
    <div className="mt-3">
      <div role="tablist" className="scrollbar-hide mb-4 flex gap-1 overflow-x-auto border-b border-black/10">
        {children.map((child, i) => (
          <button
            key={child.id}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] font-semibold transition-colors ${
              i === active ? "border-secondary text-primary" : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            {child.title || `Tab ${i + 1}`}
          </button>
        ))}
      </div>
      <BlockBody block={current} ctx={ctx} />
    </div>
  );
};

const AccordionBlock = ({ block, ctx }) => {
  const children = (block.children || []).filter((child) => child.visible !== false && !blockIsEmpty(child, ctx));
  const [open, setOpen] = useState(block.config?.openFirst === false ? -1 : 0);
  return (
    <div className="mt-3 divide-y divide-black/10 rounded-sm border border-black/10">
      {children.map((child, i) => (
        <div key={child.id}>
          <button
            type="button"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px] font-semibold text-primary"
          >
            {child.title || `Section ${i + 1}`}
            <LuChevronDown className={`h-4 w-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              <BlockBody block={child} ctx={ctx} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Whether a block would render nothing for this entry (used for hideWhenEmpty).
export const blockIsEmpty = (block, ctx) => {
  const config = block.config || {};
  const value = (id) => readField(ctx.index, ctx.entry.data, id).value;
  switch (block.type) {
    case "field":
    case "richText":
    case "gallery":
    case "video":
    case "list":
    case "table":
      return config.fieldId ? isBlank(value(config.fieldId)) : !(block.type === "richText" && config.html);
    case "faq":
      return config.fieldId ? isBlank(value(config.fieldId)) : !(config.items || []).length;
    case "image":
      return config.fieldId ? isBlank(value(config.fieldId)) : !config.url;
    case "fieldList":
      return !(config.items || []).some((item) => !isBlank(value(item.fieldId)));
    case "text":
      return !String(config.content || "").trim();
    case "tabs":
    case "accordion":
    case "group":
      return !(block.children || []).some((child) => child.visible !== false && !blockIsEmpty(child, ctx));
    case "buttons":
      return !(config.buttons || []).length;
    default:
      return false;
  }
};

// Label / value rows like the company card on the detail page.
const FieldListRows = ({ block, ctx }) => {
  const config = block.config || {};
  const rows = (config.items || []).map((item) => ({ item, ...readField(ctx.index, ctx.entry.data, item.fieldId) })).filter(({ ref, value }) => ref && !isBlank(value));
  if (config.variant === "cards") {
    return (
      <div className={`mt-3 grid gap-3 ${Number(config.columns) >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {rows.map(({ item, ref, value }) => {
          const Icon = ICONS[item.icon] || iconForField(ref);
          return (
            <div key={item.id} className="flex items-start gap-3 rounded-sm border border-black/10 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-black/[0.04] text-primary">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-primary">{item.label || ref.label}</p>
                <p className="break-words text-[14px] text-black/70">{formatValue(ref, value)}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <ul className="mt-5 space-y-4">
      {rows.map(({ item, ref, value }) => {
        const Icon = ICONS[item.icon] || iconForField(ref);
        return (
          <li key={item.id} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-black/[0.04] text-primary">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-primary">{item.label || ref.label}</p>
              <p className="break-words text-[14px] text-black/70">{formatValue(ref, value)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export const BlockBody = ({ block, ctx, inSidebar = false }) => {
  const config = block.config || {};
  const read = (id) => readField(ctx.index, ctx.entry.data, id);

  switch (block.type) {
    case "field": {
      const { ref, value } = read(config.fieldId);
      return (
        <div className="mt-3">
          <DynamicFieldRenderer fieldRef={ref} value={value} />
        </div>
      );
    }
    case "fieldList":
      return <FieldListRows block={block} ctx={ctx} />;
    case "text": {
      const tone =
        config.tone === "callout" ? "rounded-sm border border-secondary/30 bg-secondary/5 p-4 text-black" : config.tone === "muted" ? "text-slate-500" : "text-black";
      return <p className={`mt-3 whitespace-pre-line text-[15px] leading-relaxed ${tone}`}>{config.content}</p>;
    }
    case "richText": {
      const html = config.fieldId ? read(config.fieldId).value : config.html;
      return html ? <div className={`mt-3 ${PROSE_CLASSES}`} dangerouslySetInnerHTML={{ __html: html }} /> : null;
    }
    case "image": {
      const image = config.fieldId ? mediaList(read(config.fieldId).value)[0] : config.url ? { url: config.url, alt: config.alt } : null;
      if (!image) return null;
      const aspect = { "16/9": "aspect-video", "4/3": "aspect-[4/3]", "1/1": "aspect-square", "21/9": "aspect-[21/9]" }[config.aspect] || "";
      return <img src={mediaSrc(image)} alt={image.alt || config.alt || ""} className={`mt-3 w-full rounded-sm ${aspect} ${config.fit === "contain" ? "object-contain" : "object-cover"}`} loading="lazy" />;
    }
    case "gallery": {
      const images = mediaList(read(config.fieldId).value);
      const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[config.columns] || "sm:grid-cols-3";
      return (
        <div className={`mt-3 grid grid-cols-2 gap-3 ${cols}`}>
          {images.map((image, i) => (
            <a key={i} href={ctx.disableLinks ? undefined : mediaSrc(image)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-sm">
              <img src={mediaSrc(image)} alt={image.alt || ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      );
    }
    case "video":
      return (
        <div className="mt-3">
          <VideoEmbed value={read(config.fieldId).value} title={block.title} />
        </div>
      );
    case "list": {
      const { ref, value } = read(config.fieldId);
      const items = toList(ref, value);
      if (config.variant === "chips") {
        return (
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((item, i) => (
              <span key={i} className="rounded-sm bg-primary/5 px-3 py-1.5 text-[14px] font-medium text-black">
                {item}
              </span>
            ))}
          </div>
        );
      }
      // Edeco's detail pages list points as plain bullets (e.g. "What We
      // Offer"), so the "checks" style renders as bullets too.
      // if (config.variant === "checks") {
      //   return (
      //     <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      //       {items.map((item, i) => (
      //         <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed text-black">
      //           <LuCircleCheck className="mt-1 h-4 w-4 shrink-0 text-secondary" /> {item}
      //         </li>
      //       ))}
      //     </ul>
      //   );
      // }
      const ListTag = config.variant === "numbered" ? "ol" : "ul";
      return (
        <ListTag className={`mt-3 space-y-2 pl-5 text-[15px] leading-relaxed text-black marker:text-black ${config.variant === "numbered" ? "list-decimal" : "list-disc"}`}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    }
    case "table": {
      const { ref, value } = read(config.fieldId);
      if (!Array.isArray(value)) return null;
      const columns = ref?.type === "repeater" ? (ref.field.children || []).filter((child) => child.key).map((child) => ({ key: child.key, label: child.label })) : ref?.field?.columns || [];
      const rows =
        ref?.type === "repeater"
          ? value.map((item) => Object.fromEntries((ref.field.children || []).map((child) => [child.key, formatValue({ type: child.type, field: child }, item?.[child.key])])))
          : value;
      return (
        <div className="mt-3">
          <DataTable columns={columns} rows={rows} />
        </div>
      );
    }
    case "faq": {
      const items = config.fieldId ? read(config.fieldId).value : config.items;
      return Array.isArray(items) && items.length ? (
        <div className="mt-3">
          <FaqList items={items} />
        </div>
      ) : null;
    }
    case "tabs":
      return <TabsBlock block={block} ctx={ctx} />;
    case "accordion":
      return <AccordionBlock block={block} ctx={ctx} />;
    case "group": {
      const cols = Number(config.columns) >= 2 ? "md:grid-cols-2" : "";
      return (
        <div className={`mt-3 grid gap-x-8 gap-y-2 ${cols}`}>
          {(block.children || []).map((child) => (
            <DynamicSectionRenderer key={child.id} block={child} ctx={ctx} inSidebar={inSidebar} />
          ))}
        </div>
      );
    }
    case "buttons":
      return (
        <div className={`mt-5 flex flex-col gap-3 ${inSidebar ? "" : `sm:flex-row ${config.align === "center" ? "sm:justify-center" : config.align === "right" ? "sm:justify-end" : ""}`}`}>
          {(config.buttons || []).map((button) => (
            <PageButton key={button.id} button={button} ctx={ctx} block={inSidebar} />
          ))}
        </div>
      );
    case "divider":
      return <hr className="mt-7 border-black/10" />;
    default:
      return null;
  }
};

const DynamicSectionRenderer = ({ block, ctx, inSidebar = false }) => {
  if (!block || block.visible === false) return null;
  if (block.type === "hero") return <Hero block={block} ctx={ctx} />;
  if (block.hideWhenEmpty !== false && blockIsEmpty(block, ctx)) return null;

  // Each block reads like one "Job Description" sub-section: a navy heading
  // over black copy, separated by space rather than boxes.
  const heading =
    block.showTitle && block.title ? (
      <h3 className={inSidebar ? "text-[16px] font-semibold text-primary" : "text-[20px] font-bold text-primary sm:text-[24px]"}>{block.title}</h3>
    ) : null;

  return (
    <div className={inSidebar ? "mt-6 first:mt-0" : "mt-7 first:mt-0"}>
      {heading}
      <BlockBody block={block} ctx={ctx} inSidebar={inSidebar} />
    </div>
  );
};

export default DynamicSectionRenderer;
