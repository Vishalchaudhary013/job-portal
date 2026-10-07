import React, { useMemo } from "react";
import { FIELD_TYPES } from "../../shared/fieldTypes.js";
import { EDECO_LISTING_SLOTS, EDECO_LISTING_TARGETS, suggestListingMapping } from "../../shared/opportunityMapping.js";
import { referenceableFields } from "../../shared/schemaUtils.js";
import { Card, FormRow, Select, TextArea, TextInput, Toggle } from "../ui";
import FieldPicker from "./FieldPicker";

// How Edeco lists this content type: which field is the title, how URLs are
// made, what visitors can search and filter on, sorting and grid layout.

const SEARCHABLE = ["text", "textarea", "richText", "select", "radio", "multiSelect", "email", "url"];
const FILTERABLE = ["select", "radio", "multiSelect", "checkbox", "text", "number", "rating"];

const FieldChecklist = ({ refs, value = [], onChange, accepts }) => {
  const options = refs.filter((ref) => accepts.includes(ref.type));
  if (!options.length) return <p className="text-sm text-slate-500">No suitable fields in the form yet.</p>;
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {options.map((ref) => (
        <label key={ref.id} className="flex cursor-pointer items-center gap-2 rounded-sm border border-slate-200 px-2.5 py-1.5 text-sm hover:bg-slate-50">
          <input type="checkbox" className="h-4 w-4 accent-[#1F2853]" checked={value.includes(ref.id)} onChange={() => onChange(value.includes(ref.id) ? value.filter((id) => id !== ref.id) : [...value, ref.id])} />
          <span className="min-w-0 flex-1 truncate text-slate-800">{ref.label || ref.key}</span>
          <span className="text-[11px] text-slate-400">{FIELD_TYPES[ref.type]?.label}</span>
        </label>
      ))}
    </div>
  );
};

const PresentationEditor = ({ value, onChange, formFields, contentType }) => {
  const refs = useMemo(() => referenceableFields(formFields || []), [formFields]);
  const listing = value.listing || {};
  const set = (patch, mergeKey) => onChange({ ...value, ...patch }, { mergeKey });
  const setListing = (patch, mergeKey) => onChange({ ...value, listing: { ...listing, ...patch } }, { mergeKey });

  const edeco = value.edecoListing || { target: "", fields: {} };
  const setEdeco = (patch) => onChange({ ...value, edecoListing: { ...edeco, ...patch } });
  const setSlot = (slotId, fieldId) => setEdeco({ fields: { ...(edeco.fields || {}), [slotId]: fieldId || undefined } });
  const missingRequired = EDECO_LISTING_SLOTS.filter((slot) => slot.required && !edeco.fields?.[slot.id]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <Card className="space-y-4 p-5">
        <div>
          <h3 className="font-semibold text-slate-900">Show on Edeco job pages</h3>
          <p className="text-sm text-slate-500">
            Published entries appear on the homepage, the listing page with its filters and the detail page — drawn by Edeco's own job pages, exactly like jobs posted from the admin dashboard. Applications go to Edeco's application system.
          </p>
        </div>
        <FormRow label="Show entries as">
          <Select
            value={edeco.target || ""}
            onChange={(event) => {
              const target = event.target.value;
              // First time on: pre-fill the field mapping from field names.
              const fields = target && !Object.keys(edeco.fields || {}).length ? suggestListingMapping(formFields || []) : edeco.fields;
              setEdeco({ target, fields });
            }}
          >
            <option value="">Don't show on Edeco job pages</option>
            {EDECO_LISTING_TARGETS.map((target) => (
              <option key={target.id} value={target.id}>{target.label}</option>
            ))}
          </Select>
        </FormRow>
        {edeco.target && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-medium text-slate-700">Which form field fills each part of the job</p>
              <button type="button" className="text-xs font-semibold text-[#1F2853] hover:underline" onClick={() => setEdeco({ fields: { ...suggestListingMapping(formFields || []), ...(edeco.fields || {}) } })}>
                Auto-match remaining fields
              </button>
            </div>
            {missingRequired.length > 0 && (
              <p className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Choose a field for: {missingRequired.map((slot) => slot.label).join(", ")}. Entries without them aren't listed (without a deadline they stay open for 30 days).
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {EDECO_LISTING_SLOTS.map((slot) => (
                <FormRow key={slot.id} label={`${slot.label}${slot.required ? " *" : ""}`}>
                  <FieldPicker refs={refs} accepts={slot.accepts} value={edeco.fields?.[slot.id] || null} placeholder="Not used" onChange={(fieldId) => setSlot(slot.id, fieldId)} />
                </FormRow>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h3 className="font-semibold text-slate-900">Listing page</h3>
          <p className="text-sm text-slate-500">
            Lives at <code className="rounded-sm bg-slate-100 px-1 text-xs">/explore/{contentType.slug}</code> once the form, card and page are published.
          </p>
        </div>
        <FormRow label="Heading" hint={`Empty = “${contentType.name}”.`}>
          <TextInput value={value.heading || ""} onChange={(event) => set({ heading: event.target.value }, "heading")} />
        </FormRow>
        <FormRow label="Intro text">
          <TextArea rows={2} value={value.intro || ""} onChange={(event) => set({ intro: event.target.value }, "intro")} />
        </FormRow>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormRow label="View">
            <Select value={listing.view || "grid"} onChange={(event) => setListing({ view: event.target.value })}>
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </Select>
          </FormRow>
          <FormRow label="Columns">
            <Select value={listing.columns || 3} disabled={listing.view === "list"} onChange={(event) => setListing({ columns: Number(event.target.value) })}>
              {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Per page">
            <Select value={listing.pageSize || 12} onChange={(event) => setListing({ pageSize: Number(event.target.value) })}>
              {[6, 9, 12, 16, 24, 36, 48].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </FormRow>
        </div>
        <FormRow label="Message when there are no entries">
          <TextInput value={listing.emptyMessage || ""} onChange={(event) => setListing({ emptyMessage: event.target.value }, "empty")} />
        </FormRow>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-slate-900">Titles & URLs</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormRow label="Title field" hint="Used in admin lists, breadcrumbs, the page title — and each entry's URL is created from it automatically.">
            <FieldPicker refs={refs} accepts={["text", "textarea", "select", "radio", "number", "email"]} value={value.titleFieldId} placeholder="First text field" onChange={(titleFieldId) => set({ titleFieldId })} />
          </FormRow>
          {/* Entry URLs always come from the title now, so there's no separate slug source.
          <FormRow label="URL slug from" hint="Applied when an entry's slug is generated.">
            <FieldPicker refs={refs} accepts={["text", "select", "radio", "number"]} value={value.slugFieldId} placeholder="Title field" onChange={(slugFieldId) => set({ slugFieldId })} />
          </FormRow>
          */}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-slate-900">Search, filters & sorting</h3>
        <Toggle label="Show a search box" checked={listing.searchable !== false} onChange={(searchable) => setListing({ searchable })} />
        {listing.searchable !== false && (
          <FormRow label="Search in these fields" hint="The title is always searched.">
            <FieldChecklist refs={refs} accepts={SEARCHABLE} value={listing.searchableFieldIds} onChange={(searchableFieldIds) => setListing({ searchableFieldIds })} />
          </FormRow>
        )}
        <FormRow label="Filters" hint="Choice fields show their options; other fields show the values used in published entries.">
          <FieldChecklist refs={refs} accepts={FILTERABLE} value={listing.filterableFieldIds} onChange={(filterableFieldIds) => setListing({ filterableFieldIds })} />
        </FormRow>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormRow label="Default order">
            <FieldPicker refs={refs} accepts={["number", "date", "datetime", "text", "rating", "select"]} value={listing.sortFieldId} placeholder="Newest published first" onChange={(sortFieldId) => setListing({ sortFieldId })} />
          </FormRow>
          <FormRow label="Direction">
            <Select value={listing.sortDirection || "desc"} disabled={!listing.sortFieldId} onChange={(event) => setListing({ sortDirection: event.target.value })}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Select>
          </FormRow>
        </div>
      </Card>

      {/* The navbar "Explore" menu was removed, so there's no navigation setting.
      <Card className="space-y-4 p-5">
        <h3 className="font-semibold text-slate-900">Navigation</h3>
        <Toggle label="Offer in site navigation" description="Edeco decides where navigation appears; this marks the type as eligible." checked={Boolean(value.showInNavigation)} onChange={(showInNavigation) => set({ showInNavigation })} />
        {value.showInNavigation && (
          <FormRow label="Navigation label">
            <TextInput value={value.navLabel || ""} placeholder={contentType.name} onChange={(event) => set({ navLabel: event.target.value }, "navLabel")} />
          </FormRow>
        )}
      </Card>
      */}
    </div>
  );
};

export default PresentationEditor;
