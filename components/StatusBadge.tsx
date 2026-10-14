import { STATUS_LABELS, type LeadStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export const STATUS_DOT: Record<LeadStatus, string> = {
  new: 'bg-zinc-400',
  researching: 'bg-amber-500',
  contacted: 'bg-sky-500',
  replied: 'bg-violet-500',
  meeting: 'bg-indigo-500',
  won: 'bg-emerald-500',
  lost: 'bg-rose-500',
  do_not_contact: 'bg-zinc-900 dark:bg-zinc-100',
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-background px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', STATUS_DOT[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
