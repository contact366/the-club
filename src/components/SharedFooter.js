"use client";
import { useState } from 'react';
import Link from 'next/link';

const LEGAL_CONTENT = {
  mentions: {
    title: "Mentions Légales",
    content: (
      <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
        <div>
          <h4 className="font-bold text-riviera-navy text-base mb-3">Éditeur du site</h4>
          <p>Le site The Club est édité par le groupe <strong>Instant&amp;You</strong>.</p>
          <ul className="mt-3 space-y-2">
            <li><span className="font-semibold text-gray-800">Forme juridique :</span> SASU au capital de 15 000 €</li>
            <li><span className="font-semibold text-gray-800">Siège social :</span> 42 chemin du val fleuri, 06800 Cagnes-sur-Mer</li>
            <li><span className="font-semibold text-gray-800">Immatriculation :</span> RCS d&apos;Antibes n° 98431860000017</li>
            <li><span className="font-semibold text-gray-800">N° TVA intracommunautaire :</span> NC</li>
            <li><span className="font-semibold text-gray-800">Directeur de la publication :</span> Maxime FALLET</li>
            <li><span className="font-semibold text-gray-800">Contact :</span>{" "}
              <a href="mailto:contact@instantandyou.fr" className="text-riviera-azure hover:underline">contact@instantandyou.fr</a>
              {" "}— 07.45.05.50.69
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  confidentialite: {
    title: "Politique de Confidentialité (RGPD)",
    content: (
      <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
        <div>
          <h4 className="font-bold text-riviera-navy text-base mb-3">Données collectées</h4>
          <p className="mb-2">Nous collectons les données suivantes :</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><span className="font-semibold text-gray-800">Identité :</span> Nom, prénom, adresse email.</li>
            <li><span className="font-semibold text-gray-800">Abonnement :</span> Type de forfait (Explorer ou Céleste).</li>
            <li><span className="font-semibold text-gray-800">Usage :</span> Historique des économies réalisées, établissements visités, montants des additions.</li>
            <li><span className="font-semibold text-gray-800">Paiement :</span> Traité de manière sécurisée par <strong>Stripe</strong>. Aucune coordonnée bancaire n&apos;est stockée par nos soins.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-riviera-navy text-base mb-3">Finalités du traitement</h4>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Gérer votre accès aux offres partenaires.</li>
            <li>Calculer et afficher vos économies cumulées en temps réel.</li>
            <li>Vous envoyer des communications liées à votre abonnement.</li>
          </ol>
        </div>
        <div>
          <h4 className="font-bold text-riviera-navy text-base mb-3">Vos droits</h4>
          <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Vous pouvez exercer ce droit en nous contactant à :{" "}
            <a href="mailto:contact@instantandyou.fr" className="text-riviera-azure hover:underline">contact@instantandyou.fr</a>
          </p>
        </div>
      </div>
    ),
  },
  cgv: {
    title: "Conditions Générales de Vente",
    content: (
      <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
        {[
          { title: "Article 1 : Objet", body: "Les présentes CGV régissent la vente et l'utilisation des services de The Club, marque du groupe Instant&You. The Club propose un accès privilégié à des offres de réduction chez des partenaires (restaurants, loisirs, bien-être)." },
          { title: "Article 2 : Adhésion et Forfaits", body: "L'accès aux services nécessite la souscription à un abonnement payant. Forfait Explorer : accès limité (selon descriptif en vigueur). Forfait Céleste : accès premium illimité. L'abonnement est personnel, nominatif et non transférable." },
          { title: "Article 3 : Fonctionnement des Offres", body: "Offre Découverte : valable une seule fois par établissement partenaire, nécessite la validation par un code PIN fourni par le commerçant après saisie du montant de l'addition. Offre Permanente : valable de manière récurrente selon les conditions du partenaire. The Club ne peut être tenu responsable si un partenaire refuse d'appliquer l'offre, mais s'engage à faire ses meilleurs efforts pour résoudre tout litige." },
          { title: "Article 4 : Calcul des économies", body: "Le système d'économies affiché est une estimation basée sur les montants saisis par l'utilisateur et les taux de remise théoriques des partenaires. Ces données n'ont pas de valeur monétaire réelle et ne sont pas remboursables." },
          { title: "Article 5 : Prix et Paiement", body: "Les tarifs sont indiqués en euros TTC. Le paiement s'effectue par carte bancaire via une plateforme sécurisée (Stripe)." },
          { title: "Article 6 : Droit de rétractation", body: "Conformément à l'article L221-18 du Code de la consommation, le client dispose de 14 jours pour se rétracter. Toute utilisation du service (validation d'au moins une offre via code PIN) avant la fin de ce délai vaut renonciation expresse au droit de rétractation." },
          { title: "Article 7 : Résiliation", body: "L'utilisateur peut résilier son abonnement à tout moment depuis son espace client. La résiliation sera effective à la fin de la période de facturation en cours." },
          { title: "Article 8 : Litiges", body: "Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action devant les tribunaux compétents de Nice." },
        ].map((article, i) => (
          <div key={i}>
            <h4 className="font-bold text-riviera-navy text-sm mb-1">{article.title}</h4>
            <p>{article.body}</p>
          </div>
        ))}
      </div>
    ),
  },
};

const FOOTER_LINKS = [
  { label: "Explorer", href: "/#explorer" },
  { label: "Expériences", href: "/#experiences" },
  { label: "Escapades", href: "/#staycation" },
  { label: "Espace Partenaire", href: "/espace-partenaire" },
];

export default function SharedFooter() {
  const [legalModal, setLegalModal] = useState(null);

  return (
    <>
      <footer style={{ background: '#181611', color: '#FFFDF8' }} className="pt-20 pb-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {/* Grid 4 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            {/* Colonne marque */}
            <div className="lg:col-span-1">
              <a href="/" className="font-display font-semibold text-[20px] tracking-wide text-white hover:opacity-80 transition-opacity block mb-4">
                THE <em className="italic font-normal text-[#2E7C93]">Club</em>
              </a>
              <p className="text-[13.5px] max-w-[260px] leading-relaxed" style={{ color: '#B7AA8E' }}>
                Un membership d&apos;expériences dédié à la Côte d&apos;Azur. Un projet de l&apos;écosystème Instant&amp;You.
              </p>
            </div>

            {/* Explorer */}
            <div>
              <h4 className="text-[12px] uppercase tracking-[0.08em] mb-4 font-medium" style={{ color: '#B7AA8E', fontFamily: 'var(--font-mono)' }}>Explorer</h4>
              <ul className="space-y-3">
                {['Toutes les expériences', 'Escapades', 'À deux', 'La Côte d\'Azur'].map((item) => (
                  <li key={item}><a href="/#experiences" className="text-[14px] transition-colors" style={{ color: '#DCE9EA' }} onMouseEnter={(e) => e.target.style.color = '#FFFDF8'} onMouseLeave={(e) => e.target.style.color = '#DCE9EA'}>{item}</a></li>
                ))}
              </ul>
            </div>

            {/* The Club */}
            <div>
              <h4 className="text-[12px] uppercase tracking-[0.08em] mb-4 font-medium" style={{ color: '#B7AA8E', fontFamily: 'var(--font-mono)' }}>The Club</h4>
              <ul className="space-y-3">
                <li><a href="/#pass" className="text-[14px] transition-colors" style={{ color: '#DCE9EA' }}>Les Pass</a></li>
                <li><a href="/devenir-partenaire" className="text-[14px] transition-colors" style={{ color: '#DCE9EA' }}>Devenir partenaire</a></li>
                <li><a href="/#faq" className="text-[14px] transition-colors" style={{ color: '#DCE9EA' }}>FAQ</a></li>
                <li><a href="/profil" className="text-[14px] transition-colors" style={{ color: '#DCE9EA' }}>Mon Club</a></li>
              </ul>
            </div>

            {/* Zones */}
            <div>
              <h4 className="text-[12px] uppercase tracking-[0.08em] mb-4 font-medium" style={{ color: '#B7AA8E', fontFamily: 'var(--font-mono)' }}>Zones</h4>
              <ul className="space-y-3">
                {['Nice · Cannes · Antibes', 'Monaco · Menton', 'Grasse · Saint-Paul-de-Vence'].map((item) => (
                  <li key={item} className="text-[14px]" style={{ color: '#DCE9EA' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 gap-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="text-[12px]" style={{ color: '#B7AA8E' }}>
              © 2026 The Club — Côte d&apos;Azur. Tous droits réservés.
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <button
                onClick={() => setLegalModal('cgv')}
                className="text-[12px] hover:text-white transition-colors focus:outline-none"
                style={{ color: '#B7AA8E' }}
              >CGV</button>
              <button
                onClick={() => setLegalModal('mentions')}
                className="text-[12px] hover:text-white transition-colors focus:outline-none"
                style={{ color: '#B7AA8E' }}
              >Mentions légales</button>
              <button
                onClick={() => setLegalModal('confidentialite')}
                className="text-[12px] hover:text-white transition-colors focus:outline-none"
                style={{ color: '#B7AA8E' }}
              >Confidentialité</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal modal */}
      {legalModal && LEGAL_CONTENT[legalModal] && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-riviera-navy/40 backdrop-blur-sm"
            onClick={() => setLegalModal(null)}
            aria-hidden="true"
          />
          <div
            className="relative bg-white w-full max-w-lg rounded-3xl p-8 shadow-md max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
          >
            <button
              onClick={() => setLegalModal(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 id="legal-modal-title" className="font-display text-2xl font-medium text-riviera-navy mb-6">
              {LEGAL_CONTENT[legalModal].title}
            </h3>
            {LEGAL_CONTENT[legalModal].content}
          </div>
        </div>
      )}
    </>
  );
}
