import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI API Hub - Universal AI Connector Platform',
  description: 'Configure dynamic AI API connectors with real HTTP POST endpoints.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans antialiased">
        <Navbar />
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
