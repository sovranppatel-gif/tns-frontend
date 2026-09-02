import { API_URL } from "../utils/api.js";

const AUTH_TIMEOUT_MS = 12000;
const AUTH_RETRIES = 3;
const RETRY_DELAY_MS = 1200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function friendlyNetworkError(err) {
  const msg = String(err?.message || "");
  if (err?.name === "AbortError" || /aborted|timeout/i.test(msg)) {
    return "Server is taking too long to respond. Please wait a moment and try again.";
  }
  if (/failed to fetch|network request failed|load failed|econnrefused/i.test(msg)) {
    return "Cannot connect to server yet. If you just started it, wait a few seconds and try again.";
  }
  return msg || "Cannot reach the server. Please try again.";
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const err = new Error(
      data.message || (res.status === 503 ? "Server is starting up. Please retry." : "Request failed")
    );
    err.status = res.status;
    err.retryAfter = data.retryAfter;
    throw err;
  }
  return data;
}

async function authFetch(path, { method = "POST", body, token, retries = AUTH_RETRIES } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return await parseJson(res);
    } catch (err) {
      lastError = err;
      const status = err?.status;
      const retryable =
        status === 503 ||
        err?.name === "AbortError" ||
        /failed to fetch|network request failed|load failed|econnrefused|taking too long|cannot connect|starting up|temporarily unavailable/i.test(
          String(err?.message || "")
        );

      if (!retryable || attempt >= retries) {
        throw new Error(friendlyNetworkError(err));
      }

      const waitMs = Number(err?.retryAfter) > 0 ? Number(err.retryAfter) * 1000 : RETRY_DELAY_MS * attempt;
      await sleep(waitMs);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(friendlyNetworkError(lastError));
}

/**
 * Send signup OTP to email via Brevo (server).
 */
export async function sendEmailOtp(email) {
  return authFetch("/api/students/auth/send-otp", { body: { email } });
}

/**
 * Verify the 6-digit email OTP.
 */
export async function verifyEmailOtp(email, otp) {
  return authFetch("/api/students/auth/verify-otp", { body: { email, otp } });
}

export async function registerStudent(payload) {
  return authFetch("/api/students/auth/register", { body: payload });
}

export async function loginStudent({ email, password }) {
  return authFetch("/api/students/auth/login", { body: { email, password } });
}

/**
 * Send forgot-password OTP to email.
 */
export async function sendForgotPasswordOtp(email) {
  return authFetch("/api/students/auth/forgot-password/send-otp", {
    body: { email },
  });
}

/**
 * Verify forgot-password OTP.
 */
export async function verifyForgotPasswordOtp(email, otp) {
  return authFetch("/api/students/auth/forgot-password/verify-otp", {
    body: { email, otp },
  });
}

/**
 * Reset password after OTP verification. Returns token + user for auto-login.
 */
export async function resetStudentPassword({ email, password }) {
  return authFetch("/api/students/auth/forgot-password/reset", {
    body: { email, password },
  });
}

/**
 * GET /api/students/auth/me — current student profile
 */
export async function getStudentMe(token) {
  return authFetch("/api/students/auth/me", { method: "GET", token, retries: 1 });
}

/**
 * POST /api/students/auth/avatar — upload profile photo (pending until admin approves)
 */
export async function uploadStudentAvatar(token, file) {
  if (!file) throw new Error("No photo selected");
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Photo must be 2 MB or smaller");
  }
  const formData = new FormData();
  formData.append("file", file);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`${API_URL}/api/students/auth/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      signal: controller.signal,
    });
    return await parseJson(res);
  } catch (err) {
    throw new Error(friendlyNetworkError(err));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * PATCH /api/students/auth/me — submit personal details for admin approval
 */
export async function updateStudentProfile(token, payload) {
  return authFetch("/api/students/auth/me", {
    method: "PATCH",
    token,
    body: payload,
    retries: 2,
  });
}

/**
 * POST /api/students/auth/change-password
 */
export async function changeStudentPassword(token, { currentPassword, newPassword }) {
  return authFetch("/api/students/auth/change-password", {
    method: "POST",
    token,
    body: { currentPassword, newPassword },
    retries: 1,
  });
}
