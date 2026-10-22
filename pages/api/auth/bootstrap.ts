import { timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { Types } from "mongoose";
import { connectMongo } from "../../../src/server/mongodb";
import { AdminBootstrap, AdminUser } from "../../../src/server/models";
import { hashAdminPassword } from "../../../src/server/admin-password";

const matchesToken = (provided: string, expected: string) => {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
};

export default async function bootstrapAdmin(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false, message: "Method not allowed." });
  }

  const setupToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!setupToken || setupToken.length < 32) {
    return response.status(503).json({ success: false, message: "Admin bootstrap is not configured." });
  }

  const { _id, username, password, token } = request.body ?? {};
  const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
  if (typeof token !== "string" || !matchesToken(token, setupToken)) {
    return response.status(401).json({ success: false, message: "Invalid setup token." });
  }
  if (!/^[a-z0-9._@+-]{3,120}$/.test(normalizedUsername)) {
    return response.status(400).json({ success: false, message: "Username must be 3 to 120 valid characters." });
  }
  if (_id !== undefined && (typeof _id !== "string" || !/^[a-f0-9]{24}$/i.test(_id))) {
    return response.status(400).json({ success: false, message: "The administrator ID must be a 24-character MongoDB ObjectId." });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 200) {
    return response.status(400).json({ success: false, message: "Password must be between 8 and 200 characters." });
  }

  try {
    await connectMongo();
    if (await AdminUser.exists({})) {
      return response.status(409).json({ success: false, message: "An administrator is already configured." });
    }

    try {
      await AdminBootstrap.create({ key: "initial-admin" });
    } catch (error) {
      if (error && typeof error === "object" && (error as { code?: number }).code === 11000) {
        return response.status(409).json({ success: false, message: "Admin setup has already been used." });
      }
      throw error;
    }

    try {
      const passwordHash = await hashAdminPassword(password);
      const admin = await AdminUser.create({
        ...(_id ? { _id: new Types.ObjectId(_id) } : {}),
        username: normalizedUsername,
        passwordHash,
      });
      return response.status(201).json({ success: true, id: admin._id.toString(), username: normalizedUsername });
    } catch (error) {
      await AdminBootstrap.deleteOne({ key: "initial-admin" });
      throw error;
    }
  } catch {
    return response.status(503).json({ success: false, message: "Admin setup is temporarily unavailable." });
  }
}