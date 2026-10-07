// Form Builder permissions. Super admins implicitly hold every permission;
// admins hold whatever the super admin granted (or the system default).
export const PERMISSIONS = [
  { id: "content.read", group: "Content", label: "View content" },
  { id: "content.write", group: "Content", label: "Create & edit drafts" },
  { id: "content.publish", group: "Content", label: "Publish, unpublish & archive" },
  { id: "content.delete", group: "Content", label: "Delete content" },
  { id: "schema.read", group: "Builders", label: "View forms, cards & pages" },
  { id: "schema.write", group: "Builders", label: "Edit form, card & page drafts" },
  { id: "schema.publish", group: "Builders", label: "Publish form, card & page configuration" },
  { id: "schema.delete", group: "Builders", label: "Delete content types & forms" },
  { id: "submissions.read", group: "Submissions", label: "View responses" },
  { id: "submissions.manage", group: "Submissions", label: "Change status & add notes" },
  { id: "submissions.export", group: "Submissions", label: "Export responses" },
  { id: "media.manage", group: "Media", label: "Upload & manage media" },
  { id: "analytics.read", group: "Analytics", label: "View analytics" },
];

// Reserved for the super admin — never grantable to admins.
export const SUPER_ADMIN_PERMISSIONS = ["admins.manage", "settings.manage", "audit.read"];

export const ALL_GRANTABLE = PERMISSIONS.map((permission) => permission.id);

export const PERMISSION_PRESETS = {
  viewer: ["content.read", "schema.read", "submissions.read", "analytics.read"],
  editor: ["content.read", "content.write", "schema.read", "schema.write", "submissions.read", "submissions.manage", "media.manage", "analytics.read"],
  publisher: ["content.read", "content.write", "content.publish", "schema.read", "schema.write", "schema.publish", "submissions.read", "submissions.manage", "submissions.export", "media.manage", "analytics.read"],
  manager: ALL_GRANTABLE,
};

export const sanitizePermissions = (list) => [...new Set((list || []).filter((id) => ALL_GRANTABLE.includes(id)))];
