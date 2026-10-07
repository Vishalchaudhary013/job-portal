import React, { useMemo, useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { useLoader } from "../hooks";
import { Badge, Button, Card, Drawer, EmptyState, ErrorState, PageHeader, SearchInput, Skeleton, Toggle, timeAgo, useFeedback } from "../ui";

// Admins (super admin only). Who is an admin is decided by Edeco's existing
// accounts; here the super admin decides what each admin may do in the Form
// Builder — or leaves them on the default access set under Permissions.

export const PermissionChecklist = ({ catalog, value, onChange, disabled }) => {
  const groups = useMemo(() => {
    const map = new Map();
    (catalog?.permissions || []).forEach((permission) => map.set(permission.group, [...(map.get(permission.group) || []), permission]));
    return [...map.entries()];
  }, [catalog]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <span className="mr-1 self-center text-xs text-slate-500">Presets:</span>
        {Object.entries(catalog?.presets || {}).map(([name, list]) => (
          <button key={name} type="button" disabled={disabled} onClick={() => onChange(list)} className="rounded-sm border border-slate-300 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {name}
          </button>
        ))}
      </div>
      {groups.map(([group, permissions]) => (
        <div key={group}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{group}</p>
          <div className="space-y-1">
            {permissions.map((permission) => (
              <label key={permission.id} className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#1F2853]"
                  disabled={disabled}
                  checked={value.includes(permission.id)}
                  onChange={() => onChange(value.includes(permission.id) ? value.filter((id) => id !== permission.id) : [...value, permission.id])}
                />
                <span className="text-slate-800">{permission.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminsPage = () => {
  const { toast } = useFeedback();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const admins = useLoader(() => cmsAdmin.listAdmins(), []);
  const catalog = useLoader(() => cmsAdmin.permissions(), []);

  const items = (admins.data?.items || []).filter((admin) => `${admin.name} ${admin.email}`.toLowerCase().includes(search.toLowerCase()));

  const save = async (body) => {
    setSaving(true);
    try {
      await cmsAdmin.updateAdminAccess(editing.id, body);
      toast("Access updated.");
      setEditing(null);
      admins.reload();
    } catch (error) {
      toast(cmsError(error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Admins" description="Admin accounts come from Edeco. Control what each one can do in the Form Builder." />
      <SearchInput value={search} onChange={setSearch} placeholder="Search admins" className="mb-4 max-w-md" />
      {admins.error && <ErrorState message={admins.error.message} onRetry={admins.reload} />}
      {admins.loading && !admins.data ? (
        <div className="space-y-2">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-14" />)}</div>
      ) : !items.length ? (
        <EmptyState icon={Users} title="No admins found" />
      ) : (
        <Card className="divide-y divide-slate-100">
          {items.map((admin) => (
            <div key={admin.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#1F2853] text-sm font-semibold text-white">{(admin.name || admin.email).charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{admin.name}</p>
                <p className="truncate text-xs text-slate-500">{admin.email} · joined {timeAgo(admin.joinedAt)}</p>
              </div>
              {admin.role === "super_admin" ? (
                <Badge tone="navy"><ShieldCheck size={12} /> Super admin · full access</Badge>
              ) : (
                <>
                  {admin.approval === "pending" && <Badge tone="amber">Edeco approval pending</Badge>}
                  {!admin.enabled ? <Badge tone="red">No access</Badge> : admin.usesDefault ? <Badge>Default access</Badge> : <Badge tone="blue">{admin.permissions.length} permissions</Badge>}
                  <Button size="sm" onClick={() => setEditing({ ...admin })}>Manage</Button>
                </>
              )}
            </div>
          ))}
        </Card>
      )}

      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.name}
        description={editing?.email}
        width="max-w-md"
        footer={
          editing && (
            <>
              {!editing.usesDefault && <Button variant="ghost" className="mr-auto" onClick={() => save({ useDefault: true })}>Reset to default</Button>}
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" loading={saving} onClick={() => save({ enabled: editing.enabled, permissions: editing.permissions })}>Save</Button>
            </>
          )
        }
      >
        {editing && (
          <div className="space-y-5">
            <Toggle label="Can open the Form Builder" description="Off blocks this admin from the Form Builder entirely (their Edeco dashboard is unaffected)." checked={editing.enabled} onChange={(enabled) => setEditing({ ...editing, enabled, usesDefault: false })} />
            {editing.usesDefault && <p className="rounded-sm bg-slate-50 px-3 py-2 text-xs text-slate-600">Currently on the default access set. Changing anything here gives this admin their own set.</p>}
            <PermissionChecklist catalog={catalog.data} value={editing.permissions} disabled={!editing.enabled} onChange={(permissions) => setEditing({ ...editing, permissions, usesDefault: false })} />
          </div>
        )}
      </Drawer>
    </>
  );
};

export default AdminsPage;
