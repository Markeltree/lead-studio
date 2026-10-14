import Link from 'next/link';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { createLead } from '@/app/actions/leads';
import { SubmitButton } from '@/components/SubmitButton';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/misc';

export const metadata = { title: 'Add lead' };

type Field = { name: string; label: string; type?: string; full?: boolean; textarea?: boolean; placeholder?: string };

const SECTIONS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: 'Person',
    description: 'At least a name, LinkedIn URL, or email is required.',
    fields: [
      { name: 'first_name', label: 'First name', placeholder: 'Ayesha' },
      { name: 'last_name', label: 'Last name', placeholder: 'Khan' },
      { name: 'title', label: 'Job title', placeholder: 'Head of Operations' },
      { name: 'location', label: 'Location', placeholder: 'Lahore, Pakistan' },
      { name: 'linkedin_url', label: 'LinkedIn profile URL', full: true, placeholder: 'https://www.linkedin.com/in/…' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'name@company.com' },
      { name: 'phone', label: 'Phone', type: 'tel' },
    ],
  },
  {
    title: 'Company',
    description: 'Helps the AI tailor its analysis.',
    fields: [
      { name: 'company', label: 'Company', placeholder: 'Brightwave Logistics' },
      { name: 'industry', label: 'Industry', placeholder: 'Logistics and Supply Chain' },
      { name: 'company_size', label: 'Company size', placeholder: '201-500' },
      { name: 'website', label: 'Company website', placeholder: 'https://…' },
      { name: 'notes', label: 'Notes', full: true, textarea: true, placeholder: 'Anything you know: recent news, mutual connections, why they might need you…' },
    ],
  },
];

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/leads"><ArrowLeft /> All leads</Link>
      </Button>
      <PageHeader title="Add a lead" description="For prospects you found outside Sales Navigator." />

      <form action={createLead} className="space-y-6">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.fields.map((f) => (
                <div key={f.name} className={f.full ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
                  <Label htmlFor={f.name}>{f.label}</Label>
                  {f.textarea ? (
                    <Textarea id={f.name} name={f.name} rows={3} placeholder={f.placeholder} />
                  ) : (
                    <Input id={f.name} name={f.name} type={f.type ?? 'text'} placeholder={f.placeholder} />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <span>{error}</span>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/leads">Cancel</Link>
          </Button>
          <SubmitButton label="Save lead" pendingLabel="Saving…" icon={<Save />} />
        </div>
      </form>
    </div>
  );
}
