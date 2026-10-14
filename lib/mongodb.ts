import 'server-only';
import { MongoClient, type Db } from 'mongodb';

/*
 * Collections (string `_id`s so ids stay URL-safe UUIDs):
 *   users          _id = uuid
 *   user_settings  _id = user_id
 *   lead_imports   _id = uuid
 *   leads          _id = uuid
 *   lead_analyses  _id = lead_id  (one per lead, overwritten on re-run)
 *   lead_outreach  _id = lead_id  (one per lead, overwritten on re-run)
 * Every query filters on user_id; there is no database-level row security.
 */

const globalForMongo = globalThis as unknown as {
  _mongoClient?: Promise<MongoClient>;
  _mongoIndexes?: Promise<unknown>;
};

function clientPromise(): Promise<MongoClient> {
  // Reuse one client per process (and across hot reloads in dev).
  if (!globalForMongo._mongoClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set.');
    globalForMongo._mongoClient = new MongoClient(uri).connect();
  }
  return globalForMongo._mongoClient;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('lead_imports').createIndex({ user_id: 1, created_at: -1 }),
    db.collection('leads').createIndex({ user_id: 1, dedupe_key: 1 }, { unique: true }),
    db.collection('leads').createIndex({ user_id: 1, status: 1 }),
    db.collection('leads').createIndex({ user_id: 1, industry: 1 }),
    db.collection('leads').createIndex({ user_id: 1, created_at: -1 }),
    db.collection('lead_analyses').createIndex({ user_id: 1, fit_score: -1 }),
    db.collection('lead_outreach').createIndex({ user_id: 1 }),
  ]);
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  const db = client.db(process.env.MONGODB_DB || 'lead-studio');
  globalForMongo._mongoIndexes ??= ensureIndexes(db);
  await globalForMongo._mongoIndexes;
  return db;
}

/**
 * Convert a stored document into the shape the UI expects:
 * `_id` becomes `id`, and Dates become ISO strings (safe to pass to client components).
 */
export function serialize<T = Record<string, any>>(doc: Record<string, any> | null | undefined): T | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  const out: Record<string, any> = { id: _id };
  for (const [key, value] of Object.entries(rest)) {
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out as T;
}
