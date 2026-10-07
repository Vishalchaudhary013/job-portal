import React, { useEffect, useState } from "react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { useLoader } from "../hooks";
import { Alert, Button, Card, ErrorState, PageHeader, PageLoader, Toggle, useFeedback } from "../ui";
import { PermissionChecklist } from "./AdminsPage";

// Default Form Builder access for admins who haven't been configured
// individually, plus the review rule for publishing.
const PermissionsPage = () => {
  const { toast } = useFeedback();
  const settings = useLoader(() => cmsAdmin.settings(), []);
  const catalog = useLoader(() => cmsAdmin.permissions(), []);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data) setDraft(settings.data.settings);
  }, [settings.data]);

  if (settings.error) return <ErrorState message={settings.error.message} onRetry={settings.reload} />;
  if (!draft || !catalog.data) return <PageLoader />;

  const save = async () => {
    setSaving(true);
    try {
      await cmsAdmin.updateSettings({ defaultAdminAccess: draft.defaultAdminAccess, requireReview: draft.requireReview });
      toast("Permissions saved.");
      settings.reload();
    } catch (error) {
      toast(cmsError(error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Permissions" description="What admins can do by default. Individual admins can be adjusted under Admins." actions={<Button variant="primary" loading={saving} onClick={save}>Save changes</Button>} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-5 p-5">
          <Toggle
            label="Admins can use the Form Builder by default"
            description="Off: only admins you enable individually (and the super admin) can open it."
            checked={draft.defaultAdminAccess.enabled}
            onChange={(enabled) => setDraft({ ...draft, defaultAdminAccess: { ...draft.defaultAdminAccess, enabled } })}
          />
          <PermissionChecklist
            catalog={catalog.data}
            value={draft.defaultAdminAccess.permissions}
            disabled={!draft.defaultAdminAccess.enabled}
            onChange={(permissions) => setDraft({ ...draft, defaultAdminAccess: { ...draft.defaultAdminAccess, permissions } })}
          />
        </Card>
        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <h3 className="font-semibold text-slate-900">Publishing workflow</h3>
            <Toggle label="Require review before publishing" description="Entries must be sent for review first. The super admin can always publish directly." checked={Boolean(draft.requireReview)} onChange={(requireReview) => setDraft({ ...draft, requireReview })} />
          </Card>
          <Alert tone="info" title="Super admin only">
            Managing admins, permissions, system settings, API keys, webhooks and audit logs is always reserved for the super admin.
          </Alert>
        </div>
      </div>
    </>
  );
};

export default PermissionsPage;
