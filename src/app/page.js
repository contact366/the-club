        "use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Script from 'next/script';
import Link from 'next/link';
import InstallPopup from '@/components/InstallPopup';
import Emoji from '@/components/Emoji';

// --- DONNÉES STATIQUES ---
const ecoData = [
  {
    title: 'Avec Le Pass <span class="text-riviera-navy">Explorer (9,90€/m)</span>',
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
  { q: "Comment utiliser The Club chez un partenaire ?", a: "Ouvrez l'application, sélectionnez le partenaire et présentez votre téléphone. Cliquez sur Utiliser l'offre. Le commerçant tape son code secret à 4 chiffres sur votre écran et la remise est appliquée sur votre facture instantanément." },
  { q: "Puis-je changer de pass après souscription ?", a: "Oui. Vous pouvez passer au Pass Céleste à tout moment depuis votre espace membre. La montée en gamme est immédiate. Pour un passage au Pass Explorer ou Aventurier, contactez le support." },
  { q: "Le Pass Aventurier est-il remboursable ?", a: "Le Pass Aventurier est un paiement unique non remboursable une fois activé. Il vous donne accès à la plateforme pendant 72 heures, idéal pour découvrir l'expérience lors d'un séjour." }
];


const PLAN_DETAIL_MAX_HEIGHT = '160px';

function ChevronIcon({ rotated }) {
  return (
    <svg
      className="w-3.5 h-3.5 transition-transform duration-300 ease-out shrink-0"
      style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)' }}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function Home() {

  // --- ÉTATS ---
  const [ecoIndex, setEcoIndex] = useState(0);
  const [parrIndex, setParrIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [openPlanDetail, setOpenPlanDetail] = useState(null);

  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState('none');
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState(0);
  const [userLocation, setUserLocation] = useState(null);

  // Savings animation
  const [displayedSavings, setDisplayedSavings] = useState(0);
  const [savingsLabel, setSavingsLabel] = useState('savings');
  const savingsAnimRef = useRef(null);

  // Active infowindow ref (for instant favourite refresh)
  const activeInfowindowRef = useRef({ iw: null, getContent: null });

  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Favorites
  const [favorites, setFavorites] = useState([]);

  // Referral modal
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);

  // PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [activePartnerName, setActivePartnerName] = useState("");
  const [activeOfferType, setActiveOfferType] = useState("");
  const [currentOfferStatus, setCurrentOfferStatus] = useState('available');
  const [ineligibilityMessage, setIneligibilityMessage] = useState("");
  const [lastSaved, setLastSaved] = useState(0);
  const [billAmount, setBillAmount] = useState("");
  const [modalStep, setModalStep] = useState("amount");

  // ============================================================
  // FONCTIONS
  // ============================================================

  const sauvegarderEconomie = async (montantEconomise) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('montant_economise')
        .eq('id', user.id)
        .single();

      const nouveauTotal = parseFloat(profile?.montant_economise || 0) + montantEconomise;

      await supabase
        .from('profiles')
        .update({ montant_economise: nouveauTotal })
        .eq('id', user.id);

      setTotalSavings(nouveauTotal);
    } catch (err) {
      console.error("Erreur sauvegarde économie :", err.message);
    }
  };

  const verifierEligibilite = useCallback(async (userId, establishmentId, offerType, userPlan) => {
    if (offerType === 'permanente') return { autorise: true };

    const ilYaUnAn = new Date();
    ilYaUnAn.setFullYear(ilYaUnAn.getFullYear() - 1);
    const { data: utilisationEtablissement } = await supabase
      .from('utilisations')
      .select('id')
      .eq('user_id', userId)
      .eq('establishment_id', establishmentId)
      .eq('offer_type', 'decouverte')
      .gte('created_at', ilYaUnAn.toISOString());

    if (utilisationEtablissement && utilisationEtablissement.length > 0) {
      return { autorise: false, message: "Vous avez déjà utilisé l'offre découverte de cet établissement cette année." };
    }

    if (userPlan === 'explorer') {
      const debutDuMois = new Date();
      debutDuMois.setDate(1);
      debutDuMois.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('utilisations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('offer_type', 'decouverte')
        .gte('created_at', debutDuMois.toISOString());
      if (count >= 3) {
        return { autorise: false, message: "Vous avez atteint votre limite de 3 offres découvertes ce mois-ci. Passez au pass Céleste pour l'illimité !" };
      }
    }

    return { autorise: true };
  }, []);

  const checkOfferStatus = useCallback(async (partnerName, offerType) => {
    if (!user || subscription === 'none') return 'available';
    try {
      const currentPartner = partners.find(p => p.name === partnerName);
      if (!currentPartner) return 'available';
      const result = await verifierEligibilite(user.id, currentPartner.id, offerType, subscription);
      if (!result.autorise) return 'used';
    } catch (err) {
      console.error("Erreur vérification offre :", err.message);
    }
    return 'available';
  }, [user, subscription, partners, verifierEligibilite]);

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
    setIneligibilityMessage("");
    if (!user) {
      setCurrentOfferStatus('not_logged');
      setIsPinModalOpen(true);
      return;
    }
    if (subscription === 'none') {
      setCurrentOfferStatus('no_subscription');
      setIsPinModalOpen(true);
      return;
    }
    const currentPartner = partners.find(p => p.name === partnerName);
    if (currentPartner) {
      const result = await verifierEligibilite(user.id, currentPartner.id, offerType, subscription);
      if (!result.autorise) {
        setIneligibilityMessage(result.message || "Cette offre n'est pas disponible.");
        setCurrentOfferStatus('used');
      } else {
        setCurrentOfferStatus('available');
      }
    } else {
      setCurrentOfferStatus('available');
    }
    setIsPinModalOpen(true);
  }, [user, subscription, partners, verifierEligibilite]);

  const handleUseOffer = async () => {
    const currentPartner = partners.find(p => p.name === activePartnerName);

    if (!currentPartner || currentPin !== currentPartner.pin_code) {
      setCurrentOfferStatus('wrong_pin');
      setCurrentPin("");
      return;
    }

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) return;

    const eligibilite = await verifierEligibilite(user.id, currentPartner.id, activeOfferType, subscription);
    if (!eligibilite.autorise) {
      setCurrentOfferStatus('used');
      setCurrentPin("");
      return;
    }

    let saved = 0;
    if (activeOfferType === 'decouverte') {
      const rate = currentPartner.discount_decouverte || 50;
      saved = amount * (rate / 100);
    } else {
      const rate = currentPartner.discount_permanente || 10;
      saved = amount * (rate / 100);
    }

    try {
      const { error } = await supabase.from('utilisations').insert([{
        user_id: user.id,
        establishment_id: currentPartner.id,
        offer_type: activeOfferType,
        original_amount: amount,
        saved_amount: saved,
      }]);
      if (error) throw error;

      await sauvegarderEconomie(saved);
      setLastSaved(saved);
      setCurrentOfferStatus('success');
      setCurrentPin("");
      setModalStep("amount");
      setBillAmount("");
    } catch (err) {
      console.error("Erreur enregistrement offre :", err.message);
      if (err.code === '23505') {
        setIneligibilityMessage("Vous avez déjà utilisé l'offre découverte de cet établissement.");
        setCurrentOfferStatus('used');
      } else {
        setCurrentOfferStatus('error');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    if (authMode === 'signup') {
      if (!cguAccepted) {
        setMessage({ text: "Vous devez accepter les conditions générales d'utilisation.", type: "error" });
        setLoading(false);
        return;
      }
      const { data: signupData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            gender,
            birth_date: birthDate,
            newsletter,
            sms_alerts: smsAlerts,
            cgu_accepted: true,
            cgu_accepted_at: new Date().toISOString(),
          },
        },
      });
      if (!error && signupData?.user) {
        const storedRef = localStorage.getItem('ref_code');
        if (storedRef) {
          try {
            await fetch('/api/referral/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newUserId: signupData.user.id, refCode: storedRef }),
            });
            localStorage.removeItem('ref_code');
          } catch (e) { /* non-blocking */ }
        }
      }
      setMessage(error
        ? { text: error.message, type: "error" }
        : { text: "Compte créé ! Vérifiez votre boîte mail (et vos spams) pour confirmer votre inscription. 📩", type: "success" }
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "Connexion réussie !", type: "success" });
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {}
          );
        }
        setTimeout(() => { setIsAuthModalOpen(false); window.location.reload(); }, 1500);
      }
    }
    setLoading(false);
  };

  const handleGenerateReferral = async () => {
    if (!user) { setAuthMode('login'); setIsAuthModalOpen(true); return; }
    setReferralLoading(true);
    try {
      const response = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (data.link) {
        setReferralLink(data.link);
        setReferralModalOpen(true);
      } else {
        alert("Erreur : " + (data.error || "Impossible de générer le lien"));
      }
    } catch (err) {
      alert("Erreur de connexion.");
    } finally {
      setReferralLoading(false);
    }
  };

  const handleSubscription = async (plan) => {
    if (!user) { setAuthMode('signup'); setIsAuthModalOpen(true); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user.id }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Impossible de générer le lien de paiement");
      }
    } catch (err) {
      alert("Erreur de paiement : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = (plan) => handleSubscription(plan);

  const handleUpgrade = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_type: 'celeste' })
      .eq('id', user.id);
    if (!error) {
      setSubscription('celeste');
    }
  };

  const toggleFavorite = useCallback(async (partnerId) => {
    if (!user) { setAuthMode('login'); setIsAuthModalOpen(true); return; }
    const isFav = favorites.includes(partnerId);
    const newFavorites = isFav ? favorites.filter(id => id !== partnerId) : [...favorites, partnerId];
    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('partner_id', partnerId);
        if (!error) {
          setFavorites(newFavorites);
          window.reactFavorites = newFavorites;
          if (activeInfowindowRef.current.iw && activeInfowindowRef.current.getContent) {
            activeInfowindowRef.current.iw.setContent(activeInfowindowRef.current.getContent());
            setTimeout(() => {
              const favBtn = document.querySelector('.fav-toggle-btn');
              if (favBtn) { favBtn.style.transition = 'transform 0.2s ease'; favBtn.style.transform = 'scale(1.3)'; setTimeout(() => { favBtn.style.transform = 'scale(1)'; }, 200); }
            }, 50);
          }
        }
      } else {
        const { error } = await supabase.from('favorites').insert([{ user_id: user.id, partner_id: partnerId }]);
        if (!error) {
          setFavorites(newFavorites);
          window.reactFavorites = newFavorites;
          if (activeInfowindowRef.current.iw && activeInfowindowRef.current.getContent) {
            activeInfowindowRef.current.iw.setContent(activeInfowindowRef.current.getContent());
            setTimeout(() => {
              const favBtn = document.querySelector('.fav-toggle-btn');
              if (favBtn) { favBtn.style.transition = 'transform 0.2s ease'; favBtn.style.transform = 'scale(1.3)'; setTimeout(() => { favBtn.style.transform = 'scale(1)'; }, 200); }
            }, 50);
          }
        }
      }
    } catch (err) {
      console.error('Erreur toggle favori:', err.message);
    }
  }, [user, favorites]);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^CLUB-[A-Z0-9]{6}$/.test(ref)) localStorage.setItem('ref_code', ref);
  }, []);

  useEffect(() => {
    animateSavings(0, totalSavings);
  }, [totalSavings]);

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
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('montant_economise')
          .eq('id', user.id)
          .single();
        if (data) setTotalSavings(parseFloat(data.montant_economise || 0));
        const { data: favData } = await supabase.from('favorites').select('partner_id').eq('user_id', user.id);
        if (favData) setFavorites(favData.map(f => f.partner_id));
      }
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
        const { data } = await supabase.from('profiles').select('subscription_type, montant_economise').eq('id', user.id).single();
        if (data) {
          setSubscription(data.subscription_type);
          setTotalSavings(parseFloat(data.montant_economise || 0));
        }
      } else {
        setSubscription('none');
        setTotalSavings(0);
      }
    };
    getProfile();
  }, [user]);

  useEffect(() => {
    if (user && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [user]);

  useEffect(() => {
    const ecoInterval = setInterval(() => setEcoIndex(prev => (prev + 1) % ecoData.length), 4000);
    const parrInterval = setInterval(() => setParrIndex(prev => (prev + 1) % parrainageData.length), 5000);
    window.openReactPinModal = openPinModal;
    window.toggleReactFavorite = (partnerId) => toggleFavorite(partnerId);
    window.reactFavorites = favorites;
    return () => {
      clearInterval(ecoInterval);
      clearInterval(parrInterval);
    };
  }, [openPinModal, toggleFavorite, favorites]);

  useEffect(() => {
    window.initMap = () => {
      const mapElement = document.getElementById("map");
      if (!mapElement || !window.google) return;
      activeInfowindowRef.current = { iw: null, getContent: null };

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
            id: p.id,
            name: p.name,
            pos: { lat: p.latitude, lng: p.longitude },
            desc: p.address,
            offerDecouverte: p.offer_decouverte || '',
            offerPermanente: p.offer_permanente || '',
            type: p.category,
            affluence: p.affluence_status || null,
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
        const getInfoContent = () => {
          const fav = loc.id && window.reactFavorites && window.reactFavorites.includes(loc.id);
          const affluenceMap = {
            calme: { label: 'Calme', color: '#22c55e', bg: '#f0fdf4' },
            modere: { label: 'Modéré', color: '#eab308', bg: '#fefce8' },
            plein: { label: 'Plein', color: '#ef4444', bg: '#fef2f2' },
          };
          const aff = loc.affluence && affluenceMap[loc.affluence];
          const affluenceBadge = aff
            ? `<span style="display:inline-block;font-size:10px;font-weight:700;color:${aff.color};background:${aff.bg};border:1px solid ${aff.color}30;padding:2px 8px;border-radius:10px;margin-left:6px;vertical-align:middle;">${aff.label}</span>`
            : '';
          return `
            <div style="color:#0F172A;font-family:-apple-system,sans-serif;padding:12px;min-width:240px;">
              <h4 style="font-weight:700;font-size:18px;margin-bottom:2px;letter-spacing:-0.02em;">${loc.name}</h4>
              <div style="margin-bottom:8px;">
                <span style="font-size:10px;font-weight:bold;color:#0284C7;text-transform:uppercase;letter-spacing:0.05em;">${loc.type}</span>
                ${affluenceBadge}
              </div>
              <p style="font-size:12px;color:#64748b;margin-top:4px;margin-bottom:12px;line-height:1.3;">${loc.desc}</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;font-size:10px;font-weight:bold;padding:6px 8px;border-radius:6px;margin-bottom:6px;text-align:center;">${loc.offerDecouverte}</div>
              <div style="background:#eff6ff;border:1px solid #bfdbfe;color:#0284c7;font-size:10px;font-weight:bold;padding:6px 8px;border-radius:6px;margin-bottom:12px;text-align:center;">${loc.offerPermanente}</div>
              <button onclick="window.openReactPinModal('${safeName}', 'decouverte')" style="display:block;width:100%;background:#0F172A;color:white;text-align:center;padding:10px 0;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;margin-bottom:6px;">
                <img src='https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2b50.svg' alt='⭐' width='14' height='14' style='display:inline-block;vertical-align:middle;margin-right:4px;' /> Offre Découverte (-50%)
              </button>
              <button onclick="window.openReactPinModal('${safeName}', 'permanente')" style="display:block;width:100%;background:#0284C7;color:white;text-align:center;padding:10px 0;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;margin-bottom:6px;">
                <img src='https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f501.svg' alt='🔁' width='14' height='14' style='display:inline-block;vertical-align:middle;margin-right:4px;' /> Offre Permanente
              </button>
              ${loc.id ? `<button class="fav-toggle-btn" onclick="window.toggleReactFavorite('${loc.id}')" style="display:block;width:100%;background:${fav ? '#FEE2E2' : '#F9FAFB'};color:${fav ? '#DC2626' : '#6B7280'};text-align:center;padding:8px 0;border-radius:10px;font-size:12px;font-weight:600;border:1px solid ${fav ? '#FECACA' : '#E5E7EB'};cursor:pointer;margin-top:6px;transition:transform 0.2s ease;">
                <img src='https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${fav ? '2764-fe0f' : '1f90d'}.svg' alt='${fav ? '❤️' : '🤍'}' width='14' height='14' style='display:inline-block;vertical-align:middle;margin-right:4px;' /> ${fav ? 'Dans mes favoris' : 'Ajouter aux favoris'}
              </button>` : ''}
            </div>`;
        };
        const infowindow = new window.google.maps.InfoWindow({ content: getInfoContent() });
        gInfowindows.push(infowindow);
        marker.addListener("click", () => {
          gInfowindows.forEach(iw => iw.close());
          activeInfowindowRef.current = { iw: infowindow, getContent: getInfoContent };
          infowindow.setContent(getInfoContent());
          infowindow.open(map, marker);
        });
        infowindow.addListener('closeclick', () => {
          if (activeInfowindowRef.current.iw === infowindow) {
            activeInfowindowRef.current = { iw: null, getContent: null };
          }
        });
      });

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
        new window.google.maps.InfoWindow({
          content: '<div style="font-family:-apple-system,sans-serif;font-size:11px;font-weight:700;color:#0F172A;padding:2px 4px;"><img src=\'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4cd.svg\' alt=\'📍\' width=\'14\' height=\'14\' style=\'display:inline-block;vertical-align:middle;\' /> Vous êtes ici</div>'
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

      <InstallPopup />


      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/intro.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60 z-0"></div>
        <div className="max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col items-center">
          <h1 className="text-6xl md:text-7xl font-semibold leading-tight mb-6 text-white">
            L&apos;Art de vivre,<br />à prix d&apos;élite.
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-xl mx-auto font-light">
            Restaurants, spas et loisirs d&apos;exception. Jusqu&apos;à −50&nbsp;% chez les meilleurs établissements de votre région.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#tarifs" className="bg-white text-riviera-navy font-semibold px-10 py-4 rounded-2xl hover:bg-gray-100 transition-all duration-300 ease-out shadow-md hover:-translate-y-0.5">
              Obtenir mon Pass
            </a>
            <a href="#carte" className="bg-white/10 text-white border border-white/30 flex items-center justify-center px-10 py-4 font-medium rounded-2xl hover:bg-white/20 transition-all duration-300 ease-out">
              Explorer les adresses
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* GASTRONOMIE */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80" alt="Gastronomie" className="rounded-2xl shadow-md w-full aspect-[4/3] object-cover" />
            </div>
            <div className="md:w-1/2">
              <span className="text-riviera-azure text-sm font-semibold uppercase tracking-widest mb-4 block">Gastronomie</span>
              <h2 className="text-4xl md:text-5xl font-semibold text-riviera-navy mb-6 leading-tight">Tables d&apos;exception.</h2>
              <p className="text-gray-500 text-lg mb-8">Des tables étoilées aux bistrots cachés — sélectionnés pour leur excellence. Jusqu&apos;à −50&nbsp;% sur votre premier dîner.</p>
              <Link href="/gastronomie" className="inline-flex items-center text-riviera-navy font-semibold hover:text-riviera-azure transition-colors duration-300 ease-out">
                Découvrir les tables
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LOISIRS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="md:w-1/2">
              <img src="https://images.unsplash.com/photo-1588499756884-d72584d84df5?auto=format&fit=crop&w=800&q=80" alt="Loisirs" className="rounded-2xl shadow-md w-full aspect-[4/3] object-cover" />
            </div>
            <div className="md:w-1/2">
              <span className="text-riviera-azure text-sm font-semibold uppercase tracking-widest mb-4 block">Loisirs</span>
              <h2 className="text-4xl md:text-5xl font-semibold text-riviera-navy mb-6 leading-tight">Activités uniques.</h2>
              <p className="text-gray-500 text-lg mb-8">Simulateurs, activités indoor, expériences inédites. Des moments mémorables à moindre coût.</p>
              <Link href="/loisirs" className="inline-flex items-center text-riviera-navy font-semibold hover:text-riviera-azure transition-colors duration-300 ease-out">
                Voir les loisirs
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BIEN-ÊTRE */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <img src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80" alt="Bien-être" className="rounded-2xl shadow-md w-full aspect-[4/3] object-cover" />
            </div>
            <div className="md:w-1/2">
              <span className="text-riviera-azure text-sm font-semibold uppercase tracking-widest mb-4 block">Bien-être</span>
              <h2 className="text-4xl md:text-5xl font-semibold text-riviera-navy mb-6 leading-tight">Votre espace zen.</h2>
              <p className="text-gray-500 text-lg mb-8">Spas prestigieux, instituts de beauté et salles de sport privées. Prenez soin de vous à prix privilégié.</p>
              <Link href="/bien-etre" className="inline-flex items-center text-riviera-navy font-semibold hover:text-riviera-azure transition-colors duration-300 ease-out">
                Explorer le bien-être
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-riviera-navy mb-4">Comment ça marche.</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Trois étapes simples pour accéder à tous vos privilèges.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
                title: "Créez votre compte",
                desc: "Inscrivez-vous en 2 minutes et choisissez votre formule."
              },
              {
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>),
                title: "Trouvez vos adresses",
                desc: "Explorez la carte interactive et repérez les établissements partenaires."
              },
              {
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>),
                title: "Profitez de vos remises",
                desc: "Présentez l'app à la caisse et le commerçant valide votre avantage en quelques secondes."
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-riviera-navy flex items-center justify-center text-white mb-6 shadow-md">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-riviera-navy mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
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
      <section id="economies" className="py-24 bg-riviera-navy text-white">
  <div className="max-w-[1200px] mx-auto px-6 text-center">

    <h2 className="text-4xl md:text-5xl font-semibold mb-6">
      Rentabilisé dès la première sortie.
    </h2>

    <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-4">
      Avec le Pass Céleste, une seule sortie suffit souvent à amortir votre abonnement.
    </p>

    <p className="text-gray-400 text-base font-semibold mb-8">En moyenne :</p>

    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-sm text-gray-400">Économie par sortie</p>
        <p className="text-2xl font-semibold mt-2">~35€</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-sm text-gray-400">Économie par mois (2 sorties)</p>
        <p className="text-2xl font-semibold mt-2">~70€</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-sm text-gray-400">Pass Céleste</p>
        <p className="text-2xl font-semibold mt-2">14,90€ / mois</p>
        <p className="text-sm text-gray-400 mt-1">Amorti dès la première utilisation</p>
      </div>

    </div>

    <p className="text-xs text-gray-500 mt-8">
      Estimations indicatives selon l&apos;usage et les offres partenaires.
    </p>

  </div>
</section>
      {/* Profil Utilisateur Idéal */}
      <section className="py-24 bg-riviera-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-riviera-azure font-semibold tracking-wider text-sm uppercase mb-2 block">Pour qui ?</span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-riviera-navy mb-3">The Club est fait pour vous.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Que vous soyez citadin actif, amoureux ou voyageur, The Club s'adapte à votre style de vie.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                emoji: "💑",
                title: "Couples citadins",
                desc: "Dîners romantiques, sorties bien-être, week-ends en amoureux. Profitez de chaque moment à moindre coût.",
                tags: ["Restaurants", "Spas", "Loisirs"],
                usage: "Dîners en couple, spa le week-end"
              },
              {
                emoji: "👔",
                title: "Jeunes professionnels",
                desc: "Afterwork entre collègues, déjeuners d'affaires, activités sportives. L'art de vivre en ville sans se ruiner.",
                tags: ["Afterwork", "Déjeuners", "Sport"],
                usage: "Restaurants le midi, afterwork"
              },
              {
                emoji: "✈️",
                title: "Voyageurs réguliers",
                desc: "De passage sur la Côte d'Azur ? Découvrez les meilleures adresses locales avec des remises exclusives.",
                tags: ["Découverte", "Gastronomie", "Culture"],
                usage: "Activités, bons restaurants locaux"
              },
              {
                emoji: "🌟",
                title: "Amateurs de bons plans",
                desc: "Sorties week-end, activités inédites, bonnes tables. Vivez l'excellence sans sacrifier votre budget.",
                tags: ["Week-end", "Activités", "Bonne table"],
                usage: "Spa, activités, sorties week-end"
              }
            ].map((profile, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="text-5xl mb-4"><Emoji symbol={profile.emoji} label={profile.title} size={48} /></div>
                <h3 className="font-bold text-lg text-riviera-navy mb-2">{profile.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">{profile.desc}</p>
                <p className="text-xs text-riviera-azure font-semibold mb-3 italic">&ldquo;{profile.usage}&rdquo;</p>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="text-xs font-semibold bg-riviera-sand text-riviera-navy px-3 py-1 rounded-full border border-gray-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Mobile PWA */}
      <section className="py-20 bg-riviera-navy text-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 text-center md:text-left">
              <span className="text-riviera-gold font-semibold tracking-wider text-sm uppercase mb-4 block"><Emoji symbol="📱" label="mobile" size={16} /> Application Mobile</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">Toujours dans<br className="hidden md:block" /> votre poche.</h2>
              <p className="text-gray-300 text-lg mb-8">The Club fonctionne comme une vraie application mobile, directement depuis votre navigateur. Zéro téléchargement, 100% disponible.</p>
              <div className="space-y-4">
                {[
                  { icon: "📲", text: "Ajoutez The Club à votre écran d'accueil en un tap" },
                  { icon: "🔔", text: "Notifications, accès rapide, expérience native" },
                  { icon: "💯", text: "100% digital, toujours dans votre poche" },
                  { icon: "🚀", text: "Compatible iOS & Android, sans passer par l'App Store" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-2xl flex-shrink-0"><Emoji symbol={item.icon} size={24} /></span>
                    <p className="text-gray-200 text-sm font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="text-7xl mb-4"><Emoji symbol="📱" label="mobile" size={72} /></div>
                <h3 className="font-bold text-xl text-white mb-2">Installez l'app</h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">Sans téléchargement. Directement depuis votre navigateur mobile, ajoutez The Club à votre écran d'accueil.</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/20">
                    <p className="text-white font-bold"><Emoji symbol="🍎" label="iOS" size={18} /> iOS</p>
                    <p className="text-gray-400 text-xs mt-1">Safari → Partager → Écran d'accueil</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/20">
                    <p className="text-white font-bold"><Emoji symbol="🤖" label="Android" size={18} /> Android</p>
                    <p className="text-gray-400 text-xs mt-1">Chrome → Menu → Ajouter à l'écran</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grille ROI sur 3/6/12 mois */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-riviera-gold font-semibold tracking-wider text-sm uppercase mb-2 block">Retour sur investissement</span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-riviera-navy mb-3">Le calcul est évident.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Basé sur 2 sorties par mois avec une économie moyenne de 35€ par sortie. Vos économies s'accumulent chaque mois.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

            {/* Pass Explorer ROI */}
            <div className="rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-riviera-sand px-8 py-6 border-b border-gray-200">
                <h3 className="font-serif text-2xl font-bold text-riviera-navy"><Emoji symbol="🚀" label="explorer" size={24} /> Pass Explorer</h3>
                <p className="text-riviera-azure font-bold text-xl mt-1">9,90 € / mois</p>
                <div className="grid grid-cols-4 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  <span>Durée</span>
                  <span>Coût</span>
                  <span>Économies</span>
                  <span className="text-green-600">Gain net</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { period: "3 mois", cost: "29,70 €", savings: "210 €", net: "+180,30 €" },
                  { period: "6 mois", cost: "59,40 €", savings: "420 €", net: "+360,60 €" },
                  { period: "12 mois", cost: "118,80 €", savings: "840 €", net: "+721,20 €" }
                ].map((row, idx) => (
                  <div key={idx} className={`grid grid-cols-4 px-8 py-4 text-sm items-center ${idx === 2 ? 'bg-green-50/50' : ''}`}>
                    <span className="font-bold text-riviera-navy">{row.period}</span>
                    <span className="text-gray-500">{row.cost}</span>
                    <span className="text-gray-700 font-medium">{row.savings}</span>
                    <span className={`font-bold ${idx === 2 ? 'text-green-600 text-base' : 'text-green-500'}`}>{row.net}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pass Céleste ROI */}
            <div className="rounded-3xl border-2 border-riviera-gold/40 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="bg-riviera-navy px-8 py-6 border-b border-riviera-gold/20">
                <h3 className="font-serif text-2xl font-bold text-riviera-gold"><Emoji symbol="✨" label="céleste" size={24} /> Pass Céleste</h3>
                <p className="text-gray-300 font-bold text-xl mt-1">59 € / an <span className="text-xs font-normal text-gray-400">(paiement unique)</span></p>
                <div className="grid grid-cols-4 mt-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  <span>Durée</span>
                  <span>Coût**</span>
                  <span>Économies</span>
                  <span className="text-riviera-gold">Gain net</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { period: "3 mois", cost: "~14,75 €", savings: "210 €", net: "+195,25 €" },
                  { period: "6 mois", cost: "~29,50 €", savings: "420 €", net: "+390,50 €" },
                  { period: "12 mois", cost: "59 €", savings: "840 €", net: "+781 €" }
                ].map((row, idx) => (
                  <div key={idx} className={`grid grid-cols-4 px-8 py-4 text-sm items-center ${idx === 2 ? 'bg-green-50' : ''}`}>
                    <span className="font-bold text-riviera-navy">{row.period}</span>
                    <span className="text-gray-500">{row.cost}</span>
                    <span className="text-gray-700 font-medium">{row.savings}</span>
                    <span className={`font-bold ${idx === 2 ? 'text-green-600 text-base' : 'text-green-500'}`}>{row.net}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
          <p className="text-center text-xs text-gray-400 mt-6">* Estimation basée sur 2 sorties/mois avec une économie moyenne de 35€ par sortie. Résultats indicatifs, variables selon l'usage.<br />** Le Pass Céleste (59€) est réglé en une seule fois à l'année. Le coût prorata indique la fraction du coût annuel sur la période.</p>
        </div>
      </section>

      {/* Abonnements */}
      <section id="tarifs" className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-riviera-azure font-semibold tracking-wider text-sm uppercase mb-2 block">Accès Membre</span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-riviera-navy">Choisissez votre privilège.</h2>
            <p className="text-gray-500">Rejoignez le cercle et commencez à économiser aujourd'hui.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">

            {/* Pass Aventurier */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col transition-shadow duration-300 ease-out hover:shadow-md">
              <div className="mb-6">
                <h3 className="font-serif text-xl font-bold text-riviera-navy mb-1 flex items-center gap-2"><Emoji symbol="🤠" label="aventurier" size={20} /> Pass Aventurier</h3>
                <p className="text-gray-500 text-sm">Le pass éphémère pour tester l'expérience le temps d'un week-end.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-riviera-navy tracking-tight">4,90€</span>
                <span className="text-gray-400 text-sm ml-1">paiement unique</span>
              </div>
              <ul className="space-y-3 mb-5 flex-1 text-sm text-gray-600">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Accès 72H</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> 1 Offre Découverte (-50%)</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Offres permanentes illimitées (-10% à -20%)</li>
              </ul>
              <button
                onClick={() => setOpenPlanDetail(openPlanDetail === 'aventurier' ? null : 'aventurier')}
                className="text-xs text-riviera-azure font-medium mb-5 text-left flex items-center gap-1 hover:underline transition-colors duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-riviera-azure rounded"
                aria-expanded={openPlanDetail === 'aventurier'}
                aria-controls="detail-aventurier"
              >
                <ChevronIcon rotated={openPlanDetail === 'aventurier'} />
                {openPlanDetail === 'aventurier' ? 'Masquer les détails' : 'Voir tous les détails'}
              </button>
              <div
                id="detail-aventurier"
                role="region"
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ maxHeight: openPlanDetail === 'aventurier' ? PLAN_DETAIL_MAX_HEIGHT : '0' }}
                aria-hidden={openPlanDetail !== 'aventurier'}
              >
                <ul className="space-y-2 text-xs text-gray-500 mb-5 pl-3 border-l-2 border-gray-100">
                  <li>Carte interactive en temps réel</li>
                  <li>Sans abonnement — accès unique 72 heures</li>
                  <li>Idéal pour les visiteurs de passage</li>
                </ul>
              </div>
              <button disabled={subscription === 'aventurier'} onClick={() => handleSubscription('aventurier')} className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-300 ease-out ${subscription === 'aventurier' ? 'bg-green-50 text-green-700 cursor-default border border-green-200' : 'bg-gray-50 text-riviera-navy border border-gray-200 hover:bg-gray-100'}`}>
                {subscription === 'aventurier' ? "✓ Pass Actif" : (user ? "Choisir ce Pass" : "Se connecter pour choisir")}
              </button>
            </div>

            {/* Pass Explorer */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col transition-shadow duration-300 ease-out hover:shadow-md">
              <div className="mb-6">
                <h3 className="font-serif text-xl font-bold text-riviera-navy mb-1 flex items-center gap-2"><Emoji symbol="🚀" label="explorer" size={20} /> Pass Explorer</h3>
                <p className="text-gray-500 text-sm">Sans engagement. Testez l'expérience illimitée, mois par mois.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-riviera-navy tracking-tight">9,90€</span>
                <span className="text-gray-400 text-sm ml-1">/ mois</span>
              </div>
              <ul className="space-y-3 mb-5 flex-1 text-sm text-gray-600">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Sans engagement</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Jusqu'à 5 Offres Découvertes (-50%) / mois</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Offres permanentes illimitées (-10% à -20%)</li>
              </ul>
              <button
                onClick={() => setOpenPlanDetail(openPlanDetail === 'explorer' ? null : 'explorer')}
                className="text-xs text-riviera-azure font-medium mb-5 text-left flex items-center gap-1 hover:underline transition-colors duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-riviera-azure rounded"
                aria-expanded={openPlanDetail === 'explorer'}
                aria-controls="detail-explorer"
              >
                <ChevronIcon rotated={openPlanDetail === 'explorer'} />
                {openPlanDetail === 'explorer' ? 'Masquer les détails' : 'Voir tous les détails'}
              </button>
              <div
                id="detail-explorer"
                role="region"
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ maxHeight: openPlanDetail === 'explorer' ? PLAN_DETAIL_MAX_HEIGHT : '0' }}
                aria-hidden={openPlanDetail !== 'explorer'}
              >
                <ul className="space-y-2 text-xs text-gray-500 mb-5 pl-3 border-l-2 border-gray-100">
                  <li>Annulable en 1 clic depuis votre espace membre</li>
                  <li>Accès aux exclusivités Web "The Club" (bientôt)</li>
                  <li>Carte interactive partenaires en temps réel</li>
                </ul>
              </div>
              <button disabled={subscription === 'explorer'} onClick={() => handleSubscription('explorer')} className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-300 ease-out ${subscription === 'explorer' ? 'bg-green-50 text-green-700 cursor-default border border-green-200' : 'bg-gray-50 text-riviera-navy border border-gray-200 hover:bg-gray-100'}`}>
                {subscription === 'explorer' ? "✓ Pass Actif" : (user ? "Choisir ce Pass" : "Se connecter pour choisir")}
              </button>
            </div>

            {/* Pass Céleste — Recommandé */}
            <div className="bg-white rounded-2xl p-8 border-2 border-riviera-azure shadow-md flex flex-col relative transition-shadow duration-300 ease-out hover:shadow-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-riviera-azure text-white text-xs font-semibold px-4 py-1 rounded-full tracking-wide">Recommandé</span>
              </div>
              <div className="mb-6">
                <h3 className="font-serif text-xl font-bold text-riviera-navy mb-1 flex items-center gap-2"><Emoji symbol="✨" label="céleste" size={20} /> Pass Céleste</h3>
                <p className="text-gray-500 text-sm">L'accès illimité. Rentabilisé dès la première sortie.</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-riviera-navy tracking-tight">59€</span>
                <span className="text-gray-400 text-sm ml-1">/ an</span>
                <p className="text-xs text-riviera-azure font-medium mt-1">Soit 0,66€/jour</p>
              </div>
              <ul className="space-y-3 mb-5 flex-1 text-sm text-gray-700">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> <span className="font-semibold">Offres Découvertes illimitées (-50%)</span></li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Offres permanentes illimitées</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-riviera-azure shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Événements privés The Club</li>
              </ul>
              <button
                onClick={() => setOpenPlanDetail(openPlanDetail === 'celeste' ? null : 'celeste')}
                className="text-xs text-riviera-azure font-medium mb-5 text-left flex items-center gap-1 hover:underline transition-colors duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-riviera-azure rounded"
                aria-expanded={openPlanDetail === 'celeste'}
                aria-controls="detail-celeste"
              >
                <ChevronIcon rotated={openPlanDetail === 'celeste'} />
                {openPlanDetail === 'celeste' ? 'Masquer les détails' : 'Voir tous les détails'}
              </button>
              <div
                id="detail-celeste"
                role="region"
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ maxHeight: openPlanDetail === 'celeste' ? PLAN_DETAIL_MAX_HEIGHT : '0' }}
                aria-hidden={openPlanDetail !== 'celeste'}
              >
                <ul className="space-y-2 text-xs text-gray-500 mb-5 pl-3 border-l-2 border-riviera-azure/30">
                  <li>Exclu Web &amp; E-billetterie nationale (bientôt)</li>
                  <li>Accès gastronomie, bien-être, loisirs</li>
                  <li>Programme ambassadeur inclus</li>
                </ul>
              </div>
              <button disabled={subscription === 'celeste'} onClick={() => handleSubscription('celeste')} className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-300 ease-out ${subscription === 'celeste' ? 'bg-green-50 text-green-700 cursor-default border border-green-200' : 'bg-riviera-azure text-white hover:bg-sky-700'}`}>
                {subscription === 'celeste' ? "✓ Pass Actif" : (user ? "Devenir Membre" : "Se connecter pour choisir")}
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Parrainage */}
      <section className="py-16 bg-riviera-navy text-white relative border-y border-white/10 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="md:w-1/2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-white/30 mb-6"><Emoji symbol="🎁" label="cadeau" size={16} /> Programme Ambassadeur</div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Partagez l'excellence. Soyez récompensé.</h2>
            <p className="text-white/80 text-lg">Invitez vos amis à rejoindre l'élite de la région. Le programme ambassadeur The Club est conçu pour vous remercier à la hauteur de votre fidélité.</p>
            <button onClick={handleGenerateReferral} disabled={referralLoading} className="mt-8 bg-white text-riviera-navy text-sm font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition shadow-xl hidden md:inline-block disabled:opacity-70">{referralLoading ? 'Génération...' : 'Générer mon lien d\'invitation'}</button>
          </div>
          <div className="md:w-1/2 w-full flex justify-center min-h-[200px]">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative flex items-center justify-center">
              <div className="fade-transition w-full">
                <div className="text-5xl mb-4"><Emoji symbol={parrainageData[parrIndex].icon} size={48} /></div>
                <h3 className="text-xl font-bold text-white mb-2">{parrainageData[parrIndex].title}</h3>
                <p className="text-sm font-medium text-blue-100">{parrainageData[parrIndex].text}</p>
              </div>
            </div>
          </div>
          <button onClick={handleGenerateReferral} disabled={referralLoading} className="mt-2 bg-white text-riviera-navy text-sm font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition shadow-xl inline-block md:hidden disabled:opacity-70">{referralLoading ? 'Génération...' : 'Générer mon lien d\'invitation'}</button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-riviera-azure font-semibold tracking-wider text-sm uppercase mb-2 block">Vos questions</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-riviera-navy">Questions Fréquentes</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqData.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-riviera-azure rounded-2xl"
                  aria-expanded={openFaq === idx}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className="font-semibold text-base text-riviera-navy pr-4">{faq.q}</span>
                  <svg className="w-4 h-4 text-riviera-azure flex-shrink-0 transition-transform duration-300 ease-out" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  className="transition-all duration-300 ease-out overflow-hidden"
                  style={{ maxHeight: openFaq === idx ? '200px' : '0' }}
                  aria-hidden={openFaq !== idx}
                >
                  <p className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B */}
      <section id="b2b" className="relative py-24 bg-riviera-navy text-white overflow-hidden">
        <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80" className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Restaurant Interior" />
        <div className="absolute inset-0 bg-riviera-navy/70"></div>
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <span className="text-riviera-gold font-semibold tracking-wider text-sm uppercase mb-4 block">Espace Professionnels</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">Attirez la clientèle que vous méritez.</h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto font-light">Intégrez l'écosystème The Club. Zéro frais d'installation, zéro commission cachée. Nous digitalisons vos offres et vous apportons un flux qualifié.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/espace-partenaire" className="bg-white text-riviera-navy font-semibold px-8 py-4 rounded-full hover:bg-gray-100 transition shadow-xl">Référencer mon établissement</Link>
            <Link href="/espace-partenaire" className="text-white border border-white/30 px-8 py-4 rounded-full hover:bg-white/10 transition backdrop-blur-sm">Découvrir l&apos;offre Pro</Link>
          </div>
        </div>
      </section>


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
            {(authMode === 'login' || authMode === 'signup') && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:shadow-md hover:bg-gray-50 transition-all disabled:opacity-50 focus:outline-none"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  Se connecter avec Google
                </button>
                <div className="flex items-center my-4 gap-3">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400">ou</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              </div>
            )}
            <form className="space-y-4" onSubmit={handleAuth}>
              {authMode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Prénom *</label>
                      <input type="text" placeholder="Thomas" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nom *</label>
                      <input type="text" placeholder="Dupont" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">N° de téléphone</label>
                    <input type="tel" placeholder="+33 6 00 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Genre</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all bg-white">
                        <option value="">Choisir</option>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                        <option value="autre">Autre</option>
                        <option value="non_precise">Ne pas préciser</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Date de naissance *</label>
                      <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Email</label>
                <input type="email" placeholder="thomas@exemple.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Mot de passe</label>
                <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 outline-none transition-all" />
              </div>
              {authMode === 'signup' && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-0.5 rounded" />
                    <span className="text-xs text-gray-600">Restez informés de nos nouvelles offres, inscrivez-vous à la newsletter</span>
                  </label>
                  <label className={`flex items-start gap-3 ${!phone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} disabled={!phone} className="mt-0.5 rounded" />
                    <span className="text-xs text-gray-600">S&apos;inscrire aux alertes SMS</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={cguAccepted} onChange={(e) => setCguAccepted(e.target.checked)} required className="mt-0.5 rounded" />
                    <span className="text-xs text-gray-600">J&apos;accepte les <span className="font-semibold text-gray-900">conditions générales d&apos;utilisation</span> *</span>
                  </label>
                </div>
              )}
              <button type="submit" disabled={loading || (authMode === 'signup' && !cguAccepted)} className="w-full bg-riviera-navy text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg mt-2 focus:outline-none disabled:opacity-50">
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
      {/* MODAL AMBASSADEUR — Lien de parrainage                  */}
      {/* ======================================================= */}
      {referralModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-riviera-navy/40 backdrop-blur-sm" onClick={() => setReferralModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <button onClick={() => setReferralModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3"><Emoji symbol="🎁" label="cadeau" size={48} /></div>
              <h3 className="font-serif text-2xl font-bold text-riviera-navy mb-2">Votre lien ambassadeur</h3>
              <p className="text-sm text-gray-500">Partagez ce lien avec vos amis et recevez vos récompenses !</p>
            </div>
            <div className="bg-riviera-sand rounded-2xl p-4 mb-6 flex items-center gap-3">
              <span className="text-sm text-gray-700 font-mono break-all flex-1">{referralLink}</span>
              <button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(referralLink); alert('Lien copié ! 📋'); }
                  catch { prompt('Votre lien de parrainage :', referralLink); }
                }}
                className="shrink-0 bg-riviera-azure text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition"
              >
                Copier
              </button>
            </div>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() => navigator.share({ title: 'The Club — Mon invitation', text: "Rejoins The Club avec mon lien d'invitation !", url: referralLink })}
                className="w-full bg-riviera-navy text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition"
              >
                <Emoji symbol="📤" label="partager" size={18} /> Partager
              </button>
            )}
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
              {activeOfferType === 'decouverte' ? <><Emoji symbol="⭐" label="découverte" size={14} /> Offre Découverte</> : <><Emoji symbol="🔁" label="permanente" size={14} /> Offre Permanente</>}
            </p>

            <div className="w-full">
              {/* CAS 0 : NON CONNECTÉ */}
              {currentOfferStatus === 'not_logged' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-riviera-navy/20 bg-slate-50 flex flex-col items-center text-center">
                  <div className="text-4xl mb-4"><Emoji symbol="🔐" label="connexion requise" size={40} /></div>
                  <h4 className="text-lg font-bold text-riviera-navy uppercase">Connexion requise</h4>
                  <p className="text-sm text-gray-500 mt-2">Vous devez être connecté pour profiter de cette offre.</p>
                  <button onClick={() => { setIsPinModalOpen(false); setAuthMode('login'); setIsAuthModalOpen(true); }} className="mt-6 w-full bg-riviera-navy text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all">
                    Se connecter
                  </button>
                  <button onClick={() => { setIsPinModalOpen(false); setAuthMode('signup'); setIsAuthModalOpen(true); }} className="mt-3 text-riviera-azure font-bold underline text-sm">
                    Créer un compte
                  </button>
                </div>

              ) : currentOfferStatus === 'no_subscription' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-riviera-gold/40 bg-amber-50 flex flex-col items-center text-center">
                  <div className="text-4xl mb-4"><Emoji symbol="⭐" label="pass requis" size={40} /></div>
                  <h4 className="text-lg font-bold text-riviera-navy uppercase">Pass requis</h4>
                  <p className="text-sm text-gray-500 mt-2">Choisissez un pass pour accéder aux offres partenaires.</p>
                  <button onClick={() => { setIsPinModalOpen(false); document.getElementById('tarifs')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-6 w-full bg-riviera-gold text-riviera-navy font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all">
                    Voir les abonnements
                  </button>
                </div>

              ) : currentOfferStatus === 'used' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center text-center">
                  <div className="text-4xl mb-4"><Emoji symbol="❌" label="offre indisponible" size={40} /></div>
                  <h4 className="text-lg font-bold text-gray-800 uppercase">Offre indisponible</h4>
                  <p className="text-sm text-gray-500 mt-2">{ineligibilityMessage || "Cette offre découverte est à usage unique."}</p>
                  {subscription === 'explorer' && ineligibilityMessage?.includes('limite') && (
                    <button onClick={() => { setIsPinModalOpen(false); handleSubscription('celeste'); }} className="mt-5 bg-riviera-gold text-riviera-navy text-xs font-bold px-5 py-2.5 rounded-full shadow-md">
                      <Emoji symbol="✨" label="céleste" size={16} /> Passer au Pass Céleste
                    </button>
                  )}
                  <p className="text-[10px] font-bold text-orange-500 mt-4 uppercase tracking-widest">L'offre permanente reste disponible !</p>
                  <button onClick={() => setIsPinModalOpen(false)} className="mt-4 text-riviera-navy font-bold underline text-sm">Fermer</button>
                </div>

              ) : currentOfferStatus === 'wrong_pin' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50 flex flex-col items-center text-center">
                  <div className="text-4xl mb-4"><Emoji symbol="🔒" label="code incorrect" size={40} /></div>
                  <h4 className="text-lg font-bold text-red-700 uppercase">Code Incorrect</h4>
                  <p className="text-sm text-red-600 mt-2">Le code PIN saisi ne correspond pas à cet établissement.</p>
                  <button onClick={() => { setCurrentOfferStatus('available'); setModalStep('pin'); }} className="mt-6 text-riviera-navy font-bold underline text-sm">Réessayer</button>
                </div>

              ) : currentOfferStatus === 'error' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 flex flex-col items-center text-center">
                  <div className="text-4xl mb-4"><Emoji symbol="⚠️" label="erreur" size={40} /></div>
                  <h4 className="text-lg font-bold text-orange-700 uppercase">Erreur d'enregistrement</h4>
                  <p className="text-sm text-orange-600 mt-2">Une erreur est survenue. Vérifiez votre connexion et réessayez.</p>
                  <button onClick={() => { setCurrentOfferStatus('available'); setModalStep('pin'); }} className="mt-6 text-riviera-navy font-bold underline text-sm">Réessayer</button>
                </div>

              ) : currentOfferStatus === 'success' ? (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-green-200 bg-green-50 flex flex-col items-center text-center">
                  <div className="text-5xl mb-4"><Emoji symbol="🎉" label="succès" size={48} /></div>
                  <h4 className="text-xl font-bold text-green-700 uppercase tracking-tight">Offre Validée !</h4>
                  <p className="text-sm text-green-600 mt-3 font-medium">
                    Félicitations, votre avantage est activé.
                  </p>
                  <div className="mt-4 bg-white border border-green-200 rounded-2xl px-6 py-3 shadow-sm">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Économie réalisée</p>
                    <p className="text-3xl font-bold text-green-600 font-mono">+{lastSaved.toFixed(2)} €</p>
                  </div>
                  <button onClick={() => setIsPinModalOpen(false)} className="mt-8 w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all">
                    Super, merci !
                  </button>
                </div>

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
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all ${currentPin.length < 4 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-riviera-navy text-white active:scale-95'}`}
                  >
                    <Emoji symbol="✨" label="valider" size={16} /> Valider l&apos;offre avec le code
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
