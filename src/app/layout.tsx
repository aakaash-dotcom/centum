import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { GateSheet } from '@/components/GateSheet';
import { Toast } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Centum - Tamil Nadu Board Question Papers & Tests',
  description: 'Tamil Nadu State Board 10th and 12th question papers, model papers, books, and chapter tests.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FAF5FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FAF5FF] text-[#2E1065] antialiased min-h-screen flex justify-center">
        <AppProvider>
          {/* Mobile frame wrapper */}
          <div className="w-full max-w-md min-h-screen flex flex-col bg-[#FAF5FF] relative pb-20 shadow-2xl sm:border-x sm:border-[#EDE9FE]">
            <main className="flex-1 flex flex-col">{children}</main>
            <BottomNav />
            <GateSheet />
            <Toast />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
