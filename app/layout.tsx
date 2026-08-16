import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Launchpad — Peterovy aplikace',
  description: 'Centrální rozcestník pro všechny aplikace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
