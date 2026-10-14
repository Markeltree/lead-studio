import { randomUUID } from 'node:crypto';
import type { AnyBulkWriteOperation, Db, Document } from 'mongodb';
import { chunked } from './utils';
import type { ParsedLead } from './types';

/**
 * Insert new leads and refresh existing ones (matched by dedupe_key).
 * On update, only fields present in the import are overwritten, so manual
 * edits, status, notes, and AI analysis are preserved.
 */
export async function saveLeads(
  db: Db,
  userId: string,
  leads: ParsedLead[],
  importId: string | null
): Promise<{ created: number; updated: number }> {
  const leadsCol = db.collection<Document & { _id: string }>('leads');
  const existing = new Map<string, string>();

  for (const keys of chunked(
    leads.map((l) => l.dedupe_key),
    1000
  )) {
    const rows = await leadsCol
      .find({ user_id: userId, dedupe_key: { $in: keys } }, { projection: { dedupe_key: 1 } })
      .toArray();
    for (const row of rows) existing.set(row.dedupe_key, row._id);
  }

  const now = new Date();
  const inserts: (Document & { _id: string })[] = [];
  const updates: AnyBulkWriteOperation<Document & { _id: string }>[] = [];

  for (const lead of leads) {
    const id = existing.get(lead.dedupe_key);
    if (id) {
      const patch = Object.fromEntries(
        Object.entries(lead).filter(([k, v]) => v != null && k !== 'dedupe_key')
      );
      if (Object.keys(patch).length) {
        updates.push({
          updateOne: { filter: { _id: id, user_id: userId }, update: { $set: { ...patch, updated_at: now } } },
        });
      }
    } else {
      inserts.push({
        _id: randomUUID(),
        ...lead,
        user_id: userId,
        import_id: importId,
        status: 'new',
        score: null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  for (const batch of chunked(inserts, 500)) await leadsCol.insertMany(batch);
  for (const batch of chunked(updates, 500)) await leadsCol.bulkWrite(batch, { ordered: false });

  return { created: inserts.length, updated: updates.length };
}
