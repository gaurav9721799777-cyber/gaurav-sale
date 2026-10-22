import { describe, expect, it } from "vitest";
import { getDatabaseName } from "./database-config";

describe("database selection by APP_ENV", () => {
  it("uses the development database locally", () => {
    expect(getDatabaseName("local")).toBe("gaurav-sales-dev");
  });

  it("keeps dev isolated from the production database", () => {
    expect(getDatabaseName("dev")).toBe("gaurav-sales-dev");
  });

  it("uses the production database in production", () => {
    expect(getDatabaseName("production")).toBe("gaurav-sales-prod");
  });

  it("uses an explicitly configured database name", () => {
    expect(getDatabaseName("local", "sales-local-test")).toBe("sales-local-test");
  });

  it("rejects unsafe database names", () => {
    expect(() => getDatabaseName("local", "sales/prod")).toThrow(
      "MONGODB_DATABASE must be a valid database name",
    );
  });

  it("rejects unknown environments instead of selecting the wrong database", () => {
    expect(() => getDatabaseName("staging")).toThrow("APP_ENV must be one of");
  });
});