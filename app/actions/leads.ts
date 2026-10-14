'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { analyzeLead, generateOutreach } from '@/lib/ai-service';
import {
  IDENTITY_MAPPING,
  IMPORT_FIELDS,
  MAX_IMPORT_ROWS,
  buildLeads,
  normalizeRow,
  type ColumnMapping,
} from '@/lib/import';
import { saveLeads } from '@/lib/import-service';
import { leadStatusSchema } from '@/lib/validation';
import type { ActionResult, ImportSummary } from '@/lib/types';
import { toMessage } from '@/lib/utils';

function refreshLeadViews(leadId?: string) {
  if (leadId) revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  revalidatePath('/dashboard');
  // The sidebar (in the app layout) shows counts and recent leads.
  revalidatePath('/', 'layout');
}

/** Save a parsed CSV. Validation is repeated on the server; never trust the client. */
export async function importLeads(
  fileName: string,
  rows: Record<string, string>[],
  mapping: ColumnMapping
): Promise<ActionResult<ImportSummary>> {
  const { db, user } = await requireUser();

  try {
    if (!rows.length) return { ok: false, error: 'The file has no data rows.' };
    if (rows.length > MAX_IMPORT_ROWS) {
      return { ok: false, error: `Import up to ${MAX_IMPORT_ROWS} rows at a time.` };
    }

    const { leads, errors, duplicatesInFile } = buildLeads(rows, mapping);
    if (!leads.length) {
      return { ok: false, error: 'No valid leads found. Check the column mapping.' };
    }

    const importId = randomUUID();
    const imports = db.collection<any>('lead_imports');
    await imports.insertOne({
      _id: importId,
      user_id: user.id,
      file_name: fileName.slice(0, 200),
      total_rows: rows.length,
      created_count: 0,
      updated_count: 0,
      skipped_count: 0,
      created_at: new Date(),
    });

    const { created, updated } = await saveLeads(db, user.id, leads, importId);

    await imports.updateOne(
      { _id: importId, user_id: user.id },
      { $set: { created_count: created, updated_count: updated, skipped_count: errors.length } }
    );

    refreshLeadViews();
    revalidatePath('/import');

    return {
      ok: true,
      created,
      updated,
      skipped: errors.length,
      duplicatesInFile,
      errors: errors.slice(0, 25),
    };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Manually add a single lead from the form. */
export async function createLead(formData: FormData) {
  const { db, user } = await requireUser();

  const row: Record<string, string> = {};
  for (const field of IMPORT_FIELDS) row[field] = String(formData.get(field) ?? '');

  const result = normalizeRow(row, IDENTITY_MAPPING);
  if (!result.ok) {
    redirect(`/leads/new?error=${encodeURIComponent(result.reason)}`);
  }

  try {
    await saveLeads(db, user.id, [result.lead], null);
  } catch (e) {
    redirect(`/leads/new?error=${encodeURIComponent(toMessage(e))}`);
  }

  const saved = await db
    .collection<any>('leads')
    .findOne({ user_id: user.id, dedupe_key: result.lead.dedupe_key }, { projection: { _id: 1 } });

  refreshLeadViews();
  redirect(saved ? `/leads/${saved._id}` : '/leads');
}

/** Form action: update status and call notes. */
export async function updateLeadStatus(formData: FormData) {
  const { db, user } = await requireUser();

  const parsed = leadStatusSchema.safeParse({
    leadId: formData.get('leadId'),
    status: formData.get('status'),
    notes: String(formData.get('notes') ?? '').trim() || null,
  });
  if (!parsed.success) return;

  await db
    .collection<any>('leads')
    .updateOne(
      { _id: parsed.data.leadId, user_id: user.id },
      { $set: { status: parsed.data.status, notes: parsed.data.notes, updated_at: new Date() } }
    );

  refreshLeadViews(parsed.data.leadId);
}

/** Form action: delete a lead and its analysis and outreach. */
export async function deleteLead(formData: FormData) {
  const { db, user } = await requireUser();
  const leadId = String(formData.get('leadId') ?? '');
  if (!leadId) return;

  const { deletedCount } = await db.collection<any>('leads').deleteOne({ _id: leadId, user_id: user.id });
  if (deletedCount) {
    await Promise.all([
      db.collection<any>('lead_analyses').deleteOne({ _id: leadId, user_id: user.id }),
      db.collection<any>('lead_outreach').deleteOne({ _id: leadId, user_id: user.id }),
    ]);
  }

  refreshLeadViews();
  redirect('/leads');
}

export async function analyzeLeadAction(leadId: string): Promise<ActionResult> {
  const { db, user } = await requireUser();
  try {
    await analyzeLead(db, user.id, leadId);
    refreshLeadViews(leadId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function generateOutreachAction(leadId: string): Promise<ActionResult> {
  const { db, user } = await requireUser();
  try {
    await generateOutreach(db, user.id, leadId);
    refreshLeadViews(leadId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Fresh analysis followed by fresh outreach, in one step. */
export async function runPipelineAction(leadId: string): Promise<ActionResult> {
  const { db, user } = await requireUser();
  try {
    await analyzeLead(db, user.id, leadId);
    await generateOutreach(db, user.id, leadId);
    refreshLeadViews(leadId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}
