import React, { useEffect, useMemo, useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { CARD_TEMPLATES, PAGE_TEMPLATES, applyCardTemplate, applyPageTemplate } from "../../shared/layoutTemplates.js";
import { PAGE_BLOCKS } from "../../shared/presentation.js";
import { Alert, Badge, Button, Modal, cx } from "../ui";

// Built-in card / detail page layouts (shared/layoutTemplates.js). Shows a
// wireframe of the layout as it comes out for *this* form and which field
// each slot picked, then hands the finished schema to the builder.

export const LAYOUT_TEMPLATE_KINDS = {
  card: { list: CARD_TEMPLATES, apply: applyCardTemplate, noun: "card" },
  page: { list: PAGE_TEMPLATES, apply: applyPageTemplate, noun: "detail page" },
};

// Wireframes

const Bar = ({ className }) => <span className={cx("block h-1.5 rounded-sm bg-slate-300", className)} />;

const CARD_SHAPES = {
  image: () => <span className="block aspect-[16/9] w-full rounded-sm bg-slate-200" />,
  logo: () => <span className="block h-5 w-5 shrink-0 rounded-sm bg-slate-300" />,
  badge: () => <span className="inline-block h-3 w-9 rounded-sm bg-[#1F2853]/20" />,
  heading: () => <Bar className="h-2.5 w-4/5 bg-slate-500" />,
  subheading: () => <Bar className="h-2 w-1/2 bg-slate-400" />,
  text: () => (
    <span className="block space-y-1">
      <Bar className="w-full" />
      <Bar className="w-3/4" />
    </span>
  ),
  meta: () => (
    <span className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      <Bar className="w-16" />
    </span>
  ),
  date: () => (
    <span className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      <Bar className="w-10" />
    </span>
  ),
  tags: () => (
    <span className="flex gap-1">
      {[0, 1, 2].map((n) => <span key={n} className="h-2.5 w-7 rounded-sm bg-slate-200" />)}
    </span>
  ),
  price: () => <Bar className="h-2 w-10 bg-emerald-400" />,
  rating: () => (
    <span className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((n) => <span key={n} className="h-1.5 w-1.5 rounded-sm bg-amber-400" />)}
    </span>
  ),
};

const CardWireframe = ({ schema, labels }) => {
  const elements = (schema.elements || []).filter((element) => element.visible !== false);
  const inZone = (zone) => elements.filter((element) => element.zone === zone);
  const shape = (element) => {
    const Shape = CARD_SHAPES[element.display] || CARD_SHAPES.text;
    return <span key={element.id} title={labels.get(element.fieldId) || element.text || ""} className="block"><Shape /></span>;
  };
  const horizontal = schema.layout === "horizontal";
  const centered = schema.style?.align === "center";
  const media = inZone("media");
  const headerRow = inZone("header");
  return (
    <div className={cx("overflow-hidden rounded-sm bg-white", schema.style?.border !== false && "border border-slate-200", horizontal && "flex")}>
      {media.length > 0 && (
        <div className={horizontal ? "flex w-1/4 shrink-0 items-start p-2" : ""}>{media.map(shape)}</div>
      )}
      <div className={cx("min-w-0 flex-1 space-y-1.5 p-2.5", centered && "text-center [&>*]:mx-auto [&_span.flex]:justify-center")}>
        {headerRow.length > 0 && <div className={cx("flex flex-wrap items-center gap-1", centered && "justify-center")}>{headerRow.map(shape)}</div>}
        {inZone("body").map(shape)}
        <div className={cx("flex items-center gap-2 pt-1", centered ? "justify-center" : "justify-between")}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{inZone("footer").map(shape)}</div>
          {schema.action?.type !== "none" && (
            <span className={cx("shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold", schema.action?.style === "link" ? "text-[#1F2853] underline" : schema.action?.style === "secondary" ? "border border-[#1F2853] text-[#1F2853]" : "bg-[#1F2853] text-white")}>
              {schema.action?.label || "View"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const blockName = (block, labels) => block.title || labels.get(block.config?.fieldId) || PAGE_BLOCKS[block.type]?.label || block.type;

const PageBlockRow = ({ block, labels }) => {
  if (block.type === "divider") return <hr className="border-slate-200" />;
  const children = block.children || [];
  return (
    <div className="rounded-sm border border-slate-200 bg-white px-2 py-1.5">
      <p className="truncate text-[10px] font-semibold text-slate-600">{blockName(block, labels)}</p>
      {block.type === "tabs" ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {children.map((child, index) => (
            <span key={child.id} className={cx("rounded-sm px-1.5 py-0.5 text-[9px]", index === 0 ? "bg-[#1F2853] text-white" : "bg-slate-100 text-slate-500")}>{blockName(child, labels)}</span>
          ))}
        </div>
      ) : block.type === "fieldList" && block.config?.variant === "cards" ? (
        <div className="mt-1 grid grid-cols-3 gap-1">{(block.config.items || []).slice(0, 6).map((item) => <span key={item.id} className="h-3 rounded-sm bg-slate-100" />)}</div>
      ) : block.type === "related" ? (
        <div className="mt-1 grid grid-cols-3 gap-1">{[0, 1, 2].map((n) => <span key={n} className="h-4 rounded-sm border border-slate-200" />)}</div>
      ) : (
        <span className="mt-1 block space-y-1">
          <Bar className="w-full bg-slate-200" />
          <Bar className="w-2/3 bg-slate-200" />
        </span>
      )}
    </div>
  );
};

const PageWireframe = ({ schema, labels }) => {
  const blocks = (schema.blocks || []).filter((block) => block.visible !== false);
  const hero = blocks.find((block) => block.type === "hero");
  const sidebar = schema.layout?.sidebar && schema.layout.sidebar !== "none" ? schema.layout.sidebar : null;
  const main = blocks.filter((block) => block.type !== "hero" && (!sidebar || block.area !== "sidebar"));
  const side = sidebar ? blocks.filter((block) => block.type !== "hero" && block.area === "sidebar") : [];
  const width = { narrow: "max-w-[70%]", wide: "max-w-full", default: "max-w-[88%]" }[schema.layout?.width || "default"];
  return (
    <div className={cx("overflow-hidden rounded-sm border border-slate-200", schema.layout?.background === "plain" ? "bg-white" : "bg-[#E9F6FF]/60")}>
      {hero && (
        <div className={cx("px-3 py-3", hero.config?.variant === "banner" ? "bg-[#1F2853]/10" : "")}>
          <div className={cx("mx-auto flex gap-2", width, hero.config?.variant === "split" && "items-center")}>
            {hero.config?.logoFieldId && <span className="h-6 w-6 shrink-0 rounded-sm bg-slate-300" />}
            <div className="min-w-0 flex-1 space-y-1">
              {(hero.config?.badgeFieldIds || []).length > 0 && (
                <span className="flex gap-1">{hero.config.badgeFieldIds.map((id) => <span key={id} className="h-2.5 w-8 rounded-sm bg-[#1F2853]/20" />)}</span>
              )}
              <Bar className="h-2.5 w-3/5 bg-slate-500" />
              {hero.config?.subtitleFieldId && <Bar className="h-2 w-1/3 bg-slate-400" />}
              {(hero.config?.metaFieldIds || []).length > 0 && (
                <span className="flex gap-2">{hero.config.metaFieldIds.map((id) => <Bar key={id} className="w-10" />)}</span>
              )}
              {(hero.config?.buttons || []).length > 0 && (
                <span className="flex gap-1 pt-0.5">
                  {hero.config.buttons.map((button) => (
                    <span key={button.id} className={cx("rounded-sm px-1.5 py-0.5 text-[9px] font-semibold", button.style === "primary" ? "bg-[#1F2853] text-white" : "border border-[#1F2853] text-[#1F2853]")}>{button.label}</span>
                  ))}
                </span>
              )}
            </div>
            {hero.config?.variant === "split" && hero.config?.imageFieldId && <span className="aspect-[4/3] w-1/3 shrink-0 rounded-sm bg-slate-200" />}
          </div>
          {hero.config?.variant === "banner" && hero.config?.imageFieldId && <span className={cx("mx-auto mt-2 block h-8 rounded-sm bg-slate-200", width)} />}
        </div>
      )}
      <div className={cx("mx-auto grid gap-2 p-3", width, sidebar && "grid-cols-[1fr_34%]", sidebar === "left" && "grid-cols-[34%_1fr]")}>
        {sidebar === "left" && <div className="space-y-1.5">{side.map((block) => <PageBlockRow key={block.id} block={block} labels={labels} />)}</div>}
        <div className="min-w-0 space-y-1.5">
          {main.map((block) => <PageBlockRow key={block.id} block={block} labels={labels} />)}
          {!main.length && <p className="text-center text-[10px] text-slate-400">No sections for this form</p>}
        </div>
        {sidebar === "right" && <div className="space-y-1.5">{side.map((block) => <PageBlockRow key={block.id} block={block} labels={labels} />)}</div>}
      </div>
    </div>
  );
};

// Draws the template as it comes out for the given form fields.
export const LayoutWireframe = ({ kind, templateId, fields }) => {
  const result = useMemo(() => LAYOUT_TEMPLATE_KINDS[kind].apply(templateId, fields), [kind, templateId, fields]);
  const labels = useMemo(() => new Map(result.matches.filter((match) => match.field).map((match) => [match.field.id, match.field.label || match.field.key])), [result]);
  return kind === "card" ? <CardWireframe schema={result.schema} labels={labels} /> : <PageWireframe schema={result.schema} labels={labels} />;
};

// Picker

const LayoutTemplatePicker = ({ open, onClose, kind, formFields, initialId, hasContent, onApply }) => {
  const { list, apply, noun } = LAYOUT_TEMPLATE_KINDS[kind];
  const [selectedId, setSelectedId] = useState(initialId || list[0].id);

  useEffect(() => {
    if (open) setSelectedId(list.some((template) => template.id === initialId) ? initialId : list[0].id);
  }, [open, initialId, list]);

  const selected = list.find((template) => template.id === selectedId) || list[0];
  const result = useMemo(() => apply(selected.id, formFields || []), [apply, selected.id, formFields]);
  const missing = result.matches.filter((match) => !match.field);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`Start the ${noun} from a template`}
      description="Each template matches its slots to this form's fields by name and type. Change anything afterwards."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={LayoutTemplate} onClick={() => onApply(result.schema, selected)}>Use “{selected.name}”</Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="space-y-1" role="listbox" aria-label={`${noun} templates`}>
          {list.map((template) => (
            <button
              key={template.id}
              type="button"
              role="option"
              aria-selected={template.id === selected.id}
              onClick={() => setSelectedId(template.id)}
              className={cx(
                "w-full rounded-sm border px-3 py-2 text-left",
                template.id === selected.id ? "border-[#1F2853] bg-[#1F2853]/5" : "border-slate-200 hover:border-slate-300",
              )}
            >
              <span className="block text-sm font-semibold text-slate-900">{template.name}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{template.description}</span>
            </button>
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          {hasContent && (
            <Alert tone="warning">This replaces the current {noun} layout. Use Undo (Ctrl+Z) to get it back.</Alert>
          )}
          <div className={cx("rounded-sm bg-slate-50 p-4", kind === "card" && "flex justify-center")}>
            <div className={kind === "card" ? "w-full max-w-[280px]" : "w-full"}>
              <LayoutWireframe kind={kind} templateId={selected.id} fields={formFields || []} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Fields this template uses</p>
            <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {result.matches.filter((match) => match.field).map((match) => (
                <div key={match.role} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-500">{match.label}</span>
                  <span className="truncate font-medium text-slate-800">{match.field.label || match.field.key}</span>
                </div>
              ))}
            </div>
            {missing.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Skipped, no matching field: {missing.map((match) => match.label).join(", ")}.
              </p>
            )}
            {kind === "page" && <p className="mt-1 text-xs text-slate-500">Long text, lists, tables and FAQ fields not listed above get their own sections.</p>}
          </div>
          {!result.matches.some((match) => match.field) && <Badge tone="amber">No fields matched. Add fields to the form first.</Badge>}
        </div>
      </div>
    </Modal>
  );
};

export default LayoutTemplatePicker;
