import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { SmoothScrollProvider } from '@/components/ui/SmoothScrollProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Coca‑Cola — Taste The Feeling | Premium 3D Experience',
  description:
    'Experience the world\'s most iconic refreshment through a next‑generation digital journey. A hyper‑realistic 3D tribute to Coca‑Cola.',
  keywords: [
    'Coca-Cola',
    '3D',
    'Three.js',
    'R3F',
    'luxury',
    'premium experience',
    'WebGL',
  ],
  openGraph: {
    title: 'Coca‑Cola — Taste The Feeling',
    description:
      'A next‑generation 3D digital experience by Coca‑Cola. Cinematic, luxurious, unforgettable.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#060606',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <SmoothScrollProvider>
          <div className="grain-overlay" />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
