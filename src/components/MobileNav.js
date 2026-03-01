"use client";
import { useEffect } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { label: "Avantages", href: "/#economies" },
  { label: "Abonnements", href: "/#tarifs" },
  { label: "FAQ", href: "/#faq" },
];

export default function MobileNav({ open, onClose, user, onSignIn, onSignOut }) {
  // Lock body scroll while menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-sm ml-auto h-full shadow-xl flex flex-col animate-[slideInRight_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <Link
            href="/"
            className="font-serif font-bold text-xl tracking-wide text-riviera-navy"
            onClick={onClose}
          >
            THE <span className="text-riviera-gold">CLUB</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-riviera-navy"
            aria-label="Fermer le menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto px-6 py-8">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center py-3 px-2 text-lg font-medium text-gray-700 hover:text-riviera-navy rounded-xl hover:bg-gray-50 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-riviera-navy"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/espace-partenaire"
                onClick={onClose}
                className="flex items-center py-3 px-2 text-lg font-medium text-gray-700 hover:text-riviera-navy rounded-xl hover:bg-gray-50 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-riviera-navy"
              >
                Espace Partenaire
              </Link>
            </li>
          </ul>

          <div className="mt-8 pt-8 border-t border-gray-100 space-y-3">
            {user ? (
              <>
                <Link
                  href="/profil"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full bg-riviera-navy text-white font-semibold py-3.5 px-6 rounded-2xl hover:bg-gray-900 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-riviera-navy"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  Mon Espace
                </Link>
                <button
                  onClick={() => { onSignOut(); onClose(); }}
                  className="w-full text-sm font-medium text-red-500 hover:text-red-700 py-2 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-red-400 rounded-lg"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { onSignIn(); onClose(); }}
                  className="w-full text-center py-3.5 px-6 text-sm font-semibold text-riviera-navy border border-riviera-navy rounded-2xl hover:bg-riviera-navy hover:text-white transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-riviera-navy"
                >
                  Se connecter
                </button>
                <Link
                  href="/#tarifs"
                  onClick={onClose}
                  className="flex items-center justify-center w-full bg-riviera-navy text-white font-semibold py-3.5 px-6 rounded-2xl hover:bg-gray-900 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-riviera-navy"
                >
                  Obtenir mon Pass
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
