import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppTopBar } from '@/components/AppTopBar';
import { BottomNav } from '@/components/BottomNav';
import { GateSheet } from '@/components/GateSheet';
import { PaywallSheet } from '@/components/PaywallSheet';
import { Toast } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Centum - Tamil Nadu Board Question Papers & Tests',
  description: 'Tamil Nadu State Board 10th and 12th question papers, model papers, books, and chapter tests.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7C3AED',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('centum_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] antialiased min-h-screen flex justify-center transition-colors">
        <AppProvider>
          {/* Mobile frame wrapper */}
          <div className="w-full max-w-md min-h-screen flex flex-col bg-[#FAF5FF] dark:bg-[#230542] relative pb-20 shadow-2xl sm:border-x sm:border-[#EDE9FE] dark:sm:border-[#DDD6FE]/20 transition-colors">
            <AppTopBar />
            <main className="flex-1 flex flex-col">{children}</main>
            <BottomNav />
            <GateSheet />
            <PaywallSheet />
            <Toast />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
