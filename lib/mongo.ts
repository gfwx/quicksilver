// src/lib/mongodb.ts (full code from my previous response)
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB_NAME || "quicksilver";

declare global {
  // Extend the NodeJS global object type
  var _mongoClientPromise: MongoClient;
}

if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  clientPromise = new MongoClient(uri).connect();
} else {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri);
  }
  clientPromise = global._mongoClientPromise.connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}

// Global for prod (Vercel/Next.js serverless)
if (typeof globalThis !== "undefined") {
  (globalThis as any)._mongoClientPromise = clientPromise;
}
