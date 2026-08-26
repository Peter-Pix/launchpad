import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Launchpad — app launcher',
  description: 'Central launcher for all your local apps. Auto-discovery, status, one-click start.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
