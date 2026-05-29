import mongoose from "mongoose";

import { logger } from "@/server/logging/logger";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cache;

export async function connectToDatabase(uri = process.env.MONGODB_URI): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!uri) {
    throw new Error("MONGODB_URI is required to connect to MongoDB.");
  }

  cache.promise ??= mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== "production",
    bufferCommands: false,
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });

  cache.conn = await cache.promise;
  logger.info("database.connected");

  return cache.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!cache.conn) return;

  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
