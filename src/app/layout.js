import { Inter } from 'next/font/google';
import './globals.css';
import TwemojiLoader from '@/components/TwemojiLoader';
import SharedHeader from '@/components/SharedHeader';
import SharedFooter from '@/components/SharedFooter';

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
      <body className="antialiased bg-white text-gray-900">
        <SharedHeader />
        <div className="pt-16">
          {children}
        </div>
        <SharedFooter />
        <TwemojiLoader />
      </body>
    </html>
  );
}