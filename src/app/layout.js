import { Inter } from 'next/font/google';
import './globals.css';
import TwemojiLoader from '@/components/TwemojiLoader';

// 2. On configure la police
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
    // 3. On applique la classe de la police sur toute la balise <html>
    <html lang="fr" className={inter.className}>
      <body className="antialiased bg-white text-gray-900">
        {children}
        <TwemojiLoader />
      </body>
    </html>
  );
}