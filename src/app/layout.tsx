// apps/web/src/app/layout.tsx
// Self-hosted fonts via next/font/google — zero external DNS, no FOUT.

import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from 'next/font/google';
import Script                            from 'next/script';
import { AuthProvider }                  from '@/lib/context/AuthContext';
import { CareerOSProvider }              from '@/lib/context/CareerOSContext';
import AppShell                          from '@/components/ui/AppShell';
import ToastManager                      from '@/components/ui/ToastManager';
import { QueryProvider }                 from '@/lib/query/client';
import FetchInterceptorInstaller         from '@/components/ui/FetchInterceptorInstaller';

// ✅ Fix
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

const inter = Inter({
  subsets: ['latin'], weight: ['400','500','600','700'],
  variable: '--font-body', display: 'swap', preload: true,
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'], weight: ['400','500','600'],
  variable: '--font-mono', display: 'swap', preload: false,
});

export const metadata: Metadata = {
  title:       { default: 'PinIT Career OS', template: '%s · PinIT' },
  description: 'AI-powered career intelligence. Build your Career DNA, ace ATS, complete missions, and get hired faster.',
  keywords:    ['career','AI resume','ATS score','career DNA','job matching','interview prep'],
  openGraph:   { type:'website', siteName:'PinIT Career OS', title:'PinIT — The AI Career Operating System' },
  twitter:     { card:'summary_large_image', title:'PinIT — The AI Career Operating System' },
};
export const viewport: Viewport = { width:'device-width', initialScale:1, themeColor:'#4f46e5' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%234f46e5'/><text y='.9em' font-size='60' x='15' fill='white' font-family='sans-serif' font-weight='800'>Pi</text></svg>" />
      </head>
      <body>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <FetchInterceptorInstaller />
        <QueryProvider>
          <AuthProvider>
            <CareerOSProvider>
              <AppShell>{children}</AppShell>
              <ToastManager />
            </CareerOSProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
