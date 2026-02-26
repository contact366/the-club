"use client";
import Link from 'next/link';
import Emoji from '@/components/Emoji';

export default function EspacePartenairePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif font-bold text-xl tracking-widest text-riviera-navy">THE CLUB</Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-riviera-navy text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-riviera-gold text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-white/20 mb-6">
            <Emoji symbol="🤝" label="partenaire" size={16} /> Espace Partenaire
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6">Référencez votre établissement</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Rejoignez le réseau The Club et bénéficiez d&apos;une visibilité exclusive auprès d&apos;une clientèle premium sur la Côte d&apos;Azur.
          </p>
        </div>
      </section>

      {/* Coming soon */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-riviera-sand rounded-full flex items-center justify-center mx-auto mb-6">
            <Emoji symbol="🚀" label="bientôt" size={40} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-3">Bientôt disponible</h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto mb-8">
            L&apos;espace partenaire est en cours de développement. Revenez bientôt pour référencer votre établissement et proposer vos offres exclusives à nos membres.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10 text-left">
            <div className="bg-riviera-sand rounded-2xl p-5">
              <div className="mb-3"><Emoji symbol="👁️" label="visibilité" size={28} /></div>
              <h3 className="font-bold text-riviera-navy mb-1">Visibilité Premium</h3>
              <p className="text-gray-500 text-sm">Soyez mis en avant auprès d&apos;une clientèle sélective et exigeante.</p>
            </div>
            <div className="bg-riviera-sand rounded-2xl p-5">
              <div className="mb-3"><Emoji symbol="📈" label="croissance" size={28} /></div>
              <h3 className="font-bold text-riviera-navy mb-1">Nouveaux Clients</h3>
              <p className="text-gray-500 text-sm">Attirez des clients réguliers grâce à vos offres exclusives partenaires.</p>
            </div>
            <div className="bg-riviera-sand rounded-2xl p-5">
              <div className="mb-3"><Emoji symbol="🛡️" label="confiance" size={28} /></div>
              <h3 className="font-bold text-riviera-navy mb-1">Label de Qualité</h3>
              <p className="text-gray-500 text-sm">Le label The Club renforce votre image de marque et votre prestige.</p>
            </div>
          </div>
          <Link href="/" className="inline-block bg-riviera-navy text-white font-bold px-8 py-4 rounded-full hover:bg-slate-800 transition-all shadow-lg">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-riviera-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-serif font-bold text-lg tracking-widest mb-2">THE CLUB</p>
          <p className="text-gray-400 text-sm">© 2025 The Club. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
