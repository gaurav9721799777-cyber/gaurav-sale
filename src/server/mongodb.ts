import mongoose from "mongoose";
import { databaseModels } from "./models";
import { getDatabaseName } from "./database-config";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  initialization: Promise<void> | null;
};
const globalForMongoose = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cache = globalForMongoose.mongooseCache ?? { connection: null, promise: null, initialization: null };
globalForMongoose.mongooseCache = cache;

export async function connectMongo() {
  const configuredUri = process.env.MONGODB_URI?.trim();
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const database = getDatabaseName();
  let mongoUri: string;

  if (configuredUri) {
    let parsedUri: URL;
    try {
      parsedUri = new URL(configuredUri);
    } catch {
      throw new Error("MONGODB_URI must be a valid MongoDB connection string.");
    }
    if (
      !["mongodb:", "mongodb+srv:"].includes(parsedUri.protocol) ||
      !parsedUri.hostname
    ) {
      throw new Error(
        "MONGODB_URI must use the mongodb:// or mongodb+srv:// protocol.",
      );
    }
    parsedUri.pathname = `/${encodeURIComponent(database)}`;
    mongoUri = parsedUri.toString();
  } else {
    if (!username || !password || !host) {
      throw new Error(
        "Set MONGODB_URI or configure MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_HOST.",
      );
    }
    if (!/^[a-z0-9.-]+$/i.test(host) || !host.endsWith(".mongodb.net")) {
      throw new Error("MONGODB_HOST must be a MongoDB Atlas hostname.");
    }
    mongoUri = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(database)}?authSource=admin&retryWrites=true&w=majority&appName=gaurav-sales`;
  }

  if (cache.connection) return cache.connection;
  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri).catch((error: unknown) => {
      cache.promise = null;
      cache.initialization = null;
      throw error;
    });
  }
  cache.connection = await cache.promise;
  if (!cache.initialization) {
    cache.initialization = Promise.all(databaseModels.map((databaseModel) => databaseModel.init()))
      .then(() => undefined)
      .catch((error: unknown) => {
        cache.connection = null;
        cache.promise = null;
        cache.initialization = null;
        throw error;
      });
  }
  await cache.initialization;
  return cache.connection;
}