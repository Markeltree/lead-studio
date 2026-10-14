'use server';

import { getUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { leadFilter } from '@/lib/queries';

export type LeadHit = { id: string; name: string; subtitle: string; status: string };

/** Quick lead search for the command palette. */
export async function searchLeads(q: string): Promise<LeadHit[]> {
  const user = await getUser();
  if (!user) return [];

  const db = await getDb();
  const term = String(q ?? '').trim();
  const docs = await db
    .collection<any>('leads')
    .find(term ? leadFilter(user.id, { q: term }) : { user_id: user.id }, {
      projection: { full_name: 1, title: 1, company: 1, email: 1, status: 1 },
    })
    .sort(term ? { full_name: 1 } : { updated_at: -1 })
    .limit(8)
    .toArray();

  return docs.map((d) => ({
    id: d._id,
    name: d.full_name ?? d.email ?? 'Unnamed lead',
    subtitle: [d.title, d.company].filter(Boolean).join(' · '),
    status: d.status,
  }));
}
