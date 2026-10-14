export function BulletList({ items }: { items: string[] | null | undefined }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">None identified.</p>;

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand/60" />
          <span className="text-foreground/90">{item}</span>
        </li>
      ))}
    </ul>
  );
}
