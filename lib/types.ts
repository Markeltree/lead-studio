export const LEAD_STATUSES = [
  'new',
  'researching',
  'contacted',
  'replied',
  'meeting',
  'won',
  'lost',
  'do_not_contact',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  researching: 'Researching',
  contacted: 'Contacted',
  replied: 'Replied',
  meeting: 'Meeting',
  won: 'Won',
  lost: 'Lost',
  do_not_contact: 'Do not contact',
};

/** Result shape returned by server actions (safe to serialize to the client). */
export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** A normalized lead ready to be stored. */
export type ParsedLead = {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  location: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  company_size: string | null;
  notes: string | null;
  dedupe_key: string;
};

/** A lead as stored in the database. */
export type Lead = ParsedLead & {
  id: string;
  status: LeadStatus;
  score: number | null;
  import_id: string | null;
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  company_name: string | null;
  sender_name: string | null;
  sender_title: string | null;
  services_description: string | null;
  value_propositions: string | null;
  target_industries: string | null;
  typical_deal_size: string | null;
  tone: string | null;
};

export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  duplicatesInFile: number;
  errors: { row: number; reason: string }[];
};
