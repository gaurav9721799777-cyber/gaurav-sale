import type { NextApiRequest, NextApiResponse } from "next";
import { clearAdminSession, hasAdminSession, setAdminSession } from "../../../src/server/admin-auth";
import { connectMongo } from "../../../src/server/mongodb";
import { AdminUser } from "../../../src/server/models";
import { hashAdminPassword, verifyAdminPassword } from "../../../src/server/admin-password";

export default async function adminAuth(request: NextApiRequest, response: NextApiResponse) {
  response.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  if (request.method === "GET") {
    return response.status(200).json({ authenticated: hasAdminSession(request) });
  }
  if (request.method === "DELETE") {
    clearAdminSession(response);
    return response.status(200).json({ authenticated: false });
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST, DELETE");
    return response.status(405).json({ success: false, message: "Method not allowed." });
  }

  const submittedUsername = typeof request.body?.username === "string"
    ? request.body.username.trim().toLowerCase()
    : typeof request.body?.email === "string"
      ? request.body.email.trim().toLowerCase()
      : "";
  const submittedPassword = typeof request.body?.password === "string" ? request.body.password : "";
  if (!submittedUsername || !submittedPassword) {
    return response.status(400).json({ success: false, message: "Username and password are required." });
  }
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    return response.status(503).json({ success: false, message: "Admin session signing is not configured." });
  }

  try {
    await connectMongo();
    const admin = await AdminUser.findOne({ username: submittedUsername, active: true }).select("+passwordHash");
    const passwordValid = admin
      ? await verifyAdminPassword(submittedPassword, admin.passwordHash)
      : (await hashAdminPassword(submittedPassword), false);
    if (!admin || !passwordValid) {
      return response.status(401).json({ success: false, message: "Username or password is incorrect." });
    }

    setAdminSession(response);
    return response.status(200).json({ authenticated: true });
  } catch {
    return response.status(503).json({ success: false, message: "Admin sign-in is temporarily unavailable." });
  }
}