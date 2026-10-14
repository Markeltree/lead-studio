import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ExternalLink,
  Globe,
  Lightbulb,
  Linkedin,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
  Sparkles,
  Tag,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';
import { requireUser } from '@/lib/auth';
import type { Lead } from '@/lib/types';
import type { AnalysisResult, OutreachResult } from '@/lib/ai-schemas';
import { cn, formatDate } from '@/lib/utils';
import { serialize } from '@/lib/mongodb';
import { StatusBadge } from '@/components/StatusBadge';
import { FitRing } from '@/components/FitScore';
import { ActionButton } from '@/components/ActionButton';
import { CopyButton } from '@/components/CopyButton';
import { BulletList } from '@/components/BulletList';
import { EmptyState, LeadAvatar } from '@/components/page-header';
import { DeleteLeadButton, StatusForm } from '@/components/lead-forms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateOutreachAction, runPipelineAction } from '@/app/actions/leads';

// AI calls take 20-60s. Raise the limit on hosts that allow it (Vercel Pro).
export const maxDuration = 60;

type AnalysisRow = AnalysisResult & { model?: string | null; updated_at?: string };
type OutreachRow = Omit<OutreachResult, 'linkedin_messages'> & {
  linkedin_messages?: OutreachResult['linkedin_messages'];
  model?: string | null;
  updated_at?: string;
};

const LINKEDIN_NOTE_LIMIT = 200;

const LEVEL_STYLES: Record<string, string> = {
  high: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  low: 'border-border bg-muted text-muted-foreground',
};

function Level({ value, suffix }: { value: string; suffix: string }) {
  return (
    <Badge variant="outline" className={cn('font-normal', LEVEL_STYLES[value] ?? LEVEL_STYLES.low)}>
      {value} {suffix}
    </Badge>
  );
}

function Section({ title, icon, children, className }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold [&_svg]:size-4 [&_svg]:text-muted-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Step({ index, last, children }: { index: number; last: boolean; children: ReactNode }) {
  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span className="grid size-7 shrink-0 place-items-center rounded-full border bg-background text-xs font-semibold">{index}</span>
        {!last && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className={cn('min-w-0 flex-1', !last && 'pb-6')}>{children}</div>
    </li>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, user } = await requireUser();

  const [leadDoc, analysisDoc, outreachDoc] = await Promise.all([
    db.collection<any>('leads').findOne({ _id: id, user_id: user.id }),
    db.collection<any>('lead_analyses').findOne({ _id: id, user_id: user.id }),
    db.collection<any>('lead_outreach').findOne({ _id: id, user_id: user.id }),
  ]);

  const lead = serialize<Lead>(leadDoc);
  if (!lead) notFound();

  const analysis = serialize<AnalysisRow>(analysisDoc);
  const outreach = serialize<OutreachRow>(outreachDoc);
  const linkedin = outreach?.linkedin_messages;
  const name = lead.full_name ?? 'Unnamed lead';
  const href = (v: string) => (v.startsWith('http') ? v : `https://${v}`);

  const profileRows: { icon: ReactNode; label: string; value: string | null; link?: string }[] = [
    { icon: <Briefcase />, label: 'Title', value: lead.title },
    { icon: <Building2 />, label: 'Company', value: lead.company },
    { icon: <Tag />, label: 'Industry', value: lead.industry },
    { icon: <MapPin />, label: 'Location', value: lead.location },
    { icon: <Users />, label: 'Company size', value: lead.company_size },
    { icon: <Globe />, label: 'Website', value: lead.website, link: lead.website ? href(lead.website) : undefined },
    { icon: <Mail />, label: 'Email', value: lead.email, link: lead.email ? `mailto:${lead.email}` : undefined },
    { icon: <Phone />, label: 'Phone', value: lead.phone, link: lead.phone ? `tel:${lead.phone}` : undefined },
    { icon: <Linkedin />, label: 'LinkedIn', value: lead.linkedin_url, link: lead.linkedin_url ?? undefined },
  ];

  const generateButton = (
    <ActionButton
      action={runPipelineAction.bind(null, lead.id)}
      label={analysis ? 'Regenerate all' : 'Generate'}
      pendingLabel="Generating with AI… (30–60s)"
      successMessage="Analysis, emails and LinkedIn messages are ready"
      icon={<Sparkles />}
      variant="brand"
    />
  );

  return (
    <div className="animate-fade-in space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/leads"><ArrowLeft /> All leads</Link>
      </Button>

      <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <LeadAvatar name={lead.full_name} className="size-14 text-lg" />
          <div className="min-w-0 space-y-1.5">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="text-sm text-muted-foreground">
              {[lead.title, lead.company].filter(Boolean).join(' at ') || 'No title or company'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              {lead.industry && <Badge variant="secondary" className="font-normal">{lead.industry}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lead.linkedin_url && (
            <Button variant="outline" asChild>
              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin /> Profile</a>
            </Button>
          )}
          {analysis && (
            <ActionButton
              action={generateOutreachAction.bind(null, lead.id)}
              label="Rewrite outreach"
              pendingLabel="Writing outreach…"
              successMessage="New emails and LinkedIn messages are ready"
              icon={<RefreshCw />}
              variant="outline"
            />
          )}
          {generateButton}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        <div className="min-w-0 lg:col-span-2">
          {!analysis ? (
            <Card className="border-dashed">
              <EmptyState
                icon={<Sparkles />}
                title="No AI insights yet"
                description="Generate a full prospect analysis, a 4-step email sequence, LinkedIn connection note and DMs, a sales pitch and an outreach strategy."
                action={generateButton}
                className="py-20"
              />
            </Card>
          ) : (
            <Tabs defaultValue={outreach ? 'linkedin' : 'analysis'}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="analysis"><Lightbulb /> Analysis</TabsTrigger>
                <TabsTrigger value="linkedin"><Linkedin /> LinkedIn</TabsTrigger>
                <TabsTrigger value="emails"><Mail /> Emails</TabsTrigger>
                <TabsTrigger value="pitch"><Target /> Pitch & strategy</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis">
                <Card>
                  <CardContent className="space-y-8 p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">Company summary</h3>
                        {analysis.updated_at && <span className="text-xs text-muted-foreground">Updated {formatDate(analysis.updated_at)}</span>}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">{analysis.company_summary}</p>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4">
                      <h3 className="mb-1.5 text-sm font-semibold">Service fit</h3>
                      <p className="text-sm leading-relaxed text-foreground/90">{analysis.service_fit}</p>
                    </div>

                    <Section title="Likely pain points">
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {analysis.pain_points.map((p, i) => (
                          <li key={i} className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{p.point}</p>
                              <Level value={p.confidence} suffix="" />
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">{p.evidence}</p>
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <div className="grid gap-8 sm:grid-cols-2">
                      <Section title="Business challenges"><BulletList items={analysis.business_challenges} /></Section>
                      <Section title="Motivations"><BulletList items={analysis.motivations} /></Section>
                    </div>

                    <Section title="Buying signals">
                      <ul className="space-y-3">
                        {analysis.buying_signals.map((s, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Level value={s.strength} suffix="" />
                            <div className="text-sm">
                              <p className="font-medium">{s.signal}</p>
                              <p className="text-xs text-muted-foreground">{s.evidence}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <Section title="How they decide"><BulletList items={analysis.decision_factors} /></Section>

                    <Section title="Persuasion approach">
                      <ul className="space-y-3">
                        {analysis.persuasion_strategies.map((p, i) => (
                          <li key={i} className="rounded-lg border p-3 text-sm">
                            <p className="font-medium">{p.strategy}</p>
                            <p className="mt-1 text-muted-foreground">{p.why}</p>
                            <p className="mt-2 text-xs text-muted-foreground/80">Guardrail: {p.ethical_note}</p>
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <Section title="Unknowns to verify"><BulletList items={analysis.data_gaps} /></Section>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="linkedin" className="space-y-4">
                {!outreach ? (
                  <NoOutreach leadId={lead.id} />
                ) : !linkedin ? (
                  <Card className="border-dashed">
                    <EmptyState
                      icon={<Linkedin />}
                      title="No LinkedIn messages yet"
                      description="This outreach was generated before LinkedIn messages were added. Rewrite it to get a connection note and DMs."
                      action={
                        <ActionButton
                          action={generateOutreachAction.bind(null, lead.id)}
                          label="Rewrite outreach"
                          pendingLabel="Writing outreach…"
                          successMessage="LinkedIn messages are ready"
                          icon={<RefreshCw />}
                          variant="brand"
                        />
                      }
                    />
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                        <div className="space-y-1.5">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <UserPlus className="size-4 text-brand" /> Connection request note
                          </CardTitle>
                          <CardDescription>Paste this into &ldquo;Add a note&rdquo; when you send the invite.</CardDescription>
                        </div>
                        <CopyButton text={linkedin.connection_note} />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">{linkedin.connection_note}</p>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-xs tabular-nums',
                              linkedin.connection_note.length > LINKEDIN_NOTE_LIMIT ? 'text-amber-600' : 'text-muted-foreground'
                            )}
                          >
                            {linkedin.connection_note.length}/{LINKEDIN_NOTE_LIMIT} characters
                            {linkedin.connection_note.length > LINKEDIN_NOTE_LIMIT && ' · over the free-account limit (Premium allows 300)'}
                          </span>
                          {lead.linkedin_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                                Open profile <ExternalLink />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MessageSquareText className="size-4 text-brand" /> Follow-up messages
                        </CardTitle>
                        <CardDescription>Send these after they accept your invite.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ol>
                          {linkedin.messages.map((m, i) => (
                            <Step key={m.step} index={m.step} last={i === linkedin.messages.length - 1}>
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-normal">Day {m.day_offset}</Badge>
                                  <span className="text-sm font-medium">{m.purpose}</span>
                                </div>
                                <CopyButton text={m.message} />
                              </div>
                              <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">{m.message}</p>
                            </Step>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="emails">
                {!outreach ? (
                  <NoOutreach leadId={lead.id} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Email sequence</CardTitle>
                      <CardDescription>{outreach.email_sequence.length} emails, spaced over two weeks.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol>
                        {outreach.email_sequence.map((email, i) => {
                          const text = `Subject: ${email.subject}\n\n${email.body}`;
                          const mailto = lead.email
                            ? `mailto:${lead.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
                            : null;
                          return (
                            <Step key={email.step} index={email.step} last={i === outreach.email_sequence.length - 1}>
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-normal">Day {email.day_offset}</Badge>
                                  <span className="text-sm font-medium">{email.purpose}</span>
                                </div>
                                <div className="flex gap-1.5">
                                  {mailto && (
                                    <Button variant="ghost" size="sm" asChild className="h-7 px-2.5">
                                      <a href={mailto}><Mail /> Open</a>
                                    </Button>
                                  )}
                                  <CopyButton text={text} />
                                </div>
                              </div>
                              <div className="overflow-hidden rounded-lg border">
                                <p className="border-b bg-muted/40 px-4 py-2 text-sm">
                                  <span className="text-muted-foreground">Subject: </span>
                                  <span className="font-medium">{email.subject}</span>
                                </p>
                                <p className="whitespace-pre-wrap p-4 text-sm leading-relaxed">{email.body}</p>
                              </div>
                            </Step>
                          );
                        })}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="pitch" className="space-y-4">
                {!outreach ? (
                  <NoOutreach leadId={lead.id} />
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Sales pitch</CardTitle>
                        <CardDescription>{outreach.sales_pitch.approach_summary}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                          {[
                            ['Value proposition', outreach.sales_pitch.value_proposition],
                            ['Positioning', outreach.sales_pitch.positioning],
                            ['Call to action', outreach.sales_pitch.best_call_to_action],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-lg border bg-muted/30 p-4">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                              <p className="mt-2 text-sm leading-relaxed">{value}</p>
                            </div>
                          ))}
                        </div>
                        <Section title="Problems to highlight"><BulletList items={outreach.sales_pitch.problems_to_highlight} /></Section>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Outreach strategy</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                          {[
                            ['Best angle', outreach.outreach_strategy.best_angle],
                            ['Channel', outreach.outreach_strategy.channel],
                            ['Timing', outreach.outreach_strategy.timing],
                          ].map(([label, value]) => (
                            <div key={label} className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                              <p className="text-sm leading-relaxed">{value}</p>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="grid gap-8 sm:grid-cols-2">
                          <Section title="Opening lines"><BulletList items={outreach.outreach_strategy.opening_lines} /></Section>
                          <Section title="Talking points"><BulletList items={outreach.outreach_strategy.talking_points} /></Section>
                        </div>
                        <Section title="Objections & responses">
                          <ul className="space-y-3">
                            {outreach.outreach_strategy.objections.map((o, i) => (
                              <li key={i} className="rounded-lg border p-4 text-sm">
                                <p className="font-medium">&ldquo;{o.objection}&rdquo;</p>
                                <p className="mt-1.5 text-muted-foreground">{o.response}</p>
                              </li>
                            ))}
                          </ul>
                        </Section>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Review all AI output before sending. Re-run after changing your{' '}
            <Link href="/settings" className="underline underline-offset-2">Settings</Link> or this lead&apos;s details.
          </p>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <FitRing value={analysis?.fit_score} />
              <div className="space-y-1">
                <CardTitle className="text-base">Fit score</CardTitle>
                <CardDescription>
                  {analysis ? 'How well your services fit their needs' : 'Click Generate to score this lead'}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profileRows.map(({ icon, label, value, link }) => (
                <div key={label} className="flex items-start gap-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
                  {icon}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {value ? (
                      link ? (
                        <a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="block truncate hover:underline">
                          {value}
                        </a>
                      ) : (
                        <p className="truncate">{value}</p>
                      )
                    ) : (
                      <p className="text-muted-foreground/60">—</p>
                    )}
                  </div>
                </div>
              ))}
              <Separator />
              <p className="text-xs text-muted-foreground">Added {formatDate(lead.created_at)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status & notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusForm leadId={lead.id} status={lead.status} notes={lead.notes} />
              <DeleteLeadButton leadId={lead.id} name={name} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function NoOutreach({ leadId }: { leadId: string }) {
  return (
    <Card className="border-dashed">
      <EmptyState
        icon={<Sparkles />}
        title="No outreach yet"
        description="Write the email sequence, LinkedIn messages, pitch and strategy from this analysis."
        action={
          <ActionButton
            action={generateOutreachAction.bind(null, leadId)}
            label="Write outreach"
            pendingLabel="Writing outreach…"
            successMessage="Outreach is ready"
            icon={<Sparkles />}
            variant="brand"
          />
        }
      />
    </Card>
  );
}
