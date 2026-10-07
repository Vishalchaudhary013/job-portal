import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FilePlus2, Files } from "lucide-react";
import { cmsAdmin } from "../../../../services/cmsAdminAPI";
import Icon from "../Icon";
import { useStudio } from "../StudioContext";
import { useDebouncedValue, useLoader } from "../hooks";
import { Badge, Button, Card, EmptyState, ErrorState, Modal, PageHeader, Pagination, SearchInput, Select, Skeleton, StatusBadge, timeAgo } from "../ui";

// All content across every content type, filterable by type and status.
const ContentListPage = () => {
  const navigate = useNavigate();
  const { types, can } = useStudio();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [choosingType, setChoosingType] = useState(false);
  const q = useDebouncedValue(search);
  const typeId = params.get("type") || "";
  const status = params.get("status") || "";
  const page = Number(params.get("page")) || 1;
  const changes = params.get("changes") === "1";

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const { data, loading, error, reload } = useLoader(
    () => cmsAdmin.listContents({ contentType: typeId || undefined, status: status || undefined, q: q || undefined, page, changes: changes ? 1 : undefined }),
    [typeId, status, q, page, changes],
  );
  const currentType = types.find((type) => type.id === typeId);
  const activeTypes = types.filter((type) => type.status !== "archived");

  const newEntry = () => {
    if (typeId) navigate(`/form-builder/content/new?type=${typeId}`);
    else setChoosingType(true);
  };

  return (
    <>
      <PageHeader
        title={currentType ? currentType.name : "All content"}
        description={currentType ? currentType.description || "Entries of this content type." : "Every entry across all content types."}
        actions={can("content.write") && activeTypes.length > 0 && <Button variant="primary" icon={FilePlus2} onClick={newEntry}>New entry</Button>}
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setParam("page", ""); }} placeholder="Search by title or slug" />
        <Select value={typeId} onChange={(event) => setParam("type", event.target.value)} aria-label="Content type" className="sm:!w-48">
          <option value="">All content types</option>
          {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </Select>
        <Select value={status} onChange={(event) => setParam("status", event.target.value)} aria-label="Status" className="sm:!w-40">
          <option value="">Any status (not archived)</option>
          <option value="draft">Draft</option>
          <option value="review">In review</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="archived">Archived</option>
          <option value="all">Everything</option>
        </Select>
        <label className="flex items-center gap-2 whitespace-nowrap rounded-sm border border-slate-300 bg-white px-3 text-sm text-slate-700">
          <input type="checkbox" className="accent-[#1F2853]" checked={changes} onChange={(event) => setParam("changes", event.target.checked ? "1" : "")} />
          Unpublished changes
        </label>
      </div>

      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-14" />)}</div>
      ) : !data?.items?.length ? (
        <EmptyState
          icon={Files}
          title={q || status ? "Nothing matches these filters" : "No content yet"}
          description={!activeTypes.length ? "Create a content type and design its form first." : "Create the first entry using a content type's form."}
          action={
            !activeTypes.length ? (
              <Button variant="primary" onClick={() => navigate("/form-builder/forms/new?kind=content")}>Create content type</Button>
            ) : can("content.write") && !q && !status ? (
              <Button variant="primary" icon={FilePlus2} onClick={newEntry}>New entry</Button>
            ) : null
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1fr)_160px_120px_110px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Title</span>
            <span>Type</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.items.map((entry) => (
              <Link key={entry.id} to={`/form-builder/content/${entry.id}`} className="grid gap-1 px-4 py-3 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_160px_120px_110px] md:items-center md:gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{entry.title}</span>
                  <span className="block truncate text-xs text-slate-500">
                    /{entry.slug}
                    {entry.version > 0 && ` · v${entry.version}`}
                    {entry.hasUnpublishedChanges && entry.published && " · "}
                    {entry.hasUnpublishedChanges && entry.published && <span className="text-amber-700">unpublished changes</span>}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 truncate text-sm text-slate-600">
                  {entry.contentType && <Icon name={entry.contentType.icon} size={14} />}
                  {entry.contentType?.name || "—"}
                </span>
                <span><StatusBadge status={entry.status} /></span>
                <span className="text-xs text-slate-500" title={entry.updatedBy?.name}>{timeAgo(entry.updatedAt)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
      <Pagination pagination={data?.pagination} onPage={(next) => setParam("page", String(next))} />

      <Modal open={choosingType} onClose={() => setChoosingType(false)} title="New entry" description="Which content type?" size="sm">
        <div className="space-y-1">
          {activeTypes.map((type) => (
            <button key={type.id} type="button" onClick={() => navigate(`/form-builder/content/new?type=${type.id}`)} className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left hover:bg-slate-50">
              <Icon name={type.icon} />
              <span className="flex-1 font-medium text-slate-800">{type.name}</span>
              {!type.published?.form?.version && <Badge>form not published</Badge>}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default ContentListPage;
