import 'server-only';
import type { Db } from 'mongodb';
import { LEAD_STATUSES, type LeadStatus } from './types';

export type SidebarData = {
  total: number;
  analyzed: number;
  withOutreach: number;
  hasSettings: boolean;
  statusCounts: Record<LeadStatus, number>;
  recent: { id: string; name: string; subtitle: string }[];
};

/** Counts and recent leads shown in the app sidebar. */
export async function getSidebarData(db: Db, userId: string): Promise<SidebarData> {
  const mine = { user_id: userId };
  const [total, analyzed, withOutreach, settings, byStatus, recentDocs] = await Promise.all([
    db.collection('leads').countDocuments(mine),
    db.collection('lead_analyses').countDocuments(mine),
    db.collection('lead_outreach').countDocuments(mine),
    db.collection<any>('user_settings').findOne({ _id: userId }, { projection: { services_description: 1 } }),
    db
      .collection('leads')
      .aggregate<{ _id: LeadStatus; count: number }>([{ $match: mine }, { $group: { _id: '$status', count: { $sum: 1 } } }])
      .toArray(),
    db
      .collection<any>('leads')
      .find(mine, { projection: { full_name: 1, email: 1, company: 1, title: 1 } })
      .sort({ updated_at: -1 })
      .limit(5)
      .toArray(),
  ]);

  const statusCounts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const row of byStatus) if (row._id in statusCounts) statusCounts[row._id] = row.count;

  return {
    total,
    analyzed,
    withOutreach,
    hasSettings: Boolean(settings?.services_description),
    statusCounts,
    recent: recentDocs.map((d) => ({
      id: d._id,
      name: d.full_name ?? d.email ?? 'Unnamed lead',
      subtitle: d.company ?? d.title ?? '',
    })),
  };
}
