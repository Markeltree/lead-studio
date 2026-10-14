'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { settingsSchema } from '@/lib/validation';
import { toMessage } from '@/lib/utils';

const SETTINGS_FIELDS = [
  'company_name',
  'sender_name',
  'sender_title',
  'services_description',
  'value_propositions',
  'target_industries',
  'typical_deal_size',
  'tone',
] as const;

export async function saveSettings(formData: FormData) {
  const { db, user } = await requireUser();

  const raw = Object.fromEntries(
    SETTINGS_FIELDS.map((field) => [field, String(formData.get(field) ?? '').trim() || null])
  );

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    redirect('/settings?error=Please check the field lengths and try again.');
  }

  try {
    await db
      .collection<any>('user_settings')
      .updateOne(
        { _id: user.id },
        { $set: { user_id: user.id, ...parsed.data, updated_at: new Date() } },
        { upsert: true }
      );
  } catch (e) {
    redirect(`/settings?error=${encodeURIComponent(toMessage(e))}`);
  }

  revalidatePath('/', 'layout');
  redirect('/settings?saved=1');
}
