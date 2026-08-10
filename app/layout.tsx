import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'METIQ - Crypto Meta Intelligence',
  description: 'Detect emerging crypto narratives before they become obvious. Automatic reports every six hours, delivered directly to Telegram.',
  keywords: ['crypto', 'narratives', 'crypto meta', 'trading', 'dexscreener', 'telegram bot', 'signals', 'memes', 'ai agents'],
  authors: [{ name: 'Baki', url: 'https://x.com/bakixdo' }],
  icons: {
    icon: '/icon.jpg',
    apple: '/icon.jpg',
  },
  openGraph: {
    title: 'METIQ - Crypto Meta Intelligence',
    description: 'Detect emerging crypto narratives before they become obvious. Automatic reports every six hours, delivered directly to Telegram.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'METIQ - Crypto Meta Intelligence',
    description: 'Detect emerging crypto narratives before they become obvious. Automatic reports every six hours, delivered directly to Telegram.',
    creator: '@bakixdo',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
