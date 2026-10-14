import { z } from 'zod';
import { LEAD_STATUSES } from './types';

export const settingsSchema = z.object({
  company_name: z.string().max(120).nullable(),
  sender_name: z.string().max(120).nullable(),
  sender_title: z.string().max(120).nullable(),
  services_description: z.string().max(4000).nullable(),
  value_propositions: z.string().max(4000).nullable(),
  target_industries: z.string().max(500).nullable(),
  typical_deal_size: z.string().max(120).nullable(),
  tone: z.string().max(120).nullable(),
});

export const leadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(LEAD_STATUSES),
  notes: z.string().max(5000).nullable(),
});
