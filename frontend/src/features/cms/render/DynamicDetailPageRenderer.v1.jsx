import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import DynamicFieldRenderer from "./DynamicFieldRenderer";
import DynamicSectionRenderer from "./DynamicSectionRenderer";
import { buildFieldIndex, isBlank } from "./resolve";

// Builds a full detail page from (page schema + form schema + entry data).
// The page schema controls structure (block order, areas, visibility,
// labels); Edeco controls the look. With no blocks configured it falls back
// to listing every field so content is never invisible.

const WIDTHS = { narrow: "max-w-3xl", default: "max-w-[1250px]", wide: "max-w-[1440px]" };

const DynamicDetailPageRenderer = ({
  pageSchema,
  formSchema,
  cardSchema,
  entry,
  contentType,
  related,
  onFormAction,
  onShare,
  disableLinks = false,
  showBreadcrumbs = true,
}) => {
  const index = useMemo(() => buildFieldIndex(formSchema), [formSchema]);
  const layout = pageSchema?.layout || {};
  const blocks = (pageSchema?.blocks || []).filter((block) => block.visible !== false);
  const heroes = blocks.filter((block) => block.type === "hero");
  const main = blocks.filter((block) => block.type !== "hero" && block.area !== "sidebar");
  const sidebar = layout.sidebar && layout.sidebar !== "none" ? blocks.filter((block) => block.type !== "hero" && block.area === "sidebar") : [];
  const mainBlocks = layout.sidebar && layout.sidebar !== "none" ? main : blocks.filter((block) => block.type !== "hero");

  const ctx = { index, entry, typeSlug: contentType?.slug, formSchema, cardSchema, related, onFormAction, onShare, disableLinks };
  const width = WIDTHS[layout.width] || WIDTHS.default;
  const hasSidebar = sidebar.length > 0;

  const fallback = !blocks.length && (
    <section className="rounded-sm border border-[#EEF2FF] bg-white p-5 sm:p-6">
      <h1 className="mb-6 text-[26px] font-semibold text-[#1F2853]">{entry.title}</h1>
      <dl className="space-y-5">
        {[...index.values()]
          .filter((ref) => !ref.path.includes(".") && !isBlank(entry.data?.[ref.key]))
          .map((ref) => (
            <div key={ref.id}>
              <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{ref.label}</dt>
              <dd>
                <DynamicFieldRenderer fieldRef={ref} value={entry.data[ref.key]} />
              </dd>
            </div>
          ))}
      </dl>
    </section>
  );

  return (
    <div className={`min-h-[70vh] pb-16 ${layout.background === "plain" ? "bg-white" : "bg-[#EEF2FF]"}`}>
      {showBreadcrumbs && contentType && (
        <div className={`mx-auto w-full ${width} px-4 pt-5 text-sm text-slate-500 md:px-6`}>
          {disableLinks ? <span>Home</span> : <Link to="/" className="hover:underline">Home</Link>}
          <span className="mx-2">&gt;</span>
          {disableLinks ? <span>{contentType.name}</span> : <Link to={`/explore/${contentType.slug}`} className="hover:underline">{contentType.name}</Link>}
          <span className="mx-2">&gt;</span>
          <span className="font-medium text-slate-700">{entry.title}</span>
        </div>
      )}

      {heroes.map((block) => (
        <DynamicSectionRenderer key={block.id} block={block} ctx={ctx} />
      ))}

      <div className={`mx-auto w-full ${width} px-4 pt-6 md:px-6`}>
        <div className={`grid items-start gap-6 ${hasSidebar ? (layout.sidebar === "left" ? "lg:grid-cols-[340px_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_360px]") : ""}`}>
          {hasSidebar && layout.sidebar === "left" && (
            <aside className="space-y-6 lg:sticky lg:top-24">
              {sidebar.map((block) => (
                <DynamicSectionRenderer key={block.id} block={block} ctx={ctx} />
              ))}
            </aside>
          )}
          <div className="min-w-0 space-y-6">
            {fallback}
            {mainBlocks.map((block) => (
              <DynamicSectionRenderer key={block.id} block={block} ctx={ctx} />
            ))}
          </div>
          {hasSidebar && layout.sidebar !== "left" && (
            <aside className="space-y-6 lg:sticky lg:top-24">
              {sidebar.map((block) => (
                <DynamicSectionRenderer key={block.id} block={block} ctx={ctx} />
              ))}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicDetailPageRenderer;
