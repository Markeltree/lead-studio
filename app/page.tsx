import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Check,
  Download,
  FileSpreadsheet,
  Mail,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react';
import { getUser } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: { absolute: 'Lead Studio: AI research and outreach for every lead' },
  description:
    'Import your Sales Navigator or CRM leads, let Claude research each prospect, and get email sequences, pitches, and LinkedIn messages ready to send.',
};

const STEPS = [
  { icon: Upload, title: 'Import', text: 'Upload a Sales Navigator or CRM export. Columns are detected and duplicates merged.' },
  { icon: Sparkles, title: 'Analyze', text: 'Claude studies each lead and company: pain points, buying signals, and a fit score.' },
  { icon: Mail, title: 'Prepare outreach', text: 'Get a 4-step email sequence, a sales pitch, a strategy, and LinkedIn messages.' },
  { icon: Download, title: 'Export & track', text: 'Copy or export everything to CSV and track each lead through your pipeline.' },
];

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: 'CSV import with column mapping',
    text: 'Preview rows, adjust the mapping, and re-import updated exports without losing your notes or AI output.',
  },
  {
    icon: Target,
    title: 'Lead and company analysis',
    text: 'Pain points, challenges, motivations, decision factors, and a fit score grounded in the data you provide.',
  },
  {
    icon: Mail,
    title: 'Personalized email sequences',
    text: 'Four emails on day 0, 3, 7, and 14, written in your tone, each with a clear opt-out line.',
  },
  {
    icon: BarChart3,
    title: 'Sales pitch and strategy',
    text: 'Best angle, channel, and timing, plus opening lines, talking points, and answers to likely objections.',
  },
  {
    icon: MessageSquareText,
    title: 'LinkedIn messages',
    text: 'A connection note under 200 characters and three follow-up DMs, each one click to copy.',
  },
  {
    icon: Search,
    title: 'Search, filter, export',
    text: 'Find leads by name, company, status, or score. Export full data or a contacts-only list.',
  },
];

const PRINCIPLES = [
  'No scraping. Leads come from your own exports.',
  'No invented facts, false urgency, or fake social proof.',
  'Every AI reply is validated before it is saved.',
  'Your data stays scoped to your account.',
];

export default async function HomePage() {
  const user = await getUser();
  const cta = user
    ? { href: '/dashboard', label: 'Open dashboard' }
    : { href: '/login', label: 'Get started' };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">L</span>
            <span className="font-semibold tracking-tight">Lead Studio</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#principles" className="hover:text-foreground">Principles</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!user && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
            <div className="animate-fade-in space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-brand" />
                Powered by Claude
              </span>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                From a CSV of names to a ready-to-send outreach plan.
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground">
                Import your leads, let AI research every prospect, and get email sequences, pitches, and LinkedIn
                messages written for each one.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="brand" size="lg">
                  <Link href={cta.href}>
                    {cta.label}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
            </div>

            <LeadPreview />
          </div>
        </section>

        <section id="how" className="scroll-mt-14 border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHeading eyebrow="How it works" title="Four steps from export to first message" />
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="rounded-lg border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                      <Icon className="size-4" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-14 border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHeading eyebrow="Features" title="Everything you need to prepare outreach" />
            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-card p-6">
                  <Icon className="size-5 text-brand" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="principles" className="scroll-mt-14 border-t bg-muted/40">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div className="space-y-4">
              <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand">
                <ShieldCheck className="size-5" />
              </span>
              <h2 className="text-3xl font-semibold tracking-tight">Persuasive, not pushy</h2>
              <p className="text-muted-foreground">
                The AI is instructed to write honest, relevant outreach. You review every message before it goes
                out, and the <span className="font-medium text-foreground">Do not contact</span> status keeps
                opt-outs respected.
              </p>
            </div>
            <ul className="space-y-3">
              {PRINCIPLES.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl bg-zinc-950 px-6 py-14 text-center text-white sm:px-12">
              <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-violet-600/30 blur-3xl" />
              <div className="relative space-y-5">
                <h2 className="text-3xl font-semibold tracking-tight">Spend your time on conversations, not research.</h2>
                <p className="mx-auto max-w-xl text-zinc-300">
                  Bring your next lead list and have a personalized plan for each prospect in under a minute.
                </p>
                <Button asChild size="lg" className="bg-white text-zinc-950 hover:bg-white/90">
                  <Link href={cta.href}>
                    {cta.label}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Lead Studio</span>
          <span>Built with Next.js, MongoDB, and Claude</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl space-y-2">
      <p className="text-sm font-medium text-brand">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

/** A static mock of the lead detail view, illustrating what the AI produces. */
function LeadPreview() {
  return (
    <div className="relative animate-fade-in [animation-delay:150ms]" aria-hidden>
      <div className="rounded-xl border bg-card shadow-2xl shadow-brand/10">
        <div className="flex items-center gap-1.5 border-b px-4 py-3">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand">AK</span>
              <div>
                <p className="font-semibold">Ayesha Khan</p>
                <p className="text-sm text-muted-foreground">Head of Growth · Example Logistics</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">82</p>
              <p className="text-xs text-muted-foreground">Fit score</p>
            </div>
          </div>

          <div className="flex gap-1 rounded-md bg-muted p-1 text-xs font-medium">
            {['Analysis', 'Emails', 'Pitch', 'LinkedIn'].map((t, i) => (
              <span
                key={t}
                className={i === 0 ? 'flex-1 rounded bg-background py-1.5 text-center shadow-sm' : 'flex-1 py-1.5 text-center text-muted-foreground'}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pain points</p>
            {['Manual lead qualification slows the team', 'Low reply rates on generic outreach', 'Expanding into two new regions'].map((p) => (
              <div key={p} className="flex items-center gap-2 text-sm">
                <span className="size-1.5 rounded-full bg-brand" />
                {p}
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Mail className="size-3.5" /> Email 1 · Day 0
            </p>
            <p className="mt-1.5">
              Hi Ayesha, I saw Example Logistics is expanding into new regions. Teams at that stage often find…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
