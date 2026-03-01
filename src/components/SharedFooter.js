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
  { label: "Avantages", href: "/#economies" },
  { label: "Abonnements", href: "/#tarifs" },
  { label: "FAQ", href: "/#faq" },
  { label: "Espace Partenaire", href: "/espace-partenaire" },
];

export default function SharedFooter() {
  const [legalModal, setLegalModal] = useState(null);

  return (
    <>
      <footer className="bg-white border-t border-gray-100 pt-10 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grid: 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Col 1: Brand */}
            <div>
              <div className="font-serif font-bold text-xl tracking-wide text-riviera-navy mb-1">
                THE <span className="text-riviera-gold">CLUB</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">Pass Privilège · Riviera &amp; au-delà</p>
            </div>

            {/* Col 2: Navigation */}
            <nav aria-label="Navigation footer">
              <ul className="space-y-2">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-riviera-navy transition-colors duration-300 ease-out"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Col 3: Legal */}
            <div className="space-y-2">
              <button
                onClick={() => setLegalModal('cgv')}
                className="block text-sm text-gray-500 hover:text-gray-700 transition-colors duration-300 ease-out focus:outline-none focus:underline"
              >
                CGV
              </button>
              <button
                onClick={() => setLegalModal('mentions')}
                className="block text-sm text-gray-500 hover:text-gray-700 transition-colors duration-300 ease-out focus:outline-none focus:underline"
              >
                Mentions légales
              </button>
              <button
                onClick={() => setLegalModal('confidentialite')}
                className="block text-sm text-gray-500 hover:text-gray-700 transition-colors duration-300 ease-out focus:outline-none focus:underline"
              >
                Confidentialité
              </button>
            </div>
          </div>

          {/* Bottom: copyright */}
          <div className="h-px bg-gray-100 mb-6" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-gray-400">© 2026 The Club. Tous droits réservés.</p>
            <p className="text-xs text-gray-400">Propulsé par <span className="text-gray-500 font-medium">Instant&amp;You</span></p>
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
            <h3 id="legal-modal-title" className="font-serif text-2xl font-bold text-riviera-navy mb-6">
              {LEGAL_CONTENT[legalModal].title}
            </h3>
            {LEGAL_CONTENT[legalModal].content}
          </div>
        </div>
      )}
    </>
  );
}
