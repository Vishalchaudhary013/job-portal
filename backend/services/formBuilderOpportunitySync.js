import InternshipOpportunity from "../models/internshipOpportunityModel.js";
import User from "../models/userModel.js";
import { onCmsEvent } from "../cms/services/events.js";
import { getPublishedEntryById, getPublishedType, listPublishedEntries, listPublishedTypes } from "../cms/services/delivery.js";
import { mapEntryToOpportunity, missingListingFields } from "../cms/shared/opportunityMapping.js";

// Edeco side of the Form Builder integration: keeps Edeco's opportunity
// records in step with Form Builder entries whose content type is set to
// "Show on Edeco job pages". Those records are what the homepage cards, the
// /jobs listing (filters, sorting, pagination), the detail page and Apply all
// already read — so Form Builder jobs look and behave exactly like jobs posted
// from the admin dashboard.
//
// It only reads the Form Builder through its delivery layer (published data)
// and only ever touches records it created (source: "form-builder").

const SOURCE = "form-builder";
const DEFAULT_DEADLINE_DAYS = 30;

let ownerId = null;
const recordOwner = async () => {
  if (!ownerId) {
    const owner = await User.findOne({ role: "super_admin" }).select("_id").lean();
    ownerId = owner?._id || null;
  }
  return ownerId;
};

const removeRecord = (contentId) => InternshipOpportunity.deleteOne({ cmsContentId: String(contentId), source: SOURCE });

export const syncEntry = async (contentId) => {
  let published;
  try {
    published = await getPublishedEntryById(String(contentId));
  } catch {
    // Not published (or gone) -> not on Edeco either.
    await removeRecord(contentId);
    return { action: "removed" };
  }

  const type = await getPublishedType(published.contentType.slug);
  const listing = type.presentation?.edecoListing;
  if (!listing?.target) {
    await removeRecord(contentId);
    return { action: "removed" };
  }

  const record = mapEntryToOpportunity({ fields: type.formSchema?.fields || [], data: published.entry.data, mapping: listing.fields || {}, target: listing.target });
  const missing = missingListingFields(record);
  if (missing.length) {
    console.warn(`[form-builder sync] "${published.entry.title}" not listed — missing ${missing.join(", ")}.`);
    await removeRecord(contentId);
    return { action: "skipped", missing };
  }
  // Edeco requires a deadline; without one the posting stays open for 30 days from publish.
  if (!record.deadline) {
    record.deadline = new Date(new Date(published.entry.publishedAt || Date.now()).getTime() + DEFAULT_DEADLINE_DAYS * 864e5);
  }

  const owner = await recordOwner();
  if (!owner) {
    console.warn("[form-builder sync] No super admin account to own synced records — skipped.");
    return { action: "skipped" };
  }

  await InternshipOpportunity.findOneAndUpdate(
    { cmsContentId: String(contentId), source: SOURCE },
    {
      $set: { ...record, source: SOURCE, cmsContentId: String(contentId), applicationsOpenDate: published.entry.publishedAt || new Date() },
      $setOnInsert: { createdBy: owner },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  return { action: "synced" };
};

// Re-sync every published entry of one content type (after its mapping
// changes), and drop records of entries no longer published.
export const syncContentType = async (slug) => {
  let type;
  try {
    type = await getPublishedType(slug);
  } catch {
    return;
  }
  const ids = [];
  for (let page = 1; page <= 50; page += 1) {
    const result = await listPublishedEntries(slug, { page, limit: 48 });
    result.items.forEach((item) => ids.push(item.id));
    if (page >= result.pagination.totalPages) break;
  }
  for (const id of ids) await syncEntry(id);
  if (!type.presentation?.edecoListing?.target) {
    await InternshipOpportunity.deleteMany({ source: SOURCE, cmsContentId: { $in: ids } });
  }
};

const syncAll = async () => {
  const types = await listPublishedTypes();
  for (const type of types) await syncContentType(type.slug);
  // Records whose entry no longer exists or is no longer published.
  const records = await InternshipOpportunity.find({ source: SOURCE }).select("cmsContentId").lean();
  for (const record of records) {
    try {
      await getPublishedEntryById(record.cmsContentId);
    } catch {
      await removeRecord(record.cmsContentId);
    }
  }
};

export const startFormBuilderOpportunitySync = () => {
  onCmsEvent(async (event, data) => {
    if (["content.published", "content.unpublished", "content.archived"].includes(event) && data?.contentId) {
      await syncEntry(data.contentId);
    }
    if (["presentation.updated", "schema.updated"].includes(event) && data?.contentTypeSlug) {
      await syncContentType(data.contentTypeSlug);
    }
    if (event === "schema.updated" && ["status", "deleted"].includes(data?.kind)) {
      await syncAll();
    }
  });
  // Catch up on anything that changed while the server was down.
  setTimeout(() => syncAll().catch((error) => console.error("[form-builder sync] initial sync failed:", error.message)), 5000).unref();
};
