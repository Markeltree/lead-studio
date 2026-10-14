import type { Filter, Document } from 'mongodb';
import { LEAD_STATUSES } from './types';

export type LeadFilters = {
  q?: string | null;
  status?: string | null;
  industry?: string | null;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Build a MongoDB filter for a user's leads from search and filter params. */
export function leadFilter(userId: string, filters: LeadFilters): Filter<Document> {
  const filter: Filter<Document> = { user_id: userId };

  const term = (filters.q ?? '').trim().slice(0, 200);
  if (term) {
    const re = { $regex: escapeRegex(term), $options: 'i' };
    filter.$or = [{ full_name: re }, { company: re }, { title: re }, { email: re }];
  }
  if (filters.status && (LEAD_STATUSES as readonly string[]).includes(filters.status)) {
    filter.status = filters.status;
  }
  if (filters.industry) {
    filter.industry = filters.industry;
  }
  return filter;
}
