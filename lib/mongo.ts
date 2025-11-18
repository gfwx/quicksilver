import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "quicksilver";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

// Only initialize connection if URI is available (runtime, not build time)
if (uri) {
  if (process.env.NODE_ENV === "development") {
    clientPromise = new MongoClient(uri).connect();
  } else {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    clientPromise = global._mongoClientPromise;
  }

  // Global for prod (Vercel/Next.js serverless)
  if (typeof globalThis !== "undefined") {
    globalThis._mongoClientPromise = clientPromise;
  }
}

export async function getDb() {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!clientPromise) {
    throw new Error("MongoDB client not initialized");
  }
  const client = await clientPromise;
  return client.db(dbName);
}
