import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'MotoTrust',
  description: 'Transparent motorcycle servicing with pickup, proof, and digital history.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

