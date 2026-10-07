import { protect } from "../../middleware/authMiddleware.js";
import AdminAccess from "../models/AdminAccess.js";
import { getSystemSettings } from "../services/settings.js";
import { HttpError, forbidden } from "../utils/http.js";
import { ALL_GRANTABLE, SUPER_ADMIN_PERMISSIONS, sanitizePermissions } from "../utils/permissions.js";

// Form Builder access control, layered ON TOP of the existing Edeco auth.
// `protect` (unchanged, from middleware/authMiddleware.js) verifies the JWT,
// loads the user and blocks pending admins. This module then only decides what
// that admin may do inside the Form Builder; it never touches login/identity.

export const resolvePermissions = async (user) => {
  if (user.role === "super_admin") {
    return { enabled: true, permissions: [...ALL_GRANTABLE, ...SUPER_ADMIN_PERMISSIONS] };
  }
  const access = await AdminAccess.findOne({ userId: String(user._id) }).lean();
  if (access) return { enabled: access.enabled, permissions: sanitizePermissions(access.permissions) };
  const { defaultAdminAccess } = await getSystemSettings();
  return { enabled: Boolean(defaultAdminAccess?.enabled), permissions: sanitizePermissions(defaultAdminAccess?.permissions) };
};

const attachCmsUser = async (req, res, next) => {
  try {
    const user = req.user;
    // Students, mentors and any other role never get into the Form Builder.
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return next(forbidden("The Form Builder is only available to admins."));
    }
    const access = await resolvePermissions(user);
    if (!access.enabled) return next(forbidden("Your Form Builder access has been disabled by the super admin."));

    req.cmsUser = {
      id: String(user._id),
      name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      email: user.email || "",
      role: user.role,
      permissions: access.permissions,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const cmsAuthenticate = [protect, attachCmsUser];

// Passes when the user holds ANY of the listed permissions.
export const requirePermission =
  (...permissions) =>
  (req, res, next) => {
    if (!req.cmsUser) return next(new HttpError(401, "Please sign in."));
    if (permissions.some((permission) => req.cmsUser.permissions.includes(permission))) return next();
    next(forbidden());
  };

export const requireCmsSuperAdmin = (req, res, next) => {
  if (req.cmsUser?.role === "super_admin") return next();
  next(forbidden("Only the super admin can do that."));
};

export const can = (req, permission) => Boolean(req.cmsUser?.permissions?.includes(permission));
