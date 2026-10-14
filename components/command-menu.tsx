'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { LayoutDashboard, Loader2, Plus, Search, Settings, Upload, Users } from 'lucide-react';
import { searchLeads, type LeadHit } from '@/app/actions/search';
import { LeadAvatar } from '@/components/page-header';
import { cn } from '@/lib/utils';

const PAGES = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'All leads', href: '/leads', icon: Users },
  { label: 'Add a lead', href: '/leads/new', icon: Plus },
  { label: 'Import CSV', href: '/import', icon: Upload },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const itemCls =
  'flex cursor-pointer select-none items-center gap-3 rounded-md px-2.5 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground';

/** Ctrl/⌘+K palette: jump to a lead or page. */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<LeadHit[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => startTransition(async () => setHits(await searchLeads(query))), 150);
    return () => clearTimeout(t);
  }, [query, open]);

  const pages = PAGES.filter((p) => !query || p.label.toLowerCase().includes(query.toLowerCase()));

  function go(href: string) {
    onOpenChange(false);
    setQuery('');
    router.push(href);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <Command shouldFilter={false} loop>
            <div className="flex items-center gap-2 border-b px-3">
              {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <Search className="size-4 text-muted-foreground" />}
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search leads or jump to a page…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">Esc</kbd>
            </div>
            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                {pending ? 'Searching…' : 'No results.'}
              </Command.Empty>

              {hits.length > 0 && (
                <Command.Group
                  heading={query ? 'Leads' : 'Recent leads'}
                  className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {hits.map((hit) => (
                    <Command.Item key={hit.id} value={`lead-${hit.id}`} onSelect={() => go(`/leads/${hit.id}`)} className={itemCls}>
                      <LeadAvatar name={hit.name} className="size-6 text-[10px]" />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{hit.name}</span>
                        {hit.subtitle && <span className="ml-2 text-muted-foreground">{hit.subtitle}</span>}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {pages.length > 0 && (
              <Command.Group
                heading="Go to"
                className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {pages.map(({ label, href, icon: Icon }) => (
                  <Command.Item key={href} value={`page-${href}`} onSelect={() => go(href)} className={itemCls}>
                    <Icon />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function SearchTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-9 w-full items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground',
        className
      )}
    >
      <Search className="size-4" />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl K</kbd>
    </button>
  );
}
