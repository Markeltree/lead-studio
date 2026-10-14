import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, SearchX, Upload, Users } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { leadFilter } from '@/lib/queries';
import { serialize } from '@/lib/mongodb';
import { buildQuery, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { FitScore } from '@/components/FitScore';
import { EmptyState, LeadAvatar, PageHeader } from '@/components/page-header';
import { ClickableRow, ExportMenu, LeadFilters } from '@/components/leads-toolbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const metadata = { title: 'Leads' };

const PAGE_SIZE = 25;

type SearchParams = { q?: string; status?: string; industry?: string; page?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { db, user } = await requireUser();

  const page = Math.max(1, Number(sp.page) || 1);
  const filters = { q: sp.q ?? '', status: sp.status ?? '', industry: sp.industry ?? '' };
  const filter = leadFilter(user.id, filters);
  const leadsCol = db.collection<any>('leads');

  const [leadDocs, total, industryValues, grandTotal] = await Promise.all([
    leadsCol
      .find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    leadsCol.countDocuments(filter),
    leadsCol.distinct('industry', { user_id: user.id, industry: { $ne: null } }),
    leadsCol.countDocuments({ user_id: user.id }),
  ]);

  const scores = await db
    .collection<any>('lead_analyses')
    .find({ user_id: user.id, _id: { $in: leadDocs.map((l) => l._id) } }, { projection: { fit_score: 1 } })
    .toArray();
  const scoreById = new Map(scores.map((a) => [a._id as string, a.fit_score as number]));

  const leads: any[] = leadDocs.map((d) => serialize(d)!);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const industries = (industryValues as string[]).filter(Boolean).sort();
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Leads"
        description={`${grandTotal} total · ${total} matching`}
        actions={
          <>
            <ExportMenu query={filters} />
            <Button asChild>
              <Link href="/leads/new"><Plus /> Add lead</Link>
            </Button>
          </>
        }
      />

      {grandTotal === 0 ? (
        <Card>
          <EmptyState
            icon={<Users />}
            title="No leads yet"
            description="Import a CSV from Sales Navigator or your CRM to get started."
            action={<Button asChild><Link href="/import"><Upload /> Import CSV</Link></Button>}
          />
        </Card>
      ) : (
        <>
          <LeadFilters industries={industries} />

          <Card className="overflow-hidden">
            {leads.length === 0 ? (
              <EmptyState icon={<SearchX />} title="No matches" description="Try a different search or clear the filters." />
            ) : (
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead className="hidden lg:table-cell">Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fit</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <ClickableRow key={lead.id} href={`/leads/${lead.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <LeadAvatar name={lead.full_name} />
                          <div className="min-w-0">
                            <Link href={`/leads/${lead.id}`} className="block truncate font-medium hover:underline">
                              {lead.full_name ?? 'Unnamed'}
                            </Link>
                            <p className="max-w-[16rem] truncate text-xs text-muted-foreground">{lead.title ?? lead.email ?? '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[14rem] truncate text-muted-foreground md:table-cell">{lead.company ?? '—'}</TableCell>
                      <TableCell className="hidden max-w-[12rem] truncate text-muted-foreground lg:table-cell">{lead.industry ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={lead.status} /></TableCell>
                      <TableCell><FitScore value={scoreById.get(lead.id) ?? null} /></TableCell>
                      <TableCell className="hidden whitespace-nowrap text-right text-xs text-muted-foreground sm:table-cell">
                        {formatDate(lead.created_at)}
                      </TableCell>
                    </ClickableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <nav className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {from}–{to} of {total}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Page {page} of {totalPages}</span>
              <Button variant="outline" size="icon-sm" asChild={page > 1} disabled={page <= 1} aria-label="Previous page">
                {page > 1 ? (
                  <Link href={`/leads?${buildQuery({ ...filters, page: page - 1 })}`}><ChevronLeft /></Link>
                ) : (
                  <ChevronLeft />
                )}
              </Button>
              <Button variant="outline" size="icon-sm" asChild={page < totalPages} disabled={page >= totalPages} aria-label="Next page">
                {page < totalPages ? (
                  <Link href={`/leads?${buildQuery({ ...filters, page: page + 1 })}`}><ChevronRight /></Link>
                ) : (
                  <ChevronRight />
                )}
              </Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
