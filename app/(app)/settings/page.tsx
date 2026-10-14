import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { saveSettings } from '@/app/actions/settings';
import { SubmitButton } from '@/components/SubmitButton';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/misc';

export const metadata = { title: 'Settings' };

type SP = { saved?: string; error?: string };
type Field = { name: string; label: string; hint: string; placeholder?: string; textarea?: boolean; required?: boolean };

const SECTIONS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: 'Company & sender',
    description: 'Who the outreach comes from.',
    fields: [
      { name: 'company_name', label: 'Your company', hint: 'Shown to prospects in emails.', placeholder: 'Acme Inc.' },
      { name: 'sender_name', label: 'Sender name', hint: 'Used to sign emails and messages.', placeholder: 'Jane Doe' },
      { name: 'sender_title', label: 'Sender title', hint: 'Optional.', placeholder: 'Founder' },
    ],
  },
  {
    title: 'What you offer',
    description: 'The AI only makes claims supported by this text, so be specific.',
    fields: [
      {
        name: 'services_description',
        label: 'What you sell',
        hint: 'Required for AI analysis. Services, who they are for, and the main outcome.',
        placeholder: 'We help B2B companies book more sales meetings through LinkedIn outreach, cold email and CRM setup…',
        textarea: true,
        required: true,
      },
      {
        name: 'value_propositions',
        label: 'Value propositions & proof',
        hint: 'Outcomes you deliver. Include only claims you can back up.',
        placeholder: 'Clients typically see… We have worked with…',
        textarea: true,
      },
    ],
  },
  {
    title: 'Audience & voice',
    description: 'Shapes targeting and how messages sound.',
    fields: [
      { name: 'target_industries', label: 'Target industries', hint: 'Comma-separated.', placeholder: 'SaaS, Logistics, Manufacturing' },
      { name: 'typical_deal_size', label: 'Typical deal size', hint: 'Optional, for context.', placeholder: '$1,000–3,000 / month' },
      { name: 'tone', label: 'Writing tone', hint: 'e.g. “warm and direct”.', placeholder: 'Warm, professional and direct' },
    ],
  },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { db, user } = await requireUser();

  const data = (await db.collection<any>('user_settings').findOne({ _id: user.id })) as Record<string, string | null> | null;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <PageHeader title="Settings" description="This business context shapes every analysis, email, LinkedIn message and pitch the AI writes." />

      {sp.saved && (
        <Alert variant="success">
          <CheckCircle2 />
          <span>Settings saved.</span>
        </Alert>
      )}
      {sp.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <span>{sp.error}</span>
        </Alert>
      )}
      {!data?.services_description && !sp.error && (
        <Alert className="border-brand/30 bg-brand/5">
          <AlertCircle className="text-brand" />
          <span>Fill in <strong>What you sell</strong> before generating AI insights.</span>
        </Alert>
      )}

      <form action={saveSettings} className="space-y-6">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {section.fields.map((f) => (
                <div key={f.name} className={f.textarea ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
                  <Label htmlFor={f.name}>
                    {f.label}
                    {f.required && <span className="ml-0.5 text-brand">*</span>}
                  </Label>
                  {f.textarea ? (
                    <Textarea id={f.name} name={f.name} rows={5} defaultValue={data?.[f.name] ?? ''} placeholder={f.placeholder} />
                  ) : (
                    <Input id={f.name} name={f.name} defaultValue={data?.[f.name] ?? ''} placeholder={f.placeholder} />
                  )}
                  <p className="text-xs text-muted-foreground">{f.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="sticky bottom-4 z-10 flex justify-end">
          <div className="rounded-lg border bg-background/80 p-2 shadow-lg backdrop-blur">
            <SubmitButton label="Save settings" pendingLabel="Saving…" icon={<Save />} />
          </div>
        </div>
      </form>
    </div>
  );
}
