import React, { useState } from "react";
import { History } from "lucide-react";
import { cmsAdmin } from "../../../../services/cmsAdminAPI";
import { useDebouncedValue, useLoader } from "../hooks";
import { Badge, Card, EmptyState, ErrorState, Modal, PageHeader, Pagination, SearchInput, Select, Skeleton, formatDateTime } from "../ui";

const ENTITY_TYPES = ["contentType", "content", "form", "template", "submission", "media", "admin", "settings", "apiKey", "webhook"];

const AuditLogsPage = () => {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const q = useDebouncedValue(search);
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.auditLogs({ q: q || undefined, entityType: entityType || undefined, page, limit: 50 }), [q, entityType, page]);

  return (
    <>
      <PageHeader title="Audit logs" description="Every change made in the Form Builder: who, what and when." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search by person, item or action" className="flex-1" />
        <Select className="sm:!w-48" value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }} aria-label="Item type">
          <option value="">All items</option>
          {ENTITY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </Select>
      </div>
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-12" />)}</div>
      ) : !data?.items?.length ? (
        <EmptyState icon={History} title="No activity" description="Actions show up here as soon as admins start working." />
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {data.items.map((item) => (
            <button key={item._id} type="button" onClick={() => setOpen(item)} className="grid w-full gap-1 px-4 py-2.5 text-left text-sm hover:bg-slate-50 sm:grid-cols-[170px_minmax(0,1fr)_200px] sm:items-center sm:gap-3">
              <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
              <span className="min-w-0 truncate">
                <Badge className="mr-2">{item.action}</Badge>
                <span className="text-slate-800">{item.entityLabel}</span>
              </span>
              <span className="truncate text-slate-600">{item.actor?.name || "System"}</span>
            </button>
          ))}
        </Card>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.action} description={open ? `${formatDateTime(open.createdAt)} · ${open.actor?.name || "System"} (${open.actor?.email || "—"})` : ""} size="lg">
        {open && (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs font-semibold uppercase text-slate-500">Item</dt><dd>{open.entityType} · {open.entityLabel || "—"} <span className="font-mono text-xs text-slate-400">{open.entityId}</span></dd></div>
            <div><dt className="text-xs font-semibold uppercase text-slate-500">IP address</dt><dd>{open.ip || "—"}</dd></div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Details</dt>
              <dd><pre className="mt-1 max-h-80 overflow-auto rounded-sm bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(open.details || {}, null, 2)}</pre></dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  );
};

export default AuditLogsPage;
