"use client";
import { useState, useEffect } from 'react';

export default function InstallPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedOS, setSelectedOS] = useState(null); // null | 'iphone' | 'android'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;
    const alreadySeen = localStorage.getItem('installPopupSeen');

    if (!isStandalone && !alreadySeen) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('installPopupSeen', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .popup-enter {
          animation: popupFadeIn 0.35s ease both;
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        {/* Popup card */}
        <div className="popup-enter bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-sm p-6 text-white shadow-2xl">

          {selectedOS === null && (
            <>
              {/* Initial screen */}
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">⚡️</div>
                <h2 className="text-lg font-bold mb-2">Installez l&apos;application &ldquo;The Club&rdquo;</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Accédez à votre espace membre en un clic et profitez d&apos;une navigation plus fluide et rapide.
                </p>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setSelectedOS('iphone')}
                  className="flex-1 flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-colors"
                >
                  <span className="text-2xl">🍎</span>
                  <span className="text-sm font-semibold">iPhone</span>
                  <span className="text-xs text-gray-400">Safari</span>
                </button>
                <button
                  onClick={() => setSelectedOS('android')}
                  className="flex-1 flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-colors"
                >
                  <span className="text-2xl">🤖</span>
                  <span className="text-sm font-semibold">Android</span>
                  <span className="text-xs text-gray-400">Chrome</span>
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleClose}
                  className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </>
          )}

          {selectedOS === 'iphone' && (
            <>
              <h2 className="text-base font-bold mb-4 text-center">🍎 Installation sur iPhone (Safari)</h2>
              <ol className="space-y-3 mb-5 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="text-lg">📤</span>
                  <span>Appuyez sur l&apos;icône <strong className="text-white">Partager</strong> (le carré avec une flèche vers le haut en bas de votre écran).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-lg">📋</span>
                  <span>Faites défiler les options et appuyez sur <strong className="text-white">&ldquo;Sur l&apos;écran d&apos;accueil&rdquo;</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-lg">✅</span>
                  <span>Appuyez sur <strong className="text-white">&ldquo;Ajouter&rdquo;</strong> en haut à droite pour confirmer.</span>
                </li>
              </ol>
              <BenefitsSection />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setSelectedOS(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-semibold transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-white text-black rounded-xl py-3 text-sm font-bold hover:bg-gray-100 transition-colors"
                >
                  Compris !
                </button>
              </div>
            </>
          )}

          {selectedOS === 'android' && (
            <>
              <h2 className="text-base font-bold mb-4 text-center">🤖 Installation sur Android (Chrome)</h2>
              <ol className="space-y-3 mb-5 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="text-lg">⋮</span>
                  <span>Appuyez sur les <strong className="text-white">trois points verticaux (⋮)</strong> situés en haut à droite de votre navigateur.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-lg">📲</span>
                  <span>Sélectionnez l&apos;option <strong className="text-white">&ldquo;Installer l&apos;application&rdquo;</strong> ou <strong className="text-white">&ldquo;Ajouter à l&apos;écran d&apos;accueil&rdquo;</strong>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-lg">✅</span>
                  <span>Validez en appuyant sur <strong className="text-white">&ldquo;Ajouter&rdquo;</strong>.</span>
                </li>
              </ol>
              <BenefitsSection />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setSelectedOS(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-semibold transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-white text-black rounded-xl py-3 text-sm font-bold hover:bg-gray-100 transition-colors"
                >
                  Compris !
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

function BenefitsSection() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm space-y-2">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Pourquoi l&apos;installer ?</p>
      <div className="flex gap-2">
        <span>⚡</span>
        <span><strong className="text-white">Rapidité</strong> <span className="text-gray-400">: Plus besoin de taper l&apos;adresse dans votre navigateur.</span></span>
      </div>
      <div className="flex gap-2">
        <span>📱</span>
        <span><strong className="text-white">Immersion</strong> <span className="text-gray-400">: Navigation en plein écran sans les barres de menu du navigateur.</span></span>
      </div>
      <div className="flex gap-2">
        <span>🔒</span>
        <span><strong className="text-white">Accès Privé</strong> <span className="text-gray-400">: Le Club est toujours à portée de main.</span></span>
      </div>
    </div>
  );
}
