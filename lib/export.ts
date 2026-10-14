import { one } from './utils';

export const LEAD_EXPORT_COLUMNS = [
  'full_name',
  'first_name',
  'last_name',
  'title',
  'company',
  'industry',
  'location',
  'linkedin_url',
  'email',
  'phone',
  'website',
  'company_size',
  'status',
  'score',
  'notes',
  'created_at',
];

export const AI_EXPORT_COLUMNS = [
  'fit_score',
  'company_summary',
  'service_fit',
  'pain_points',
  'business_challenges',
  'motivations',
  'buying_signals',
  'decision_factors',
  'persuasion_strategies',
  'data_gaps',
  'email_sequence',
  'linkedin_messages',
  'sales_pitch',
  'outreach_strategy',
];

export function exportColumns(include: 'all' | 'leads'): string[] {
  return include === 'all' ? [...LEAD_EXPORT_COLUMNS, ...AI_EXPORT_COLUMNS] : LEAD_EXPORT_COLUMNS;
}

const singleLine = (s: string) => s.replace(/\s*\n\s*/g, ' ').trim();

/** Turn any stored JSON value into readable text for a spreadsheet cell. */
export function formatValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => `• ${singleLine(formatValue(item))}`)
      .filter((line) => line !== '• ')
      .join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${singleLine(formatValue(v))}`)
      .join(' | ');
  }
  return '';
}

function formatSequence(sequence: Array<Record<string, unknown>>): string {
  return sequence
    .map(
      (e) =>
        `Step ${e.step} (Day ${e.day_offset}) — ${e.purpose ?? ''}\nSubject: ${e.subject ?? ''}\n${e.body ?? ''}`
    )
    .join('\n\n');
}

function formatLinkedIn(li: Record<string, any> | null | undefined): string {
  if (!li) return '';
  const parts = [`Connection note: ${li.connection_note ?? ''}`];
  for (const m of li.messages ?? []) {
    parts.push(`Message ${m.step} (Day ${m.day_offset}) — ${m.purpose ?? ''}\n${m.message ?? ''}`);
  }
  return parts.join('\n\n');
}

/** Flatten a leads row (with joined analysis and outreach) into export columns. */
export function exportRowFor(row: Record<string, any>): Record<string, unknown> {
  const analysis = one<Record<string, any>>(row.lead_analyses) ?? {};
  const outreach = one<Record<string, any>>(row.lead_outreach) ?? {};

  return {
    full_name: row.full_name,
    first_name: row.first_name,
    last_name: row.last_name,
    title: row.title,
    company: row.company,
    industry: row.industry,
    location: row.location,
    linkedin_url: row.linkedin_url,
    email: row.email,
    phone: row.phone,
    website: row.website,
    company_size: row.company_size,
    status: row.status,
    score: row.score,
    notes: row.notes,
    created_at: row.created_at,

    fit_score: analysis.fit_score ?? null,
    company_summary: analysis.company_summary ?? null,
    service_fit: analysis.service_fit ?? null,
    pain_points: formatValue(analysis.pain_points),
    business_challenges: formatValue(analysis.business_challenges),
    motivations: formatValue(analysis.motivations),
    buying_signals: formatValue(analysis.buying_signals),
    decision_factors: formatValue(analysis.decision_factors),
    persuasion_strategies: formatValue(analysis.persuasion_strategies),
    data_gaps: formatValue(analysis.data_gaps),

    email_sequence: formatSequence(outreach.email_sequence ?? []),
    linkedin_messages: formatLinkedIn(outreach.linkedin_messages),
    sales_pitch: formatValue(outreach.sales_pitch),
    outreach_strategy: formatValue(outreach.outreach_strategy),
  };
}
