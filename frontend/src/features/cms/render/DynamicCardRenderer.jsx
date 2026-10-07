import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { LuCalendar, LuMapPin, LuShare2 } from "react-icons/lu";
import { RatingStars } from "./DynamicFieldRenderer";
import { buildFieldIndex, entryPath, formatDate, formatValue, isBlank, isSafeHref, mediaList, mediaSrc, readField, toList } from "./resolve";
import { shareLink, useSavedEntries } from "./savedEntries";
import { ICONS, TONE_CLASSES } from "./theme";

// Renders one entry as a card from the admin-built card schema, in the SAME
// design as the Jobs page cards (OpportunityListCard / OpportunityGridCard):
// the card schema decides which fields fill which slot; this component fixes
// how they look. `variant` is "list" (Jobs list view) or "grid" (Jobs grid
// view / "You may also like").
//
// Slots, by the element's display type:
//   heading     -> title                    subheading -> company line
//   badge       -> coral type chip(s)        logo       -> square logo box
//   image       -> cover image on top        price      -> bold amount in the meta row
//   meta / date / rating / text -> icon meta row (footer-zone dates go to the footer)
//   tags        -> outlined skill chips
// The previous implementation is kept in DynamicCardRenderer.v1.jsx.

const resolveAll = (cardSchema, index, data) =>
  (cardSchema?.elements || [])
    .filter((element) => element.visible !== false)
    .map((element) => {
      const { ref, value } = element.source === "static" ? { ref: null, value: element.text } : readField(index, data, element.fieldId);
      if (element.source !== "static" && !ref) return null; // field removed from the form
      if (isBlank(value) && element.hideWhenEmpty !== false) return null;
      const raw = element.source === "static" ? String(value || "") : formatValue(ref, value);
      const text = `${element.prefix || ""}${raw}${element.suffix || ""}`;
      const label = element.showLabel ? element.label || ref?.label || "" : "";
      return { element, ref, value, text, label };
    })
    .filter(Boolean);

const resolveAction = (cardSchema, entry, typeSlug, index) => {
  const action = cardSchema?.action || { type: "detail" };
  switch (action.type) {
    case "none":
      return null;
    case "url":
      return isSafeHref(action.url) ? { kind: "external", href: action.url, label: action.label, newTab: action.newTab } : null;
    case "fieldUrl": {
      const { value } = readField(index, entry.data, action.fieldId);
      const href = typeof value === "string" ? value : value?.url;
      return isSafeHref(href) ? { kind: "external", href, label: action.label, newTab: action.newTab } : null;
    }
    case "form":
      return action.formSlug ? { kind: "form", formSlug: action.formSlug, label: action.label } : null;
    default:
      return { kind: "detail", label: action.label };
  }
};

const Badge = ({ item, filled }) => {
  const key = Array.isArray(item.value) ? item.value[0] : item.value;
  const tone = item.element.toneMap?.[String(key)] || item.element.tone;
  const classes = filled === false ? "border border-secondary/40 text-secondary" : TONE_CLASSES[tone] || TONE_CLASSES.primary;
  return (
    <span className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${classes}`}>
      {item.label ? `${item.label}: ` : ""}
      {item.text}
    </span>
  );
};

const MetaItem = ({ item }) => {
  const { element, ref, value } = item;
  if (element.display === "price") return <span className="font-semibold text-primary">{item.label ? `${item.label}: ` : ""}{item.text}</span>;
  if (element.display === "rating") return <RatingStars value={value} max={Number(ref?.field?.settings?.max) || 5} size={13} />;
  const Icon = ICONS[element.icon] || (element.display === "date" ? LuCalendar : null);
  const text = element.display === "date" ? `${element.prefix || ""}${formatDate(value, ref?.type === "datetime")}${element.suffix || ""}` : item.text;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {item.label && <span>{item.label}:</span>}
      <span className="truncate">{text}</span>
    </span>
  );
};

const LogoBox = ({ item, fallbackText, size = "list" }) => {
  const image = item ? mediaList(item.value)[0] : null;
  const box = size === "list" ? "h-14 w-14 border border-black/10 p-2" : "h-9 w-9 bg-primary/10";
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-sm ${box}`}>
      {image ? (
        <img src={mediaSrc(image)} alt={image.alt || fallbackText} className="h-full w-full object-contain" />
      ) : (
        <span className={`font-bold text-primary ${size === "list" ? "text-[20px]" : "text-[13px]"}`}>{String(fallbackText || "E").trim().charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};

const DynamicCardRenderer = ({ cardSchema, formSchema, entry, typeSlug, onFormAction, fieldIndex, disableLinks = false, variant = "list" }) => {
  const navigate = useNavigate();
  const { isSaved, toggle } = useSavedEntries();
  const index = useMemo(() => fieldIndex || buildFieldIndex(formSchema), [fieldIndex, formSchema]);
  const items = resolveAll(cardSchema, index, entry.data);
  const of = (...displays) => items.filter((item) => displays.includes(item.element.display));

  const heading = of("heading")[0];
  const title = heading?.text || entry.title;
  const subheads = of("subheading");
  const company = subheads[0]?.text || "";
  const badges = of("badge");
  const logo = of("logo")[0];
  const cover = of("image")[0];
  const prices = of("price");
  const metas = items.filter((item) => ["meta", "date", "rating", "text"].includes(item.element.display) && item.element.zone !== "footer");
  const footerMetas = items.filter((item) => ["meta", "date", "text"].includes(item.element.display) && item.element.zone === "footer");
  const tagItems = of("tags").flatMap((item) => (item.element.source === "static" ? [item.text] : toList(item.ref, item.value)));
  const tags = [...new Set(tagItems)];
  const visibleTags = tags.slice(0, 4);
  const moreTags = Math.max(tags.length - visibleTags.length, 0);
  const coverImage = cover ? mediaList(cover.value)[0] : null;

  const detailPath = typeSlug ? entryPath(typeSlug, entry) : null;
  const action = resolveAction(cardSchema, entry, typeSlug, index);
  const saved = isSaved(entry.id);
  const postedOn = entry.publishedAt ? formatDate(entry.publishedAt) : "";

  const open = () => {
    if (disableLinks || !detailPath) return;
    navigate(detailPath);
  };
  const stop = (handler) => (event) => {
    event.stopPropagation();
    if (!disableLinks) handler(event);
  };

  const actionButton =
    action && action.kind !== "detail" ? (
      action.kind === "form" ? (
        <button type="button" onClick={stop(() => onFormAction?.(action.formSlug, entry))} className="rounded-sm bg-secondary px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-secondary/90">
          {action.label || "Apply"}
        </button>
      ) : (
        <a
          href={disableLinks ? undefined : action.href}
          target={action.newTab ? "_blank" : undefined}
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="rounded-sm bg-secondary px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-secondary/90"
        >
          {action.label || "Open"}
        </a>
      )
    ) : null;

  const cardProps = {
    role: "link",
    tabIndex: 0,
    "aria-label": `View details for ${title}`,
    onClick: open,
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    },
  };

  const titleNode = (className) =>
    detailPath && !disableLinks ? (
      <Link to={detailPath} onClick={(event) => event.stopPropagation()} className={`${className} hover:text-secondary`}>
        {title}
      </Link>
    ) : (
      <span className={className}>{title}</span>
    );

  if (variant === "grid") {
    // Grid view — OpportunityGridCard / FeaturedJobCard layout.
    const location = metas.find((item) => item.element.icon === "location") || metas[0];
    const pay = prices[0];
    return (
      <article {...cardProps} className="flex h-full cursor-pointer flex-col gap-4 rounded-sm border border-black/20 bg-white p-5 transition-colors hover:border-secondary/50">
        {coverImage && <img src={mediaSrc(coverImage)} alt={coverImage.alt || ""} className="-mx-5 -mt-5 aspect-video w-[calc(100%+2.5rem)] max-w-none rounded-t-sm object-cover" />}
        <div>
          <div className="flex items-start justify-between gap-3">
            {titleNode("text-[17px] font-bold leading-snug text-primary")}
            <button
              type="button"
              className="-mr-1 -mt-1 shrink-0 rounded-sm p-1.5 text-slate-400 transition-colors hover:text-secondary"
              onClick={stop(() => toggle(entry.id))}
              aria-label={saved ? "Remove from saved" : "Save"}
            >
              {saved ? <BsBookmarkFill className="h-4 w-4 text-secondary" /> : <BsBookmark className="h-4 w-4" />}
            </button>
          </div>
          {(badges.length > 0 || pay) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] text-primary">
              {badges.map((item, i) => (
                <Badge key={item.element.id} item={item} filled={i === 0 ? undefined : false} />
              ))}
              {pay && <span>{pay.label || pay.ref?.label ? `${pay.label || pay.ref.label}: ` : ""}{pay.text}</span>}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center gap-3">
          <LogoBox item={logo} fallbackText={company || title} size="grid" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-primary">{company || subheads[0]?.text || title}</p>
            {location && (
              <p className="flex items-center gap-1 text-[12px] text-slate-500">
                <LuMapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location.text}</span>
              </p>
            )}
          </div>
          {actionButton}
        </div>
      </article>
    );
  }

  // List view — OpportunityListCard layout.
  return (
    <article {...cardProps} className="cursor-pointer rounded-sm border border-black/10 bg-white p-5 transition-colors hover:border-secondary/40">
      {coverImage && <img src={mediaSrc(coverImage)} alt={coverImage.alt || ""} className="-mx-5 -mt-5 mb-5 aspect-[21/9] w-[calc(100%+2.5rem)] max-w-none rounded-t-sm object-cover" />}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {titleNode("block truncate text-[19px] font-bold text-primary")}

          {(company || badges.length > 0) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              {subheads.map((item) => (
                <p key={item.element.id} className="truncate text-[14px] text-slate-500">
                  {item.text}
                </p>
              ))}
              {badges.map((item, i) => (
                <Badge key={item.element.id} item={item} filled={i === 0 ? undefined : false} />
              ))}
            </div>
          )}

          {(prices.length > 0 || metas.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-500">
              {prices.map((item) => (
                <MetaItem key={item.element.id} item={item} />
              ))}
              {metas.map((item) => (
                <MetaItem key={item.element.id} item={item} />
              ))}
            </div>
          )}

          {visibleTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {visibleTags.map((tag) => (
                <span key={tag} className="rounded-sm border border-black/10 px-2.5 py-1 text-[12px] text-slate-600">
                  {tag}
                </span>
              ))}
              {moreTags > 0 && <span className="rounded-sm border border-black/10 px-2.5 py-1 text-[12px] text-slate-600">+{moreTags}</span>}
            </div>
          )}
        </div>

        {(logo || company) && <LogoBox item={logo} fallbackText={company || title} size="list" />}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/10 pt-3">
        <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-500">
          {postedOn && <span>Posted {postedOn}</span>}
          {footerMetas.map((item) => (
            <span key={item.element.id} className="inline-flex items-center gap-1 font-semibold text-primary">
              <MetaItem item={item} />
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 text-primary">
          {actionButton}
          <button
            type="button"
            className="rounded-sm p-1.5 transition-colors hover:text-secondary"
            aria-label="Share"
            onClick={stop(() => shareLink(title, `${window.location.origin}${detailPath || ""}`))}
          >
            <LuShare2 className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-sm p-1.5 transition-colors hover:text-secondary" onClick={stop(() => toggle(entry.id))} aria-label={saved ? "Remove from saved" : "Save"}>
            {saved ? <BsBookmarkFill className="h-4 w-4 text-secondary" /> : <BsBookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
};

export default DynamicCardRenderer;
