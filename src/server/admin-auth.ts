import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";

const cookieName = "gs-admin-session";
const sessionLifetimeSeconds = 60 * 60 * 8;

function signature(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function setAdminSession(response: NextApiResponse) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + sessionLifetimeSeconds * 1000 })).toString("base64url");
  const value = `${payload}.${signature(payload)}`;
  response.setHeader("Set-Cookie", `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionLifetimeSeconds}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

export function clearAdminSession(response: NextApiResponse) {
  response.setHeader("Set-Cookie", `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

export function hasAdminSession(request: NextApiRequest) {
  try {
    const value = request.cookies[cookieName];
    if (!value) return false;
    const [payload, suppliedSignature] = value.split(".");
    if (!payload || !suppliedSignature) return false;
    const expected = Buffer.from(signature(payload));
    const supplied = Buffer.from(suppliedSignature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function requireAdmin(request: NextApiRequest, response: NextApiResponse) {
  if (hasAdminSession(request)) return true;
  response.status(401).json({ success: false, message: "Administrator sign-in required." });
  return false;
}