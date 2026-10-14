import Link from 'next/link';
import { ArrowUpRight, FileSpreadsheet, MessagesSquare, Plus, Send, Sparkles, Upload, Users } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { LEAD_STATUSES, STATUS_LABELS } from '@/lib/types';
import { serialize } from '@/lib/mongodb';
import { formatDate, cn } from '@/lib/utils';
import { FitScore } from '@/components/FitScore';
import { STATUS_DOT } from '@/components/StatusBadge';
import { EmptyState, LeadAvatar, PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const { db, user } = await requireUser();
  const mine = { user_id: user.id };

  const [total, analyzed, withOutreach, byStatus, importDocs, topAnalyses] = await Promise.all([
    db.collection('leads').countDocuments(mine),
    db.collection('lead_analyses').countDocuments(mine),
    db.collection('lead_outreach').countDocuments(mine),
    db
      .collection('leads')
      .aggregate<{ _id: string; count: number }>([{ $match: mine }, { $group: { _id: '$status', count: { $sum: 1 } } }])
      .toArray(),
    db.collection('lead_imports').find(mine).sort({ created_at: -1 }).limit(5).toArray(),
    db.collection<any>('lead_analyses').find(mine, { projection: { fit_score: 1 } }).sort({ fit_score: -1 }).limit(5).toArray(),
  ]);

  const statusCounts = LEAD_STATUSES.map((status) => ({
    status,
    count: byStatus.find((s) => s._id === status)?.count ?? 0,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count));
  const inConversation = statusCounts
    .filter((s) => s.status === 'replied' || s.status === 'meeting')
    .reduce((n, s) => n + s.count, 0);

  const recentImports = importDocs.map((d) => serialize(d)!);

  const topLeads = await db
    .collection<any>('leads')
    .find(
      { user_id: user.id, _id: { $in: topAnalyses.map((a) => a._id) } },
      { projection: { full_name: 1, title: 1, company: 1 } }
    )
    .toArray();
  const topFits = topAnalyses
    .map((a) => ({ fit_score: a.fit_score as number, lead: serialize(topLeads.find((l) => l._id === a._id)) }))
    .filter((row) => row.lead);

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const stats = [
    { label: 'Total leads', value: total, hint: 'in your workspace', icon: Users },
    { label: 'Analyzed', value: analyzed, hint: `${pct(analyzed)}% of leads`, icon: Sparkles },
    { label: 'Outreach ready', value: withOutreach, hint: `${pct(withOutreach)}% of leads`, icon: Send },
    { label: 'In conversation', value: inConversation, hint: 'replied or meeting', icon: MessagesSquare },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your pipeline at a glance."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/import"><Upload /> Import CSV</Link>
            </Button>
            <Button asChild>
              <Link href="/leads/new"><Plus /> Add lead</Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </Card>
        ))}
      </section>

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={<FileSpreadsheet />}
            title="No leads yet"
            description="Import a CSV export from Sales Navigator or your CRM, or add a lead by hand."
            action={
              <div className="flex gap-2">
                <Button asChild><Link href="/import"><Upload /> Import CSV</Link></Button>
                <Button variant="outline" asChild><Link href="/leads/new"><Plus /> Add lead</Link></Button>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Pipeline</CardTitle>
              <CardDescription>Leads by status. Click a row to filter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {statusCounts.map(({ status, count }) => (
                <Link
                  key={status}
                  href={`/leads?status=${status}`}
                  className="group grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span className={cn('size-2 rounded-full', STATUS_DOT[status])} />
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn('block h-full rounded-full opacity-80 transition-all group-hover:opacity-100', STATUS_DOT[status])}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </span>
                  <span className="text-right text-sm font-medium tabular-nums">{count}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Best fit</CardTitle>
                  <CardDescription>Highest AI fit scores</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/leads">All <ArrowUpRight /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                {!topFits.length ? (
                  <p className="text-sm text-muted-foreground">No analyses yet. Open a lead and click Generate.</p>
                ) : (
                  <ul className="-mx-2 space-y-0.5">
                    {topFits.map(({ fit_score, lead }: any) => (
                      <li key={lead.id}>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
                        >
                          <LeadAvatar name={lead.full_name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{lead.full_name ?? 'Unnamed lead'}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[lead.title, lead.company].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          <FitScore value={fit_score} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent imports</CardTitle>
              </CardHeader>
              <CardContent>
                {!recentImports.length ? (
                  <p className="text-sm text-muted-foreground">No imports yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {recentImports.map((imp: any) => (
                      <li key={imp.id} className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-muted/50">
                          <FileSpreadsheet className="size-4 text-muted-foreground" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{imp.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(imp.created_at)} · {imp.created_count} new · {imp.updated_count} updated
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
