import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_COOKIE = "cc_admin_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Single shared admin password (env var), not a full user/login system.
 * The session cookie is an HMAC derived from the password + a fixed label,
 * so it stays valid until ADMIN_PASSWORD changes and never needs a session store.
 */
function expectedSessionToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHmac("sha256", password).update("admin-session").digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured || !password) return false;
  return timingSafeStringEqual(password, configured);
}

export function setAdminSessionCookie() {
  const token = expectedSessionToken();
  if (!token) throw new Error("ADMIN_PASSWORD is not configured");
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export function clearAdminSessionCookie() {
  cookies().delete(ADMIN_COOKIE);
}

export function isAdminAuthenticated(): boolean {
  const expected = expectedSessionToken();
  if (!expected) return false;
  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  return timingSafeStringEqual(cookie, expected);
}
