import React, { useEffect, useMemo, useState } from "react";
import SectionTitle from "../../../components/common/SectionTitle";
import { getCmsRelated } from "../../../services/cmsAPI";
import DynamicCardRenderer from "./DynamicCardRenderer";
import DynamicFieldRenderer from "./DynamicFieldRenderer";
import DynamicSectionRenderer, { Hero, blockIsEmpty } from "./DynamicSectionRenderer";
import { buildFieldIndex, formatValue, isBlank, mediaList, mediaSrc, readField } from "./resolve";

// Builds a full detail page from (page schema + form schema + entry data) in
// the SAME layout as the Jobs / Internship detail page (OpportunityDetailView):
//   hero band (#E9F6FF) with the summary card
//   white body: description column + sticky bordered sidebar card (1250px)
//   "You may also like" strip of grid cards
// The page schema controls which blocks exist, their order, area and field
// mapping; this file controls the look. With no blocks it still renders a
// complete page (title hero + every field as a section). The previous
// implementation is kept in DynamicDetailPageRenderer.v1.jsx.

const WIDTHS = { narrow: "max-w-3xl", default: "max-w-[1250px]", wide: "max-w-[1440px]" };

const RelatedSection = ({ block, ctx, width }) => {
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

  if (!items || !items.length) return null;
  return (
    <section>
      <div className={`mx-auto w-full ${width} px-4 py-14 md:px-6`}>
        <SectionTitle title={block.title || "You may also like"} viewAllLink={ctx.typeSlug ? `/explore/${ctx.typeSlug}` : "/explore"} hideViewAll={ctx.disableLinks} />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <DynamicCardRenderer
              key={item.id}
              variant="grid"
              cardSchema={ctx.cardSchema}
              fieldIndex={ctx.index}
              entry={item}
              typeSlug={ctx.typeSlug}
              onFormAction={ctx.onFormAction}
              disableLinks={ctx.disableLinks}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Top of the sidebar card: logo + name, like the company card.
const SidebarHeader = ({ hero, ctx }) => {
  if (!hero) return null;
  const logo = mediaList(readField(ctx.index, ctx.entry.data, hero.config?.logoFieldId).value)[0];
  const subtitle = readField(ctx.index, ctx.entry.data, hero.config?.subtitleFieldId);
  const name = subtitle.ref && !isBlank(subtitle.value) ? formatValue(subtitle.ref, subtitle.value) : "";
  if (!logo && !name) return null;
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-primary/10">
        {logo ? (
          <img src={mediaSrc(logo)} alt={logo.alt || name} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[16px] font-bold text-primary">{String(name || "E").trim().charAt(0).toUpperCase()}</span>
        )}
      </div>
      <p className="min-w-0 truncate text-[16px] font-semibold text-primary">{name}</p>
    </div>
  );
};

const DynamicDetailPageRenderer = ({ pageSchema, formSchema, cardSchema, entry, contentType, related, onFormAction, onShare, disableLinks = false }) => {
  const index = useMemo(() => buildFieldIndex(formSchema), [formSchema]);
  const layout = pageSchema?.layout || {};
  const blocks = (pageSchema?.blocks || []).filter((block) => block.visible !== false);
  const hasSidebar = layout.sidebar && layout.sidebar !== "none";
  const width = WIDTHS[layout.width] || WIDTHS.default;

  const ctx = { index, entry, typeSlug: contentType?.slug, formSchema, cardSchema, related, onFormAction, onShare, disableLinks };
  const heroes = blocks.filter((block) => block.type === "hero");
  const relatedBlocks = blocks.filter((block) => block.type === "related");
  const body = blocks.filter((block) => !["hero", "related"].includes(block.type));
  const sidebar = hasSidebar ? body.filter((block) => block.area === "sidebar" && !(block.hideWhenEmpty !== false && blockIsEmpty(block, ctx))) : [];
  const main = hasSidebar ? body.filter((block) => block.area !== "sidebar") : body;
  // A page always opens with the hero band, even if none was configured.
  const heroBlocks = heroes.length ? heroes : [{ id: "auto-hero", type: "hero", config: {} }];

  const fallback = !blocks.length && (
    <div>
      {[...index.values()]
        .filter((ref) => !ref.path.includes(".") && !isBlank(entry.data?.[ref.key]))
        .map((ref) => (
          <div key={ref.id} className="mt-7 first:mt-0">
            <h3 className="text-[20px] font-bold text-primary sm:text-[24px]">{ref.label}</h3>
            <div className="mt-3 text-[15px] text-black">
              <DynamicFieldRenderer fieldRef={ref} value={entry.data[ref.key]} />
            </div>
          </div>
        ))}
    </div>
  );

  const aside = sidebar.length > 0 && (
    // self-start keeps the card its own height (and lets sticky work) inside the grid.
    <aside className="h-fit self-start rounded-sm border border-black/10 bg-white p-6 lg:sticky lg:top-24">
      <SidebarHeader hero={heroes[0]} ctx={ctx} />
      {sidebar.map((block) => (
        <DynamicSectionRenderer key={block.id} block={block} ctx={ctx} inSidebar />
      ))}
    </aside>
  );

  return (
    <>
      {heroBlocks.map((block) => (
        <Hero key={block.id} block={block} ctx={ctx} />
      ))}

      <section className="bg-white">
        <div className={`mx-auto w-full ${width} px-4 py-14 md:px-6`}>
          <div className={`grid grid-cols-1 gap-10 ${aside ? (layout.sidebar === "left" ? "lg:grid-cols-[360px_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_360px]") : ""}`}>
            {aside && layout.sidebar === "left" && aside}
            <div className="min-w-0">
              {fallback}
              {main.map((block) => (
                <DynamicSectionRenderer key={block.id} block={block} ctx={ctx} />
              ))}
            </div>
            {aside && layout.sidebar !== "left" && aside}
          </div>
        </div>
      </section>

      {relatedBlocks.map((block) => (
        <RelatedSection key={block.id} block={block} ctx={ctx} width={width} />
      ))}
    </>
  );
};

export default DynamicDetailPageRenderer;
