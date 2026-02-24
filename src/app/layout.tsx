import type { Metadata } from 'next';
import { Playfair_Display, Caveat } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import SkyBackground from '@/components/SkyBackground';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Admin — Made in Heaven Mezuzahs',
  description: 'Admin panel for managing the mezuzah collection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${caveat.variable} antialiased`}>
        <SkyBackground />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
