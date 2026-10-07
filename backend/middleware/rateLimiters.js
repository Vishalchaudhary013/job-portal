import { createRateLimiter } from "./rateLimiter.js";

// Unauthenticated endpoints are keyed by IP (nothing else identifies the
// caller yet); authenticated endpoints are keyed by userId so the limit
// follows the account, not whatever IP/device they're currently on.
const byIp = (req) => req.ip;
const byIpAndEmail = (req) => `${req.ip}:${String(req.body?.email || "").toLowerCase()}`;
const byUser = (req) => String(req.user?._id || req.ip);

// Resume Builder AI endpoints: public (no account) and each call hits Gemini,
// so cap per-IP. Generous enough for a real session of drafting a resume,
// tight enough to stop scripted abuse of the AI quota.
export const resumeAiLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 15,
  keyPrefix: "resume-ai",
  keyGenerator: byIp,
});

// Cover Letter Builder AI endpoints: public and Gemini-backed, so keep the
// same per-IP safety guard as the resume builder.
export const coverLetterAiLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 15,
  keyPrefix: "cover-letter-ai",
  keyGenerator: byIp,
});

// Signup: creating an account is rare for a legitimate user, so a tight per-IP
// cap doesn't hurt real traffic but blocks scripted account-creation abuse.
export const signupLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 5,
  keyPrefix: "signup",
  keyGenerator: byIp,
});

// OTP requests are part of the signup/verification funnel — separate from the
// signup POST itself since a user may legitimately hit "resend code" a few times.
export const otpLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 5,
  keyPrefix: "otp",
  keyGenerator: byIpAndEmail,
});

// Login: keyed by IP+email (not IP alone) so one slow/mistyped-password user
// doesn't get everyone else on the same network/NAT locked out too.
export const loginLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 10,
  keyPrefix: "login",
  keyGenerator: byIpAndEmail,
});

// Start test: a legitimate student calls this once (or a handful of times on
// refresh/resume) — generous enough to never block a real retry after a flaky
// network response, tight enough to stop a scripted hammering of the endpoint.
export const startTestLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 10,
  keyPrefix: "test-start",
  keyGenerator: byUser,
});

// Stakeholder export: a super-admin clicking "Download Excel" on the Admins /
// Users / Mentors lists. Each call builds a workbook and pushes to Google Sheets,
// so cap per-user — generous for real use, tight enough to stop an accidental
// click-loop from hammering the Sheets API quota.
export const stakeholderExportLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 15,
  keyPrefix: "stakeholder-export",
  keyGenerator: byUser,
});

// Autosave: the highest-frequency authenticated traffic in the exam flow —
// one active student can legitimately fire this every few seconds while
// answering. Capped high enough to never throttle real exam traffic, low
// enough to stop a runaway client loop (e.g. a bug sending on every keystroke).
export const autosaveLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 60,
  keyPrefix: "autosave",
  keyGenerator: byUser,
});

// Heartbeat: a lightweight periodic keep-alive/clock-resync ping — infrequent
// by design (e.g. every 15-30s), so a modest cap is already generous.
export const heartbeatLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 20,
  keyPrefix: "heartbeat",
  keyGenerator: byUser,
});

// Security events: the lockdown client fires these on tab-switch, copy attempts,
// mouse-leave, etc. Bursty by nature (a student rage-clicking, a flurry of
// focus/blur while alt-tabbing) so the cap is high — it only exists to stop a
// buggy/hostile client from writing unbounded audit rows.
export const securityEventLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 120,
  keyPrefix: "test-security-event",
  keyGenerator: byUser,
});

// Terminate: should fire at most once per attempt, but several browser events
// can trip it near-simultaneously and the handler is idempotent, so allow a
// small burst.
export const terminateTestLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 10,
  keyPrefix: "test-terminate",
  keyGenerator: byUser,
});

// [CODING-AUTOGRADE-DISABLED 2026-09-03] runCodeLimiter was here, guarding the
// student "Run code" endpoint against draining the Judge0 quota. That endpoint
// is gone — coding answers are reviewed by an admin now.

// Submit: happens once per student in the common case, but must tolerate a
// couple of retries if the first response is lost to a network blip — the
// handler itself is idempotent (TestAttempt.submitTest), so retries here are
// safe even if this limiter is generous.
export const submitTestLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 10,
  keyPrefix: "test-submit",
  keyGenerator: byUser,
});
