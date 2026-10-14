import { NextResponse, type NextRequest } from 'next/server';
import { getUser } from '@/lib/auth';
import { getDb, serialize } from '@/lib/mongodb';
import { toCsv } from '@/lib/csv';
import { exportColumns, exportRowFor } from '@/lib/export';
import { leadFilter } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/export?q=&status=&industry=&include=all|leads
 * Downloads the current filtered set as CSV. `include=leads` omits AI columns.
 */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const params = request.nextUrl.searchParams;
  const include = params.get('include') === 'leads' ? 'leads' : 'all';

  let data: Record<string, any>[];
  try {
    const db = await getDb();
    const leads = await db
      .collection<any>('leads')
      .find(
        leadFilter(user.id, {
          q: params.get('q'),
          status: params.get('status'),
          industry: params.get('industry'),
        })
      )
      .sort({ created_at: -1 })
      .limit(10000)
      .toArray();

    const byLead = { user_id: user.id, _id: { $in: leads.map((l) => l._id) } };
    const [analyses, outreach] =
      include === 'all'
        ? await Promise.all([
            db.collection<any>('lead_analyses').find(byLead).toArray(),
            db.collection<any>('lead_outreach').find(byLead).toArray(),
          ])
        : [[], []];
    const analysisById = new Map(analyses.map((a) => [a._id, a]));
    const outreachById = new Map(outreach.map((o) => [o._id, o]));

    data = leads.map((l) => ({
      ...serialize(l),
      lead_analyses: analysisById.get(l._id) ?? null,
      lead_outreach: outreachById.get(l._id) ?? null,
    }));
  } catch {
    return new NextResponse('Export failed.', { status: 500 });
  }

  const rows = data.map(exportRowFor);
  const csv = toCsv(rows, exportColumns(include));
  const filename = `leads-${include}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
