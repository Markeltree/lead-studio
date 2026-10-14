import 'server-only';
import type { Db } from 'mongodb';
import { serialize } from './mongodb';
import { askClaudeJson } from './claude';
import {
  analysisSchema,
  outreachSchema,
  type AnalysisResult,
  type OutreachResult,
} from './ai-schemas';
import {
  ANALYSIS_SYSTEM,
  OUTREACH_SYSTEM,
  analysisUserPrompt,
  outreachUserPrompt,
} from './prompts';
import type { Lead, UserSettings } from './types';

async function loadLead(db: Db, userId: string, leadId: string): Promise<Lead> {
  const data = serialize<Lead>(await db.collection<any>('leads').findOne({ _id: leadId, user_id: userId }));
  if (!data) throw new Error('Lead not found.');
  return data;
}

async function loadSettings(db: Db, userId: string): Promise<UserSettings> {
  const data = await db.collection<any>('user_settings').findOne({ _id: userId });
  if (!data?.services_description) {
    throw new Error('Add your services description in Settings before running AI analysis.');
  }
  return data as UserSettings;
}

/** Step 1: analyze the lead and its company (pain points, signals, persuasion). */
export async function analyzeLead(
  db: Db,
  userId: string,
  leadId: string
): Promise<AnalysisResult> {
  const lead = await loadLead(db, userId, leadId);
  const settings = await loadSettings(db, userId);

  const { data, model } = await askClaudeJson({
    system: ANALYSIS_SYSTEM,
    user: analysisUserPrompt(lead, settings),
    schema: analysisSchema,
    maxTokens: 3000,
  });

  const now = new Date();
  await db.collection<any>('lead_analyses').replaceOne(
    { _id: leadId },
    { lead_id: leadId, user_id: userId, ...data, model, updated_at: now },
    { upsert: true }
  );

  await db
    .collection<any>('leads')
    .updateOne({ _id: leadId, user_id: userId }, { $set: { score: data.fit_score, updated_at: now } });

  return data;
}

/** Step 2: generate the email sequence, sales pitch, and outreach strategy. */
export async function generateOutreach(
  db: Db,
  userId: string,
  leadId: string
): Promise<OutreachResult> {
  const lead = await loadLead(db, userId, leadId);
  const settings = await loadSettings(db, userId);

  const findAnalysis = () => db.collection<any>('lead_analyses').findOne({ _id: leadId, user_id: userId });
  let analysisRow = await findAnalysis();

  // Outreach builds on the analysis, so run it first if it doesn't exist yet.
  if (!analysisRow) {
    await analyzeLead(db, userId, leadId);
    analysisRow = await findAnalysis();
  }
  if (!analysisRow) throw new Error('Analysis is required before generating outreach.');

  const { data, model } = await askClaudeJson({
    system: OUTREACH_SYSTEM,
    user: outreachUserPrompt(lead, settings, analysisRow as AnalysisResult),
    schema: outreachSchema,
    maxTokens: 8000,
  });

  await db.collection<any>('lead_outreach').replaceOne(
    { _id: leadId },
    {
      lead_id: leadId,
      user_id: userId,
      email_sequence: data.email_sequence,
      sales_pitch: data.sales_pitch,
      outreach_strategy: data.outreach_strategy,
      linkedin_messages: data.linkedin_messages,
      model,
      updated_at: new Date(),
    },
    { upsert: true }
  );

  return data;
}
