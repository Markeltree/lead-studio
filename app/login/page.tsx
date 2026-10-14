import { AlertCircle, ArrowRight, Mail, MessageSquareText, Sparkles } from 'lucide-react';
import { signIn } from './actions';
import { SubmitButton } from '@/components/SubmitButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/misc';

export const metadata = { title: 'Sign in' };

const FEATURES = [
  { icon: Sparkles, text: 'AI research on every lead: pain points, buying signals, fit score' },
  { icon: Mail, text: 'Personalized 4-step email sequences' },
  { icon: MessageSquareText, text: 'LinkedIn connection notes and follow-up DMs' },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-32 -top-32 size-[28rem] rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 size-[24rem] rounded-full bg-violet-600/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-white text-sm font-bold text-zinc-950">L</span>
          <span className="text-lg font-semibold tracking-tight">Lead Studio</span>
        </div>
        <div className="relative mt-auto max-w-md space-y-8">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            From a CSV of names to a ready-to-send outreach plan.
          </h2>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/10">
                  <Icon className="size-4" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your workspace.</p>
          </div>

          <form action={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" className="h-10" />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <span>{error}</span>
              </Alert>
            )}
            <SubmitButton label="Sign in" pendingLabel="Signing in…" size="lg" className="w-full" icon={<ArrowRight className="order-last" />} />
          </form>

          {/* <p className="text-center text-xs text-muted-foreground">
            No account? Create one with <code className="rounded bg-muted px-1 py-0.5 font-mono">npm run create-user</code>
          </p> */}
        </div>
      </section>
    </main>
  );
}
