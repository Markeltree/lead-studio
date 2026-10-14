import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist_Mono, Roboto } from 'next/font/google';
import { Providers } from '@/components/theme';
import './globals.css';

const sans = Roboto({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: { default: 'Lead Studio', template: '%s · Lead Studio' },
  description: 'Manage leads and prepare AI-assisted outreach.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
