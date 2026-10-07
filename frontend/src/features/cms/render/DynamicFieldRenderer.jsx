import React, { useState } from "react";
import { FiChevronDown, FiDownload, FiStar } from "react-icons/fi";
import { formatValue, isBlank, isSafeHref, mediaList, mediaSrc } from "./resolve";
import { PROSE_CLASSES } from "./theme";

// Renders ONE field value automatically, based on its field type. Used by the
// detail page's "Single field" block and anywhere a value needs its natural
// presentation (repeater items, group children, fallback layouts).

const videoEmbedUrl = (raw) => {
  const url = typeof raw === "string" ? raw : raw?.url;
  if (!url) return null;
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (youtube) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${youtube[1]}` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: "video", src: mediaSrc({ url }) };
};

export const VideoEmbed = ({ value, title }) => {
  const embed = videoEmbedUrl(value);
  if (!embed) return null;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-sm bg-black">
      {embed.kind === "iframe" ? (
        <iframe src={embed.src} title={title || "Video"} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
      ) : (
        <video src={embed.src} controls className="h-full w-full" preload="metadata" />
      )}
    </div>
  );
};

export const RatingStars = ({ value, max = 5, size = 16 }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of ${max}`}>
    {Array.from({ length: max }, (_, index) => (
      <FiStar key={index} size={size} className={index < Math.round(Number(value) || 0) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
    ))}
  </span>
);

export const FaqList = ({ items }) => {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-black/10 rounded-sm border border-black/10 bg-white">
      {items.map((item, index) => (
        <div key={index}>
          <button
            type="button"
            onClick={() => setOpen(open === index ? -1 : index)}
            aria-expanded={open === index}
            className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-[15px] font-semibold text-primary"
          >
            {item.question}
            <FiChevronDown className={`shrink-0 transition-transform ${open === index ? "rotate-180" : ""}`} />
          </button>
          {open === index && <div className={`px-4 pb-4 ${PROSE_CLASSES}`} dangerouslySetInnerHTML={{ __html: item.answer }} />}
        </div>
      ))}
    </div>
  );
};

export const DataTable = ({ columns, rows }) => (
  <div className="overflow-x-auto rounded-sm border border-black/10">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-primary/5 text-primary">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="px-4 py-2.5 font-semibold">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-black/5 bg-white">
        {rows.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column.key} className="px-4 py-2.5 text-black">
                {row?.[column.key] ?? ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const childRef = (child) => ({ id: child.id, key: child.key, type: child.type, label: child.label, field: child });

const DynamicFieldRenderer = ({ fieldRef, value, compact = false }) => {
  if (!fieldRef || isBlank(value)) return null;
  const field = fieldRef.field || {};

  switch (fieldRef.type) {
    case "richText":
      return <div className={PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: value }} />;
    case "textarea":
      return <p className="whitespace-pre-line text-[15px] leading-relaxed text-black">{value}</p>;
    case "url":
      return isSafeHref(value) ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="break-all text-[#1F2853] underline underline-offset-2">
          {value}
        </a>
      ) : null;
    case "email":
      return <a href={`mailto:${value}`} className="text-[#1F2853] underline underline-offset-2">{value}</a>;
    case "phone":
      return <a href={`tel:${String(value).replace(/\s/g, "")}`} className="text-[#1F2853] underline underline-offset-2">{value}</a>;
    case "color":
      return (
        <span className="inline-flex items-center gap-2 text-slate-700">
          <span className="h-4 w-4 rounded-sm border border-black/10" style={{ backgroundColor: value }} /> {value}
        </span>
      );
    case "multiSelect":
    case "checkbox": {
      if (fieldRef.type === "checkbox" && !field.options?.length) return <span className="text-slate-700">{value ? "Yes" : "No"}</span>;
      const labels = formatValue(fieldRef, value).split(", ").filter(Boolean);
      return (
        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <span key={label} className="rounded-sm bg-primary/5 px-3 py-1.5 text-[14px] font-medium text-black">{label}</span>
          ))}
        </div>
      );
    }
    case "rating":
      return <RatingStars value={value} max={Number(field.settings?.max) || 5} />;
    case "image": {
      const images = mediaList(value);
      if (images.length === 1) {
        return <img src={mediaSrc(images[0])} alt={images[0].alt || fieldRef.label || ""} className="w-full rounded-sm object-cover" loading="lazy" />;
      }
      return (
        <div className={`grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
          {images.map((image, index) => (
            <img key={index} src={mediaSrc(image)} alt={image.alt || ""} className="aspect-[4/3] w-full rounded-sm object-cover" loading="lazy" />
          ))}
        </div>
      );
    }
    case "file":
      return (
        <ul className="space-y-2">
          {mediaList(value).map((file, index) => (
            <li key={index}>
              <a href={mediaSrc(file)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-[#1F2853] hover:underline">
                <FiDownload /> {file.name || "Download"}
              </a>
            </li>
          ))}
        </ul>
      );
    case "video":
      return <VideoEmbed value={value} title={fieldRef.label} />;
    case "faq":
      return Array.isArray(value) ? <FaqList items={value} /> : null;
    case "table":
      return Array.isArray(value) ? <DataTable columns={field.columns || []} rows={value} /> : null;
    case "group":
      return (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {(field.children || []).filter((child) => child.key && !isBlank(value?.[child.key])).map((child) => (
            <div key={child.id}>
              <dt className="text-[14px] font-semibold text-primary">{child.label}</dt>
              <dd className="mt-0.5 text-black/70">
                <DynamicFieldRenderer fieldRef={childRef(child)} value={value[child.key]} compact />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "repeater":
      return (
        <div className="space-y-3">
          {(Array.isArray(value) ? value : []).map((item, index) => (
            <div key={index} className="rounded-sm border border-black/10 bg-white p-4">
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {(field.children || []).filter((child) => child.key && !isBlank(item?.[child.key])).map((child) => (
                  <div key={child.id} className={["richText", "textarea", "image", "table", "repeater"].includes(child.type) ? "sm:col-span-2" : ""}>
                    <dt className="text-[14px] font-semibold text-primary">{child.label}</dt>
                    <dd className="mt-0.5 text-black/70">
                      <DynamicFieldRenderer fieldRef={childRef(child)} value={item[child.key]} compact />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      );
    default:
      return <span className="text-black">{formatValue(fieldRef, value)}</span>;
  }
};

export default DynamicFieldRenderer;
