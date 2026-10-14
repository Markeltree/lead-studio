import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/mongodb';
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from '@/lib/session';

/** The signed-in user from the session cookie, or null. */
export async function getUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/**
 * Returns the signed-in user and a database handle.
 * Redirects to /login when there is no session.
 * Call this OUTSIDE try/catch blocks: redirect() works by throwing.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/login');

  const db = await getDb();
  return { db, user };
}
