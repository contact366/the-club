import { Inter } from 'next/font/google';
import './globals.css';
import TwemojiLoader from '@/components/TwemojiLoader';
import SharedHeader from '@/components/SharedHeader';
import SharedFooter from '@/components/SharedFooter';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', 
});

export const metadata = {
  title: "The Club",
  description: "Pass Privilège",
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
    <html lang="fr" className={inter.className}>
      <body className="bg-riviera-sand text-riviera-navy">
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