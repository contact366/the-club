// 1. On importe la police "Inter" depuis Google Fonts via Next.js
import { Inter } from 'next/font/google';
import './globals.css'; // Garde ton import CSS existant

// 2. On configure la police
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  // On peut ajouter un nom de variable si on utilise Tailwind de façon avancée
  variable: '--font-inter', 
});

export const metadata = {
  title: 'The Club',
  description: 'Votre pass pour les meilleures offres',
};

export default function RootLayout({ children }) {
  return (
    // 3. On applique la classe de la police sur toute la balise <html>
    <html lang="fr" className={inter.className}>
      <body className="antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}