'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, Search, X } from 'lucide-react';
import { LEAD_STATUSES, STATUS_LABELS } from '@/lib/types';
import { buildQuery, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Search and filters that update the URL as you type (debounced). */
export function LeadFilters({ industries }: { industries: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get('q') ?? '');
  const first = useRef(true);

  const status = params.get('status') ?? '';
  const industry = params.get('industry') ?? '';

  function push(next: Record<string, string>) {
    const merged = { q, status, industry, ...next };
    startTransition(() => router.replace(`${pathname}?${buildQuery(merged)}`, { scroll: false }));
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => push({ q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = Boolean(q || status || industry);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        {pending ? (
          <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, title, company, email…"
          className="pl-9"
          aria-label="Search leads"
        />
      </div>
      <div className="flex gap-2">
        <div className="w-full sm:w-40">
          <NativeSelect value={status} onChange={(e) => push({ status: e.target.value })} aria-label="Status">
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-full sm:w-44">
          <NativeSelect value={industry} onChange={(e) => push({ industry: e.target.value })} aria-label="Industry">
            <option value="">All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </NativeSelect>
        </div>
        {active && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear filters"
            onClick={() => {
              setQ('');
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
          >
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ExportMenu({ query }: { query: Record<string, string> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline"><Download /> Export</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Export filtered leads as CSV</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`/api/export?${buildQuery(query)}`}>
            <Download />
            <div>
              <p>All data</p>
              <p className="text-xs text-muted-foreground">Leads + AI analysis + outreach</p>
            </div>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`/api/export?${buildQuery({ ...query, include: 'leads' })}`}>
            <Download />
            <div>
              <p>Contacts only</p>
              <p className="text-xs text-muted-foreground">Plain contact list</p>
            </div>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Table row that navigates on click, while keeping real links inside it working. */
export function ClickableRow({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a,button')) return;
        router.push(href);
      }}
      className={cn('cursor-pointer border-b transition-colors hover:bg-muted/50', className)}
    >
      {children}
    </tr>
  );
}
