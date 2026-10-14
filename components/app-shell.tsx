'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState, type ReactNode } from 'react';
import { Check, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Sparkles, Upload, Users } from 'lucide-react';
import { signOut } from '@/app/login/actions';
import type { SidebarData } from '@/lib/sidebar';
import { STATUS_LABELS, type LeadStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme';
import { CommandMenu, SearchTrigger } from '@/components/command-menu';
import { LeadAvatar } from '@/components/page-header';
import { STATUS_DOT } from '@/components/StatusBadge';
import { cn, initials } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users, count: 'total' as const },
  { href: '/import', label: 'Import CSV', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// Lost and Do-not-contact only appear once they have leads.
const PIPELINE: LeadStatus[] = ['new', 'researching', 'contacted', 'replied', 'meeting', 'won', 'lost', 'do_not_contact'];
const ALWAYS_SHOWN = new Set<LeadStatus>(['new', 'researching', 'contacted', 'replied', 'meeting', 'won']);

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-violet-500 text-[13px] font-bold text-white shadow-sm shadow-brand/30">
        L
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Lead Studio</span>
    </Link>
  );
}

function GroupLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2.5 pb-1 pt-5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">{children}</span>
      {action}
    </div>
  );
}

const itemCls = (active: boolean) =>
  cn(
    'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
    active
      ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  );

function Count({ value }: { value: number }) {
  return <span className="ml-auto text-xs tabular-nums text-muted-foreground">{value}</span>;
}

function NavLinks({ data, onNavigate }: { data: SidebarData; onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon, count }) => {
        const active =
          href === '/leads'
            ? (pathname === '/leads' && !params.get('status')) || /^\/leads\/(?!new)/.test(pathname)
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} onClick={onNavigate} className={itemCls(active)}>
            <Icon className={cn('size-4', active ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground')} />
            {label}
            {count && <Count value={data.total} />}
          </Link>
        );
      })}
    </nav>
  );
}

function PipelineLinks({ data, onNavigate }: { data: SidebarData; onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = useSearchParams().get('status');
  return (
    <div className="flex flex-col gap-0.5">
      {PIPELINE.filter((s) => ALWAYS_SHOWN.has(s) || data.statusCounts[s] > 0).map((status) => (
        <Link
          key={status}
          href={`/leads?status=${status}`}
          onClick={onNavigate}
          className={itemCls(pathname === '/leads' && current === status)}
        >
          <span className="grid size-4 place-items-center">
            <span className={cn('size-2 rounded-full', STATUS_DOT[status])} />
          </span>
          {STATUS_LABELS[status]}
          <Count value={data.statusCounts[status]} />
        </Link>
      ))}
    </div>
  );
}

function RecentLeads({ data, onNavigate }: { data: SidebarData; onNavigate?: () => void }) {
  const pathname = usePathname();
  if (!data.recent.length) {
    return <p className="px-2.5 py-1.5 text-xs text-muted-foreground">Leads you add or update show up here.</p>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {data.recent.map((lead) => (
        <Link
          key={lead.id}
          href={`/leads/${lead.id}`}
          onClick={onNavigate}
          className={itemCls(pathname === `/leads/${lead.id}`)}
        >
          <LeadAvatar name={lead.name} className="size-5 text-[9px]" />
          <span className="min-w-0 flex-1 truncate">{lead.name}</span>
        </Link>
      ))}
    </div>
  );
}

/** Onboarding checklist until setup is done, then an AI coverage meter. */
function ProgressCard({ data, onNavigate }: { data: SidebarData; onNavigate?: () => void }) {
  const steps = [
    { done: data.hasSettings, label: 'Describe what you sell', href: '/settings' },
    { done: data.total > 0, label: 'Import your leads', href: '/import' },
    { done: data.analyzed > 0, label: 'Generate first insights', href: '/leads' },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  if (doneCount < steps.length) {
    return (
      <div className="rounded-lg border bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Get started</p>
          <span className="text-xs tabular-nums text-muted-foreground">{doneCount}/{steps.length}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
        <ul className="mt-3 space-y-1">
          {steps.map((s) => (
            <li key={s.label}>
              <Link
                href={s.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 rounded px-1 py-0.5 text-xs transition-colors hover:bg-accent',
                  s.done ? 'text-muted-foreground line-through' : 'text-foreground'
                )}
              >
                <span
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded-full border',
                    s.done && 'border-brand bg-brand text-brand-foreground'
                  )}
                >
                  {s.done && <Check className="size-2.5" />}
                </span>
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const pct = data.total ? Math.round((data.analyzed / data.total) * 100) : 0;
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-brand" />
        <p className="text-sm font-medium">AI coverage</p>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-violet-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {data.analyzed} of {data.total} analyzed · {data.withOutreach} outreach ready
      </p>
    </div>
  );
}

function UserFooter({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg p-1.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
        {initials(email.split('@')[0].replace(/[._-]/g, ' '))}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={email}>
        {email}
      </span>
      <ThemeToggle />
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sign out" title="Sign out">
          <LogOut />
        </Button>
      </form>
    </div>
  );
}

function SidebarBody({
  email,
  data,
  onSearch,
  onNavigate,
}: {
  email: string;
  data: SidebarData;
  onSearch: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <Logo />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" asChild aria-label="Add lead">
              <Link href="/leads/new" onClick={onNavigate}><Plus /></Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Add lead</TooltipContent>
        </Tooltip>
      </div>

      <SearchTrigger onClick={onSearch} className="mt-4" />

      <div className="-mx-1 mt-3 flex-1 overflow-y-auto px-1">
        <Suspense>
          <NavLinks data={data} onNavigate={onNavigate} />
          {data.total > 0 && (
            <>
              <GroupLabel>Pipeline</GroupLabel>
              <PipelineLinks data={data} onNavigate={onNavigate} />
            </>
          )}
        </Suspense>
        <GroupLabel>Recent</GroupLabel>
        <RecentLeads data={data} onNavigate={onNavigate} />
      </div>

      <div className="mt-3 space-y-2">
        <ProgressCard data={data} onNavigate={onNavigate} />
        <UserFooter email={email} />
      </div>
    </>
  );
}

export function AppShell({ email, data, children }: { email: string; data: SidebarData; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = () => {
    setOpen(false);
    setSearchOpen(true);
  };

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-3 md:flex">
        <SidebarBody email={email} data={data} onSearch={openSearch} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
          <Logo />
          <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={openSearch} aria-label="Search">
            <Search />
          </Button>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent className="bg-sidebar p-3">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody email={email} data={data} onSearch={openSearch} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

