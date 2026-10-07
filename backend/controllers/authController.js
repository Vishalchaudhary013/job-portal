import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import BuilderResume from "../models/builderResumeModel.js";
import { generateToken } from "../utils/token.js";
import { sendTransactionalEmail } from "../utils/mailer.js";
import {
  getWhatsAppRuntimeStatus,
  sendWhatsAppText,
} from "../utils/whatsapp.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { getOrCreateStudentProfile } from "./studentProfileController.js";

export const getDecryptedAdminPassword = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const admin = await User.findById(req.params.id).select(
      "encryptedPassword role",
    );
    if (!admin || (admin.role !== "admin" && admin.role !== "mentor")) {
      return res.status(404).json({ message: "Admin or Mentor not found" });
    }
    if (!admin.encryptedPassword) {
      return res.status(400).json({ message: "Password not available for decryption" });
    }
    const decrypted = decrypt(admin.encryptedPassword);
    res.json({ password: decrypted });
  } catch (error) {
    console.error("Decryption error:", error);
    res.status(500).json({ message: "Error decrypting password" });
  }
};

const PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters and include letters, numbers, and special characters.";
const OTP_EXPIRES_IN_MINUTES = 10;

const getOtpExpiryDate = () =>
  new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const hashCode = (code) =>
  crypto.createHash("sha256").update(String(code)).digest("hex");

const buildAdminPasswordChangedEmail = ({ adminName, changedByName }) => {
  const subject = "Your admin password was changed";
  const text = [
    `Hi ${adminName || "Admin"},`,
    "",
    `Your admin account password was changed by ${changedByName || "Super Admin"}.`,
    "If you did not expect this change, contact support immediately.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Hi ${adminName || "Admin"},</p>
      <p>
        Your admin account password was changed by
        <strong>${changedByName || "Super Admin"}</strong>.
      </p>
      <p>If you did not expect this change, contact support immediately.</p>
    </div>
  `;

  return { subject, text, html };
};

const isStrongPassword = (password) => {
  if (typeof password !== "string") {
    return false;
  }

  return (
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  accountType: userDoc.accountType || "",
  firstName: userDoc.firstName || "",
  lastName: userDoc.lastName || "",
  fullName: userDoc.fullName,
  email: userDoc.email,
  latestQualification: userDoc.latestQualification || "",
  yearOfPassing: userDoc.yearOfPassing || "",
  semester: userDoc.semester || "",
  collegeName: userDoc.collegeName || "",
  location: userDoc.location || "",
  phoneNumber: userDoc.phoneNumber || "",
  whatsappNumber: userDoc.whatsappNumber || "",
  resumeFileName: userDoc.resumeFileName || "",
  resumeFilePath: userDoc.resumeFilePath || "",
  agreeToWhatsAppUpdates: Boolean(userDoc.agreeToWhatsAppUpdates),
  isEmailVerified: Boolean(userDoc.isEmailVerified),
  isPhoneVerified: Boolean(userDoc.isPhoneVerified),
  role: userDoc.role,
  adminApprovalStatus:
    userDoc.role === "admin"
      ? userDoc.adminApprovalStatus || "approved"
      : "approved",
  adminApprovedAt: userDoc.adminApprovedAt || null,

  experiencedDomain: userDoc.experiencedDomain || "",
  companiesWorkedAt: userDoc.companiesWorkedAt || "",
  yearsOfExperience: userDoc.yearsOfExperience || "",
  teachingExperience: userDoc.teachingExperience || "",
  engagementType: userDoc.engagementType || [],
  otherEngagementIdea: userDoc.otherEngagementIdea || "",
  topicsToTeach: userDoc.topicsToTeach || "",
  motivationForTeaching: userDoc.motivationForTeaching || [],
  otherMotivationIdea: userDoc.otherMotivationIdea || "",
  socialMediaFollowers: userDoc.socialMediaFollowers || "",
  linkedinProfile: userDoc.linkedinProfile || "",
  twitterProfile: userDoc.twitterProfile || "",
});


const buildOtpEmailContent = ({ fullName, code, reason }) => {
  const isReset = reason === "password_reset";

  const subject = isReset
    ? "Your password reset code"
    : "Your email verification code";

  const purposeLabel = isReset
    ? "reset your password"
    : "verify your email address";

  const text = [
    `Hi ${fullName || "there"},`,
    "",
    `Your ${isReset ? "password reset" : "email verification"} code is: ${code}`,
    `It expires in ${OTP_EXPIRES_IN_MINUTES} minutes.`,
    "",
    `If you did not request this code, please ignore this email.`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 480px;">
      <p>Hi ${fullName || "there"},</p>
      <p>Use the code below to ${purposeLabel}:</p>
      <div style="
        display: inline-block;
        background: #f3f4f6;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 6px;
        color: #111827;
        margin: 8px 0;
      ">${code}</div>
      <p style="color: #6b7280; font-size: 14px;">
        This code expires in <strong>${OTP_EXPIRES_IN_MINUTES} minutes</strong>.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  return { subject, text, html };
};


const sendEmailOtp = async ({ user, code, reason }) => {
  const content = buildOtpEmailContent({
    fullName: user.fullName,
    code,
    reason,
  });

  const result = await sendTransactionalEmail({
    to: user.email,
    ...content,
  });

  return {
    sent: Boolean(result?.sent),
    message:
      result?.message || (result?.sent ? "OTP sent." : "OTP delivery failed."),
  };
};


const buildAdminApprovedEmailContent = ({ adminName, approverName }) => {
  const subject = "Your admin account has been approved";

  const text = [
    `Hi ${adminName || "Admin"},`,
    "",
    `Your admin account has been approved by ${approverName || "Super Admin"}.`,
    "You can now log in to the admin panel.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 480px;">
      <p>Hi ${adminName || "Admin"},</p>
      <p>
        Your admin account has been approved by
        <strong>${approverName || "Super Admin"}</strong>.
      </p>
      <p>You can now <a href="${process.env.ADMIN_LOGIN_URL || "#"}">log in to the admin panel</a>.</p>
    </div>
  `;

  return { subject, text, html };
};

const sendRegistrationSuccessNotifications = async ({ user, accountLabel }) => {
  const label = accountLabel || "user";
  const isAdmin = label === "admin";

  const subject = `Welcome${isAdmin ? " — your admin request is under review" : ""}! Account created successfully`;

  const adminNote = isAdmin
    ? "\n\nYour account is pending approval by a super admin. You will be notified once approved."
    : "";

  const text = [
    `Hi ${user.fullName || "there"},`,
    "",
    `Your ${label} account has been created successfully.`,
    `Please verify your email and phone number to complete setup.${adminNote}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 480px;">
      <p>Hi ${user.fullName || "there"},</p>
      <p>Your <strong>${label}</strong> account has been created successfully.</p>
      <p>Please verify your email and phone number to complete setup.</p>
      ${isAdmin ? `<p style="color: #6b7280;">Your account is pending approval by a super admin. You will be notified once approved.</p>` : ""}
    </div>
  `;

  const email = await sendTransactionalEmail({
    to: user.email,
    subject,
    text,
    html,
  });

  let whatsapp = {
    sent: false,
    message: "WhatsApp number not available.",
  };

  const toNumber = user.phoneNumber || user.whatsappNumber;

  if (toNumber) {
    whatsapp = await sendWhatsAppText({
      to: toNumber,
      body: text,
    });
  }

  return { email, whatsapp };
};


const sendAdminAccessRequestNotifications = async ({ adminUser }) => {
  const superAdmins = await User.find({ role: "super_admin" }).select(
    "_id fullName email phoneNumber whatsappNumber",
  );

  if (!superAdmins.length) {
    return {
      recipients: [],
      totalRecipients: 0,
    };
  }

  const subject = "New admin account request pending approval";

  const results = await Promise.all(
    superAdmins.map(async (superAdmin) => {
      const text = [
        `Hi ${superAdmin.fullName || "Super Admin"},`,
        "",
        `A new admin account has been registered and requires your approval.`,
        `Name: ${adminUser.fullName}`,
        `Email: ${adminUser.email}`,
        "",
        "Please log in to the super admin panel to review this request.",
      ].join("\n");

      const html = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 480px;">
          <p>Hi ${superAdmin.fullName || "Super Admin"},</p>
          <p>A new admin account has been registered and requires your approval.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 8px 0;">
            <tr>
              <td style="padding: 4px 8px; font-weight: bold;">Name</td>
              <td style="padding: 4px 8px;">${adminUser.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: bold;">Email</td>
              <td style="padding: 4px 8px;">${adminUser.email}</td>
            </tr>
          </table>
          <p>Please log in to the super admin panel to review this request.</p>
        </div>
      `;

      const email = await sendTransactionalEmail({
        to: superAdmin.email,
        subject,
        text,
        html,
      });

      let whatsapp = {
        sent: false,
        message: "WhatsApp number not available.",
      };

      const toNumber = superAdmin.phoneNumber || superAdmin.whatsappNumber;

      if (toNumber) {
        whatsapp = await sendWhatsAppText({
          to: toNumber,
          body: text,
        });
      }

      return {
        recipientEmail: superAdmin.email,
        email,
        whatsapp,
      };
    }),
  );

  return {
    recipients: results,
    totalRecipients: results.length,
  };
};


const sendPhoneOtp = async ({ user, code }) => {
  // [WHATSAPP-OTP-DISABLED 2026-08-27] WhatsApp OTP delivery is temporarily
  // disabled. Only email OTP is used for verification for now. To re-enable,
  // uncomment the block below and remove the early return stub.
  return {
    sent: false,
    message: "WhatsApp OTP is temporarily disabled. Email verification only.",
  };

  /* eslint-disable no-unreachable */
  // const body = [
  //   `Hi ${user.fullName || "there"},`,
  //   `Your verification code is: ${code}`,
  //   `It expires in ${OTP_EXPIRES_IN_MINUTES} minutes.`,
  // ].join("\n");
  //
  // const toNumber = user.phoneNumber || user.whatsappNumber;
  // const whatsappResult = await sendWhatsAppText({ to: toNumber, body });
  //
  // if (whatsappResult.sent) {
  //   return whatsappResult;
  // }
  //
  // return {
  //   sent: false,
  //   message:
  //     whatsappResult.message ||
  //     "WhatsApp delivery failed and no email fallback is configured for phone OTP.",
  // };
  /* eslint-enable no-unreachable */
};

const sendAdminApprovedNotifications = async ({ adminUser, approverName }) => {
  const emailContent = buildAdminApprovedEmailContent({
    adminName: adminUser.fullName,
    approverName,
  });

  const email = await sendTransactionalEmail({
    to: adminUser.email,
    ...emailContent,
  });

  let whatsapp = {
    sent: false,
    message: "WhatsApp number not available.",
  };

  const toNumber = adminUser.phoneNumber || adminUser.whatsappNumber;

  if (toNumber) {
    whatsapp = await sendWhatsAppText({
      to: toNumber,
      body: [
        `Hi ${adminUser.fullName || "Admin"},`,
        `Your admin account has been approved by ${approverName || "Super Admin"}.`,
        "You can now login to the admin panel.",
      ].join("\n"),
    });
  }

  return {
    email,
    whatsapp,
  };
};


const buildFullName = ({ fullName, firstName, lastName }) => {
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const parts = [firstName, lastName]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.join(" ").trim();
};

const buildContactNumber = ({ whatsappNumber, phoneNumber, mobileNumber }) => {
  return [whatsappNumber, phoneNumber, mobileNumber]
    .find((value) => typeof value === "string" && value.trim())
    ?.trim();
};

const getNormalizedEnvValue = (value) => String(value || "").trim();


const tryEnvSuperAdminLogin = async ({ email, password }) => {
  const envEmail = getNormalizedEnvValue(
    process.env.SUPER_ADMIN_EMAIL,
  ).toLowerCase();
  const envPassword = getNormalizedEnvValue(process.env.SUPER_ADMIN_PASSWORD);
  const normalizedEmail = getNormalizedEnvValue(email).toLowerCase();
  const normalizedPassword = getNormalizedEnvValue(password);

  if (!envEmail || !envPassword) {
    return null;
  }

  if (normalizedEmail !== envEmail || normalizedPassword !== envPassword) {
    return null;
  }

  let user = await User.findOne({ email: envEmail });

  if (!user) {
    const hashedPassword = await bcrypt.hash(envPassword, 10);
    user = await User.create({
      accountType: "super_admin",
      firstName: "Super",
      lastName: "Admin",
      fullName: "Super Admin",
      email: envEmail,
      password: hashedPassword,
      role: "super_admin",
      whatsappNumber: "",
    });
  } else {
    const updates = {};

    if (user.role !== "super_admin") {
      updates.role = "super_admin";
    }

    if (user.accountType !== "super_admin") {
      updates.accountType = "super_admin";
    }

    if (!user.fullName) {
      updates.fullName = "Super Admin";
    }

    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: user._id }, { $set: updates });
      user = await User.findById(user._id);
    }
  }

  const token = generateToken({ id: user._id, role: user.role });

  return {
    token,
    user: sanitizeUser(user),
  };
};


const authenticateUser = async ({ email, password, allowedRoles = null }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      const error = new Error("You are not allowed to login from this portal.");
      error.statusCode = 403;
      throw error;
    }
  }

  if (user.role === "admin" && user.adminApprovalStatus === "pending") {
    const error = new Error(
      "Your admin account is pending super admin approval. Login is disabled until approval.",
    );
    error.statusCode = 403;
    throw error;
  }

  if (
    ["user", "admin"].includes(user.role) &&
    !user.isEmailVerified
  ) {
    const error = new Error(
      "Please verify your email with OTP before login.",
    );
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken({ id: user._id, role: user.role });

  return {
    token,
    user: sanitizeUser(user),
  };
};

const registerUser = async ({
  accountType,
  firstName,
  lastName,
  fullName,
  email,
  password,
  role,
  latestQualification,
  yearOfPassing,
  semester,
  collegeName,
  location,
  phoneNumber,
  whatsappNumber,
  resumeFileName,
  resumeFilePath,
  organizationName,
  organizationType,
  username,
  agreeToWhatsAppUpdates,
  agreeToTerms,
  experiencedDomain,
  companiesWorkedAt,
  yearsOfExperience,
  teachingExperience,
  engagementType,
  topicsToTeach,
  motivationForTeaching,
  socialMediaFollowers,
  linkedinProfile,
  twitterProfile,
  isEmailVerified,
  isPhoneVerified,
}) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const error = new Error("Email already in use.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let encryptedPassword = "";
  if (role === "admin") {
    encryptedPassword = encrypt(password);
  }

  const user = await User.create({
    accountType: accountType || role || "student",
    firstName: firstName || "",
    lastName: lastName || "",
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    adminApprovalStatus: role === "admin" ? "pending" : "approved",
    adminApprovedBy: null,
    adminApprovedAt: role === "admin" ? null : new Date(),
    latestQualification: latestQualification || "",
    yearOfPassing: yearOfPassing || "",
    semester: semester || "",
    collegeName: collegeName || "",
    location: location || "",
    phoneNumber: phoneNumber || "",
    whatsappNumber: whatsappNumber || "",
    resumeFileName: resumeFileName || "",
    resumeFilePath: resumeFilePath || "",
    organizationName: organizationName || "",
    organizationType: organizationType || "",
    username: username || "",
    agreeToWhatsAppUpdates: Boolean(agreeToWhatsAppUpdates),
    agreeToTerms: Boolean(agreeToTerms),
    experiencedDomain: experiencedDomain || "",
    companiesWorkedAt: companiesWorkedAt || "",
    yearsOfExperience: yearsOfExperience || "",
    teachingExperience: teachingExperience || "",
    engagementType: Array.isArray(engagementType) ? engagementType : (engagementType ? [engagementType] : []),
    topicsToTeach: topicsToTeach || "",
    motivationForTeaching: Array.isArray(motivationForTeaching) ? motivationForTeaching : (motivationForTeaching ? [motivationForTeaching] : []),
    socialMediaFollowers: socialMediaFollowers || "",
    linkedinProfile: linkedinProfile || "",
    twitterProfile: twitterProfile || "",
    isEmailVerified: isEmailVerified ?? false,
    isPhoneVerified: isPhoneVerified ?? true,
    encryptedPassword,
  });

  const token = generateToken({ id: user._id, role: user.role });

  return {
    token,
    user: sanitizeUser(user),
  };
};



const setEmailVerificationCode = async (user) => {
  const code = generateOtpCode();
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationCodeHash: hashCode(code),
        emailVerificationCodeExpiresAt: getOtpExpiryDate(),
      },
    },
  );
  return code;
};

const setPhoneVerificationCode = async (user) => {
  const code = generateOtpCode();
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        phoneVerificationCodeHash: hashCode(code),
        phoneVerificationCodeExpiresAt: getOtpExpiryDate(),
      },
    },
  );
  return code;
};

const setPasswordResetCode = async (user) => {
  const code = generateOtpCode();
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetCodeHash: hashCode(code),
        passwordResetCodeExpiresAt: getOtpExpiryDate(),
      },
    },
  );
  return code;
};

const validateCode = ({ providedCode, storedHash, expiresAt }) => {
  if (!storedHash || !expiresAt) {
    return false;
  }

  if (expiresAt.getTime() < Date.now()) {
    return false;
  }

  return hashCode(providedCode) === storedHash;
};

const issueInitialVerificationCodes = async (userId) => {
  const user = await User.findById(userId).select(
    "+emailVerificationCodeHash +emailVerificationCodeExpiresAt +phoneVerificationCodeHash +phoneVerificationCodeExpiresAt",
  );

  if (!user) {
    return {
      email: { sent: false, message: "User not found for email verification." },
      phone: { sent: false, message: "User not found for phone verification." },
    };
  }

  const emailCode = await setEmailVerificationCode(user);
  const phoneCode = await setPhoneVerificationCode(user);

  const [emailResult, phoneResult] = await Promise.all([
    sendEmailOtp({ user, code: emailCode, reason: "email_verification" }),
    sendPhoneOtp({ user, code: phoneCode }),
  ]);

  return {
    email: emailResult,
    phone: phoneResult,
  };
};


export const sendSignupOtps = async (req, res, next) => {
  try {
    const { email, whatsappNumber, fullName } = req.body;

    if (!email || !whatsappNumber) {
      return res.status(400).json({ message: "email and whatsappNumber are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const emailCode = generateOtpCode();
    const phoneCode = generateOtpCode();

    const mockUser = {
      email: email.toLowerCase(),
      fullName: fullName || "there",
      whatsappNumber,
      phoneNumber: whatsappNumber,
    };

    // [WHATSAPP-OTP-DISABLED 2026-08-27] Only the email OTP is sent for now.
    // The WhatsApp OTP call is commented out; phoneResult is a disabled stub so
    // the rest of the flow (and the stored phone hash) stays intact for re-enable.
    const emailResult = await sendEmailOtp({
      user: mockUser,
      code: emailCode,
      reason: "email_verification",
    });
    const phoneResult = {
      sent: false,
      disabled: true,
      message: "WhatsApp OTP is temporarily disabled.",
    };
    // const [emailResult, phoneResult] = await Promise.all([
    //   sendEmailOtp({ user: mockUser, code: emailCode, reason: "email_verification" }),
    //   sendPhoneOtp({ user: mockUser, code: phoneCode }),
    // ]);

    // if (!phoneResult.sent) {
    //   console.error(
    //     `Signup WhatsApp OTP delivery failed for ${whatsappNumber}: ${phoneResult.message}`,
    //   );
    // }
    if (!emailResult.sent) {
      console.error(
        `Signup email OTP delivery failed for ${email}: ${emailResult.message}`,
      );
    }

    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        email: email.toLowerCase(),
        whatsappNumber,
        emailOtpHash: hashCode(emailCode),
        phoneOtpHash: hashCode(phoneCode),
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "OTPs sent successfully.",
      email: emailResult,
      phone: phoneResult,
    });
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    const {
      accountType,
      fullName,
      firstName,
      lastName,
      email,
      password,
      latestQualification,
      yearOfPassing,
      collegeName,
      location,
      whatsappNumber,
      phoneNumber,
      mobileNumber,
      resumeFileName,
      resumeFilePath,
      agreeToWhatsAppUpdates,
      agreeToTerms,
      experiencedDomain,
      companiesWorkedAt,
      yearsOfExperience,
      teachingExperience,
      engagementType,
      topicsToTeach,
      motivationForTeaching,
      socialMediaFollowers,
      linkedinProfile,
      twitterProfile,
      emailCode,
      phoneCode,
    } = req.body;
    const resolvedFullName = buildFullName({ fullName, firstName, lastName });
    const resolvedContactNumber = buildContactNumber({
      whatsappNumber,
      phoneNumber,
      mobileNumber,
    });

    const isMentor = accountType === "mentor";
    let actualPassword = password;
    if (isMentor && !password) {
      actualPassword = "Mentor@123" + Math.random().toString(36).slice(-6);
    }

    if (!resolvedFullName || !email || !actualPassword) {
      res
        .status(400)
        .json({ message: "fullName, email and password are required." });
      return;
    }

    if (!resolvedContactNumber) {
      res
        .status(400)
        .json({ message: "whatsappNumber is required for user signup." });
      return;
    }

    if (!isStrongPassword(actualPassword)) {
      res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
      return;
    }

    const resolvedResumeFileName = req.file
      ? req.file.originalname
      : String(req.body.resumeFileName || "").trim();

    const resolvedResumeFilePath = req.file
      ? `/uploads/resumes/${req.file.filename}`
      : String(req.body.resumeFilePath || "").trim();

    // [WHATSAPP-OTP-DISABLED 2026-08-27] Verification requires the email code
    // only for now. Original combined email + WhatsApp check kept below.
    // if (emailCode && phoneCode) {
    if (emailCode) {
      const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
      if (!otpRecord) {
        return res.status(400).json({ message: "OTP session expired or not found. Please resend codes." });
      }
      // if (otpRecord.emailOtpHash !== hashCode(emailCode) || otpRecord.phoneOtpHash !== hashCode(phoneCode)) {
      //   return res.status(400).json({ message: "Invalid email or WhatsApp code." });
      // }
      if (otpRecord.emailOtpHash !== hashCode(emailCode)) {
        return res.status(400).json({ message: "Invalid email code." });
      }

      const result = await registerUser({
        accountType: accountType || "student",
        firstName,
        lastName,
        fullName: resolvedFullName,
        email,
        password: actualPassword,
        role: accountType === "mentor" ? "mentor" : "user",
        latestQualification,
        yearOfPassing,
        collegeName,
        location,
        phoneNumber: mobileNumber || phoneNumber || "",
        whatsappNumber: resolvedContactNumber,
        resumeFileName: resolvedResumeFileName,
        resumeFilePath: resolvedResumeFilePath,
        agreeToWhatsAppUpdates,
        agreeToTerms,
        experiencedDomain,
        companiesWorkedAt,
        yearsOfExperience,
        teachingExperience,
        engagementType,
        topicsToTeach,
        motivationForTeaching,
        socialMediaFollowers,
        linkedinProfile,
        twitterProfile,
        isEmailVerified: true,
        isPhoneVerified: true,
      });

      await Otp.deleteOne({ _id: otpRecord._id });

      if (result.user.role !== "mentor") {
        await getOrCreateStudentProfile(result.user.id);
      }

      await sendRegistrationSuccessNotifications({ user: result.user, accountLabel: result.user.role });

      return res.status(201).json({
        ...result,
        message: "Account created successfully.",
      });
    }

    const result = await registerUser({
      accountType: accountType || "student",
      firstName,
      lastName,
      fullName: resolvedFullName,
      email,
      password: actualPassword,
      role: accountType === "mentor" ? "mentor" : "user",
      latestQualification,
      yearOfPassing,
      collegeName,
      location,
      phoneNumber: mobileNumber || phoneNumber || "",
      whatsappNumber: resolvedContactNumber,
      resumeFileName: resolvedResumeFileName,
      resumeFilePath: resolvedResumeFilePath,
      agreeToWhatsAppUpdates,
      agreeToTerms,
      experiencedDomain,
      companiesWorkedAt,
      yearsOfExperience,
      teachingExperience,
      engagementType,
      topicsToTeach,
      motivationForTeaching,
      socialMediaFollowers,
      linkedinProfile,
      twitterProfile,
    });

    const verificationDispatch = await issueInitialVerificationCodes(
      result.user.id,
    );

    res.status(201).json({
      ...result,
      verificationDispatch,
      message:
        "Account created. Please verify your email and phone number to secure your account.",
    });
  } catch (error) {
    next(error);
  }
};

export const userSignup = signup;

// Simplified student signup used by a Test's public link (/t/:slug) — name,
// email, phone number (stored, never OTP-verified), college, semester,
// password, and ONLY an email OTP. Deliberately doesn't reuse `signup`
// above, which requires a WhatsApp-verified phone number; this flow needs
// none of that.
export const studentSignup = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, collegeName, semester, password } = req.body || {};

    const normalizedFullName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedFullName || !normalizedEmail || !password) {
      res.status(400).json({ message: "fullName, email and password are required." });
      return;
    }
    if (!isStrongPassword(password)) {
      res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
      return;
    }

    const [firstName, ...rest] = normalizedFullName.split(/\s+/);
    const lastName = rest.join(" ");

    const result = await registerUser({
      accountType: "student",
      firstName,
      lastName,
      fullName: normalizedFullName,
      email: normalizedEmail,
      password,
      role: "user",
      phoneNumber: String(phoneNumber || "").trim(),
      collegeName: String(collegeName || "").trim(),
      semester: String(semester || "").trim(),
      isEmailVerified: false,
      isPhoneVerified: true, // stored, never OTP-verified for this flow
    });

    await getOrCreateStudentProfile(result.user.id);

    const emailCode = await setEmailVerificationCode({ _id: result.user.id });
    const emailResult = await sendEmailOtp({
      user: { email: normalizedEmail, fullName: normalizedFullName },
      code: emailCode,
      reason: "email_verification",
    });

    res.status(201).json({
      ...result,
      emailVerificationDispatch: emailResult,
      message: "Account created. Please verify your email to continue.",
    });
  } catch (error) {
    next(error);
  }
};

const notifySuperAdminOfAccessRequest = async (adminUser) => {
  try {
    return await sendAdminAccessRequestNotifications({ adminUser });
  } catch (notificationError) {
    return {
      recipients: [
        {
          recipientEmail: "",
          email: {
            sent: false,
            message:
              notificationError?.message ||
              "Failed to notify super admin about admin request.",
          },
          whatsapp: {
            sent: false,
            message:
              notificationError?.message ||
              "Failed to notify super admin on WhatsApp.",
          },
        },
      ],
      totalRecipients: 0,
    };
  }
};

export const adminSignup = async (req, res, next) => {
  try {
    const {
      accountType,
      fullName,
      firstName,
      lastName,
      email,
      password,
      organizationName,
      organizationType,
      username,
      whatsappNumber,
      phoneNumber,
      mobileNumber,
      agreeToWhatsAppUpdates,
      agreeToTerms,
      emailCode,
      phoneCode,
    } = req.body;
    const resolvedFullName = buildFullName({ fullName, firstName, lastName });
    const resolvedContactNumber = buildContactNumber({
      whatsappNumber,
      phoneNumber,
      mobileNumber,
    });

    if (!resolvedFullName || !email || !password) {
      res
        .status(400)
        .json({ message: "fullName, email and password are required." });
      return;
    }

    if (!resolvedContactNumber) {
      res
        .status(400)
        .json({ message: "whatsappNumber is required for admin signup." });
      return;
    }

    if (!isStrongPassword(password)) {
      res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
      return;
    }

    const registerUserPayload = {
      accountType: accountType || "employer",
      firstName,
      lastName,
      fullName: resolvedFullName,
      email,
      password,
      role: "admin",
      organizationName,
      organizationType,
      username,
      phoneNumber: mobileNumber || phoneNumber || "",
      whatsappNumber: resolvedContactNumber,
      agreeToWhatsAppUpdates,
      agreeToTerms,
    };

    // [WHATSAPP-OTP-DISABLED 2026-08-27] Verification requires the email code
    // only for now. Original combined email + WhatsApp check kept below.
    // if (emailCode && phoneCode) {
    if (emailCode) {
      const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
      if (!otpRecord) {
        return res.status(400).json({ message: "OTP session expired or not found. Please resend codes." });
      }
      // if (otpRecord.emailOtpHash !== hashCode(emailCode) || otpRecord.phoneOtpHash !== hashCode(phoneCode)) {
      //   return res.status(400).json({ message: "Invalid email or WhatsApp code." });
      // }
      if (otpRecord.emailOtpHash !== hashCode(emailCode)) {
        return res.status(400).json({ message: "Invalid email code." });
      }

      const result = await registerUser({
        ...registerUserPayload,
        isEmailVerified: true,
        isPhoneVerified: true,
      });

      await Otp.deleteOne({ _id: otpRecord._id });

      const accessRequestNotificationDispatch = await notifySuperAdminOfAccessRequest(result.user);

      return res.status(201).json({
        ...result,
        token: "",
        accessRequestNotificationDispatch,
        message:
          "Admin account created and sent for super admin approval. Login will be enabled after approval.",
      });
    }

    const result = await registerUser(registerUserPayload);

    const verificationDispatch = await issueInitialVerificationCodes(
      result.user.id,
    );

    const accessRequestNotificationDispatch = await notifySuperAdminOfAccessRequest(result.user);

    res.status(201).json({
      ...result,
      token: "",
      verificationDispatch,
      accessRequestNotificationDispatch,
      message:
        "Admin account created and sent for super admin approval. Please verify your email and phone number. Login will be enabled after approval.",
    });
  } catch (error) {
    next(error);
  }
};

// export const superAdminSignup = async (req, res, next) => {
//   try {
//     const {
//       accountType,
//       fullName,
//       firstName,
//       lastName,
//       email,
//       password,
//       superAdminSecret,
//       organizationName,
//       organizationType,
//       username,
//       whatsappNumber,
//       phoneNumber,
//       mobileNumber,
//       agreeToWhatsAppUpdates,
//       agreeToTerms,
//     } = req.body;
//     const resolvedFullName = buildFullName({ fullName, firstName, lastName });
//     const resolvedContactNumber = buildContactNumber({
//       whatsappNumber,
//       phoneNumber,
//       mobileNumber,
//     });

//     if (!resolvedFullName || !email || !password) {
//       res
//         .status(400)
//         .json({ message: "fullName, email and password are required." });
//       return;
//     }

//     if (!resolvedContactNumber) {
//       res.status(400).json({
//         message: "whatsappNumber is required for super admin signup.",
//       });
//       return;
//     }

//     if (!process.env.SUPER_ADMIN_SIGNUP_SECRET) {
//       res
//         .status(500)
//         .json({ message: "SUPER_ADMIN_SIGNUP_SECRET not configured." });
//       return;
//     }

//     if (superAdminSecret !== process.env.SUPER_ADMIN_SIGNUP_SECRET) {
//       res.status(403).json({ message: "Invalid super admin signup secret." });
//       return;
//     }

//     if (!isStrongPassword(password)) {
//       res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
//       return;
//     }

//     const result = await registerUser({
//       accountType: accountType || "super_admin",
//       firstName,
//       lastName,
//       fullName: resolvedFullName,
//       email,
//       password,
//       role: "super_admin",
//       organizationName,
//       organizationType,
//       username,
//       phoneNumber: mobileNumber || phoneNumber || "",
//       whatsappNumber: resolvedContactNumber,
//       agreeToWhatsAppUpdates,
//       agreeToTerms,
//     });

//     const verificationDispatch = await issueInitialVerificationCodes(
//       result.user.id,
//     );

//     res.status(201).json({
//       ...result,
//       verificationDispatch,
//       message:
//         "Account created. Please verify your email and phone number to secure your account.",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required." });
      return;
    }

    const envSuperAdminLogin = await tryEnvSuperAdminLogin({
      email,
      password,
    });

    if (envSuperAdminLogin) {
      res.status(200).json(envSuperAdminLogin);
      return;
    }

    const result = await authenticateUser({ email, password });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required." });
      return;
    }

    const result = await authenticateUser({
      email,
      password,
      allowedRoles: ["user"],
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required." });
      return;
    }

    const result = await authenticateUser({
      email,
      password,
      allowedRoles: ["admin", "super_admin"],
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const requestEmailVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "email is required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+emailVerificationCodeHash +emailVerificationCodeExpiresAt",
    );

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (user.isEmailVerified) {
      res.status(200).json({ message: "Email is already verified." });
      return;
    }

    const code = await setEmailVerificationCode(user);
    const delivery = await sendEmailOtp({
      user,
      code,
      reason: "email_verification",
    });

    res.status(200).json({
      message: delivery.sent
        ? "Verification code sent to email."
        : "Verification code generated but email delivery failed.",
      delivery,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: "email and code are required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+emailVerificationCodeHash +emailVerificationCodeExpiresAt",
    );

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const valid = validateCode({
      providedCode: code,
      storedHash: user.emailVerificationCodeHash,
      expiresAt: user.emailVerificationCodeExpiresAt,
    });

    if (!valid) {
      res
        .status(400)
        .json({ message: "Invalid or expired verification code." });
      return;
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationCodeHash: "",
          emailVerificationCodeExpiresAt: null,
        },
      },
      { returnDocument: "after" },
    );

    let registrationNotificationDispatch = null;
    if (updatedUser.isEmailVerified) {

      try {
        registrationNotificationDispatch =
          await sendRegistrationSuccessNotifications({
            user: updatedUser,
            accountLabel: updatedUser.role === "admin" ? "admin" : "student",
          });
      } catch (e) {
        console.error(
          "Failed to send welcome notification after email verification:",
          e,
        );
      }
    }

    res.status(200).json({
      message: "Email verified successfully.",
      registrationNotificationDispatch,
      user: {
        ...sanitizeUser(updatedUser),
        isEmailVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const requestPhoneVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "email is required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+phoneVerificationCodeHash +phoneVerificationCodeExpiresAt",
    );

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (user.isPhoneVerified) {
      res.status(200).json({ message: "Phone number is already verified." });
      return;
    }

    const code = await setPhoneVerificationCode(user);
    const delivery = await sendPhoneOtp({ user, code });

    res.status(200).json({
      message: delivery.sent
        ? "Verification code sent to phone."
        : "Verification code generated but phone delivery failed.",
      delivery,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPhoneCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: "email and code are required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+phoneVerificationCodeHash +phoneVerificationCodeExpiresAt",
    );

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const valid = validateCode({
      providedCode: code,
      storedHash: user.phoneVerificationCodeHash,
      expiresAt: user.phoneVerificationCodeExpiresAt,
    });

    if (!valid) {
      res
        .status(400)
        .json({ message: "Invalid or expired verification code." });
      return;
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          isPhoneVerified: true,
          phoneVerificationCodeHash: "",
          phoneVerificationCodeExpiresAt: null,
        },
      },
      { returnDocument: "after" },
    );

    let registrationNotificationDispatch = null;
    if (updatedUser.isEmailVerified && updatedUser.isPhoneVerified) {
      try {
        registrationNotificationDispatch =
          await sendRegistrationSuccessNotifications({
            user: updatedUser,
            accountLabel: updatedUser.role === "admin" ? "admin" : "student",
          });
      } catch (e) {
        console.error(
          "Failed to send welcome notification after phone verification:",
          e,
        );
      }
    }

    res.status(200).json({
      message: "Phone verified successfully.",
      registrationNotificationDispatch,
      user: {
        ...sanitizeUser(updatedUser),
        isPhoneVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "email is required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordResetCodeHash +passwordResetCodeExpiresAt",
    );

    if (!user) {
      res.status(200).json({
        message:
          "If an account exists for this email, a password reset code has been sent.",
      });
      return;
    }

    const code = await setPasswordResetCode(user);
    const delivery = await sendEmailOtp({
      user,
      code,
      reason: "password_reset",
    });

    res.status(200).json({
      message:
        "If an account exists for this email, a password reset code has been sent.",
      delivery,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res
        .status(400)
        .json({ message: "email, code and newPassword are required." });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordResetCodeHash +passwordResetCodeExpiresAt",
    );

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const valid = validateCode({
      providedCode: code,
      storedHash: user.passwordResetCodeHash,
      expiresAt: user.passwordResetCodeExpiresAt,
    });

    if (!valid) {
      res.status(400).json({ message: "Invalid or expired reset code." });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          passwordResetCodeHash: "",
          passwordResetCodeExpiresAt: null,
        },
      },
    );

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};

export const updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const hasField = (name) =>
      Object.prototype.hasOwnProperty.call(req.body || {}, name);

    if (hasField("firstName")) {
      user.firstName = String(req.body.firstName || "").trim();
    }

    if (hasField("lastName")) {
      user.lastName = String(req.body.lastName || "").trim();
    }

    if (hasField("fullName")) {
      user.fullName = String(req.body.fullName || "").trim();
    } else {
      const recomputedFullName = buildFullName({
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      if (recomputedFullName) {
        user.fullName = recomputedFullName;
      }
    }

    if (!String(user.fullName || "").trim()) {
      res.status(400).json({ message: "fullName cannot be empty." });
      return;
    }

    if (hasField("whatsappNumber")) {
      user.whatsappNumber = String(req.body.whatsappNumber || "").trim();
    }

    if (hasField("phoneNumber")) {
      user.phoneNumber = String(req.body.phoneNumber || "").trim();
    }

    if (hasField("location")) {
      user.location = String(req.body.location || "").trim();
    }

    if (hasField("latestQualification")) {
      user.latestQualification = String(
        req.body.latestQualification || "",
      ).trim();
    }

    if (hasField("yearOfPassing")) {
      user.yearOfPassing = String(req.body.yearOfPassing || "").trim();
    }

    if (hasField("collegeName")) {
      user.collegeName = String(req.body.collegeName || "").trim();
    }

    if (hasField("resumeFileName")) {
      user.resumeFileName = String(req.body.resumeFileName || "").trim();
    }

    if (hasField("resumeFilePath")) {
      user.resumeFilePath = String(req.body.resumeFilePath || "").trim();
    }

    if (hasField("agreeToWhatsAppUpdates")) {
      user.agreeToWhatsAppUpdates = Boolean(req.body.agreeToWhatsAppUpdates);
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getWhatsAppStatus = async (req, res) => {
  res.status(200).json(getWhatsAppRuntimeStatus());
};

export const getUserDirectory = async (req, res, next) => {
  try {
    const users = await User.find({
      $or: [
        { role: "super_admin" },
        { isEmailVerified: true },
      ],
    })
      .select(
        "_id fullName email role whatsappNumber phoneNumber createdAt adminApprovalStatus adminApprovedAt isEmailVerified isPhoneVerified latestQualification resumeFilePath resumeFileName organizationName organizationType plainPassword experiencedDomain companiesWorkedAt yearsOfExperience teachingExperience engagementType otherEngagementIdea topicsToTeach motivationForTeaching otherMotivationIdea socialMediaFollowers linkedinProfile twitterProfile",
      )
      .sort({ createdAt: -1 });

    const toPublicShape = (item) => ({
      id: item._id,
      fullName: item.fullName,
      email: item.email,
      role: item.role,
      whatsappNumber: item.whatsappNumber || "",
      phoneNumber: item.phoneNumber || "",
      organizationName: item.organizationName || "",
      organizationType: item.organizationType || "",
      plainPassword: item.plainPassword || "",
      adminApprovalStatus:
        item.role === "admin" ? item.adminApprovalStatus || "approved" : null,
      adminApprovedAt: item.adminApprovedAt || null,
      isEmailVerified: Boolean(item.isEmailVerified),
      isPhoneVerified: true,
      createdAt: item.createdAt,
      latestQualification: item.latestQualification || "",
      resumeFilePath: item.resumeFilePath || "",
      resumeFileName: item.resumeFileName || "",
      experiencedDomain: item.experiencedDomain || "",
      companiesWorkedAt: item.companiesWorkedAt || "",
      yearsOfExperience: item.yearsOfExperience || "",
      teachingExperience: item.teachingExperience || "",
      engagementType: item.engagementType || [],
      otherEngagementIdea: item.otherEngagementIdea || "",
      topicsToTeach: item.topicsToTeach || "",
      motivationForTeaching: item.motivationForTeaching || [],
      otherMotivationIdea: item.otherMotivationIdea || "",
      socialMediaFollowers: item.socialMediaFollowers || "",
      linkedinProfile: item.linkedinProfile || "",
      twitterProfile: item.twitterProfile || "",
    });

    const admins = users
      .filter((item) => item.role === "admin")
      .map(toPublicShape);
    const normalUsers = users
      .filter((item) => item.role === "user")
      .map(toPublicShape);
    const superAdmins = users
      .filter((item) => item.role === "super_admin")
      .map(toPublicShape);
    const mentors = users
      .filter((item) => item.role === "mentor")
      .map(toPublicShape);

    // Latest resume each user has built (and finished) in the Resume Builder —
    // distinct from the resume they uploaded at signup (`resumeFilePath`).
    const latestBuilderByUser = await BuilderResume.aggregate([
      { $match: { status: "SAVED" } },
      { $sort: { finalizedAt: -1 } },
      {
        $group: {
          _id: "$userId",
          resumeId: { $first: "$_id" },
          fileUrl: { $first: "$fileUrl" },
          fileName: { $first: "$fileName" },
          finalizedAt: { $first: "$finalizedAt" },
        },
      },
    ]);
    const builderResumeMap = new Map(
      latestBuilderByUser.map((row) => [
        String(row._id),
        { id: row.resumeId, fileUrl: row.fileUrl || "", fileName: row.fileName || "", finalizedAt: row.finalizedAt || null },
      ]),
    );
    normalUsers.forEach((item) => {
      item.builderResume = builderResumeMap.get(String(item.id)) || null;
    });

    const builderResumeCount = await BuilderResume.countDocuments({ status: "SAVED" });

    res.status(200).json({
      admins,
      users: normalUsers,
      superAdmins,
      mentors,
      counts: {
        admins: admins.length,
        users: normalUsers.length,
        superAdmins: superAdmins.length,
        mentors: mentors.length,
        total: users.length,
        builderResumes: builderResumeCount,
        builderResumeUsers: builderResumeMap.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "User id is required." });
      return;
    }

    if (String(req.user?._id) === String(id)) {
      res.status(400).json({ message: "You cannot delete your own account." });
      return;
    }

    const user = await User.findById(id).select("_id role fullName email");

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (user.role === "super_admin") {
      res
        .status(403)
        .json({ message: "Super admin accounts cannot be deleted." });
      return;
    }

    await User.deleteOne({ _id: id });

    res.status(200).json({
      message: "Account deleted successfully.",
      deleted: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changeAdminPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword, notifyAdmin } = req.body;

    if (!id) {
      res.status(400).json({ message: "Admin id is required." });
      return;
    }

    if (!newPassword) {
      res.status(400).json({ message: "newPassword is required." });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
      return;
    }

    const adminUser = await User.findById(id).select("_id role fullName email");

    if (!adminUser) {
      res.status(404).json({ message: "Admin account not found." });
      return;
    }

    if (adminUser.role !== "admin" && adminUser.role !== "mentor") {
      res.status(400).json({
        message: "Password can only be changed for admin or mentor accounts.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const encryptedPassword = encrypt(newPassword);

    await User.updateOne(
      { _id: adminUser._id },
      {
        $set: {
          password: hashedPassword,
          encryptedPassword: encryptedPassword,
          passwordResetCodeHash: "",
          passwordResetCodeExpiresAt: null,
        },
      },
    );

    const shouldNotifyAdmin = Boolean(notifyAdmin);
    let notification = {
      requested: shouldNotifyAdmin,
      sent: false,
      message: "Admin email notification was not requested.",
    };

    if (shouldNotifyAdmin) {
      const changedByName = req.user?.fullName || "Super Admin";
      const emailContent = buildAdminPasswordChangedEmail({
        adminName: adminUser.fullName,
        changedByName,
      });

      const emailResult = await sendTransactionalEmail({
        to: adminUser.email,
        ...emailContent,
      });

      notification = {
        requested: true,
        sent: Boolean(emailResult?.sent),
        message:
          emailResult?.message ||
          "Admin notification email status is unavailable.",
      };
    }

    const responseMessage = shouldNotifyAdmin
      ? notification.sent
        ? "Admin password changed and notification email sent."
        : `Admin password changed, but email notification failed: ${notification.message}`
      : "Admin password changed successfully.";

    res.status(200).json({
      message: responseMessage,
      admin: {
        id: adminUser._id,
        fullName: adminUser.fullName,
        email: adminUser.email,
      },
      notification,
    });
  } catch (error) {
    next(error);
  }
};

export const impersonateAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      res.status(400).json({ message: "adminId is required." });
      return;
    }

    const adminUser = await User.findById(adminId).select(
      "_id fullName email role adminApprovalStatus",
    );

    if (!adminUser) {
      res.status(404).json({ message: "Admin user not found." });
      return;
    }

    if (adminUser.role !== "admin" && adminUser.role !== "mentor") {
      res.status(400).json({
        message: "Only admin or mentor accounts can be opened from this action.",
      });
      return;
    }

    if (adminUser.adminApprovalStatus === "pending") {
      res.status(403).json({
        message: "Selected admin is pending approval and cannot be opened yet.",
      });
      return;
    }

    const token = generateToken({ id: adminUser._id, role: adminUser.role });

    res.status(200).json({
      token,
      user: sanitizeUser(adminUser),
    });
  } catch (error) {
    next(error);
  }
};

export const approveAdminAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "Admin id is required." });
      return;
    }

    const adminUser = await User.findById(id).select(
      "_id fullName email role phoneNumber whatsappNumber adminApprovalStatus isEmailVerified isPhoneVerified",
    );

    if (!adminUser) {
      res.status(404).json({ message: "Admin account not found." });
      return;
    }

    if (adminUser.role !== "admin") {
      res.status(400).json({
        message: "Access approval can only be performed for admin accounts.",
      });
      return;
    }

    if (!adminUser.isEmailVerified || !adminUser.isPhoneVerified) {
      res.status(400).json({
        message:
          "Admin must verify both email and phone number before approval.",
      });
      return;
    }

    if (adminUser.adminApprovalStatus !== "approved") {
      adminUser.adminApprovalStatus = "approved";
      adminUser.adminApprovedBy = req.user?._id || null;
      adminUser.adminApprovedAt = new Date();
      await adminUser.save();
    }

    let approvalNotification = {
      email: { sent: false, message: "Approval email not sent." },
      whatsapp: { sent: false, message: "Approval WhatsApp message not sent." },
    };

    try {
      approvalNotification = await sendAdminApprovedNotifications({
        adminUser,
        approverName: req.user?.fullName || "Super Admin",
      });
    } catch (notificationError) {
      approvalNotification = {
        email: {
          sent: false,
          message:
            notificationError?.message || "Failed to send approval email.",
        },
        whatsapp: {
          sent: false,
          message:
            notificationError?.message ||
            "Failed to send approval WhatsApp message.",
        },
      };
    }

    res.status(200).json({
      message: "Admin access approved successfully.",
      admin: sanitizeUser(adminUser),
      approvalNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }
    return res.status(200).json({ message: "Email is available.", available: true });
  } catch (error) {
    next(error);
  }
};
