import { cn } from '@/lib/utils';

function tone(value: number) {
  if (value >= 70) return { text: 'text-emerald-600 dark:text-emerald-400', stroke: 'stroke-emerald-500', bg: 'bg-emerald-500' };
  if (value >= 40) return { text: 'text-amber-600 dark:text-amber-400', stroke: 'stroke-amber-500', bg: 'bg-amber-500' };
  return { text: 'text-zinc-500', stroke: 'stroke-zinc-400', bg: 'bg-zinc-400' };
}

/** Compact fit score: a small bar with the number. */
export function FitScore({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const t = tone(value);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-muted sm:block">
        <span className={cn('block h-full rounded-full', t.bg)} style={{ width: `${value}%` }} />
      </span>
      <span className={cn('text-xs font-semibold tabular-nums', t.text)}>{value}</span>
    </span>
  );
}

/** Large circular fit score for the lead header. */
export function FitRing({ value, size = 56 }: { value: number | null | undefined; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = value ?? 0;
  const t = tone(pct);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-muted" strokeWidth={5} fill="none" />
        {value != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            className={cn(t.stroke, 'transition-all duration-700')}
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (pct / 100) * c}
          />
        )}
      </svg>
      <span className={cn('absolute text-sm font-semibold tabular-nums', value == null ? 'text-muted-foreground' : t.text)}>
        {value ?? '—'}
      </span>
    </div>
  );
}
