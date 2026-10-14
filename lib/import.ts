import type { ParsedLead } from './types';

/**
 * Pure CSV-mapping logic. Shared by the browser (preview) and the server
 * (authoritative save), so both always agree on what a row means.
 */

export const IMPORT_FIELDS = [
  'first_name',
  'last_name',
  'full_name',
  'title',
  'company',
  'industry',
  'location',
  'linkedin_url',
  'email',
  'phone',
  'website',
  'company_size',
  'notes',
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

/** Maps each app field to the CSV header that feeds it. */
export type ColumnMapping = Partial<Record<ImportField, string>>;

export const FIELD_LABELS: Record<ImportField, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  full_name: 'Full name',
  title: 'Job title',
  company: 'Company',
  industry: 'Industry',
  location: 'Location',
  linkedin_url: 'LinkedIn profile URL',
  email: 'Email',
  phone: 'Phone',
  website: 'Company website',
  company_size: 'Company size',
  notes: 'Notes',
};

export const MAX_IMPORT_ROWS = 5000;

const ALIASES: Record<ImportField, string[]> = {
  first_name: ['first name', 'firstname', 'given name'],
  last_name: ['last name', 'lastname', 'surname', 'family name'],
  full_name: ['full name', 'name', 'person name', 'contact name'],
  title: ['title', 'job title', 'position', 'headline', 'current title'],
  company: ['company', 'company name', 'current company', 'organization', 'account name', 'employer'],
  industry: ['industry', 'company industry', 'sector'],
  location: ['location', 'geography', 'region', 'city', 'country'],
  linkedin_url: ['profile url', 'linkedin url', 'linkedin profile url', 'linkedin profile', 'profile link', 'linkedin', 'linkedin link'],
  email: ['email', 'email address', 'work email', 'e-mail'],
  phone: ['phone', 'phone number', 'mobile', 'mobile phone'],
  website: ['website', 'company website', 'domain', 'company url'],
  company_size: ['company size', 'employees', 'employee count', 'company headcount', 'size'],
  notes: ['notes', 'note', 'comments'],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Guess the mapping from CSV headers. Each header is used at most once. */
export function detectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  for (const field of IMPORT_FIELDS) {
    const match = headers.find((h) => !used.has(h) && ALIASES[field].includes(normalizeHeader(h)));
    if (match) {
      mapping[field] = match;
      used.add(match);
    }
  }
  return mapping;
}

/** Identity mapping used when a lead is entered manually in the form. */
export const IDENTITY_MAPPING = Object.fromEntries(
  IMPORT_FIELDS.map((f) => [f, f])
) as ColumnMapping;

/** Accepts linkedin.com URLs with or without scheme; returns a canonical URL or null. */
export function normalizeLinkedInUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const url = new URL(s);
    if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) return null;
    const path = url.pathname.replace(/\/+$/, '');
    if (!path || path === '/') return null;
    return `https://www.linkedin.com${path}`;
  } catch {
    return null;
  }
}

function clean(value: unknown, max = 255): string | null {
  if (value == null) return null;
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, max) : null;
}

export type RowResult = { ok: true; lead: ParsedLead } | { ok: false; reason: string };

/** Normalize one raw CSV row into a lead, or explain why it was rejected. */
export function normalizeRow(row: Record<string, unknown>, mapping: ColumnMapping): RowResult {
  const get = (field: ImportField) => {
    const header = mapping[field];
    return header ? clean(row[header], field === 'notes' ? 2000 : 255) : null;
  };

  let first = get('first_name');
  let last = get('last_name');
  const full = get('full_name');

  if (!first && !last && full) {
    const parts = full.split(' ');
    first = parts[0] ?? null;
    last = parts.slice(1).join(' ') || null;
  }

  const name = [first, last].filter(Boolean).join(' ') || full || null;
  const linkedin = normalizeLinkedInUrl(get('linkedin_url'));
  const emailRaw = get('email');
  const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw.toLowerCase() : null;

  if (!name && !linkedin && !email) {
    return { ok: false, reason: 'Missing name, LinkedIn URL and email — at least one is required' };
  }

  const company = get('company');
  const dedupe_key = linkedin
    ? `li:${linkedin.toLowerCase()}`
    : email
      ? `em:${email}`
      : `nc:${(name ?? '').toLowerCase()}|${(company ?? '').toLowerCase()}`;

  return {
    ok: true,
    lead: {
      first_name: first,
      last_name: last,
      full_name: name,
      title: get('title'),
      company,
      industry: get('industry'),
      location: get('location'),
      linkedin_url: linkedin,
      email,
      phone: get('phone'),
      website: get('website'),
      company_size: get('company_size'),
      notes: get('notes'),
      dedupe_key,
    },
  };
}

/**
 * Normalize a whole file. Rows that repeat an earlier identity within the same
 * file are merged (the last occurrence wins). Row numbers are spreadsheet rows
 * (header is row 1).
 */
export function buildLeads(rows: Record<string, unknown>[], mapping: ColumnMapping) {
  const byKey = new Map<string, ParsedLead>();
  const errors: { row: number; reason: string }[] = [];
  let valid = 0;

  rows.forEach((row, index) => {
    const result = normalizeRow(row, mapping);
    if (!result.ok) {
      errors.push({ row: index + 2, reason: result.reason });
      return;
    }
    valid += 1;
    byKey.set(result.lead.dedupe_key, result.lead);
  });

  const leads = [...byKey.values()];
  return { leads, errors, duplicatesInFile: valid - leads.length };
}
