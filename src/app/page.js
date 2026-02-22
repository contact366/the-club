"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Script from 'next/script';


// --- DONNÉES STATIQUES ---
const ecoData = [
  {
    title: 'Avec Le Pass <span class="text-sky-400">Explorer (9,90€/m)</span>',
    details: `
      <div class="flex justify-between items-center text-sm"><span class="text-gray-300">Dîner pour deux <span class="text-riviera-azure text-xs font-bold bg-blue-500/20 px-2 py-0.5 rounded ml-1">-50% (1 seule fois)</span></span><span class="text-white font-mono">60 €</span></div>
      <div class="flex justify-between items-center text-sm mt-4"><span class="text-gray-300">Activité de loisir <span class="text-gray-400 text-xs font-bold bg-gray-500/20 px-2 py-0.5 rounded ml-1">-10% (Permanent)</span></span><span class="text-white font-mono">90 €</span></div>
      <hr class="border-riviera-azure/30 my-4">
      <div class="flex justify-between items-center"><span class="font-bold text-lg">Total Payé</span><span class="text-3xl font-bold text-white font-mono">150 €</span></div>`,
    savings: 'Économie sur la soirée : 70 €',
    desc: 'Idéal pour tester. <span class="text-white font-semibold">Gain net : 60,10€</span> une fois le pass déduit.',
    colorClass: 'bg-white', textColor: 'text-riviera-navy'
  },
  {
    title: 'Avec Le Pass <span class="text-riviera-gold">Céleste (59€/an)</span>',
    details: `
      <div class="flex justify-between items-center text-sm"><span class="text-gray-300">Dîner pour deux <span class="text-green-400 text-xs font-bold bg-green-500/20 px-2 py-0.5 rounded ml-1">-50%</span></span><span class="text-white font-mono">60 €</span></div>
      <div class="flex justify-between items-center text-sm mt-4"><span class="text-gray-300">Activité de loisir <span class="text-green-400 text-xs font-bold bg-green-500/20 px-2 py-0.5 rounded ml-1">-50%</span></span><span class="text-white font-mono">50 €</span></div>
      <hr class="border-riviera-azure/30 my-4">
      <div class="flex justify-between items-center"><span class="font-bold text-lg">Total Payé</span><span class="text-3xl font-bold text-white font-mono">110 €</span></div>`,
    savings: 'Économie sur la soirée : 110 €',
    desc: 'Votre pass annuel à 59€ est <span class="text-white font-semibold underline decoration-riviera-gold">intégralement remboursé dès le premier soir</span> !',
    colorClass: 'bg-riviera-gold', textColor: 'text-riviera-navy'
  }
];

const parrainageData = [
  { icon: "🎁", title: "2 Mois Offerts", text: "Pour chaque filleul qui s'abonne au Pass Céleste, recevez 2 mois d'abonnement immédiats." },
  { icon: "♾️", title: "Sans Limite", text: "Parrainez 6 amis et profitez de l'application The Club 100% gratuitement pendant un an." },
  { icon: "💸", title: "Cash ou Remise", text: "Choisissez d'être remboursé directement sur votre compte ou d'obtenir une remise." }
];

const faqData = [
  { q: "Comment fonctionne l'offre Découverte ?", a: "L'offre Découverte (allant jusqu'à -50%) est valable une seule fois par établissement partenaire. Une fois scannée et utilisée, vous bénéficiez automatiquement de l'offre Privilège permanente (ex: -10% ou -20%) pour toutes vos visites suivantes." },
  { q: "Le Pass Explorer est-il avec engagement ?", a: "Non, le Pass Explorer (mensuel à 9,90€) est totalement sans engagement. Vous pouvez l'annuler en un seul clic depuis votre espace membre. Le Pass Céleste (59€/an) vous engage sur 12 mois pour vous offrir le tarif le plus avantageux possible et un accès illimité aux offres." },
  { q: "Comment utiliser The Club chez un partenaire ?", a: "Ouvrez l'application, sélectionnez le partenaire et présentez votre téléphone. Cliquez sur Utiliser l'offre. Le commerçant tape son code secret à 4 chiffres sur votre écran et la remise est appliquée sur votre facture instantanément." }
];

// --- CONTENUS LÉGAUX ---
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
            <li><span className="font-semibold text-gray-800">Immatriculation :</span> RCS d'Antibes n° 98431860000017</li>
            <li><span className="font-semibold text-gray-800">N° TVA intracommunautaire :</span> NC</li>
            <li><span className="font-semibold text-gray-800">Directeur de la publication :</span> Maxime FALLET</li>
            <li><span className="font-semibold text-gray-800">Contact :</span>{" "}
              <a href="mailto:contact@instantandyou.fr" className="text-riviera-azure hover:underline">contact@instantandyou.fr</a>
              {" "}— 07.45.05.50.69
            </li>
          </ul>
        </div>
      </div>
    )
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
            <li><span className="font-semibold text-gray-800">Paiement :</span> Traité de manière sécurisée par <strong>Stripe</strong>. Aucune coordonnée bancaire n'est stockée par nos soins.</li>
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
          <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez exercer ce droit en nous contactant à :{" "}
            <a href="mailto:contact@instantandyou.fr" className="text-riviera-azure hover:underline">contact@instantandyou.fr</a>
          </p>
        </div>
      </div>
    )
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
          { title: "Article 8 : Litiges", body: "Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action devant les tribunaux compétents de Nice." }
        ].map((article, i) => (
          <div key={i}>
            <h4 className="font-bold text-riviera-navy text-sm mb-1">{article.title}</h4>
            <p>{article.body}</p>
          </div>
        ))}
      </div>
    )
  }
};

export default function Home() {

  // --- ÉTATS ---
  const [wordIndex, setWordIndex] = useState(0);
  const words = ["Surclassé.", "Réinventé.", "Privilégié.", "Digitalisé."];
  const [ecoIndex, setEcoIndex] = useState(0);
  const [parrIndex, setParrIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState('none');
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState(0);
  const [userLocation, setUserLocation] = useState(null);

  // Savings animation
  const [displayedSavings, setDisplayedSavings] = useState(0);
  const [savingsLabel, setSavingsLabel] = useState('savings'); // 'savings' | 'status'
  const savingsAnimRef = useRef(null);

  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Legal modal
  const [legalModal, setLegalModal] = useState(null); // 'mentions' | 'confidentialite' | 'cgv' | null

  // PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [activePartnerName, setActivePartnerName] = useState("");
  const [activeOfferType, setActiveOfferType] = useState("");
  const [currentOfferStatus, setCurrentOfferStatus] = useState('available');
  const [billAmount, setBillAmount] = useState("");
  const [modalStep, setModalStep] = useState("amount");

  // ============================================================
  // FONCTIONS
  // ============================================================

  const fetchTotalSavings = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      const { data, error } = await supabase
        .from('usage_history')
        .select('saved_amount')
        .eq('user_id', currentUser.id);
      if (error) throw error;
      if (data) {
        const total = data.reduce((acc, curr) => acc + (curr.saved_amount || 0), 0);
        setTotalSavings(total);
      }
    } catch (err) {
      console.error("Erreur récupération économies :", err.message);
    }
  }, []);

  const checkOfferStatus = useCallback(async (partnerName, offerType) => {
    if (!user || subscription === 'none') return 'available';
    try {
      const { data: usages } = await supabase
        .from('offer_usage')
        .select('used_at')
        .eq('user_id', user.id)
        .eq('partner_name', partnerName);

      if (offerType === 'decouverte') {
        if (subscription === 'explorer') {
          return usages?.length > 0 ? 'used' : 'available';
        }
        if (subscription === 'celeste') {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          return usages?.some(u => new Date(u.used_at) >= startOfMonth) ? 'used' : 'available';
        }
      }
    } catch (err) {
      console.error("Erreur vérification offre :", err.message);
    }
    return 'available';
  }, [user, subscription]);

  const addPinDigit = (digit) => {
    if (currentPin.length < 4) setCurrentPin(prev => prev + digit.toString());
  };

  const removePinDigit = () => setCurrentPin(prev => prev.slice(0, -1));

  const openPinModal = useCallback(async (partnerName, offerType) => {
    setActivePartnerName(partnerName);
    setActiveOfferType(offerType);
    setCurrentPin("");
    setBillAmount("");
    setModalStep("amount");

    // Upfront check: has this user already used this découverte offer?
    if (user && offerType === 'decouverte') {
      const { data: existing } = await supabase
        .from('usage_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('partner_name', partnerName)
        .eq('offer_type', 'Découverte')
        .maybeSingle();
      if (existing) {
        setCurrentOfferStatus('used');
        setIsPinModalOpen(true);
        return;
      }
    }

    const status = await checkOfferStatus(partnerName, offerType);
    setCurrentOfferStatus(status);
    setIsPinModalOpen(true);
  }, [checkOfferStatus, user]);

  const handleUseOffer = async () => {
    const currentPartner = partners.find(p => p.name === activePartnerName);

    // 1. Vérification PIN
    if (!currentPartner || currentPin !== currentPartner.pin_code) {
      setCurrentOfferStatus('wrong_pin');
      setCurrentPin("");
      return;
    }

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) return;

    // 2. Si offre découverte, vérifier qu'elle n'a pas déjà été utilisée
    if (activeOfferType === 'decouverte' && user) {
      const { data: existingOffer } = await supabase
        .from('usage_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('partner_name', activePartnerName)
        .eq('offer_type', 'Découverte')
        .maybeSingle();
      if (existingOffer) {
        setCurrentOfferStatus('used');
        setCurrentPin("");
        return;
      }
    }

    // 3. Calcul du montant économisé
    let saved = 0;
    if (activeOfferType === 'decouverte') {
      const rate = currentPartner.discount_decouverte || 50;
      saved = amount * (rate / 100);
    } else {
      const rate = currentPartner.discount_permanente || 10;
      saved = amount * (rate / 100);
    }

    // 4. Enregistrement en base
    try {
      const { error } = await supabase.from('usage_history').insert([{
        user_id: user.id,
        partner_name: activePartnerName,
        offer_type: activeOfferType === 'decouverte' ? 'Découverte' : 'Permanente',
        original_amount: amount,
        saved_amount: saved,
      }]);
      if (error) throw error;

      await fetchTotalSavings();
      setCurrentOfferStatus('success');
      setCurrentPin("");
      setModalStep("amount");
      setBillAmount("");
    } catch (err) {
      console.error("Erreur enregistrement offre :", err.message);
      setCurrentOfferStatus('error');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName } } });
      setMessage(error
        ? { text: error.message, type: "error" }
        : { text: "Inscription réussie ! Vérifiez vos emails.", type: "success" }
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "Connexion réussie !", type: "success" });
        // Géolocalisation à la connexion
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {} // silently fail if denied
          );
        }
        setTimeout(() => { setIsAuthModalOpen(false); window.location.reload(); }, 1500);
      }
    }
    setLoading(false);
  };

  const handleSubscription = async (plan) => {
    if (!user) { setAuthMode('signup'); setIsAuthModalOpen(true); return; }
    setLoading(true);
    try {
      const domain = window.location.origin;
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan,
          userId: user.id,
          success_url: `${domain}/success`,
          cancel_url: `${domain}/cancel`,
        },
      });
      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Impossible de générer le lien de paiement");
      }
    } catch (err) {
      alert("Erreur de paiement : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_type: 'celeste' })
      .eq('id', user.id);
    if (!error) {
      setSubscription('celeste');
    }
  };

  // Animated counter: smoothly scroll from old to new value
  const animateSavings = useCallback((from, to) => {
    if (savingsAnimRef.current) cancelAnimationFrame(savingsAnimRef.current);
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedSavings(from + (to - from) * eased);
      if (progress < 1) savingsAnimRef.current = requestAnimationFrame(step);
    };
    savingsAnimRef.current = requestAnimationFrame(step);
  }, []);

  // ============================================================
  // EFFETS
  // ============================================================

  useEffect(() => { fetchTotalSavings(); }, [fetchTotalSavings]);

  // Animate counter when totalSavings updates
  useEffect(() => {
    animateSavings(displayedSavings, totalSavings);
  }, [totalSavings]);

  // Rotate badge between savings amount and subscription status every 3s
  useEffect(() => {
    if (!user || subscription === 'none') return;
    const labelInterval = setInterval(() => {
      setSavingsLabel(prev => prev === 'savings' ? 'status' : 'savings');
    }, 3000);
    return () => clearInterval(labelInterval);
  }, [user, subscription]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase.from('partners').select('*');
        if (error) throw error;
        setPartners(data || []);
      } catch (err) {
        console.error("Erreur chargement partenaires:", err.message);
      } finally {
        setPartnersLoading(false);
      }
    };
    fetchPartners();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authSub.unsubscribe();
  }, []);

  useEffect(() => {
    const getProfile = async () => {
      if (user) {
        const { data } = await supabase.from('profiles').select('subscription_type').eq('id', user.id).single();
        if (data) setSubscription(data.subscription_type);
      } else {
        setSubscription('none');
      }
    };
    getProfile();
  }, [user]);

  // Request geolocation for logged-in users on page load
  useEffect(() => {
    if (user && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently ignore if denied
      );
    }
  }, [user]);

  useEffect(() => {
    const wordInterval = setInterval(() => setWordIndex(prev => (prev + 1) % words.length), 3000);
    const ecoInterval = setInterval(() => setEcoIndex(prev => (prev + 1) % ecoData.length), 4000);
    const parrInterval = setInterval(() => setParrIndex(prev => (prev + 1) % parrainageData.length), 5000);
    window.openReactPinModal = openPinModal;
    return () => {
      clearInterval(wordInterval);
      clearInterval(ecoInterval);
      clearInterval(parrInterval);
    };
  }, [openPinModal]);

  useEffect(() => {
    window.initMap = () => {
      const mapElement = document.getElementById("map");
      if (!mapElement || !window.google) return;

      const map = new window.google.maps.Map(mapElement, {
        center: userLocation || { lat: 43.68, lng: 7.18 },
        zoom: 12,
        styles: [
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9e9e9" }, { lightness: 17 }] },
          { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }, { lightness: 20 }] },
          { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }, { lightness: 17 }] },
          { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f5f5f5" }, { lightness: 21 }] }
        ],
        disableDefaultUI: true,
      });

      const locations = partners.length > 0
        ? partners.map(p => ({
            name: p.name,
            pos: { lat: p.latitude, lng: p.longitude },
            desc: p.address,
            offerDecouverte: p.offer_decouverte || '',
            offerPermanente: p.offer_permanente || '',
            type: p.category,
          }))
        : [
            { name: "Le Negresco", pos: { lat: 43.6946, lng: 7.2581 }, desc: "37 Prom. des Anglais, 06000 Nice", offerDecouverte: "DÉCOUVERTE : SURCLASSEMENT OFFERT", offerPermanente: "PERMANENTE : 1 BOISSON OFFERTE/PERS.", type: "Hôtellerie & Bien-être" },
            { name: "Aviasim", pos: { lat: 43.6669, lng: 7.2155 }, desc: "Novotel, 455 Prom. des Anglais, 06200 Nice", offerDecouverte: "DÉCOUVERTE : -50% SUR LA 1ÈRE SÉANCE", offerPermanente: "PERMANENTE : -10%", type: "Simulateur de vol" },
            { name: "Le Carré Bleu", pos: { lat: 43.656447, lng: 7.1640697 }, desc: "61 Ter Prom. de la Plage, 06800 Cagnes-sur-Mer", offerDecouverte: "DÉCOUVERTE : -40%", offerPermanente: "PERMANENTE : 1 BOISSON OFFERTE/PERS.", type: "Plage & Restauration" }
          ];

      const pulseDotSvg = 'data:image/svg+xml;utf-8,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="8" fill="%230284C7" /><circle cx="30" cy="30" r="3" fill="%23FFFFFF" /><circle cx="30" cy="30" r="8" fill="none" stroke="%230284C7" stroke-width="2"><animate attributeName="r" from="8" to="24" dur="1.5s" begin="0s" repeatCount="indefinite" /><animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" /></circle></svg>';

      let gInfowindows = [];
      let gMarkers = [];

      locations.forEach((loc) => {
        const marker = new window.google.maps.Marker({
          position: loc.pos, map, title: loc.name,
          icon: { url: pulseDotSvg, scaledSize: new window.google.maps.Size(60, 60), anchor: new window.google.maps.Point(30, 30) }
        });
        gMarkers.push(marker);

        const safeName = loc.name.replace(/'/g, "\\'");
        const infowindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color:#0F172A;font-family:-apple-system,sans-serif;padding:12px;min-width:240px;">
              <h4 style="font-weight:700;font-size:18px;margin-bottom:2px;letter-spacing:-0.02em;">${loc.name}</h4>
              <span style="font-size:10px;font-weight:bold;color:#0284C7;text-transform:uppercase;letter-spacing:0.05em;">${loc.type}</span>
              <p style="font-size:12px;color:#64748b;margin-top:4px;margin-bottom:12px;line-height:1.3;">${loc.desc}</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;font-size:10px;font-weight:bold;padding:6px 8px;border-radius:6px;margin-bottom:6px;text-align:center;">${loc.offerDecouverte}</div>
              <div style="background:#eff6ff;border:1px solid #bfdbfe;color:#0284c7;font-size:10px;font-weight:bold;padding:6px 8px;border-radius:6px;margin-bottom:12px;text-align:center;">${loc.offerPermanente}</div>
              <button onclick="window.openReactPinModal('${safeName}', 'decouverte')" style="display:block;width:100%;background:#0F172A;color:white;text-align:center;padding:10px 0;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;margin-bottom:6px;">
                ⭐ Offre Découverte (-50%)
              </button>
              <button onclick="window.openReactPinModal('${safeName}', 'permanente')" style="display:block;width:100%;background:#0284C7;color:white;text-align:center;padding:10px 0;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;">
                🔁 Offre Permanente
              </button>
            </div>`
        });
        gInfowindows.push(infowindow);
        marker.addListener("click", () => {
          gInfowindows.forEach(iw => iw.close());
          infowindow.open(map, marker);
        });
      });

      // User location marker
      if (userLocation) {
        new window.google.maps.Marker({
          position: userLocation,
          map,
          title: "Vous êtes ici",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          zIndex: 999,
        });
        // Small info bubble
        new window.google.maps.InfoWindow({
          content: '<div style="font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;color:#0F172A;padding:2px 4px;">📍 Vous êtes ici</div>'
        }).open(map);
      }

      const searchInput = document.getElementById('search-input');
      const searchResults = document.getElementById('search-results');
      if (searchInput && searchResults) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', function () {
          const val = this.value.toLowerCase();
          searchResults.innerHTML = '';
          if (!val) { searchResults.classList.add('hidden'); return; }
          const matches = locations.map((loc, idx) => ({ loc, idx })).filter(({ loc }) =>
            loc.name.toLowerCase().includes(val) ||
            loc.type.toLowerCase().includes(val) ||
            loc.desc.toLowerCase().includes(val)
          );
          if (matches.length > 0) {
            searchResults.classList.remove('hidden');
            matches.forEach(({ loc, idx }) => {
              const div = document.createElement('div');
              div.className = "p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors";
              div.innerHTML = `<div class="bg-blue-50 p-2 rounded-full text-riviera-azure"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div><div class="flex-1 overflow-hidden"><p class="text-sm text-riviera-navy font-bold truncate">${loc.name}</p><p class="text-xs text-gray-400 truncate">${loc.desc}</p></div>`;
              div.onclick = () => {
                gInfowindows.forEach(iw => iw.close());
                map.setCenter(loc.pos);
                map.setZoom(16);
                gInfowindows[idx].open(map, gMarkers[idx]);
                searchResults.classList.add('hidden');
                newSearchInput.value = loc.name;
              };
              searchResults.appendChild(div);
            });
          } else {
            searchResults.classList.add('hidden');
          }
        });
        document.addEventListener('click', (e) => {
          if (!newSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
          }
        });
      }
    };
    if (window.google && window.google.maps) window.initMap();
  }, [partners, userLocation]);

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <main className="antialiased selection:bg-riviera-azure selection:text-white">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-light border-b border-gray-200/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="font-serif font-bold text-xl tracking-wide text-riviera-navy">
            THE <span className="text-riviera-gold">CLUB</span>
          </a>
          <div className="hidden lg:flex space-x-8 text-sm font-medium text-gray-600">
            <a href="#univers" className="hover:text-riviera-azure transition">Univers</a>
            <a href="#economies" className="hover:text-riviera-azure transition">Avantages</a>
            <a href="#tarifs" className="hover:text-riviera-azure transition">Abonnements</a>
            <a href="#faq" className="hover:text-riviera-azure transition">FAQ</a>
          </div>
          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  Bonjour, <span className="text-riviera-navy font-bold">{user.user_metadata?.first_name || 'Membre'}</span>
                  {/* Rotating badge: savings amount ↔ subscription status */}
                  <div
                    className="relative bg-black px-3 py-1 rounded-full shadow-sm overflow-hidden"
                    style={{ minWidth: '120px', height: '24px', fontFamily: '-apple-system, "SF Pro Display", "SF Pro Text", BlinkMacSystemFont, sans-serif' }}
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold tracking-tight transition-all duration-700"
                      style={{
                        opacity: savingsLabel === 'savings' ? 1 : 0,
                        transform: savingsLabel === 'savings' ? 'translateY(0)' : 'translateY(-8px)',
                        letterSpacing: '-0.02em',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <span className="text-green-400 mr-1">↓</span>
                      {displayedSavings.toFixed(2)}€
                      <span className="font-normal text-gray-400 ml-1">économisés</span>
                    </span>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest transition-all duration-700"
                      style={{
                        opacity: savingsLabel === 'status' ? 1 : 0,
                        transform: savingsLabel === 'status' ? 'translateY(0)' : 'translateY(8px)',
                        color: subscription === 'celeste' ? '#F5C842' : '#60A5FA',
                      }}
                    >
                      {subscription === 'celeste' ? '✨ Céleste' : '🚀 Explorer'}
                    </span>
                  </div>
                </span>
                <button onClick={() => supabase.auth.signOut()} className="text-xs text-red-500 hover:text-red-700 font-semibold transition">
                  Déconnexion
                </button>
              </div>
            ) : (
              <button onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} className="text-sm font-semibold text-gray-600 hover:text-riviera-azure transition">
                Se connecter
              </button>
            )}
            <a href="#b2b" className="hidden md:inline-block text-sm font-semibold text-riviera-navy border border-riviera-navy px-5 py-2 rounded-full hover:bg-riviera-navy hover:text-white transition">
              Devenir Partenaire
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden min-h-[90vh] flex items-center justify-center text-center">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/intro.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-riviera-navy/60 z-0"></div>
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <span className="text-riviera-gold font-bold tracking-widest text-sm uppercase mb-6 block drop-shadow-lg">Édition locale • Bientôt partout en France</span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8 text-white drop-shadow-xl h-32 md:h-auto">
            L'Art de vivre, <br />
            <span className="text-gradient inline-block transition-opacity duration-500">{words[wordIndex]}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light drop-shadow-md">
            Accédez à l'élite des restaurants, spas et loisirs de votre région avec des privilèges allant jusqu'à -50%. Votre pass exclusif, 100% digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <a href="#tarifs" className="bg-riviera-gold text-riviera-navy font-bold px-10 py-4 rounded-full hover:bg-white transition-all shadow-xl hover:-translate-y-1">
              Obtenir mon Pass
            </a>
            <a href="#carte" className="bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center px-10 py-4 font-medium rounded-full hover:bg-white/30 transition-colors">
              Explorer les adresses
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          </div>
        </div>
      </section>


      {/* Univers */}
      <section id="univers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-3 text-riviera-navy">Cinq univers. Une seule carte.</h2>
            <p className="text-gray-500 text-sm">L'excellence sélectionnée par The Club, en ville et en ligne.</p>
          </div>

          {/* Row 1 : 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {[
              {
                id: 'gastronomie',
                title: 'Gastronomie',
                description: 'Tables étoilées, bistrots cachés et coffee shops pointus.',
                label: "JUSQU'À -50%",
                image: '/gastronomie.jpg',
                color: 'text-riviera-gold',
              },
              {
                id: 'bien-etre',
                title: 'Bien-être',
                description: 'Spas prestigieux, instituts de beauté et salles de sport privées.',
                label: "JUSQU'À -40%",
                image: '/spa.jpg',
                color: 'text-sky-400',
              },
              {
                id: 'loisirs',
                title: 'Loisirs',
                description: 'Activités indoor, simulateurs et expériences inédites.',
                label: "JUSQU'À -50%",
                image: '/bowling.png',
                color: 'text-red-500',
              },
            ].map((cat) => (
              <div
                key={cat.id}
                className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-lg cursor-pointer group transition-all hover:scale-[1.02]"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1 ${cat.color}`}>{cat.label}</p>
                  <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{cat.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium line-clamp-2">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2 : 2 wide cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                id: 'exclu-web',
                title: 'Exclu Web',
                description: 'Réductions exclusives sur vos marques préférées en ligne.',
                label: 'OFFRES NATIONALES',
                badge: 'BIENTÔT DISPONIBLE',
                image: '/sephora.jpg',
                color: 'text-purple-400',
              },
              {
                id: 'e-billetterie',
                title: 'E-billetterie',
                description: "Vos places de spectacles, cinémas et parcs d'attractions à prix réduits.",
                label: 'CONCERTS & PARCS',
                badge: 'BIENTÔT DISPONIBLE',
                image: '/lepal.jpg',
                color: 'text-green-400',
              },
            ].map((cat) => (
              <div
                key={cat.id}
                className="relative aspect-[16/9] rounded-[1.5rem] overflow-hidden shadow-lg cursor-pointer group transition-all hover:scale-[1.01]"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                {cat.badge && (
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full">
                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">{cat.badge}</span>
                  </div>
                )}
                <div className="absolute bottom-5 left-5 right-5">
                  <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1 ${cat.color}`}>{cat.label}</p>
                  <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{cat.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium line-clamp-2">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carte */}
      <section id="carte" className="py-24 bg-riviera-sand relative border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-8 pointer-events-none">
          <div className="text-center md:text-left max-w-2xl mx-auto md:mx-0">
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-riviera-navy pointer-events-auto flex flex-wrap justify-center md:justify-start items-end gap-2">
              Votre terrain de <span className="text-riviera-gold pb-1">jeu.</span>
            </h2>
            <p className="text-gray-600 text-lg pointer-events-auto bg-white/50 inline-block px-4 py-2 rounded-lg backdrop-blur-sm mb-6">Découvrez nos partenaires en temps réel autour de vous.</p>
            <div className="relative pointer-events-auto max-w-md w-full shadow-2xl rounded-2xl bg-white">
              <input id="search-input" type="text" placeholder="Rechercher (ex: Nice, Cagnes, Spa...)" autoComplete="off" className="w-full pl-6 pr-14 py-4 rounded-full border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 focus:outline-none text-sm text-gray-700 bg-white/95 backdrop-blur-md transition-all" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-riviera-navy text-white p-2.5 rounded-full hover:bg-riviera-azure transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
              <div id="search-results" className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl mt-2 hidden overflow-hidden z-50 border border-gray-100"></div>
            </div>
          </div>
        </div>
        <div id="map" className="w-full h-[500px] md:h-[700px] bg-gray-200 z-0 absolute top-0 left-0 right-0 bottom-0 mt-[400px] md:mt-[300px]"></div>
        <div className="h-[400px] md:h-[500px]"></div>
      </section>

      {/* Économies */}
      <section id="economies" className="py-24 bg-riviera-navy text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-riviera-azure rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-riviera-gold rounded-full opacity-10 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-riviera-gold font-semibold tracking-wider text-sm uppercase mb-2 block">Le calcul est vite fait</span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">Rentabilisé dès le premier soir.</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">Concrètement, voici ce qu'il se passe lors d'une sortie en amoureux avec et sans l'application The Club.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center max-w-5xl mx-auto">
            <div className="w-full md:w-1/3 bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-[2rem]">
              <h3 className="font-bold text-xl text-gray-400 mb-6 text-center">Une soirée classique</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm"><span className="text-gray-300">Dîner pour deux</span><span className="text-white font-mono">120 €</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-gray-300">Activité de loisir</span><span className="text-white font-mono">100 €</span></div>
                <hr className="border-slate-700" />
                <div className="flex justify-between items-center"><span className="font-bold">Total Payé</span><span className="text-xl font-bold text-white font-mono">220 €</span></div>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center w-12 h-12 bg-riviera-gold text-riviera-navy font-bold rounded-full z-10 -mx-6 shadow-xl">VS</div>
            <div className="w-full md:w-5/12 bg-gradient-to-br from-riviera-azure/20 to-slate-800 border-2 border-riviera-azure p-8 rounded-[2rem] transform md:scale-105 shadow-2xl relative min-h-[350px]">
              <div className="absolute top-0 left-0 h-1 bg-riviera-azure rounded-t-[2rem] animate-pulse" style={{ width: '100%' }}></div>
              <div className="fade-transition">
                <h3 className="font-bold text-xl text-white mb-6 text-center" dangerouslySetInnerHTML={{ __html: ecoData[ecoIndex].title }}></h3>
                <div className="space-y-4 mb-6" dangerouslySetInnerHTML={{ __html: ecoData[ecoIndex].details }}></div>
                <div className={`font-bold text-center py-3 rounded-xl transition-colors shadow-lg ${ecoData[ecoIndex].colorClass} ${ecoData[ecoIndex].textColor}`}>{ecoData[ecoIndex].savings}</div>
                <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: ecoData[ecoIndex].desc }}></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Abonnements */}
      <section id="tarifs" className="py-24 bg-riviera-sand">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-riviera-azure font-semibold tracking-wider text-sm uppercase mb-2 block">Accès Membre</span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-riviera-navy">Choisissez votre privilège.</h2>
            <p className="text-gray-600">Rejoignez le cercle et commencez à économiser aujourd'hui.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pass Explorer */}
            <div className="bg-white rounded-[2rem] p-8 border border-gray-200 flex flex-col hover:shadow-xl transition-shadow">
              <h3 className="font-serif text-2xl font-bold mb-2 text-riviera-navy">Pass Explorer</h3>
              <p className="text-gray-500 text-sm mb-6 h-10">La solution pour tester l'expérience en illimité ou de passage dans la région.</p>
              <div className="mb-8"><span className="text-5xl font-bold text-riviera-navy tracking-tight">9,90€</span><span className="text-gray-500">/ mois</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-600 font-medium">
                <li className="flex items-center"><svg className="w-5 h-5 text-riviera-azure mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Sans engagement (annulable en 1 clic)</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-riviera-azure mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Offres permanentes (-10% à -20%)</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-riviera-azure mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> 1 Seule Offre Découverte (-50%) / mois</li>
              </ul>
              <button disabled={subscription === 'explorer'} onClick={() => handleSubscription('explorer')} className={`w-full py-4 rounded-xl font-bold transition ${subscription === 'explorer' ? 'bg-green-100 text-green-700 cursor-default' : 'bg-riviera-sand text-riviera-navy border border-gray-200 hover:bg-gray-100'}`}>
                {subscription === 'explorer' ? "✓ Pass Actif" : (user ? "Prendre ce Pass" : "Se connecter pour choisir")}
              </button>
            </div>
            {/* Pass Céleste */}
            <div className="bg-riviera-navy text-white rounded-[2rem] p-8 border-2 border-riviera-gold/30 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
              <div
                className="absolute top-0 right-8 transform -translate-y-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #F5C842, #F59E0B, #F5C842)',
                  backgroundSize: '200% 200%',
                  animation: 'neonGlow 2s ease-in-out infinite, shimmer 3s linear infinite',
                  boxShadow: '0 0 10px #F5C84280, 0 0 20px #F5C84250, 0 0 40px #F5C84230',
                }}
              >Le plus choisi</div>
              <style>{`
                @keyframes neonGlow {
                  0%, 100% { box-shadow: 0 0 8px #F5C84290, 0 0 18px #F5C84260, 0 0 35px #F5C84240; }
                  50% { box-shadow: 0 0 15px #F5C842cc, 0 0 30px #F5C84299, 0 0 55px #F5C84266; }
                }
                @keyframes shimmer {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}</style>
              <h3 className="font-serif text-2xl font-bold mb-2 text-riviera-gold">Pass Céleste</h3>
              <p className="text-gray-300 text-sm mb-6 h-10">L'accès illimité. Conçu pour les résidents qui sortent souvent.</p>
              <div className="mb-8"><span className="text-5xl font-bold tracking-tight">59€</span><span className="text-gray-400">/ an</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300 font-medium">
                <li className="flex items-center"><svg className="w-5 h-5 text-riviera-gold mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> <span className="text-white font-bold">Toutes les offres Découvertes (-50%)</span></li>
                <li className="flex items-center"><svg className="w-5 h-5 text-riviera-gold mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Offres permanentes illimitées</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-riviera-gold mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Exclu Web & E-billetterie nationales</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-riviera-gold mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Événements privés The Club</li>
              </ul>
              <button disabled={subscription === 'celeste'} onClick={() => handleSubscription('celeste')} className={`w-full py-4 rounded-xl font-bold transition shadow-lg ${subscription === 'celeste' ? 'bg-green-100 text-green-700 cursor-default' : 'bg-riviera-gold text-white hover:bg-yellow-600'}`}>
                {subscription === 'celeste' ? "✓ Pass Actif" : (user ? "Devenir Membre" : "Se connecter pour choisir")}
              </button>
              <p className="text-center text-xs text-gray-400 mt-4">Soit seulement 4,91€ / mois. Rentabilisé à la 1ère sortie.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Parrainage */}
      <section className="py-16 bg-gradient-to-r from-riviera-azure to-blue-900 text-white relative border-y border-white/10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="md:w-1/2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-white/30 mb-6">🎁 Programme Ambassadeur</div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Partagez l'excellence. Soyez récompensé.</h2>
            <p className="text-white/80 text-lg">Invitez vos amis à rejoindre l'élite de la région. Le programme ambassadeur The Club est conçu pour vous remercier à la hauteur de votre fidélité.</p>
            <button className="mt-8 bg-white text-riviera-navy text-sm font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition shadow-xl hidden md:inline-block">Générer mon lien d'invitation</button>
          </div>
          <div className="md:w-1/2 w-full flex justify-center min-h-[200px]">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative flex items-center justify-center">
              <div className="fade-transition w-full">
                <div className="text-5xl mb-4">{parrainageData[parrIndex].icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{parrainageData[parrIndex].title}</h3>
                <p className="text-sm font-medium text-blue-100">{parrainageData[parrIndex].text}</p>
              </div>
            </div>
          </div>
          <button className="mt-2 bg-white text-riviera-navy text-sm font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition shadow-xl inline-block md:hidden">Générer mon lien d'invitation</button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-riviera-navy">Questions Fréquentes</h2>
          </div>
          <div className="space-y-4">
            {faqData.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 shadow-sm rounded-2xl bg-gray-50 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white transition-colors focus:outline-none">
                  <span className="font-bold text-lg text-riviera-navy">{faq.q}</span>
                  <svg className="w-5 h-5 text-riviera-azure flex-shrink-0 transition-transform duration-300" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="bg-white px-6 transition-all duration-300 overflow-hidden" style={{ maxHeight: openFaq === idx ? '200px' : '0' }}>
                  <p className="text-gray-600 text-sm pb-5">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B */}
      <section id="b2b" className="relative py-24 bg-riviera-navy text-white overflow-hidden">
        <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80" className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Restaurant Interior" />
        <div className="absolute inset-0 bg-gradient-to-t from-riviera-navy via-riviera-navy/80 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <span className="text-riviera-gold font-semibold tracking-wider text-sm uppercase mb-4 block">Espace Professionnels</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">Attirez la clientèle que vous méritez.</h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto font-light">Intégrez l'écosystème The Club. Zéro frais d'installation, zéro commission cachée. Nous digitalisons vos offres et vous apportons un flux qualifié.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-riviera-navy font-semibold px-8 py-4 rounded-full hover:bg-gray-100 transition shadow-xl">Référencer mon établissement</button>
            <button className="text-white border border-white/30 px-8 py-4 rounded-full hover:bg-white/10 transition backdrop-blur-sm">Découvrir l'offre Pro</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-16 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="font-serif font-bold text-3xl tracking-wide text-riviera-navy mb-8">THE <span className="text-riviera-gold">CLUB</span></div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-600 mb-8">
            <button onClick={() => setLegalModal('cgv')} className="hover:text-riviera-azure transition">Conditions Générales de Vente</button>
            <button onClick={() => setLegalModal('mentions')} className="hover:text-riviera-azure transition">Mentions légales</button>
            <button onClick={() => setLegalModal('confidentialite')} className="hover:text-riviera-azure transition">Politique de confidentialité</button>
            <a href="#faq" className="hover:text-riviera-azure transition">FAQ</a>
            <a href="#b2b" className="hover:text-riviera-azure transition">Devenir Partenaire</a>
          </div>
          <p className="text-gray-500 text-sm mb-2">Conçu et propulsé par l'écosystème <span className="text-riviera-navy font-bold">Instant&amp;You</span>.</p>
          <p className="text-gray-400 text-xs">© 2026 The Club. Tous droits réservés.</p>
        </div>
      </footer>

      {/* ======================================================= */}
      {/* MODAL AUTHENTIFICATION                                   */}
      {/* ======================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-riviera-navy/40 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="font-serif text-3xl font-bold text-riviera-navy mb-2">
              {authMode === 'signup' ? 'Rejoindre The Club' : 'Bon retour.'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {authMode === 'signup' ? 'Créez votre compte pour obtenir votre pass.' : 'Connectez-vous pour accéder à vos privilèges.'}
            </p>
            {message.text && (
              <div className={`p-4 rounded-xl text-sm mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleAuth}>
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Prénom</label>
                  <input type="text" placeholder="Thomas" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Email</label>
                <input type="email" placeholder="thomas@exemple.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Mot de passe</label>
                <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-riviera-navy text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg mt-2 focus:outline-none disabled:opacity-50">
                {loading ? "Chargement..." : (authMode === 'signup' ? "Créer mon compte" : "Se connecter")}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-500">
              {authMode === 'signup' ? "Vous avez déjà un compte ?" : "Nouveau ici ?"}
              <button onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setMessage({ text: "", type: "" }); }} className="ml-1 text-riviera-azure font-bold hover:underline focus:outline-none">
                {authMode === 'signup' ? 'Se connecter' : 'Créer un compte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL LÉGAL (Mentions / RGPD / CGV)                     */}
      {/* ======================================================= */}
      {legalModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-riviera-navy/50 backdrop-blur-sm" onClick={() => setLegalModal(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <h3 className="font-serif text-2xl font-bold text-riviera-navy">
                {LEGAL_CONTENT[legalModal].title}
              </h3>
              <button onClick={() => setLegalModal(null)} className="text-gray-400 hover:text-gray-600 transition focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Scrollable content */}
            <div className="overflow-y-auto px-8 py-6 flex-1">
              {LEGAL_CONTENT[legalModal].content}
            </div>
            {/* Footer tabs */}
            <div className="px-8 py-5 border-t border-gray-100 flex flex-wrap gap-3 justify-center">
              {Object.entries(LEGAL_CONTENT).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setLegalModal(key)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full transition ${legalModal === key ? 'bg-riviera-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {val.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL CLAVIER PIN — FLUX EN 2 ÉTAPES                    */}
      {/* ======================================================= */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPinModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl flex flex-col items-center">

            <button onClick={() => setIsPinModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-riviera-navy mb-1 text-center">{activePartnerName}</h3>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1 text-center">Validation Partenaire</p>
            <p className="text-riviera-azure text-[11px] font-bold uppercase tracking-widest mb-6 text-center">
              {activeOfferType === 'decouverte' ? '⭐ Offre Découverte' : '🔁 Offre Permanente'}
            </p>

            <div className="w-full">
              {/* CAS 1 : OFFRE DÉJÀ UTILISÉE */}
              {currentOfferStatus === 'used' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center text-center">
                  <div className="text-4xl mb-4">❌</div>
                  <h4 className="text-lg font-bold text-gray-800 uppercase">Offre consommée</h4>
                  <p className="text-sm text-gray-500 mt-2">Cette offre découverte est à usage unique.</p>
                  <p className="text-[10px] font-bold text-orange-500 mt-4 uppercase tracking-widest">L'offre permanente reste disponible !</p>
                  <button onClick={() => setIsPinModalOpen(false)} className="mt-6 text-riviera-navy font-bold underline text-sm">Fermer</button>
                </div>

              /* CAS 2 : MAUVAIS PIN */
              ) : currentOfferStatus === 'wrong_pin' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50 flex flex-col items-center text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h4 className="text-lg font-bold text-red-700 uppercase">Code Incorrect</h4>
                  <p className="text-sm text-red-600 mt-2">Le code PIN saisi ne correspond pas à cet établissement.</p>
                  <button onClick={() => { setCurrentOfferStatus('available'); setModalStep('pin'); }} className="mt-6 text-riviera-navy font-bold underline text-sm">Réessayer</button>
                </div>

              /* CAS 3 : ERREUR */
              ) : currentOfferStatus === 'error' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 flex flex-col items-center text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h4 className="text-lg font-bold text-orange-700 uppercase">Erreur d'enregistrement</h4>
                  <p className="text-sm text-orange-600 mt-2">Une erreur est survenue. Vérifiez votre connexion et réessayez.</p>
                  <button onClick={() => { setCurrentOfferStatus('available'); setModalStep('pin'); }} className="mt-6 text-riviera-navy font-bold underline text-sm">Réessayer</button>
                </div>

              /* CAS 4 : SUCCÈS */
              ) : currentOfferStatus === 'success' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-green-200 bg-green-50 flex flex-col items-center text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h4 className="text-xl font-bold text-green-700 uppercase tracking-tight">Offre Validée !</h4>
                  <p className="text-sm text-green-600 mt-3 font-medium">
                    Félicitations, votre avantage est activé. <br />
                    Vos économies ont été ajoutées à votre tableau de bord !
                  </p>
                  <button onClick={() => { animateSavings(displayedSavings, totalSavings); setIsPinModalOpen(false); }} className="mt-8 w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all">
                    Super, merci !
                  </button>
                </div>

              /* CAS 5 : ÉTAPE 1 — SAISIE DU MONTANT */
              ) : modalStep === 'amount' ? (
                <div className="py-6 flex flex-col items-center">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Montant de l'addition</h4>
                  <p className="text-sm text-gray-500 mb-6 text-center">Saisissez le montant total hors remise pour calculer vos économies.</p>
                  <div className="relative w-full max-w-[200px] mb-6">
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className="w-full text-center text-3xl font-bold text-riviera-navy bg-gray-50 border-2 border-gray-200 rounded-xl py-3 focus:border-riviera-navy focus:outline-none"
                    />
                    <span className="absolute right-4 top-4 text-xl font-bold text-gray-400">€</span>
                  </div>
                  <button
                    onClick={() => setModalStep('pin')}
                    disabled={!billAmount || parseFloat(billAmount) <= 0}
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all ${!billAmount || parseFloat(billAmount) <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-riviera-navy text-white active:scale-95'}`}
                  >
                    Continuer
                  </button>
                </div>

              /* CAS 6 : ÉTAPE 2 — CLAVIER PIN */
              ) : (
                <div>
                  <div className="flex justify-center gap-4 mb-6">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${currentPin.length > index ? 'bg-riviera-navy border-riviera-navy' : 'bg-transparent border-gray-300'}`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => addPinDigit(num)}
                        className="h-16 rounded-full text-2xl font-medium bg-gray-50 text-riviera-navy active:bg-gray-200 transition-colors"
                      >
                        {num}
                      </button>
                    ))}
                    <div className="invisible"></div>
                    <button onClick={() => addPinDigit(0)} className="h-16 rounded-full text-2xl font-medium bg-gray-50 text-riviera-navy active:bg-gray-200 transition-colors">
                      0
                    </button>
                    <button onClick={removePinDigit} className="h-16 flex items-center justify-center text-gray-400 active:text-gray-600 transition-colors">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={handleUseOffer}
                    disabled={currentPin.length < 4}
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all ${
                      currentPin.length < 4
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-riviera-navy text-white active:scale-95'
                    }`}
                  >
                    ✨ Valider l'offre avec le code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Script Google Maps */}
      <Script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAqe5OVJNNdypCxK8VjDFNQqN8bE63xEnk"
        strategy="afterInteractive"
        onReady={() => { if (window.initMap) window.initMap(); }}
      />
    </main>
  );
}
