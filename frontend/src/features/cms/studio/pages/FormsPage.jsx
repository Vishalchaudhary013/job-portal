import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FilePlus2, FormInput, Inbox, Layers } from "lucide-react";
import { cmsAdmin } from "../../../../services/cmsAdminAPI";
import Icon from "../Icon";
import { useStudio } from "../StudioContext";
import { useDebouncedValue, useLoader } from "../hooks";
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, SearchInput, Select, Skeleton, StatusBadge, Tabs, timeAgo } from "../ui";

// Forms: every form in the system — content type forms (how admins author
// content) and response forms (what Edeco users submit).

const ContentTypesTable = ({ q, status }) => {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.listTypes({ q, status: status || undefined }), [q, status]);
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading && !data) return <div className="space-y-2">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-16" />)}</div>;
  if (!data?.items?.length) {
    return (
      <EmptyState
        icon={Layers}
        title={q ? "No matching content types" : "No content types yet"}
        description="A content type is a blank form you design, plus how its entries look as cards and detail pages on Edeco."
        action={!q && <Button variant="primary" icon={FilePlus2} onClick={() => navigate("/form-builder/forms/new?kind=content")}>Create content type</Button>}
      />
    );
  }
  return (
    <Card className="divide-y divide-slate-100">
      {data.items.map((type) => (
        <Link key={type.id} to={`/form-builder/types/${type.id}/form`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-slate-100 text-slate-600"><Icon name={type.icon} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{type.name}</p>
            <p className="truncate text-xs text-slate-500">/{type.slug} · {type.counts?.total || 0} entr{type.counts?.total === 1 ? "y" : "ies"} · updated {timeAgo(type.updatedAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["form", "card", "page"].map((kind) => (
              <Badge key={kind} tone={type.published?.[kind]?.version ? (type.dirty?.[kind] ? "amber" : "green") : "neutral"}>
                {kind}
                {type.published?.[kind]?.version ? ` v${type.published[kind].version}` : " –"}
              </Badge>
            ))}
            <StatusBadge status={type.status} />
          </div>
        </Link>
      ))}
    </Card>
  );
};

const ResponseFormsTable = ({ q, status }) => {
  const navigate = useNavigate();
  const { can } = useStudio();
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.listForms({ q, status: status || undefined }), [q, status]);
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading && !data) return <div className="space-y-2">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-16" />)}</div>;
  if (!data?.items?.length) {
    return (
      <EmptyState
        icon={FormInput}
        title={q ? "No matching forms" : "No response forms yet"}
        description="Response forms collect submissions from Edeco users — attach them to cards or detail page buttons."
        action={!q && <Button variant="primary" icon={FilePlus2} onClick={() => navigate("/form-builder/forms/new?kind=response")}>Create response form</Button>}
      />
    );
  }
  return (
    <Card className="divide-y divide-slate-100">
      {data.items.map((form) => (
        <div key={form.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
          <Link to={`/form-builder/forms/${form.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-slate-100 text-slate-600"><FormInput size={16} /></span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-slate-900">{form.name}</span>
              <span className="block truncate text-xs text-slate-500">{form.slug} · updated {timeAgo(form.updatedAt)}</span>
            </span>
          </Link>
          {can("submissions.read") && (
            <Link to={`/form-builder/submissions?formId=${form.id}`} className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:text-[#1F2853]">
              <Inbox size={14} /> {form.submissions.total}
              {form.submissions.new > 0 && <Badge tone="blue">{form.submissions.new} new</Badge>}
            </Link>
          )}
          {form.published?.version > 0 && <Badge tone={form.dirty ? "amber" : "green"}>v{form.published.version}</Badge>}
          <StatusBadge status={form.status} />
        </div>
      ))}
    </Card>
  );
};

const FormsPage = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "response" ? "response" : "content";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const q = useDebouncedValue(search);
  const { can } = useStudio();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Forms"
        description="Content type forms define what content exists. Response forms collect submissions on Edeco."
        actions={can("schema.write") && <Button variant="primary" icon={FilePlus2} onClick={() => navigate(`/form-builder/forms/new?kind=${tab}`)}>Create form</Button>}
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={(next) => setParams(next === "response" ? { tab: "response" } : {})}
        tabs={[
          { id: "content", label: "Content type forms", icon: Layers },
          { id: "response", label: "Response forms", icon: FormInput },
        ]}
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name" className="flex-1" />
        <Select className="sm:!w-44" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
          <option value="">Active</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      {tab === "content" ? <ContentTypesTable q={q} status={status} /> : <ResponseFormsTable q={q} status={status} />}
    </>
  );
};

export default FormsPage;
