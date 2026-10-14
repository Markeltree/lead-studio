import { z } from 'zod';

const confidence = z.enum(['low', 'medium', 'high']);

/** Output of the lead analysis step (stored in lead_analyses). */
export const analysisSchema = z.object({
  company_summary: z.string().min(1),
  pain_points: z
    .array(z.object({ point: z.string(), evidence: z.string(), confidence }))
    .max(8),
  business_challenges: z.array(z.string()).max(8),
  motivations: z.array(z.string()).max(8),
  buying_signals: z
    .array(z.object({ signal: z.string(), strength: confidence, evidence: z.string() }))
    .max(10),
  decision_factors: z.array(z.string()).max(8),
  persuasion_strategies: z
    .array(z.object({ strategy: z.string(), why: z.string(), ethical_note: z.string() }))
    .max(6),
  service_fit: z.string().min(1),
  fit_score: z.number().int().min(0).max(100),
  data_gaps: z.array(z.string()).max(8),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

/** Output of the outreach step (stored in lead_outreach). */
export const outreachSchema = z.object({
  email_sequence: z
    .array(
      z.object({
        step: z.number().int().min(1),
        day_offset: z.number().int().min(0),
        purpose: z.string(),
        subject: z.string().min(1).max(200),
        body: z.string().min(1),
      })
    )
    .min(3)
    .max(5),
  sales_pitch: z.object({
    approach_summary: z.string(),
    problems_to_highlight: z.array(z.string()).max(5),
    value_proposition: z.string(),
    positioning: z.string(),
    best_call_to_action: z.string(),
  }),
  outreach_strategy: z.object({
    best_angle: z.string(),
    channel: z.string(),
    timing: z.string(),
    opening_lines: z.array(z.string()).max(5),
    talking_points: z.array(z.string()).max(6),
    objections: z
      .array(z.object({ objection: z.string(), response: z.string() }))
      .max(6),
  }),
  linkedin_messages: z.object({
    // LinkedIn caps invitation notes at 300 characters (200 on free accounts).
    connection_note: z.string().min(1).max(300),
    messages: z
      .array(
        z.object({
          step: z.number().int().min(1),
          day_offset: z.number().int().min(0),
          purpose: z.string(),
          message: z.string().min(1).max(1500),
        })
      )
      .min(2)
      .max(4),
  }),
});

export type OutreachResult = z.infer<typeof outreachSchema>;
