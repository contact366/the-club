// 1. On importe la police "Inter" depuis Google Fonts via Next.js
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css'; // Garde ton import CSS existant

// 2. On configure la police
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  // On peut ajouter un nom de variable si on utilise Tailwind de façon avancée
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
        <Script
          src="https://cdn.jsdelivr.net/npm/twemoji@latest/dist/twemoji.min.js"
          strategy="afterInteractive"
          onReady={() => {
            if (typeof window !== 'undefined' && window.twemoji) {
              window.twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
              const observer = new MutationObserver(() => {
                window.twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
              });
              observer.observe(document.body, { childList: true, subtree: true });
            }
          }}
        />
      </body>
    </html>
  );
}