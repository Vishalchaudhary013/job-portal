import React, { useState } from "react";
import { Copy, KeyRound, Plus, RefreshCw, Send, Trash2, Webhook } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { useLoader } from "../hooks";
import { Alert, Badge, Button, Card, Drawer, EmptyState, ErrorState, FormRow, IconButton, Modal, PageHeader, Pagination, Skeleton, StatusBadge, Tabs, TextInput, Toggle, formatDateTime, timeAgo, useFeedback } from "../ui";

// System settings (super admin): server-to-server API keys and signed
// webhooks for external consumers of the Form Builder (e.g. the main Edeco
// site). The portal itself reads published content in-process and needs neither.

const randomSecret = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `whsec_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
};

const copy = (text, toast) => navigator.clipboard?.writeText(text).then(() => toast("Copied."));

const ApiKeysPanel = () => {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.listApiKeys(), []);
  const [creating, setCreating] = useState(null);
  const [secret, setSecret] = useState(null);

  const create = async () => {
    try {
      const result = await cmsAdmin.createApiKey(creating);
      setCreating(null);
      setSecret(result.secret);
      reload();
    } catch (createError) {
      toast(cmsError(createError).message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-slate-600">
          Keys let another server read published content from <code className="rounded-sm bg-slate-100 px-1 text-xs">/api/cms/v1</code> and send form responses. Never put a key in browser code.
        </p>
        <Button variant="primary" icon={Plus} onClick={() => setCreating({ name: "", scopes: data?.scopes || [] })}>New key</Button>
      </div>
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data ? <Skeleton className="h-24" /> : !data?.items?.length ? (
        <EmptyState icon={KeyRound} title="No API keys" description="Create one for each system that integrates with the Form Builder." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {data.items.map((key) => (
            <div key={key.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{key.name}</p>
                <p className="text-xs text-slate-500">
                  <code>{key.prefix}…</code> · created {timeAgo(key.createdAt)} by {key.createdBy?.name} · {key.lastUsedAt ? `last used ${timeAgo(key.lastUsedAt)}` : "never used"}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">{key.scopes.map((scope) => <Badge key={scope}>{scope}</Badge>)}</div>
              </div>
              {key.revokedAt ? (
                <Badge tone="red">revoked {timeAgo(key.revokedAt)}</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="danger-ghost"
                  onClick={async () => {
                    if (!(await confirm({ title: `Revoke “${key.name}”?`, message: "Anything using this key stops working immediately.", confirmLabel: "Revoke", tone: "danger" }))) return;
                    cmsAdmin.revokeApiKey(key.id).then(() => { toast("Key revoked."); reload(); }).catch((revokeError) => toast(cmsError(revokeError).message, "error"));
                  }}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}

      <Modal open={Boolean(creating)} onClose={() => setCreating(null)} title="New API key" size="sm" footer={<><Button onClick={() => setCreating(null)}>Cancel</Button><Button variant="primary" disabled={!creating?.name?.trim() || !creating?.scopes?.length} onClick={create}>Create key</Button></>}>
        {creating && (
          <div className="space-y-4">
            <FormRow label="Name" hint="Which system will use it, e.g. “Edeco main site”.">
              <TextInput value={creating.name} onChange={(event) => setCreating({ ...creating, name: event.target.value })} />
            </FormRow>
            <FormRow label="Scopes">
              <div className="space-y-1">
                {(data?.scopes || []).map((scope) => (
                  <label key={scope} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="accent-[#1F2853]" checked={creating.scopes.includes(scope)} onChange={() => setCreating({ ...creating, scopes: creating.scopes.includes(scope) ? creating.scopes.filter((item) => item !== scope) : [...creating.scopes, scope] })} />
                    <code className="text-xs">{scope}</code>
                  </label>
                ))}
              </div>
            </FormRow>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(secret)} onClose={() => setSecret(null)} title="Copy your new key" size="md" footer={<Button variant="primary" onClick={() => setSecret(null)}>I've stored it safely</Button>}>
        <Alert tone="warning" className="mb-3">This is the only time the key is shown. Store it in the other server's environment variables.</Alert>
        <div className="flex gap-2">
          <TextInput readOnly value={secret || ""} className="font-mono !text-xs" onFocus={(event) => event.target.select()} />
          <IconButton icon={Copy} label="Copy" onClick={() => copy(secret, toast)} />
        </div>
      </Modal>
    </div>
  );
};

const DeliveriesDrawer = ({ endpoint, onClose }) => {
  const { toast } = useFeedback();
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useLoader(() => (endpoint ? cmsAdmin.webhookDeliveries(endpoint.id, { page }) : Promise.resolve(null)), [endpoint?.id, page]);
  return (
    <Drawer open={Boolean(endpoint)} onClose={onClose} title={`Deliveries · ${endpoint?.name || ""}`} description={endpoint?.url} width="max-w-2xl">
      <div className="mb-3 flex justify-end"><Button size="sm" icon={RefreshCw} onClick={reload}>Refresh</Button></div>
      {loading && !data ? <Skeleton className="h-40" /> : !data?.items?.length ? <p className="text-sm text-slate-500">No deliveries yet.</p> : (
        <div className="divide-y divide-slate-100 rounded-sm border border-slate-200">
          {data.items.map((delivery) => (
            <div key={delivery._id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
              <StatusBadge status={delivery.status === "success" ? "published" : delivery.status === "failed" ? "archived" : "review"} />
              <code className="text-xs text-slate-700">{delivery.event}</code>
              <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                {formatDateTime(delivery.createdAt)} · {delivery.attempts} attempt{delivery.attempts === 1 ? "" : "s"}
                {delivery.responseStatus ? ` · HTTP ${delivery.responseStatus}` : ""}
                {delivery.lastError ? ` · ${delivery.lastError}` : ""}
              </span>
              {delivery.status !== "success" && (
                <Button size="sm" onClick={() => cmsAdmin.redeliverWebhook(endpoint.id, delivery._id).then(() => { toast("Redelivery attempted."); reload(); }).catch((error) => toast(cmsError(error).message, "error"))}>Retry</Button>
              )}
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
      <p className="mt-4 text-xs text-slate-500">Status labels: Published = delivered, In review = retrying, Archived = gave up after 6 attempts.</p>
    </Drawer>
  );
};

const WebhooksPanel = () => {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.listWebhooks(), []);
  const [editing, setEditing] = useState(null);
  const [deliveriesFor, setDeliveriesFor] = useState(null);
  const events = data?.events || [];

  const save = async () => {
    try {
      const body = { name: editing.name, url: editing.url, events: editing.events, active: editing.active, ...(editing.secret ? { secret: editing.secret } : {}) };
      if (editing.id) await cmsAdmin.updateWebhook(editing.id, body);
      else await cmsAdmin.createWebhook(body);
      toast(editing.id ? "Webhook updated." : "Webhook created. Give the receiver the same signing secret.");
      setEditing(null);
      reload();
    } catch (saveError) {
      toast(cmsError(saveError).message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-slate-600">
          Webhooks tell other systems when content, schemas, cards, pages or responses change. Each request is signed with HMAC-SHA256 in the
          <code className="mx-1 rounded-sm bg-slate-100 px-1 text-xs">X-Edeco-Signature</code>header and retried with backoff if it fails.
        </p>
        <Button variant="primary" icon={Plus} onClick={() => setEditing({ name: "", url: "", events, active: true, secret: randomSecret() })}>New webhook</Button>
      </div>
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data ? <Skeleton className="h-24" /> : !data?.items?.length ? (
        <EmptyState icon={Webhook} title="No webhooks" description="Add one for each external system that needs to keep its cache or search index in sync." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {data.items.map((endpoint) => (
            <div key={endpoint.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{endpoint.name}</p>
                  {!endpoint.active && <Badge>paused</Badge>}
                </div>
                <p className="truncate text-xs text-slate-500">{endpoint.url}</p>
                <p className="text-xs text-slate-500">
                  {endpoint.events.length} event{endpoint.events.length === 1 ? "" : "s"} · {endpoint.deliveries.success || 0} delivered · {endpoint.deliveries.failed || 0} failed · {endpoint.deliveries.pending || 0} pending
                </p>
              </div>
              <Button size="sm" icon={Send} onClick={() => cmsAdmin.testWebhook(endpoint.id).then((result) => toast(result.delivery?.status === "success" ? "Test delivered." : `Test failed: ${result.delivery?.lastError || "see deliveries"}`, result.delivery?.status === "success" ? "success" : "error")).catch((testError) => toast(cmsError(testError).message, "error"))}>Test</Button>
              <Button size="sm" onClick={() => setDeliveriesFor(endpoint)}>Deliveries</Button>
              <Button size="sm" onClick={() => setEditing({ ...endpoint, secret: "" })}>Edit</Button>
              <IconButton
                icon={Trash2}
                label="Delete webhook"
                tone="danger"
                onClick={async () => {
                  if (!(await confirm({ title: `Delete “${endpoint.name}”?`, message: "It stops receiving events.", confirmLabel: "Delete", tone: "danger" }))) return;
                  cmsAdmin.deleteWebhook(endpoint.id).then(() => { toast("Deleted."); reload(); }).catch((deleteError) => toast(cmsError(deleteError).message, "error"));
                }}
              />
            </div>
          ))}
        </Card>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit webhook" : "New webhook"}
        size="lg"
        footer={<><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" disabled={!editing?.name?.trim() || !editing?.url?.trim() || !editing?.events?.length} onClick={save}>Save</Button></>}
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormRow label="Name"><TextInput value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></FormRow>
              <FormRow label="Endpoint URL" hint="https:// in production"><TextInput value={editing.url} placeholder="https://example.com/api/webhooks/form-builder" onChange={(event) => setEditing({ ...editing, url: event.target.value })} /></FormRow>
            </div>
            <FormRow label="Signing secret" hint={editing.id ? "Leave empty to keep the current secret." : "Copy this to the receiving server now — it isn't shown again."}>
              <div className="flex gap-2">
                <TextInput className="font-mono !text-xs" value={editing.secret} placeholder={editing.id ? "unchanged" : ""} onChange={(event) => setEditing({ ...editing, secret: event.target.value })} />
                {editing.secret && <IconButton icon={Copy} label="Copy secret" onClick={() => copy(editing.secret, toast)} />}
                <IconButton icon={RefreshCw} label="Generate new secret" onClick={() => setEditing({ ...editing, secret: randomSecret() })} />
              </div>
            </FormRow>
            <FormRow label="Events">
              <div className="grid gap-1 sm:grid-cols-2">
                {events.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="accent-[#1F2853]" checked={editing.events.includes(event)} onChange={() => setEditing({ ...editing, events: editing.events.includes(event) ? editing.events.filter((item) => item !== event) : [...editing.events, event] })} />
                    <code className="text-xs">{event}</code>
                  </label>
                ))}
              </div>
            </FormRow>
            <Toggle label="Active" checked={editing.active} onChange={(active) => setEditing({ ...editing, active })} />
          </div>
        )}
      </Modal>
      <DeliveriesDrawer endpoint={deliveriesFor} onClose={() => setDeliveriesFor(null)} />
    </div>
  );
};

const SettingsPage = () => {
  const [tab, setTab] = useState("keys");
  return (
    <>
      <PageHeader title="System settings" description="Integrations for systems outside this portal." />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ id: "keys", label: "API keys", icon: KeyRound }, { id: "webhooks", label: "Webhooks", icon: Webhook }]} />
      {tab === "keys" ? <ApiKeysPanel /> : <WebhooksPanel />}
    </>
  );
};

export default SettingsPage;
