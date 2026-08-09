import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';
import TwemojiLoader from '@/components/TwemojiLoader';
import SharedHeader from '@/components/SharedHeader';
import SharedFooter from '@/components/SharedFooter';
import BottomNav from '@/components/BottomNav';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
});

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata = {
  title: "The Club — Vivez la Côte d'Azur autrement.",
  description: "Restaurants, escapades, bien-être, sorties et expériences sélectionnés pour les membres The Club.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Club",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <SharedHeader />
        <div className="pt-16 pb-16 lg:pb-0">
          {children}
        </div>
        <SharedFooter />
        <BottomNav />
        <TwemojiLoader />
      </body>
    </html>
  );
}