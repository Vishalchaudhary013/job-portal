import nodemailer from "nodemailer";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeValue = (value) => String(value || "").trim();

const normalizeEmailPass = (value) =>

  String(value || "").replace(/\s+/g, "");

const getTransportConfig = () => {
  const emailService = normalizeValue(process.env.EMAIL_SERVICE);
  const emailUser = normalizeValue(process.env.EMAIL_USER);
  const emailPass = normalizeEmailPass(process.env.EMAIL_PASS);
  const isGmail = emailService.toLowerCase() === "gmail";

  if (emailService && emailUser && emailPass) {
    const serviceConfig = isGmail
      ? {
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
        }
      : {
          service: emailService,
        };

    return {
      transport: nodemailer.createTransport({
        ...serviceConfig,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      }),
      from: normalizeValue(process.env.MAIL_FROM) || emailUser,
      emailService,
    };
  }

  
  const url = process.env.SMTP_URL;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (url) {
    return {
      transport: nodemailer.createTransport(url),
      from: process.env.MAIL_FROM || process.env.SMTP_FROM || undefined,
      emailService: "smtp-url",
    };
  }

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
    port === 465;

  return {
    transport: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    }),
    from: process.env.MAIL_FROM || user,
    emailService: host,
  };
};

export const isMailConfigured = () => Boolean(getTransportConfig());

export const sendTransactionalEmail = async ({ to, subject, text, html }) => {
  const mailConfig = getTransportConfig();

  if (!mailConfig) {
    console.error(
      `sendTransactionalEmail skipped (to=${to}): no SMTP config found — ` +
        "set EMAIL_SERVICE/EMAIL_USER/EMAIL_PASS (or SMTP_HOST/SMTP_USER/SMTP_PASS) as environment variables on the deployed backend, not just in a local .env file.",
    );
    return {
      sent: false,
      message: "SMTP settings are not configured.",
    };
  }

  try {
    await mailConfig.transport.sendMail({
      from: mailConfig.from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error(
      `sendTransactionalEmail failed (to=${to}, service=${mailConfig.emailService}):`,
      error?.code || error?.responseCode || "",
      error?.message || error,
    );

    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      return {
        sent: false,
        message:
          "Email login failed. For Gmail, enable 2-Step Verification and use an App Password.",
      };
    }

    return {
      sent: false,
      message: "Failed to send email due to SMTP error.",
    };
  }

  return {
    sent: true,
    message: "Email sent successfully.",
  };
};

const buildConfirmationEmail = (application) => {
  const companyName = application.company || "our team";
  const subject = `Application received for ${application.opportunityTitle}`;

  const text = [
    `Hi ${application.name},`,
    "",
    `We received your application for ${application.opportunityTitle} (${application.opportunityType}) at ${companyName}.`,
    "",
    "Our team will review your submission and contact you if your profile matches the opportunity.",
    "",
    "Application summary:",
    `- Opportunity: ${application.opportunityTitle}`,
    `- Type: ${application.opportunityType}`,
    `- Email: ${application.email}`,
    `- Phone: ${application.phone}`,
    "",
    "Thank you for applying.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Hi ${escapeHtml(application.name)},</p>
      <p>
        We received your application for <strong>${escapeHtml(
          application.opportunityTitle,
        )}</strong> (${escapeHtml(application.opportunityType)}) at ${escapeHtml(
          companyName,
        )}.
      </p>
      <p>
        Our team will review your submission and contact you if your profile
        matches the opportunity.
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 12px;">
        <p style="margin: 0 0 8px;"><strong>Application summary</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Opportunity: ${escapeHtml(application.opportunityTitle)}</li>
          <li>Type: ${escapeHtml(application.opportunityType)}</li>
          <li>Email: ${escapeHtml(application.email)}</li>
          <li>Phone: ${escapeHtml(application.phone)}</li>
        </ul>
      </div>
      <p>Thank you for applying.</p>
    </div>
  `;

  return { subject, text, html };
};

export const sendApplicationConfirmationEmail = async (application) => {
  const mailConfig = getTransportConfig();

  if (!mailConfig) {
    return {
      sent: false,
      message:
        "Confirmation email was skipped because SMTP settings are not configured.",
    };
  }

  const { subject, text, html } = buildConfirmationEmail(application);

  try {
    await mailConfig.transport.sendMail({
      from: mailConfig.from,
      to: application.email,
      subject,
      text,
      html,
    });
  } catch (error) {
    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      return {
        sent: false,
        message:
          "Application was submitted, but email login failed. For Gmail, enable 2-Step Verification, generate a 16-character App Password, and set EMAIL_USER/EMAIL_PASS with that app password.",
      };
    }

    return {
      sent: false,
      message:
        "Application was submitted, but the confirmation email could not be sent due to an SMTP error.",
    };
  }

  return {
    sent: true,
    message: "A confirmation email has been sent to your inbox.",
  };
};

const buildAdminApplicationAlertEmail = (application, adminName = "Admin") => {
  const subject = `New application: ${application.opportunityTitle}`;
  const companyName = application.company || "N/A";

  const text = [
    `Hi ${adminName},`,
    "",
    "A new application has been submitted.",
    "",
    `Opportunity: ${application.opportunityTitle}`,
    `Type: ${application.opportunityType}`,
    `Company: ${companyName}`,
    "",
    `Applicant Name: ${application.name}`,
    `Applicant Email: ${application.email}`,
    `Applicant Phone: ${application.phone || "N/A"}`,
    "",
    "Please review it in the admin dashboard.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Hi ${escapeHtml(adminName)},</p>
      <p>A new application has been submitted.</p>
      <div style="background: #f8fafc; padding: 14px; border-radius: 10px; margin: 12px 0;">
        <p style="margin: 0 0 8px;"><strong>Job Details</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Opportunity: ${escapeHtml(application.opportunityTitle)}</li>
          <li>Type: ${escapeHtml(application.opportunityType)}</li>
          <li>Company: ${escapeHtml(companyName)}</li>
        </ul>
      </div>
      <div style="background: #f3f4f6; padding: 14px; border-radius: 10px; margin: 12px 0;">
        <p style="margin: 0 0 8px;"><strong>Applicant Details</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Name: ${escapeHtml(application.name)}</li>
          <li>Email: ${escapeHtml(application.email)}</li>
          <li>Phone: ${escapeHtml(application.phone || "N/A")}</li>
        </ul>
      </div>
      <p>Please review it in the admin dashboard.</p>
    </div>
  `;

  return { subject, text, html };
};

export const sendAdminApplicationAlertEmail = async ({
  application,
  adminRecipient,
}) => {
  const mailConfig = getTransportConfig();

  if (!mailConfig) {
    return {
      sent: false,
      message:
        "Admin alert email was skipped because SMTP settings are not configured.",
    };
  }

  const fallbackRecipient =
    adminRecipient?.role === "super_admin"
      ? normalizeValue(process.env.SUPER_ADMIN_EMAIL_TO)
      : normalizeValue(process.env.ADMIN_EMAIL_TO);

  const targetEmail = normalizeValue(
    adminRecipient?.email || fallbackRecipient,
  );
  if (!targetEmail) {
    return {
      sent: false,
      message:
        "Admin alert email was skipped because no admin email recipient was available.",
    };
  }

  const { subject, text, html } = buildAdminApplicationAlertEmail(
    application,
    adminRecipient?.fullName || "Admin",
  );

  try {
    await mailConfig.transport.sendMail({
      from: mailConfig.from,
      to: targetEmail,
      subject,
      text,
      html,
    });
  } catch (error) {
    return {
      sent: false,
      message:
        "Application was submitted, but admin alert email could not be sent.",
    };
  }

  return {
    sent: true,
    message: "Admin has been notified by email.",
    to: targetEmail,
  };
};

const buildApplicationSelectionEmail = (application) => {
  const companyName = application.company || "our team";
  const subject = `Congratulations! You are selected for ${application.opportunityTitle}`;

  const text = [
    `Hi ${application.name},`,
    "",
    `We are pleased to inform you that you have been selected for the ${application.opportunityTitle} (${application.opportunityType}) at ${companyName}.`,
    "",
    "Our team will contact you soon with the next steps.",
    "",
    "Best regards,",
    `${companyName}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Hi ${escapeHtml(application.name)},</p>
      <p>
        We are pleased to inform you that you have been selected for the <strong>${escapeHtml(
          application.opportunityTitle,
        )}</strong> (${escapeHtml(application.opportunityType)}) at ${escapeHtml(
          companyName,
        )}.
      </p>
      <p>
        Our team will contact you soon with the next steps.
      </p>
      <p>Best regards,<br>${escapeHtml(companyName)}</p>
    </div>
  `;

  return { subject, text, html };
};

export const sendApplicationSelectionEmail = async (application) => {
  const mailConfig = getTransportConfig();
  if (!mailConfig) return { sent: false, message: "SMTP settings not configured." };

  const { subject, text, html } = buildApplicationSelectionEmail(application);

  try {
    await mailConfig.transport.sendMail({
      from: mailConfig.from,
      to: application.email,
      subject,
      text,
      html,
    });
    return { sent: true, message: "Selection email sent." };
  } catch (error) {
    console.error("Failed to send selection email:", error);
    return { sent: false, message: "Failed to send selection email." };
  }
};

const buildApplicationRejectionEmail = (application) => {
  const companyName = application.company || "our team";
  const subject = `Update regarding your application for ${application.opportunityTitle}`;

  const text = [
    `Hi ${application.name},`,
    "",
    `Thank you for your interest in the ${application.opportunityTitle} (${application.opportunityType}) at ${companyName}.`,
    "",
    "After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.",
    "",
    "We wish you the best in your future endeavors.",
    "",
    "Best regards,",
    `${companyName}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p>Hi ${escapeHtml(application.name)},</p>
      <p>
        Thank you for your interest in the <strong>${escapeHtml(
          application.opportunityTitle,
        )}</strong> (${escapeHtml(application.opportunityType)}) at ${escapeHtml(
          companyName,
        )}.
      </p>
      <p>
        After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.
      </p>
      <p>
        We wish you the best in your future endeavors.
      </p>
      <p>Best regards,<br>${escapeHtml(companyName)}</p>
    </div>
  `;

  return { subject, text, html };
};

export const sendApplicationRejectionEmail = async (application) => {
  const mailConfig = getTransportConfig();
  if (!mailConfig) return { sent: false, message: "SMTP settings not configured." };

  const { subject, text, html } = buildApplicationRejectionEmail(application);

  try {
    await mailConfig.transport.sendMail({
      from: mailConfig.from,
      to: application.email,
      subject,
      text,
      html,
    });
    return { sent: true, message: "Rejection email sent." };
  } catch (error) {
    console.error("Failed to send rejection email:", error);
    return { sent: false, message: "Failed to send rejection email." };
  }
};

export const sendMasterclassNotificationEmail = async (applicantName, applicantEmail, masterclassTitle) => {
  const mailConfig = getTransportConfig();
  if (!mailConfig) return { sent: false, message: "SMTP settings not configured." };

  const subject = `Masterclass Notification: ${masterclassTitle}`;
  const text = `Hi ${applicantName},\n\nYou have successfully signed up to be notified when the masterclass "${masterclassTitle}" goes live!\nWe will let you know as soon as it's ready.\n\nBest regards,\nGlobal Program Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Hello ${escapeHtml(applicantName)},</h2>
      <p>
        You have successfully signed up to be notified when the masterclass <strong>"${escapeHtml(masterclassTitle)}"</strong> goes live!
      </p>
      <p>We'll let you know as soon as it's ready.</p>
      <p>Best regards,<br>Global Program Team</p>
    </div>
  `;

  try {
    await mailConfig.transport.sendMail({
      from: mailConfig.from,
      to: applicantEmail,
      subject,
      text,
      html,
    });
    return { sent: true, message: "Notification email sent." };
  } catch (error) {
    console.error("Failed to send notification email:", error);
    return { sent: false, message: "Failed to send notification email." };
  }
};
