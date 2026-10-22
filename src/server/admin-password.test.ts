import { describe, expect, it } from "vitest";
import { hashAdminPassword, verifyAdminPassword } from "./admin-password";

describe("admin password hashing", () => {
  it("stores a salted scrypt hash and verifies only the matching password", async () => {
    const password = "a-long-test-password";
    const storedHash = await hashAdminPassword(password);

    expect(storedHash).not.toContain(password);
    expect(await verifyAdminPassword(password, storedHash)).toBe(true);
    expect(await verifyAdminPassword("wrong-password", storedHash)).toBe(false);
  });
});