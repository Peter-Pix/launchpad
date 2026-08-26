import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Launchpad — rozcestník aplikací',
  description: 'Centrální rozcestník pro všechny lokální aplikace. Auto-discovery, status, spuštění jedním klikem.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
