const CONTACT_EMAIL = "ritikchauhan32132@gmail.com";
const MAX_BODY_BYTES = 12_000;
const MIN_FORM_AGE_MS = 2_500;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 4;
const requestsByIp = new Map();

function respond(res, statusCode, message, extraHeaders = {}) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  for (const [name, value] of Object.entries(extraHeaders)) {
    res.setHeader(name, value);
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify({ ok: statusCode >= 200 && statusCode < 300, message }));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[character];
  });
}

function normalizeField(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(value);
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  const requestHost = req.headers["x-forwarded-host"] || req.headers.host;
  if (typeof origin !== "string" || typeof requestHost !== "string") return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.protocol === "https:" || originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1"
      ? originUrl.host.toLowerCase() === requestHost.split(",")[0].trim().toLowerCase()
      : false;
  } catch {
    return false;
  }
}

function isRateLimited(ip, now) {
  for (const [key, timestamps] of requestsByIp) {
    const recent = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    if (recent.length > 0) {
      requestsByIp.set(key, recent);
    } else {
      requestsByIp.delete(key);
    }
  }

  const timestamps = requestsByIp.get(ip) || [];
  const recent = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
}

module.exports = async function contactHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return respond(res, 405, "Only POST requests are accepted.");
  }

  if (!isSameOrigin(req)) {
    return respond(res, 403, "This form only accepts requests from this website.");
  }

  const contentType = req.headers["content-type"];
  if (typeof contentType !== "string" || !/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return respond(res, 415, "The form data format was not supported. Please try again.");
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return respond(res, 413, "Your message is too large. Please shorten it and try again.");
  }

  const payload = typeof req.body === "string"
    ? (() => {
        try {
          return JSON.parse(req.body);
        } catch {
          return null;
        }
      })()
    : req.body;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return respond(res, 400, "The form data was invalid. Please check the fields and try again.");
  }

  if (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_BODY_BYTES) {
    return respond(res, 413, "Your message is too large. Please shorten it and try again.");
  }

  const name = normalizeField(payload.name);
  const email = normalizeField(payload.email);
  const subject = normalizeField(payload.subject).replace(/[\r\n]+/g, " ");
  const message = normalizeField(payload.message);
  const formStartedAt = Number(payload.formStartedAt);
  const honeypot = normalizeField(payload.website);

  if (honeypot) {
    return respond(res, 400, "The form could not be submitted. Please try again.");
  }

  if (
    name.length < 2 || name.length > 100 ||
    !isValidEmail(email) ||
    subject.length < 2 || subject.length > 150 ||
    message.length < 10 || message.length > 5_000 ||
    !Number.isSafeInteger(formStartedAt) ||
    Date.now() - formStartedAt < MIN_FORM_AGE_MS ||
    Date.now() - formStartedAt > 60 * 60 * 1000
  ) {
    return respond(res, 400, "Please enter a valid name, email, subject, and message, then try again.");
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = typeof req.headers["x-real-ip"] === "string"
    ? req.headers["x-real-ip"]
    : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : "unknown";

  if (isRateLimited(ip, Date.now())) {
    return respond(res, 429, "Too many messages were sent from this connection. Please try again in 15 minutes.", {
      "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  if (!apiKey || !from) {
    console.error("Contact email is not configured: RESEND_API_KEY and CONTACT_FROM are required.");
    return respond(res, 503, "The contact service is not configured yet. Please email ritikchauhan32132@gmail.com directly.");
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    "",
    message
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject: `Portfolio message: ${subject}`,
        text,
        html: `<h2>Portfolio contact message</h2><p><strong>Name:</strong> ${safeName}</p><p><strong>Sender email:</strong> ${safeEmail}</p><p><strong>Subject:</strong> ${safeSubject}</p><p><strong>Message:</strong><br>${safeMessage}</p>`
      }),
      signal: AbortSignal.timeout(9_000)
    });

    if (!response.ok) {
      console.error(`Resend rejected a contact message with HTTP ${response.status}.`);
      return respond(res, 502, "Your message could not be delivered right now. Please try again later or email me directly.");
    }
  } catch (error) {
    console.error("Resend could not be reached while sending a contact message.", error);
    return respond(res, 502, "Your message could not be delivered right now. Please try again later or email me directly.");
  }

  return respond(res, 200, "Your message was accepted for delivery. Thank you — I'll be in touch.");
};
