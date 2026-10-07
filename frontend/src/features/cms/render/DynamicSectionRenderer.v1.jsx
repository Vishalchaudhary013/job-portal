import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiChevronDown, FiShare2 } from "react-icons/fi";
import { getCmsRelated } from "../../../services/cmsAPI";
import DynamicCardRenderer from "./DynamicCardRenderer";
import DynamicFieldRenderer, { DataTable, FaqList, VideoEmbed } from "./DynamicFieldRenderer";
import { formatValue, isBlank, isSafeHref, mediaList, mediaSrc, readField, toList } from "./resolve";
import { BUTTON_CLASSES, ICONS, PROSE_CLASSES, TONE_CLASSES } from "./theme";

// Renders one detail-page block from the admin-built page schema.
//   ctx = { index, entry, typeSlug, formSchema, cardSchema, related?, onFormAction, onShare, disableLinks }

const PageButton = ({ button, ctx }) => {
  const style = BUTTON_CLASSES[button.style] || BUTTON_CLASSES.primary;
  const className = `inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-semibold transition ${style}`;

  if (button.action === "share") {
    return (
      <button type="button" className={className} onClick={() => !ctx.disableLinks && ctx.onShare?.()}>
        <FiShare2 /> {button.label || "Share"}
      </button>
    );
  }
  if (button.action === "form") {
    if (!button.formSlug) return null;
    return (
      <button type="button" className={className} onClick={() => !ctx.disableLinks && ctx.onFormAction?.(button.formSlug, ctx.entry)}>
        {button.label || "Apply"}
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
    <a
      href={ctx.disableLinks ? undefined : href}
      target={button.newTab ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={className}
    >
      {button.label || "Open"}
    </a>
  );
};

const Hero = ({ block, ctx }) => {
  const config = block.config || {};
  const read = (id) => readField(ctx.index, ctx.entry.data, id);
  const title = config.titleFieldId ? formatValue(read(config.titleFieldId).ref, read(config.titleFieldId).value) : ctx.entry.title;
  const subtitle = config.subtitleFieldId ? formatValue(read(config.subtitleFieldId).ref, read(config.subtitleFieldId).value) : "";
  const image = mediaList(read(config.imageFieldId).value)[0];
  const logo = mediaList(read(config.logoFieldId).value)[0];
  const badges = (config.badgeFieldIds || []).map((id) => read(id)).filter(({ ref, value }) => ref && !isBlank(value));
  const metas = (config.metaFieldIds || []).map((id) => read(id)).filter(({ ref, value }) => ref && !isBlank(value));
  const split = config.variant === "split" && image;
  const banner = config.variant !== "simple";

  return (
    <section className={banner ? "bg-[#E9F6FF]" : "bg-transparent"}>
      <div className={`mx-auto w-full max-w-[1250px] px-4 md:px-6 ${banner ? "py-10 sm:py-14" : "pt-8"}`}>
        <div className={`grid items-center gap-8 ${split ? "lg:grid-cols-[1fr_440px]" : ""}`}>
          <div className="min-w-0">
            {(logo || badges.length > 0) && (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {logo && (
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-sm border border-black/5 bg-white ">
                    <img src={mediaSrc(logo)} alt={logo.alt || ""} className="h-full w-full object-contain" />
                  </span>
                )}
                {badges.map(({ ref, value }) => (
                  <span key={ref.id} className={`rounded-sm px-3 py-1 text-xs font-semibold ${TONE_CLASSES.primary}`}>{formatValue(ref, value)}</span>
                ))}
              </div>
            )}
            <h1 className="text-[28px] font-semibold leading-tight text-[#1F2853] sm:text-[38px]">{title}</h1>
            {subtitle && <p className="mt-3 max-w-3xl text-[16px] text-slate-700 sm:text-[17px]">{subtitle}</p>}
            {metas.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                {metas.map(({ ref, value }) => (
                  <span key={ref.id} className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{ref.label}:</span> {formatValue(ref, value)}
                  </span>
                ))}
              </div>
            )}
            {(config.buttons || []).length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {config.buttons.map((button) => (
                  <PageButton key={button.id} button={button} ctx={ctx} />
                ))}
              </div>
            )}
          </div>
          {split &&<img src={mediaSrc(image)} alt={image.alt || ""} className="aspect-[4/3] w-full rounded-sm object-cover " />}
        </div>
        {image && !split && (
          <img src={mediaSrc(image)} alt={image.alt || ""} className="mt-8 aspect-[21/9] w-full rounded-sm object-cover " />
        )}
      </div>
    </section>
  );
};

const RelatedBlock = ({ block, ctx }) => {
  const limit = Number(block.config?.limit) || 3;
  const [items, setItems] = useState(ctx.related ? ctx.related.slice(0, limit) : null);

  useEffect(() => {
    if (ctx.related) {
      setItems(ctx.related.slice(0, limit));
      return undefined;
    }
    let active = true;
    getCmsRelated(ctx.entry.id, { limit, matchFieldId: block.config?.matchFieldId })
      .then((result) => active && setItems(result.items || []))
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, [ctx.entry.id, ctx.related, limit, block.config?.matchFieldId]);

  if (items === null) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].slice(0, limit).map((n) => <div key={n} className="h-48 animate-pulse rounded-sm bg-slate-100" />)}</div>;
  if (!items.length) return <p className="text-sm text-slate-500">Nothing related yet.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <DynamicCardRenderer
          key={item.id}
          cardSchema={ctx.cardSchema}
          fieldIndex={ctx.index}
          entry={item}
          typeSlug={ctx.typeSlug}
          onFormAction={ctx.onFormAction}
          disableLinks={ctx.disableLinks}
        />
      ))}
    </div>
  );
};

const TabsBlock = ({ block, ctx }) => {
  const children = (block.children || []).filter((child) => child.visible !== false && !blockIsEmpty(child, ctx));
  const [active, setActive] = useState(0);
  if (!children.length) return null;
  const current = children[Math.min(active, children.length - 1)];
  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {children.map((child, i) => (
          <button
            key={child.id}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              i === active ? "border-[#1F2853] text-[#1F2853]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {child.title || `Tab ${i + 1}`}
          </button>
        ))}
      </div>
      <DynamicSectionRenderer block={{ ...current, showTitle: false }} ctx={ctx} bare />
    </div>
  );
};

const AccordionBlock = ({ block, ctx }) => {
  const children = (block.children || []).filter((child) => child.visible !== false && !blockIsEmpty(child, ctx));
  const [open, setOpen] = useState(block.config?.openFirst === false ? -1 : 0);
  return (
    <div className="divide-y divide-slate-200 rounded-sm border border-slate-200">
      {children.map((child, i) => (
        <div key={child.id}>
          <button
            type="button"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold text-slate-900"
          >
            {child.title || `Section ${i + 1}`}
            <FiChevronDown className={`transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              <DynamicSectionRenderer block={{ ...child, showTitle: false }} ctx={ctx} bare />
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

const BlockBody = ({ block, ctx }) => {
  const config = block.config || {};
  const read = (id) => readField(ctx.index, ctx.entry.data, id);

  switch (block.type) {
    case "field": {
      const { ref, value } = read(config.fieldId);
      return <DynamicFieldRenderer fieldRef={ref} value={value} />;
    }
    case "fieldList": {
      const rows = (config.items || []).map((item) => ({ item, ...read(item.fieldId) })).filter(({ ref, value }) => ref && !isBlank(value));
      if (config.variant === "cards") {
        return (
          <div className={`grid gap-3 ${Number(config.columns) >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {rows.map(({ item, ref, value }) => {
              const Icon = ICONS[item.icon];
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-sm border border-[#EEF2FF] bg-[#F8FAFF] p-4">
                  {Icon && (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#E2E8F0] text-[#1F2853]">
                      <Icon size={18} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label || ref.label}</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{formatValue(ref, value)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      return (
        <ul className="flex flex-col gap-4">
          {rows.map(({ item, ref, value }) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.id} className="flex flex-col gap-1 sm:flex-row sm:items-center">
                <span className="flex items-center gap-2.5 whitespace-nowrap text-[13.5px] font-medium text-gray-500">
                  {Icon && <Icon size={18} />}
                  {item.label || ref.label}
                </span>
                <span className="mx-4 hidden flex-grow border-b border-dashed border-black/10 sm:block" />
                <span className="text-[14.5px] font-medium text-gray-900 sm:text-right">{formatValue(ref, value)}</span>
              </li>
            );
          })}
        </ul>
      );
    }
    case "text": {
      const tone = config.tone === "callout" ? "rounded-sm border border-amber-200 bg-amber-50 p-4 text-amber-900" : config.tone === "muted" ? "text-slate-500" : "text-slate-700";
      return <p className={`whitespace-pre-line text-[15px] leading-relaxed ${tone}`}>{config.content}</p>;
    }
    case "richText": {
      const { value } = read(config.fieldId);
      const html = config.fieldId ? value : config.html;
      return html ? <div className={PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: html }} /> : null;
    }
    case "image": {
      const image = config.fieldId ? mediaList(read(config.fieldId).value)[0] : config.url ? { url: config.url, alt: config.alt } : null;
      if (!image) return null;
      const aspect = { "16/9": "aspect-video", "4/3": "aspect-[4/3]", "1/1": "aspect-square", "21/9": "aspect-[21/9]" }[config.aspect] || "";
      return <img src={mediaSrc(image)} alt={image.alt || config.alt || ""} className={`w-full rounded-sm ${aspect} ${config.fit === "contain" ? "object-contain" : "object-cover"}`} loading="lazy" />;
    }
    case "gallery": {
      const images = mediaList(read(config.fieldId).value);
      const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[config.columns] || "sm:grid-cols-3";
      return (
        <div className={`grid grid-cols-2 gap-3 ${cols}`}>
          {images.map((image, i) => (
            <a key={i} href={ctx.disableLinks ? undefined : mediaSrc(image)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-sm">
              <img src={mediaSrc(image)} alt={image.alt || ""} className="aspect-[4/3] w-full object-cover transition hover:scale-105" loading="lazy" />
            </a>
          ))}
        </div>
      );
    }
    case "video":
      return <VideoEmbed value={read(config.fieldId).value} title={block.title} />;
    case "list": {
      const { ref, value } = read(config.fieldId);
      const items = toList(ref, value);
      if (config.variant === "chips") {
        return (
          <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <span key={i} className="rounded-sm bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{item}</span>
            ))}
          </div>
        );
      }
      if (config.variant === "checks") {
        return (
          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] text-slate-700">
                <FiCheckCircle className="mt-1 shrink-0 text-emerald-600" /> {item}
              </li>
            ))}
          </ul>
        );
      }
      const ListTag = config.variant === "numbered" ? "ol" : "ul";
      return (
        <ListTag className={`space-y-2 pl-5 text-[15px] text-slate-700 ${config.variant === "numbered" ? "list-decimal" : "list-disc"}`}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    }
    case "table": {
      const { ref, value } = read(config.fieldId);
      if (!Array.isArray(value)) return null;
      const columns = ref?.type === "repeater"
        ? (ref.field.children || []).filter((child) => child.key).map((child) => ({ key: child.key, label: child.label }))
        : ref?.field?.columns || [];
      const rows = ref?.type === "repeater"
        ? value.map((item) => Object.fromEntries((ref.field.children || []).map((child) => [child.key, formatValue({ type: child.type, field: child }, item?.[child.key])])))
        : value;
      return <DataTable columns={columns} rows={rows} />;
    }
    case "faq": {
      const items = config.fieldId ? read(config.fieldId).value : config.items;
      return Array.isArray(items) && items.length ? <FaqList items={items} /> : null;
    }
    case "tabs":
      return <TabsBlock block={block} ctx={ctx} />;
    case "accordion":
      return <AccordionBlock block={block} ctx={ctx} />;
    case "group": {
      const cols = Number(config.columns) >= 2 ? "md:grid-cols-2" : "";
      return (
        <div className={`grid gap-6 ${cols}`}>
          {(block.children || []).map((child) => (
            <DynamicSectionRenderer key={child.id} block={child} ctx={ctx} bare={!config.boxed} />
          ))}
        </div>
      );
    }
    case "related":
      return <RelatedBlock block={block} ctx={ctx} />;
    case "buttons":
      return (
        <div className={`flex flex-wrap gap-3 ${config.align === "center" ? "justify-center" : config.align === "right" ? "justify-end" : ""}`}>
          {(config.buttons || []).map((button) => (
            <PageButton key={button.id} button={button} ctx={ctx} />
          ))}
        </div>
      );
    case "divider":
      return <hr className="border-slate-200" />;
    default:
      return null;
  }
};

const DynamicSectionRenderer = ({ block, ctx, bare = false }) => {
  if (!block || block.visible === false) return null;
  if (block.type === "hero") return <Hero block={block} ctx={ctx} />;
  if (block.hideWhenEmpty !== false && blockIsEmpty(block, ctx)) return null;

  const content = <BlockBody block={block} ctx={ctx} />;
  const title = block.showTitle && block.title ? <h2 className="mb-4 text-[20px] font-semibold text-[#1F2853] sm:text-[22px]">{block.title}</h2> : null;

  if (bare || block.type === "divider" || block.type === "buttons") {
    return (
      <div>
        {title}
        {content}
      </div>
    );
  }
  return (
    <section className="rounded-sm border border-[#EEF2FF] bg-white p-5 sm:p-6">
      {title}
      {content}
    </section>
  );
};

export default DynamicSectionRenderer;
