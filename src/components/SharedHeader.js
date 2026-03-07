"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import MobileNav from './MobileNav';

const NAV_LINKS = [
  { label: "Avantages", href: "/#economies" },
  { label: "Abonnements", href: "/#tarifs" },
  { label: "FAQ", href: "/#faq" },
  { label: "La Cuisine du Club", href: "/cuisine-du-club" },
];

export default function SharedHeader() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const openSignIn = () => {
    setAuthMode('login');
    setMessage({ text: '', type: '' });
    setIsAuthModalOpen(true);
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsAuthModalOpen(false);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName, last_name: lastName } },
        });
        if (error) throw error;
        setMessage({ text: 'Vérifiez votre email pour confirmer votre compte.', type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => supabase.auth.signOut();

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/60 shadow-sm transition-all duration-300 ease-out">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif font-bold text-xl tracking-wide text-riviera-navy hover:opacity-80 transition-opacity duration-300 ease-out"
          >
            THE <span className="text-riviera-gold">CLUB</span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-riviera-navy transition-colors duration-300 ease-out"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/espace-partenaire"
              className="text-sm font-medium text-gray-600 hover:text-riviera-navy transition-colors duration-300 ease-out"
            >
              Espace Partenaire
            </Link>
          </nav>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-500">
                  {user.user_metadata?.first_name || user.email?.split('@')[0] || 'Membre'}
                </span>
                <Link
                  href="/profil"
                  className="flex items-center gap-2 px-4 py-2 bg-riviera-navy text-white rounded-full text-sm font-medium hover:bg-gray-900 transition-colors duration-300 ease-out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  Mon Espace
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors duration-300 ease-out"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openSignIn}
                  className="text-sm font-medium text-gray-600 hover:text-riviera-navy transition-colors duration-300 ease-out"
                >
                  Se connecter
                </button>
                {/* Primary CTA */}
                <Link
                  href="/#tarifs"
                  className="px-5 py-2 bg-riviera-navy text-white text-sm font-semibold rounded-full hover:bg-gray-900 transition-colors duration-300 ease-out shadow-sm"
                >
                  Obtenir mon Pass
                </Link>
              </>
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-riviera-navy"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile navigation */}
      <MobileNav
        id="mobile-nav"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onSignIn={openSignIn}
        onSignOut={handleSignOut}
      />

      {/* Auth modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-riviera-navy/40 backdrop-blur-sm"
            onClick={() => setIsAuthModalOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 id="auth-modal-title" className="font-serif text-3xl font-bold text-riviera-navy mb-2">
              {authMode === 'signup' ? 'Rejoindre The Club' : 'Bon retour.'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {authMode === 'signup'
                ? 'Créez votre compte pour obtenir votre pass.'
                : 'Connectez-vous pour accéder à vos privilèges.'}
            </p>
            {message.text && (
              <div className={`p-4 rounded-xl text-sm mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
              </div>
            )}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:shadow-md hover:bg-gray-50 transition-all duration-300 ease-out disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-riviera-navy"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Se connecter avec Google
              </button>
              <div className="flex items-center my-4 gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleAuth}>
              {authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Prénom *</label>
                    <input
                      type="text"
                      placeholder="Thomas"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-navy focus:ring-2 focus:ring-riviera-navy/20 outline-none transition-all duration-300 ease-out"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nom *</label>
                    <input
                      type="text"
                      placeholder="Dupont"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-navy focus:ring-2 focus:ring-riviera-navy/20 outline-none transition-all duration-300 ease-out"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="thomas@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-navy focus:ring-2 focus:ring-riviera-navy/20 outline-none transition-all duration-300 ease-out"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Mot de passe *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-navy focus:ring-2 focus:ring-riviera-navy/20 outline-none transition-all duration-300 ease-out"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-riviera-navy text-white font-bold py-3.5 rounded-2xl hover:bg-gray-900 transition-colors duration-300 ease-out disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-riviera-navy"
              >
                {loading ? 'Chargement…' : authMode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              {authMode === 'login' ? (
                <>Pas encore membre ?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="font-semibold text-riviera-navy hover:underline focus:outline-none"
                  >
                    Créer un compte
                  </button>
                </>
              ) : (
                <>Déjà membre ?{' '}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="font-semibold text-riviera-navy hover:underline focus:outline-none"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
