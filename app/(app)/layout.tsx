import type { ReactNode } from 'react';
import { requireUser } from '@/lib/auth';
import { getSidebarData } from '@/lib/sidebar';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { db, user } = await requireUser();
  const data = await getSidebarData(db, user.id);

  return (
    <AppShell email={user.email} data={data}>
      {children}
    </AppShell>
  );
}
