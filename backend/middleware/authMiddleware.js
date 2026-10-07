import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      res.status(401).json({ message: "Unauthorized. Token missing." });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select(
      "_id accountType firstName lastName fullName email latestQualification yearOfPassing collegeName location phoneNumber whatsappNumber agreeToWhatsAppUpdates isEmailVerified isPhoneVerified role adminApprovalStatus",
    );

    if (!user) {
      res.status(401).json({ message: "Unauthorized. User not found." });
      return;
    }

    if (user.role === "admin" && user.adminApprovalStatus === "pending") {
      res.status(403).json({
        message:
          "Admin access pending. Please wait for super admin approval before using this account.",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized. Invalid token." });
  }
};

// Like `protect`, but never rejects: sets req.user when a valid Bearer token is
// present and silently continues otherwise. For public routes (e.g. form
// submission) that behave differently for a signed-in user — such as attaching a
// Resume Builder resume the user owns.
export const attachUserIfPresent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "_id accountType firstName lastName fullName email latestQualification role adminApprovalStatus",
    );
    if (user && !(user.role === "admin" && user.adminApprovalStatus === "pending")) {
      req.user = user;
    }
  } catch {
    // Ignore — an invalid/expired token just means "treat as anonymous".
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !["admin", "super_admin", "mentor"].includes(req.user.role)) {
    res
      .status(403)
      .json({ message: "Forbidden. Admin or super admin access required." });
    return;
  }

  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "super_admin") {
    res
      .status(403)
      .json({ message: "Forbidden. Super admin access required." });
    return;
  }

  next();
};

export const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    res.status(403).json({ message: "Forbidden. Student access required." });
    return;
  }

  next();
};
