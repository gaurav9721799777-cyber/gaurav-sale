const databasesByEnvironment = {
  local: "gaurav-sales-dev",
  dev: "gaurav-sales-dev",
  production: "gaurav-sales-prod",
} as const;

export type AppEnvironment = keyof typeof databasesByEnvironment;

export function getDatabaseName(
  environment =
    process.env.APP_ENV ??
    (process.env.NODE_ENV === "production" ? "production" : "local"),
  databaseOverride = process.env.MONGODB_DATABASE,
): string {
  const database = databaseOverride?.trim();
  if (database) {
    if (!/^[a-zA-Z0-9_-]{1,63}$/.test(database)) {
      throw new Error(
        "MONGODB_DATABASE must be a valid database name (letters, numbers, hyphens, and underscores only).",
      );
    }
    return database;
  }
  if (
    !Object.prototype.hasOwnProperty.call(databasesByEnvironment, environment)
  ) {
    throw new Error("APP_ENV must be one of: local, dev, production.");
  }
  return databasesByEnvironment[environment as AppEnvironment];
}