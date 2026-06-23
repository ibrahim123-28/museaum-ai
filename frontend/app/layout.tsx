import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aetherium Museum',
  description: 'Interactive Futuristic Museum Ticketing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<ClerkProvider appearance={{
      variables: { colorPrimary: '#10b981' } 
    }}>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}