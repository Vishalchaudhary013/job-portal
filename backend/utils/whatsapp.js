const normalizeValue = (value) => String(value || "").trim();

const getProvider = () =>
  normalizeValue(
    process.env.WHATSAPP_PROVIDER || "meta-cloud",
  ).toLowerCase();

const metaConfigured = () =>
  Boolean(
    (normalizeValue(process.env.WHATSAPP_CLOUD_ACCESS_TOKEN) || normalizeValue(process.env.WHATSAPP_ACCESS_TOKEN)) &&
      (normalizeValue(process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID) || normalizeValue(process.env.WHATSAPP_PHONE_NUMBER_ID)),
  );

const getWhatsAppSender = () => {
  const from = normalizeValue(process.env.TWILIO_WHATSAPP_FROM);
  if (!from) {
    return "";
  }

  return from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
};

const normalizePhoneNumber = (value) => {
  const raw = normalizeValue(value).replace(/[^\d+]/g, "");
  if (!raw) {
    return "";
  }

  if (raw.startsWith("+")) {
    return raw;
  }

  if (raw.length === 10) {
    return `+91${raw}`;
  }

  if (raw.length === 11 && raw.startsWith("0")) {
    return `+91${raw.slice(1)}`;
  }

  if (raw.length === 12 && raw.startsWith("91")) {
    return `+${raw}`;
  }

  return `+${raw}`;
};

const twilioConfigured = () =>
  Boolean(
    normalizeValue(process.env.TWILIO_ACCOUNT_SID) &&
      normalizeValue(process.env.TWILIO_AUTH_TOKEN) &&
      getWhatsAppSender(),
  );

export const getWhatsAppProvider = () => getProvider();

export const isWhatsAppConfigured = () => {
  const provider = getProvider();
  if (provider === "twilio") {
    return twilioConfigured();
  }
  if (provider === "meta-cloud") {
    return metaConfigured();
  }
  return false;
};

export const getWhatsAppRuntimeStatus = () => {
  const provider = getProvider();

  if (provider === "twilio") {
    const configured = twilioConfigured();
    return {
      provider,
      configured,
      connected: configured,
      initializing: false,
      requiresQr: false,
      message: configured
        ? "Twilio WhatsApp is configured."
        : "Twilio credentials are missing.",
      lastError: "",
    };
  }

  if (provider === "meta-cloud") {
    const configured = metaConfigured();
    return {
      provider,
      configured,
      connected: configured,
      initializing: false,
      requiresQr: false,
      message: configured
        ? "Meta WhatsApp Cloud API is configured."
        : "Meta Cloud API credentials (token or phone ID) are missing.",
      lastError: "",
    };
  }

  return {
    provider,
    configured: false,
    connected: false,
    initializing: false,
    requiresQr: false,
    message: "Invalid WHATSAPP_PROVIDER. Use meta-cloud or twilio.",
    lastError: "",
  };
};

const sendWithTwilio = async ({ to, body }) => {
  if (!twilioConfigured()) {
    return {
      sent: false,
      message:
        "WhatsApp notifications are skipped because Twilio settings are not configured.",
    };
  }

  const recipient = normalizePhoneNumber(to);
  if (!recipient) {
    return {
      sent: false,
      message:
        "WhatsApp notifications are skipped because no recipient number was provided.",
    };
  }

  const payload = new URLSearchParams();
  payload.set("From", getWhatsAppSender());
  payload.set("To", `whatsapp:${recipient}`);
  payload.set("Body", String(body || ""));

  const accountSid = normalizeValue(process.env.TWILIO_ACCOUNT_SID);
  const authToken = normalizeValue(process.env.TWILIO_AUTH_TOKEN);
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Twilio WhatsApp send failed with status ${response.status}: ${errorText}`,
    );
  }

  const data = await response.json();
  return {
    sent: true,
    message: "WhatsApp message sent successfully via Twilio.",
    sid: data.sid,
  };
};

const sendWithMetaCloudApi = async ({ to, body, template }) => {
  if (!metaConfigured()) {
    return {
      sent: false,
      message:
        "WhatsApp notifications are skipped because Meta Cloud API settings are not configured.",
    };
  }

  const recipient = normalizePhoneNumber(to).replace("+", "");
  if (!recipient) {
    return {
      sent: false,
      message:
        "WhatsApp notifications are skipped because no valid recipient number was provided.",
    };
  }

  const accessToken = normalizeValue(process.env.WHATSAPP_CLOUD_ACCESS_TOKEN) || normalizeValue(process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = normalizeValue(process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID) || normalizeValue(process.env.WHATSAPP_PHONE_NUMBER_ID);
  
  const apiVersion = normalizeValue(process.env.WHATSAPP_API_VERSION) || "v21.0";
  const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  let payload = {
    messaging_product: "whatsapp",
    to: recipient,
  };

  if (template) {
    payload.type = "template";
    payload.template = {
      name: template.name,
      language: template.language || { code: "en_US" },
    };

    if (template.components && template.components.length > 0) {
      payload.template.components = template.components;
    }
  } else {
    payload.type = "text";
    payload.text = { body: String(body || "") };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Meta Cloud API send failed with status ${response.status}: ${data.error?.message || JSON.stringify(data)}`,
    );
  }

  return {
    sent: true,
    message: `WhatsApp message sent successfully via Meta Cloud API${template ? " (template)" : ""}.`,
    id: data.messages?.[0]?.id,
  };
};

const sendWhatsAppMessage = async ({ to, body, template }) => {
  const provider = getProvider();

  if (provider === "twilio") {
    return sendWithTwilio({ to, body });
  }

  if (provider === "meta-cloud") {
    return sendWithMetaCloudApi({ to, body, template });
  }

  return {
    sent: false,
    message:
      "WhatsApp notifications are skipped because WHATSAPP_PROVIDER is invalid. Use meta-cloud or twilio.",
  };
};

export const sendWhatsAppText = async ({ to, body, template }) => {
  try {
    return await sendWhatsAppMessage({ to, body, template });
  } catch (error) {
    return {
      sent: false,
      message: `WhatsApp notification failed: ${error.message}`,
    };
  }
};

const buildApplicantMessage = (application) =>
  [
    `Hi ${application.name},`,
    "",
    `Your application for ${application.opportunityTitle} (${application.opportunityType}) has been received.`,
    "",
    `Company: ${application.company || "N/A"}`,
    `Phone: ${application.phone || "N/A"}`,
    `Email: ${application.email}`,
    "",
    "Thank you for applying.",
  ].join("\n");

const buildAdminMessage = (application) =>
  [
    `New application received for ${application.opportunityTitle} (${application.opportunityType}).`,
    "",
    `Applicant: ${application.name}`,
    `Phone: ${application.phone || "N/A"}`,
    `Email: ${application.email}`,
    `Company: ${application.company || "N/A"}`,
    `Status: ${application.status || "New"}`,
  ].join("\n");

export const sendApplicationWhatsAppNotifications = async ({
  application,
  applicantRecipient,
  adminRecipient,
}) => {
  const applicantResult = await sendWhatsAppMessage({
    to: applicantRecipient || application.phone,
    body: buildApplicantMessage(application),
  }).catch((error) => ({
    sent: false,
    message: `WhatsApp message to applicant failed: ${error.message}`,
  }));

  const adminRecipientNumber =
    adminRecipient?.whatsappNumber ||
    (adminRecipient?.role === "super_admin"
      ? process.env.SUPER_ADMIN_WHATSAPP_TO
      : process.env.ADMIN_WHATSAPP_TO);

  const adminResult = await sendWhatsAppMessage({
    to: adminRecipientNumber,
    body: buildAdminMessage(application),
  }).catch((error) => ({
    sent: false,
    message: `WhatsApp message to admin failed: ${error.message}`,
  }));

  return {
    applicant: applicantResult,
    admin: adminResult,
  };
};

export const bootWhatsAppProvider = () => {
};
