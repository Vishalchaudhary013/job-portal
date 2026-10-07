import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { RiArrowRightUpLongLine } from "react-icons/ri";
import { RatingStars } from "./DynamicFieldRenderer";
import { buildFieldIndex, entryPath, formatDate, formatValue, isBlank, isSafeHref, mediaList, mediaSrc, readField, toList } from "./resolve";
import { ASPECT_CLASSES, BUTTON_CLASSES, GAP_CLASSES, ICONS, PAD_CLASSES, RADIUS_CLASSES, SHADOW_CLASSES, TONE_CLASSES } from "./theme";

// Renders one entry as a card from the admin-built card schema. The card
// schema decides WHAT appears and WHERE; this component decides how it looks
// (Edeco's design system). It never renders arbitrary markup from the schema.

const clampClass = (lines) => ({ 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3", 4: "line-clamp-4" })[lines] || "";

const toneFor = (element, rawValue) => {
  const key = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  return TONE_CLASSES[element.toneMap?.[String(key)] || element.tone] || TONE_CLASSES.neutral;
};

const CardElement = ({ element, index, data }) => {
  if (element.visible === false) return null;

  const { ref, value } = element.source === "static" ? { ref: null, value: element.text } : readField(index, data, element.fieldId);
  if (element.source !== "static" && !ref) return null; // field removed from the form
  if (isBlank(value) && element.hideWhenEmpty !== false) return null;

  const text = element.source === "static" ? String(value || "") : formatValue(ref, value);
  const withAffixes = (content) => `${element.prefix || ""}${content}${element.suffix || ""}`;
  const label = element.showLabel && (element.label || ref?.label);
  const Icon = ICONS[element.icon];

  switch (element.display) {
    case "image": {
      const image = mediaList(value)[0];
      return image ? <img src={mediaSrc(image)} alt={image.alt || ""} className="h-full w-full object-cover" loading="lazy" /> : null;
    }
    case "logo": {
      const image = mediaList(value)[0];
      return image ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-black/5 bg-white">
          <img src={mediaSrc(image)} alt={image.alt || ""} className="h-full w-full object-contain" loading="lazy" />
        </span>
      ) : null;
    }
    case "heading":
      return <h3 className={`text-[19px] font-semibold leading-snug text-slate-900 ${clampClass(element.lines)}`}>{withAffixes(text)}</h3>;
    case "subheading":
      return <p className={`text-[15px] font-medium text-slate-700 ${clampClass(element.lines)}`}>{withAffixes(text)}</p>;
    case "badge":
      return (
        <span className={`inline-flex w-fit items-center gap-1 rounded-sm px-2.5 py-0.5 text-[11.5px] font-semibold ${toneFor(element, value)}`}>
          {Icon && <Icon size={12} />}
          {label ? `${label}: ` : ""}
          {withAffixes(text)}
        </span>
      );
    case "tags": {
      const items = element.source === "static" ? [text] : toList(ref, value);
      return (
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, element.lines > 0 ? element.lines * 2 : 6).map((item, i) => (
            <span key={`${item}-${i}`} className="rounded-sm bg-gray-100 px-3 py-[2px] text-[13px] text-gray-700">{item}</span>
          ))}
        </div>
      );
    }
    case "meta":
      return (
        <p className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-slate-600">
          {Icon && <Icon size={14} className="shrink-0 text-slate-500" />}
          {label && <span className="font-medium text-slate-500">{label}:</span>}
          <span className="truncate">{withAffixes(text)}</span>
        </p>
      );
    case "price":
      return (
        <p className="text-[15.5px] font-semibold text-slate-900">
          {label && <span className="mr-1 text-[13px] font-normal text-slate-500">{label}</span>}
          {withAffixes(text)}
        </p>
      );
    case "rating":
      return <RatingStars value={value} max={Number(ref?.field?.settings?.max) || 5} size={14} />;
    case "date":
      return (
        <p className="flex items-center gap-1.5 text-[13px] text-slate-600">
          {Icon && <Icon size={14} />}
          {label && <span className="text-slate-500">{label}:</span>}
          {withAffixes(ref?.type === "datetime" ? formatDate(value, true) : formatDate(value))}
        </p>
      );
    default:
      return (
        <p className={`text-[14px] leading-relaxed text-slate-600 ${clampClass(element.lines)}`}>
          {label && <span className="font-medium text-slate-700">{label}: </span>}
          {withAffixes(text)}
        </p>
      );
  }
};

const resolveAction = (cardSchema, entry, typeSlug, index) => {
  const action = cardSchema?.action || { type: "detail", label: "View details" };
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
      return typeSlug ? { kind: "internal", href: entryPath(typeSlug, entry), label: action.label || "View details" } : null;
  }
};

const DynamicCardRenderer = ({ cardSchema, formSchema, entry, typeSlug, onFormAction, fieldIndex, disableLinks = false }) => {
  const index = useMemo(() => fieldIndex || buildFieldIndex(formSchema), [fieldIndex, formSchema]);
  const schema = cardSchema || {};
  const style = schema.style || {};
  const elements = (schema.elements || []).filter((element) => element.visible !== false);
  const zone = (name) => elements.filter((element) => element.zone === name);

  const action = resolveAction(schema, entry, typeSlug, index);
  const actionStyle = BUTTON_CLASSES[schema.action?.style] || BUTTON_CLASSES.primary;
  const horizontal = schema.layout === "horizontal";
  const centered = style.align === "center";
  const media = zone("media");
  const hasMedia = media.some((element) => element.fieldId && !isBlank(readField(index, entry.data, element.fieldId).value));
  const cardLinkable = action?.kind === "internal" && schema.action?.wholeCardClickable !== false && !disableLinks;

  // A card with nothing configured still shows something sensible.
  const fallback = !elements.length;

  const actionButton = action && (
    action.kind === "form" ? (
      <button
        type="button"
        onClick={() => !disableLinks && onFormAction?.(action.formSlug, entry)}
        className={`relative z-10 inline-flex items-center gap-1 rounded-sm px-4 py-1.5 text-sm font-medium transition ${actionStyle}`}
      >
        {action.label || "Apply"} <RiArrowRightUpLongLine />
      </button>
    ) : action.kind === "internal" ? (
      <Link
        to={disableLinks ? "#" : action.href}
        onClick={(event) => disableLinks && event.preventDefault()}
        className={`relative z-10 inline-flex items-center gap-1 rounded-sm px-4 py-1.5 text-sm font-medium transition ${actionStyle}`}
      >
        {action.label} <RiArrowRightUpLongLine />
      </Link>
    ) : (
      <a
        href={disableLinks ? undefined : action.href}
        target={action.newTab ? "_blank" : undefined}
        rel="noopener noreferrer"
        className={`relative z-10 inline-flex items-center gap-1 rounded-sm px-4 py-1.5 text-sm font-medium transition ${actionStyle}`}
      >
        {action.label || "Open"} <RiArrowRightUpLongLine />
      </a>
    )
  );

  return (
    <article
      className={`group relative flex h-full overflow-hidden bg-white transition hover:-translate-y-0.5  ${horizontal ? "flex-row" : "flex-col"} ${
        RADIUS_CLASSES[style.radius] ?? RADIUS_CLASSES.md
      } ${SHADOW_CLASSES[style.shadow] ?? SHADOW_CLASSES.sm} ${style.border === false ? "" : "border border-gray-100"}`}
    >
      {cardLinkable && <Link to={action.href} className="absolute inset-0 z-0" aria-label={entry.title || "Open"} />}

      {hasMedia && (
        <div
          className={`relative shrink-0 overflow-hidden bg-slate-100 ${
            horizontal ? "w-36 sm:w-44" : ASPECT_CLASSES[style.imageAspect] ?? ASPECT_CLASSES["16/9"]
          } ${style.imageFit === "contain" ? "[&_img]:object-contain [&_img]:p-3" : ""}`}
        >
          {media.map((element) => (
            <CardElement key={element.id} element={element} index={index} data={entry.data} />
          ))}
        </div>
      )}

      <div className={`flex min-w-0 flex-1 flex-col ${PAD_CLASSES[style.padding] ?? PAD_CLASSES.md} ${centered ? "items-center text-center" : ""}`}>
        {zone("header").length > 0 && (
          <div className={`mb-3 flex flex-wrap items-center gap-2 ${centered ? "justify-center" : "justify-between"}`}>
            {zone("header").map((element) => (
              <CardElement key={element.id} element={element} index={index} data={entry.data} />
            ))}
          </div>
        )}

        <div className={`flex flex-col ${GAP_CLASSES[style.gap] ?? GAP_CLASSES.normal} ${centered ? "items-center" : ""}`}>
          {fallback ? (
            <h3 className="text-[19px] font-semibold text-slate-900">{entry.title}</h3>
          ) : (
            zone("body").map((element) => <CardElement key={element.id} element={element} index={index} data={entry.data} />)
          )}
        </div>

        {(zone("footer").length > 0 || actionButton) && (
          <div className={`mt-auto flex flex-wrap items-center gap-3 border-t border-black/10 pt-3 ${zone("body").length || fallback ? "mt-4" : ""} ${centered ? "justify-center" : "justify-between"}`}>
            <div className="flex min-w-0 flex-col gap-1">
              {zone("footer").map((element) => (
                <CardElement key={element.id} element={element} index={index} data={entry.data} />
              ))}
            </div>
            {actionButton}
          </div>
        )}
      </div>
    </article>
  );
};

export default DynamicCardRenderer;
