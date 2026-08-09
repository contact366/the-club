        "use client";
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import Script from 'next/script';
import Link from 'next/link';
import InstallPopup from '@/components/InstallPopup';
import Emoji from '@/components/Emoji';
import MoodExplorer, { MOOD_CATEGORIES } from '@/components/club/MoodExplorer';
import RivieraMap from '@/components/club/RivieraMap';
import { generatePartnerSlug } from '@/lib/slugUtils';

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
    title: 'Avec Le Pass <span class="text-riviera-gold">Céleste (14,90€/m)</span>',
    details: `
      <div class="flex justify-between items-center text-sm"><span class="text-gray-300">Dîner pour deux <span class="text-green-400 text-xs font-bold bg-green-500/20 px-2 py-0.5 rounded ml-1">-50%</span></span><span class="text-white font-mono">60 €</span></div>
      <div class="flex justify-between items-center text-sm mt-4"><span class="text-gray-300">Activité de loisir <span class="text-green-400 text-xs font-bold bg-green-500/20 px-2 py-0.5 rounded ml-1">-50%</span></span><span class="text-white font-mono">50 €</span></div>
      <hr class="border-riviera-azure/30 my-4">
      <div class="flex justify-between items-center"><span class="font-bold text-lg">Total Payé</span><span class="text-3xl font-bold text-white font-mono">110 €</span></div>`,
    savings: 'Économie sur la soirée : 110 €',
    desc: 'Votre pass mensuel à 14,90€ est <span class="text-white font-semibold underline decoration-riviera-gold">rentabilisé dès la première sortie</span> !',
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
  { q: "Le Pass Explorer est-il avec engagement ?", a: "Non, le Pass Explorer (9,90€/mois) est totalement sans engagement. Vous pouvez l'annuler en un seul clic depuis votre espace membre. Le Pass Céleste (14,90€/mois) est également sans engagement et vous donne accès à des avantages exclusifs supplémentaires." },
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
  const [simSorties, setSimSorties] = useState(3);

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

  // Explorer / Mood filters (new)
  const [activeMood, setActiveMood] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);
  const [mapCity, setMapCity] = useState('all');
  const [memberTab, setMemberTab] = useState('dashboard');

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

      // 🏅 Validation automatique des badges d'exploration (non bloquant)
      try {
        if (currentPartner) {
          await fetch('/api/badges/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              establishmentId: currentPartner.id,
              partnerCategory: currentPartner.category || '',
            }),
          });
        }
      } catch (badgeErr) {
        // Non bloquant : si la validation badge échoue, l'offre reste validée normalement
        console.error('Erreur validation badge (non bloquant):', badgeErr.message);
      }
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
              <a href="/experiences/${generatePartnerSlug(loc.name, loc.desc)}" style="display:block;width:100%;background:#F8FAFC;color:#0F172A;text-align:center;padding:10px 0;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #E2E8F0;cursor:pointer;margin-bottom:6px;text-decoration:none;">Voir la fiche →</a>
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
  // DONNÉES DÉRIVÉES
  // ============================================================

  // Extraction d'une ville depuis l'adresse partenaire
  const extractCity = (address = '') => {
    const known = ['Nice', 'Cannes', 'Antibes', 'Monaco', 'Menton', 'Grasse',
      'Cagnes', 'Villefranche', 'Vence', 'Juan', 'Mougins', 'Sophia'];
    const found = known.find(c => address.includes(c));
    return found || '';
  };

  // Partenaires filtrés (mood + search + city + category)
  const filteredPartners = useMemo(() => {
    let list = [...partners];

    if (activeMood && MOOD_CATEGORIES[activeMood]?.length) {
      const cats = MOOD_CATEGORIES[activeMood];
      list = list.filter(p => {
        const cat = (p.category || '').toLowerCase();
        return cats.some(c => cat.includes(c));
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (cityFilter) {
      list = list.filter(p =>
        (p.address || '').toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (mapCity && mapCity !== 'all') {
      const cityNames = {
        cannes: 'cannes', antibes: 'antibes', cagnes: 'cagnes',
        nice: 'nice', villefranche: 'villefranche', capferrat: 'cap-ferrat',
        menton: 'menton', monaco: 'monaco', grasse: 'grasse', stpaul: 'vence',
      };
      const cityQ = cityNames[mapCity] || mapCity;
      list = list.filter(p => (p.address || '').toLowerCase().includes(cityQ));
    }

    if (categoryFilter) {
      list = list.filter(p =>
        (p.category || '').toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    return list;
  }, [partners, activeMood, searchQuery, cityFilter, mapCity, categoryFilter]);

  // Partenaires pour la section "Staycation"
  const staycationPartners = useMemo(() =>
    partners.filter(p => {
      const cat = (p.category || '').toLowerCase();
      return cat.includes('hôtel') || cat.includes('hotel') || cat.includes('spa') ||
        cat.includes('hébergement') || cat.includes('séjour') || cat.includes('wellness');
    }).slice(0, 3),
    [partners]
  );

  // Partenaires pour la section "À deux"
  const aDeuxPartners = useMemo(() =>
    partners.filter(p => {
      const cat = (p.category || '').toLowerCase();
      return cat.includes('restaurant') || cat.includes('spa') || cat.includes('hôtel') || cat.includes('gastronomie');
    }).slice(0, 5),
    [partners]
  );

  // Catégories uniques disponibles
  const availableCategories = useMemo(() =>
    [...new Set(partners.map(p => p.category).filter(Boolean))].sort(),
    [partners]
  );

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <main className="antialiased" style={{ fontFamily: 'var(--font-sans)' }}>

      <InstallPopup />

      {/* ============================================================ */}
      {/* SECTION : HERO ÉDITORIAL                                    */}
      {/* ============================================================ */}
      <section
        id="top"
        className="relative min-h-screen flex items-center pt-[140px] pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #F7F2E8 0%, #F7F2E8 60%, #E3D4B4 160%)' }}
      >
        {/* Lignes décoratives SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" viewBox="0 0 1280 900" preserveAspectRatio="none" aria-hidden="true">
          <path d="M -50 620 C 200 520, 340 700, 560 560 C 780 420, 900 620, 1100 480 C 1250 380, 1300 500, 1400 420"
            stroke="#2E7C93" strokeWidth="1.4" fill="none" opacity="0.5"/>
          <path d="M -50 700 C 220 610, 360 780, 600 650 C 820 530, 940 700, 1150 560"
            stroke="#B7AA8E" strokeWidth="1" fill="none" opacity="0.6"/>
        </svg>

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10 w-full">
          {/* Eyebrow */}
          <div className="eyebrow mb-7 animate-fade-in-down">The Club · Côte d&apos;Azur</div>

          {/* Titre principal */}
          <h1
            className="font-display text-riviera-navy animate-fade-in-up"
            style={{ fontSize: 'clamp(48px,8vw,108px)', lineHeight: 1.04, letterSpacing: '-0.01em', maxWidth: '780px' }}
          >
            Vivez la<br/>Côte d&apos;Azur <em className="italic font-normal text-riviera-azure">autrement.</em>
          </h1>

          {/* Sous-titre */}
          <p className="text-riviera-navy/60 text-[17px] leading-relaxed mt-7 mb-10 max-w-[520px] animate-fade-in-up-delay">
            Restaurants, escapades, bien-être, sorties et expériences sélectionnés pour les membres The Club.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-16 animate-fade-in-up-delay-2">
            <a href="#carte" className="btn btn-primary">Explorer la Côte d&apos;Azur</a>
            <a href="#pass" className="btn btn-ghost">Découvrir les Pass</a>
          </div>

          {/* Villes */}
          <p className="text-stone animate-fade-in-up-delay-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Nice · Cannes · Antibes · Monaco · Menton
          </p>
        </div>

        {/* Image éditoriale desktop */}
        <div className="hidden xl:block absolute right-10 top-[180px] w-[360px] h-[460px] rounded-[22px] overflow-hidden shadow-[0_20px_60px_rgba(13,42,59,0.10)] z-[1]">
          <img
            src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80"
            alt="Terrasse au coucher du soleil sur la Côte d'Azur"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION : MOOD EXPLORER                                    */}
      {/* ============================================================ */}
      <section id="mood" className="py-24 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-riviera-navy">
                Qu&apos;avez-vous envie<br/>de <em className="italic">vivre</em> ?
              </h2>
            </div>
            <p className="text-riviera-navy/60 text-[15px] leading-relaxed max-w-[380px]">
              Choisissez une humeur, nous filtrons les expériences qui lui correspondent.
            </p>
          </div>
          <MoodExplorer activeMood={activeMood} onMoodSelect={(m) => { setActiveMood(m); setVisibleCount(8); }} />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION : EXPLORER (search + filters)                       */}
      {/* ============================================================ */}
      <section id="explorer" className="py-8 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="rounded-[22px] bg-riviera-navy text-white p-12 lg:p-14">
            <div className="eyebrow eyebrow-sand mb-6">L&apos;explorateur</div>
            <h2 className="font-display text-[clamp(28px,4vw,46px)] text-white mb-8">
              Aujourd&apos;hui,<br/>on fait <em className="italic">quoi ?</em>
            </h2>
            {/* Search */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(8); }}
                placeholder="Que voulez-vous vivre ? Dîner romantique, spa, coucher de soleil…"
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white placeholder-white/50 text-[15px] focus:outline-none focus:border-white/50 transition-colors"
              />
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setVisibleCount(8); }}
                className="bg-white/10 border border-white/20 text-white rounded-full px-4 py-3 text-[13px] focus:outline-none cursor-pointer"
              >
                <option value="" className="text-gray-900">Tous les lieux</option>
                {['Nice', 'Cannes', 'Antibes', 'Monaco', 'Menton', 'Grasse', 'Cagnes-sur-Mer', 'Villefranche'].map(c => (
                  <option key={c} value={c} className="text-gray-900">{c}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setVisibleCount(8); }}
                className="bg-white/10 border border-white/20 text-white rounded-full px-4 py-3 text-[13px] focus:outline-none cursor-pointer"
              >
                <option value="" className="text-gray-900">Toutes les catégories</option>
                {availableCategories.map(c => (
                  <option key={c} value={c} className="text-gray-900">{c}</option>
                ))}
              </select>
            </div>
            {/* Count */}
            {(searchQuery || cityFilter || categoryFilter || activeMood) && (
              <p className="mt-5 text-sand/80" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em' }}>
                {filteredPartners.length} résultat{filteredPartners.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION : EXPERIENCE GRID                                   */}
      {/* ============================================================ */}
      <section id="experiences" className="py-20 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-riviera-navy">
              Les <em className="italic">expériences</em>
            </h2>
            <p className="text-riviera-navy/60 text-[15px] max-w-[380px]">
              Sélectionnées et vérifiées par The Club. Tarifs, avantages et accès réservés aux membres.
            </p>
          </div>

          {partnersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-sand/30 rounded-[10px] aspect-[4/3] animate-pulse" />
              ))}
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-16 text-stone" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', gridColumn: '1/-1' }}>
              Aucune expérience trouvée pour ces critères.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredPartners.slice(0, visibleCount).map((partner) => {
                const isFav = favorites.includes(partner.id);
                const city = partner.address?.split(',').slice(-2, -1)[0]?.trim() || '';
                const discountStr = partner.discount_decouverte
                  ? `Offre Découverte −${partner.discount_decouverte}%`
                  : partner.offer_decouverte || 'Avantage Membre';
                const isPremium = (partner.discount_decouverte || 0) >= 40;

                return (
                  <div
                    key={partner.id}
                    className="bg-white-warm rounded-[10px] overflow-hidden cursor-pointer border border-[rgba(24,22,17,0.07)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(13,42,59,0.10)] group"
                  >
                    {/* Media */}
                    <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'linear-gradient(135deg,#173F55,#D3BE93)' }}>
                      {partner.image_url && (
                        <img
                          src={partner.image_url}
                          alt={partner.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                          loading="lazy"
                        />
                      )}
                      {/* Badge offre */}
                      <div className={`absolute top-3 left-3 text-[10.5px] tracking-[0.08em] uppercase px-3 py-1.5 rounded-full z-10 ${isPremium ? 'bg-riviera-navy text-sand' : 'bg-white-warm text-riviera-navy'}`}
                        style={{ fontFamily: 'var(--font-mono)' }}>
                        {isPremium ? 'Premium' : 'Membre'}
                      </div>
                      {/* Fav button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(partner.id); }}
                        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white-warm/90 flex items-center justify-center z-10 transition-transform duration-300 hover:scale-110"
                        aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" strokeWidth="1.6"
                          stroke="#0D2A3B" fill={isFav ? '#0D2A3B' : 'none'}>
                          <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 6 4c2.2-.3 3.8 1 6 3.2C14.2 5 15.8 3.7 18 4c4 .5 5.5 4.4 4 7.8-2.5 4.6-10 9.2-10 9.2z"/>
                        </svg>
                      </button>
                    </div>
                    {/* Body */}
                    <div className="p-5">
                      <div className="text-riviera-azure mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {partner.category}
                      </div>
                      <h3 className="font-display text-[19px] text-riviera-navy mb-1">{partner.name}</h3>
                      {city && (
                        <p className="text-stone text-[12.5px] mb-2">{city}</p>
                      )}
                      {/* Avantage chip */}
                      <div className="inline-block text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 rounded-full bg-riviera-navy/10 text-riviera-navy/70 mb-4"
                        style={{ fontFamily: 'var(--font-mono)' }}>
                        {discountStr}
                      </div>
                      {/* Price row */}
                      <div className="flex items-baseline justify-between border-t border-[rgba(24,22,17,0.07)] pt-3.5">
                        <div className="text-stone text-[12.5px] line-through">Tarif public</div>
                        <div>
                          <span className="font-mono text-[16px] font-medium text-riviera-navy">Tarif Club</span>
                          <span className="block text-[10px] text-verde uppercase tracking-[0.06em] text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                            Avantage membre
                          </span>
                        </div>
                      </div>
                      {/* CTA */}
                      <button
                        onClick={() => openPinModal(partner.name, 'decouverte')}
                        className="mt-4 w-full py-3 bg-riviera-navy text-white text-[13px] font-semibold rounded-lg hover:bg-charcoal transition-colors duration-300"
                      >
                        Utiliser l&apos;offre
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!partnersLoading && visibleCount < filteredPartners.length && (
            <div className="text-center mt-12">
              <button
                onClick={() => setVisibleCount(v => v + 8)}
                className="btn btn-ghost"
              >
                Voir plus d&apos;expériences
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION : STAYCATION                                        */}
      {/* ============================================================ */}
      <section id="staycation" className="py-24" style={{ background: '#0D2A3B' }}>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <div className="eyebrow eyebrow-sand mb-5">Escapades</div>
              <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-white">
                Partir sans<br/><em className="italic">partir.</em>
              </h2>
            </div>
            <p className="text-[#DCE9EA] text-[15px] leading-relaxed max-w-[380px]">
              Une nuit, une journée ou un week-end suffit parfois à changer d&apos;air.
            </p>
          </div>

          {staycationPartners.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {staycationPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-[10px] overflow-hidden cursor-pointer transition-transform duration-500 hover:-translate-y-1.5 border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="aspect-[4/3]" style={{ background: 'linear-gradient(135deg,#D3BE93,#173F55)' }}>
                    {partner.image_url && (
                      <img src={partner.image_url} alt={partner.name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="eyebrow eyebrow-sand mb-2.5">{partner.category}</div>
                    <h3 className="font-display text-[21px] text-white mb-2">{partner.name}</h3>
                    <p className="text-[#DCE9EA] text-[13.5px] mb-4 leading-relaxed">
                      {partner.offer_decouverte || 'Expérience exclusive membre'}
                    </p>
                    <div className="flex justify-between items-baseline border-t border-white/10 pt-3.5">
                      <span className="text-stone text-[12.5px]">Tarif public</span>
                      <span className="font-mono text-white text-[15px]">Tarif Club</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Nuit d\'hôtel', cat: 'Hébergement', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=70', desc: 'Une nuit dans un établissement partenaire avec avantages membres.' },
                { title: 'Journée Spa', cat: 'Bien-être', img: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=70', desc: 'Accès privilégié aux meilleurs spas de la Côte d\'Azur.' },
                { title: 'Dîner d\'exception', cat: 'Gastronomie', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=70', desc: 'Tables sélectionnées pour leur excellence culinaire.' },
              ].map((item, i) => (
                <div key={i} className="rounded-[10px] overflow-hidden cursor-pointer transition-transform duration-500 hover:-translate-y-1.5 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-6">
                    <div className="eyebrow eyebrow-sand mb-2.5">{item.cat}</div>
                    <h3 className="font-display text-[21px] text-white mb-2">{item.title}</h3>
                    <p className="text-[#DCE9EA] text-[13.5px] mb-4">{item.desc}</p>
                    <div className="flex justify-between items-baseline border-t border-white/10 pt-3.5">
                      <span className="text-stone text-[12.5px]">Tarif public</span>
                      <span className="font-mono text-white text-[15px]">Tarif Club</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION : CARTE CÔTE D'AZUR (éditoriale + Google Maps)     */}
      {/* ============================================================ */}
      <section id="carte" className="py-24 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {/* En-tête éditorial */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="eyebrow mb-5">La Riviera</div>
              <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-riviera-navy">
                La <em className="italic">Côte d&apos;Azur</em>
              </h2>
            </div>
            <p className="text-riviera-navy/60 text-[15px] max-w-[380px]">
              De Menton à Monaco, en passant par l&apos;arrière-pays. Cliquez une ville pour découvrir ses expériences.
            </p>
          </div>

          {/* Carte éditoriale SVG interactive */}
          <RivieraMap partners={partners} selectedCity={mapCity} onCitySelect={(city) => { setMapCity(city); setVisibleCount(8); }} />

          {/* Google Maps interactif */}
          <div className="mt-16">
            <div className="eyebrow mb-6">Trouvez nos partenaires autour de vous</div>
            <div className="relative">
              <div className="relative max-w-md w-full shadow-xl rounded-2xl bg-white mb-6">
                <input id="search-input" type="text" placeholder="Rechercher (ex: Nice, Cagnes, Spa...)" autoComplete="off"
                  className="w-full pl-6 pr-14 py-4 rounded-full border border-[rgba(24,22,17,0.12)] focus:border-riviera-azure focus:ring-2 focus:ring-riviera-azure/20 focus:outline-none text-sm text-riviera-navy bg-white transition-all" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-riviera-navy text-white p-2.5 rounded-full hover:bg-charcoal transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
                <div id="search-results" className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl mt-2 hidden overflow-hidden z-50 border border-[rgba(24,22,17,0.07)]"></div>
              </div>
              <div id="map" className="w-full h-[500px] rounded-[22px] overflow-hidden bg-gray-200"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Économies — Démonstration & Simulateur */}
      {/* ============================================================ */}
      {/* SECTION : À DEUX                                            */}
      {/* ============================================================ */}
      <section id="adeux" className="py-24 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-riviera-navy">
              À deux, c&apos;est<br/><em className="italic">mieux.</em>
            </h2>
            <p className="text-riviera-navy/60 text-[15px] max-w-[380px]">
              Des moments pensés pour être partagés.
            </p>
          </div>
          {aDeuxPartners.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {aDeuxPartners.map((partner) => (
                <div key={partner.id} className="relative aspect-[3/4.2] rounded-[10px] overflow-hidden cursor-pointer group">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0D2A3B,#D3BE93)' }}>
                    {partner.image_url && (
                      <img src={partner.image_url} alt={partner.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" loading="lazy" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-riviera-navy/80 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="text-sand text-[10.5px] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>{partner.category}</div>
                    <h4 className="font-display text-[16.5px] font-medium leading-tight">{partner.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { title: 'Dîner romantique', cat: 'Gastronomie', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=70' },
                { title: 'Spa en duo', cat: 'Bien-être', img: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=70' },
                { title: 'Escapade hôtel', cat: 'Hébergement', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=600&q=70' },
                { title: 'Cocktails au coucher du soleil', cat: 'Bar & Lounge', img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=70' },
                { title: 'Activité insolite', cat: 'Loisirs', img: 'https://images.unsplash.com/photo-1588499756884-d72584d84df5?auto=format&fit=crop&w=600&q=70' },
              ].map((item, i) => (
                <div key={i} className="relative aspect-[3/4.2] rounded-[10px] overflow-hidden cursor-pointer group">
                  <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-riviera-navy/80 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="text-sand text-[10.5px] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>{item.cat}</div>
                    <h4 className="font-display text-[16.5px] font-medium leading-tight">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION : POURQUOI THE CLUB                                 */}
      {/* ============================================================ */}
      <section className="py-24 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-riviera-navy">
              Pourquoi<br/><em className="italic">The Club.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Discover', desc: 'Découvrez des endroits que vous n\'auriez peut-être jamais trouvés. Notre équipe sélectionne les meilleures adresses pour vous.' },
              { num: '02', title: 'Enjoy', desc: 'Profitez de tarifs et avantages réservés aux membres. Restaurants, spas, hôtels et expériences à prix Club.' },
              { num: '03', title: 'Belong', desc: 'Accédez à des expériences et privilèges exclusifs. The Club, c\'est une communauté d\'amateurs d\'art de vivre.' },
            ].map((pilier) => (
              <div key={pilier.num} className="border-t border-[rgba(24,22,17,0.12)] pt-9">
                <div className="text-riviera-azure text-[12px] mb-5" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{pilier.num}</div>
                <h3 className="font-display text-[24px] text-riviera-navy mb-3">{pilier.title}</h3>
                <p className="text-riviera-navy/60 text-[14.5px] leading-relaxed">{pilier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ============================================================ */}
      {/* SECTION : PASS                                               */}
      {/* ============================================================ */}
      <section id="pass" className="py-24" style={{ background: '#E3D4B4' }}>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-riviera-navy">
              Choisissez votre façon<br/>de vivre la <em className="italic">Côte d&apos;Azur.</em>
            </h2>
          </div>

          {/* 3 cartes Pass */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">

            {/* AVENTURIER */}
            <div className="bg-white-warm rounded-[22px] p-9 border border-[rgba(24,22,17,0.07)] cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(13,42,59,0.10)] flex flex-col">
              <div className="text-riviera-azure mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>L&apos;Aventurier</div>
              <div className="font-display text-[44px] text-riviera-navy mb-0.5">4,99 €</div>
              <div className="text-stone text-[13px] mb-5">72 heures · Paiement unique</div>
              <p className="text-riviera-navy/60 text-[14px] leading-relaxed mb-6 flex-1">Le pass idéal pour découvrir The Club et profiter de la Côte d&apos;Azur pendant 72 heures.</p>
              <ul className="mb-7 space-y-0">
                {['Accès 72H complet', '1 Offre Découverte −50%', 'Offres permanentes illimitées'].map((f) => (
                  <li key={f} className="py-2.5 border-t border-[rgba(24,22,17,0.07)] flex items-center gap-2.5 text-[13.5px] text-riviera-navy">
                    <span className="text-riviera-azure">—</span>{f}
                  </li>
                ))}
              </ul>
              <button
                disabled={subscription === 'aventurier'}
                onClick={() => handleSubscription('aventurier')}
                className="w-full py-3.5 rounded-full font-semibold text-[14px] border border-riviera-navy text-riviera-navy hover:bg-riviera-navy hover:text-white transition-all duration-300"
              >
                {subscription === 'aventurier' ? '✓ Pass Actif' : (user ? 'Commencer l\'aventure' : 'Se connecter')}
              </button>
            </div>

            {/* EXPLORER */}
            <div className="bg-white-warm rounded-[22px] p-9 border border-[rgba(24,22,17,0.07)] cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(13,42,59,0.10)] flex flex-col">
              <div className="text-riviera-azure mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pass Explorer</div>
              <div className="font-display text-[44px] text-riviera-navy mb-0.5">9,90 €</div>
              <div className="text-stone text-[13px] mb-5">par mois · Sans engagement</div>
              <p className="text-riviera-navy/60 text-[14px] leading-relaxed mb-6 flex-1">Le pass pensé pour profiter régulièrement des adresses, expériences et avantages The Club sur la Côte d&apos;Azur.</p>
              <ul className="mb-7 space-y-0">
                {['Sans engagement', 'Jusqu\'à 5 Offres Découvertes /mois', 'Offres permanentes illimitées', 'Carte partenaires en temps réel'].map((f) => (
                  <li key={f} className="py-2.5 border-t border-[rgba(24,22,17,0.07)] flex items-center gap-2.5 text-[13.5px] text-riviera-navy">
                    <span className="text-riviera-azure">—</span>{f}
                  </li>
                ))}
              </ul>
              <button
                disabled={subscription === 'explorer'}
                onClick={() => handleSubscription('explorer')}
                className="w-full py-3.5 rounded-full font-semibold text-[14px] border border-riviera-navy text-riviera-navy hover:bg-riviera-navy hover:text-white transition-all duration-300"
              >
                {subscription === 'explorer' ? '✓ Pass Actif' : (user ? 'Choisir Explorer' : 'Se connecter')}
              </button>
            </div>

            {/* CÉLESTE — FEATURED */}
            <div className="rounded-[22px] p-9 cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(13,42,59,0.25)] flex flex-col relative" style={{ background: '#0D2A3B', color: '#FFFDF8' }}>
              <div className="absolute -top-3 right-7 bg-verde text-white-warm text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full" style={{ fontFamily: 'var(--font-mono)' }}>Recommandé</div>
              <div className="mb-4" style={{ color: '#E3D4B4', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pass Céleste</div>
              <div className="font-display text-[44px] mb-0.5" style={{ color: '#FFFDF8' }}>14,90 €</div>
              <div className="text-[13px] mb-5" style={{ color: '#DCE9EA' }}>par mois · Sans engagement</div>
              <p className="text-[14px] leading-relaxed mb-6 flex-1" style={{ color: '#DCE9EA' }}>Tout l&apos;univers Explorer, avec davantage de privilèges, d&apos;expériences exclusives et d&apos;attentions réservées aux membres Céleste.</p>
              <ul className="mb-7 space-y-0">
                {['Offres Découvertes illimitées', 'Expériences exclusives Céleste', 'Événements privés The Club', 'Avantages partenaires premium', 'Programme ambassadeur inclus'].map((f) => (
                  <li key={f} className="py-2.5 flex items-center gap-2.5 text-[13.5px]" style={{ borderTop: '1px solid rgba(255,255,255,0.14)', color: '#FFFDF8' }}>
                    <span style={{ color: '#E3D4B4' }}>—</span>{f}
                  </li>
                ))}
              </ul>
              <button
                disabled={subscription === 'celeste'}
                onClick={() => handleSubscription('celeste')}
                className="w-full py-3.5 rounded-full font-semibold text-[14px] bg-white-warm text-riviera-navy hover:bg-sand transition-all duration-300"
              >
                {subscription === 'celeste' ? '✓ Pass Actif' : (user ? 'Devenir Membre Céleste' : 'Rejoindre The Club')}
              </button>
            </div>
          </div>

          {/* Simulateur */}
          <div className="bg-white-warm rounded-[22px] p-12 border border-[rgba(24,22,17,0.07)]">
            <div className="eyebrow mb-5">Simulateur</div>
            <h2 className="font-display text-[30px] text-riviera-navy mb-8">
              Votre abonnement peut-il<br/>se <em className="italic">rentabiliser ?</em>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                {[
                  { label: 'Restaurants / mois', key: 'restos', val: Math.round(simSorties * 0.5) },
                  { label: 'Activités / mois', key: 'activites', val: Math.round(simSorties * 0.3) },
                  { label: 'Bien-être / mois', key: 'bienetre', val: Math.round(simSorties * 0.2) },
                ].map((row, i) => (
                  <div key={i} className="mb-6">
                    <div className="flex justify-between text-[13.5px] mb-2.5 font-semibold">
                      <span>{row.label}</span>
                      <span className="text-riviera-azure" style={{ fontFamily: 'var(--font-mono)' }}>{row.val}</span>
                    </div>
                    <div className="h-1 bg-[rgba(24,22,17,0.10)] rounded-full">
                      <div className="h-1 bg-riviera-azure rounded-full transition-all duration-300" style={{ width: `${Math.min((row.val / 5) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[13.5px] font-semibold">Total sorties / mois</label>
                  <span className="text-riviera-azure text-[16px]" style={{ fontFamily: 'var(--font-mono)' }}>{simSorties}</span>
                </div>
                <input
                  type="range" min="1" max="10" value={simSorties}
                  onChange={(e) => setSimSorties(parseInt(e.target.value))}
                  className="w-full accent-riviera-navy"
                />
              </div>
              <div className="rounded-[10px] p-9" style={{ background: '#0D2A3B', color: '#FFFDF8' }}>
                {[
                  { lbl: 'Économie estimée', val: `${simSorties * 20} €` },
                  { lbl: 'Coût du Pass Explorer', val: '9,90 €' },
                  { lbl: 'Gain estimé / mois', val: `${Math.max(0, simSorties * 20 - 9.9).toFixed(0)} €` },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-baseline py-3.5" style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.14)' : 'none' }}>
                    <span className="text-[13px]" style={{ color: '#DCE9EA' }}>{row.lbl}</span>
                    <span className="font-display text-[24px]">{row.val}</span>
                  </div>
                ))}
                <p className="text-[11.5px] mt-4" style={{ color: '#B7AA8E' }}>Simulation indicative basée sur les remises moyennes du catalogue.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aventurier — CTA voyageur */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6">
        <div className="rounded-[22px] overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-10 px-14 py-16" style={{ background: 'linear-gradient(120deg, #57644A, #173F55)' }}>
            <div className="text-white">
              <div className="eyebrow eyebrow-sand mb-5">Vous êtes de passage ?</div>
              <h2 className="font-display text-[clamp(28px,4vw,44px)] text-white max-w-[480px]">
                Découvrez la Côte d&apos;Azur pendant 72 heures avec The Club.
              </h2>
              <p className="text-[15px] mt-4 max-w-[440px]" style={{ color: '#E3D4B4' }}>
                L&apos;Aventurier vous donne un accès complet au catalogue, sans engagement.
              </p>
            </div>
            <div className="text-center border border-white/20 rounded-[10px] px-9 py-7" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="font-display text-[38px] text-white mb-1">4,99 €</div>
              <div className="text-[12px] tracking-[0.08em] uppercase mb-5" style={{ fontFamily: 'var(--font-mono)', color: '#E3D4B4' }}>72 heures · L&apos;Aventurier</div>
              <button onClick={() => handleSubscription('aventurier')} className="btn btn-light btn-sm">
                Commencer l&apos;aventure
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION : PARTENAIRES B2B                                   */}
      {/* ============================================================ */}
      <section id="partenaires" className="py-24 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="eyebrow mb-6">Partenaires</div>
              <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-riviera-navy mb-3">
                Vous faites vivre<br/>la <em className="italic">Côte d&apos;Azur ?</em>
              </h2>
              <p className="text-riviera-navy/60 text-[15px] leading-relaxed mb-3 max-w-[400px]">
                Rejoignez les établissements et expériences sélectionnés par The Club.
              </p>
              <ul className="mb-8">
                {['Visibilité auprès d\'une clientèle qualifiée', 'Nouveaux clients réguliers', 'Présence dans nos sélections éditoriales', 'Offres exclusives valorisées auprès des membres'].map((benefit) => (
                  <li key={benefit} className="py-3 border-t border-[rgba(24,22,17,0.07)] flex items-center gap-3 text-[14.5px] text-riviera-navy">
                    <span className="text-riviera-azure">—</span>{benefit}
                  </li>
                ))}
              </ul>
              <Link href="/devenir-partenaire" className="btn btn-primary">
                Devenir partenaire
              </Link>
            </div>
            <div className="aspect-[4/5] rounded-[22px] overflow-hidden" style={{ background: 'linear-gradient(150deg,#D3BE93,#173F55)' }}>
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80"
                alt="Restaurant partenaire The Club"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION : MON CLUB (espace membre)                          */}
      {/* ============================================================ */}
      <section id="monclub" className="py-24" style={{ background: '#181611', color: '#FFFDF8' }}>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="eyebrow eyebrow-white mb-5">Espace membre</div>
              <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-white">
                Mon <em className="italic">Club</em>
              </h2>
            </div>
            {user && (
              <p className="text-[15px]" style={{ color: '#DCE9EA' }}>
                Bonjour {user.user_metadata?.first_name || user.email?.split('@')[0] || 'Membre'} — votre espace membre.
              </p>
            )}
          </div>

          {user ? (
            <>
              {/* Tabs */}
              <div className="flex gap-0 mb-10 border-b border-white/10 overflow-x-auto hide-scrollbar">
                {[
                  { key: 'dashboard', label: 'Tableau de bord' },
                  { key: 'favoris', label: 'Mes favoris' },
                  { key: 'monpass', label: 'Mon pass' },
                  { key: 'profil', label: 'Mon profil' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMemberTab(tab.key)}
                    className="px-1 mr-7 pb-3.5 text-[13.5px] font-semibold transition-all duration-300 whitespace-nowrap"
                    style={{
                      color: memberTab === tab.key ? '#FFFDF8' : '#DCE9EA',
                      borderBottom: memberTab === tab.key ? '2px solid #E3D4B4' : '2px solid transparent',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Dashboard view */}
              {memberTab === 'dashboard' && (
                <div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {[
                      { num: `${displayedSavings.toFixed(2).replace('.', ',')} €`, lbl: 'Mes économies' },
                      { num: favorites.length, lbl: 'Mes favoris' },
                      { num: subscription === 'none' ? '—' : subscription === 'celeste' ? 'Céleste' : subscription === 'explorer' ? 'Explorer' : 'Aventurier', lbl: 'Mon pass' },
                      { num: partners.length > 0 ? `+${partners.length}` : '50+', lbl: 'Établissements' },
                    ].map((stat, i) => (
                      <div key={i} className="rounded-[10px] p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="font-display text-[32px] text-white mb-1">{stat.num}</div>
                        <div className="text-[12px] uppercase tracking-[0.05em]" style={{ color: '#DCE9EA', fontFamily: 'var(--font-mono)' }}>{stat.lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[10px] p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                      <div className="eyebrow eyebrow-sand mb-3">Explorez maintenant</div>
                      <h3 className="font-display text-[22px] text-white">Trouvez votre prochaine expérience</h3>
                    </div>
                    <a href="#experiences" className="btn btn-light btn-sm shrink-0">Explorer le catalogue</a>
                  </div>
                </div>
              )}

              {/* Favoris view */}
              {memberTab === 'favoris' && (
                <div>
                  {favorites.length === 0 ? (
                    <div className="text-center py-16" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#DCE9EA' }}>
                      Vous n&apos;avez pas encore de favoris.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {partners.filter(p => favorites.includes(p.id)).map((partner) => (
                        <div key={partner.id} className="rounded-[10px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div className="aspect-[4/3]" style={{ background: 'linear-gradient(135deg,#173F55,#D3BE93)' }}>
                            {partner.image_url && <img src={partner.image_url} alt={partner.name} className="w-full h-full object-cover" loading="lazy" />}
                          </div>
                          <div className="p-4">
                            <div className="text-[10.5px] uppercase tracking-[0.1em] mb-1" style={{ color: '#2E7C93', fontFamily: 'var(--font-mono)' }}>{partner.category}</div>
                            <h4 className="font-display text-[17px] text-white">{partner.name}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mon Pass view */}
              {memberTab === 'monpass' && (
                <div>
                  {subscription === 'none' ? (
                    <div className="text-center py-12">
                      <p className="text-[15px] mb-6" style={{ color: '#DCE9EA' }}>Vous n&apos;avez pas encore de pass actif.</p>
                      <a href="#pass" className="btn btn-light">Découvrir les Pass</a>
                    </div>
                  ) : (
                    <div className="max-w-md">
                      <div className="rounded-[10px] p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="text-[12px] uppercase tracking-[0.1em] mb-3" style={{ color: '#E3D4B4', fontFamily: 'var(--font-mono)' }}>Pass actif</div>
                        <div className="font-display text-[32px] text-white mb-2 capitalize">{subscription}</div>
                        <button
                          onClick={async () => {
                            const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
                            const data = await res.json();
                            if (data.url) window.location.href = data.url;
                          }}
                          className="mt-5 text-[13px] underline"
                          style={{ color: '#DCE9EA' }}
                        >
                          Gérer mon abonnement →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profil view */}
              {memberTab === 'profil' && (
                <div>
                  <Link href="/profil" className="btn btn-light btn-sm">Accéder à mon profil complet →</Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-[17px] mb-8" style={{ color: '#DCE9EA' }}>
                Connectez-vous pour accéder à votre espace membre.
              </p>
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="btn btn-light"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION : ABONNEMENTS (garde l'id tarifs pour rétrocompat)  */}
      {/* ============================================================ */}
      <section id="tarifs" className="py-24 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <span className="text-riviera-azure font-semibold tracking-wider text-sm uppercase mb-2 block">Accès Membre</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-riviera-navy">Choisissez votre privilège.</h2>
            <p className="text-riviera-navy/60">Rejoignez le cercle et commencez à économiser aujourd&apos;hui.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">

            {/* Pass Aventurier */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col transition-shadow duration-300 ease-out hover:shadow-md">
              <div className="mb-6">
                <h3 className="font-display text-xl font-medium text-riviera-navy mb-1 flex items-center gap-2"><Emoji symbol="🤠" label="aventurier" size={20} /> Pass Aventurier</h3>
                <p className="text-stone text-sm">Le pass idéal pour découvrir The Club et profiter de la Côte d&apos;Azur pendant 72 heures.</p>
              </div>
              <div className="mb-6">
                <span className="font-display text-4xl text-riviera-navy">4,99€</span>
                <span className="text-stone text-sm ml-1">paiement unique</span>
              </div>
              <ul className="space-y-3 mb-5 flex-1 text-sm text-riviera-navy/70">
                {['Accès 72H', '1 Offre Découverte (-50%)', 'Offres permanentes illimitées'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="text-riviera-azure">—</span>{f}</li>
                ))}
              </ul>
              <button
                disabled={subscription === 'aventurier'}
                onClick={() => handleSubscription('aventurier')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-300 ease-out ${subscription === 'aventurier' ? 'bg-green-50 text-green-700 cursor-default border border-green-200' : 'bg-riviera-sand text-riviera-navy border border-sand hover:bg-sand'}`}
              >
                {subscription === 'aventurier' ? '✓ Pass Actif' : (user ? 'Choisir ce Pass' : 'Se connecter pour choisir')}
              </button>
            </div>

            {/* Pass Explorer */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col transition-shadow duration-300 ease-out hover:shadow-md">
              <div className="mb-6">
                <h3 className="font-display text-xl font-medium text-riviera-navy mb-1 flex items-center gap-2"><Emoji symbol="🚀" label="explorer" size={20} /> Pass Explorer</h3>
                <p className="text-stone text-sm">Le pass pensé pour profiter régulièrement des adresses, expériences et avantages The Club.</p>
              </div>
              <div className="mb-6">
                <span className="font-display text-4xl text-riviera-navy">9,90€</span>
                <span className="text-stone text-sm ml-1">/ mois</span>
              </div>
              <ul className="space-y-3 mb-5 flex-1 text-sm text-riviera-navy/70">
                {['Sans engagement', 'Jusqu\'à 5 Offres Découvertes /mois', 'Offres permanentes illimitées'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="text-riviera-azure">—</span>{f}</li>
                ))}
              </ul>
              <button
                disabled={subscription === 'explorer'}
                onClick={() => handleSubscription('explorer')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-300 ease-out ${subscription === 'explorer' ? 'bg-green-50 text-green-700 cursor-default border border-green-200' : 'bg-riviera-sand text-riviera-navy border border-sand hover:bg-sand'}`}
              >
                {subscription === 'explorer' ? '✓ Pass Actif' : (user ? 'Choisir ce Pass' : 'Se connecter pour choisir')}
              </button>
            </div>

            {/* Pass Céleste */}
            <div className="rounded-2xl p-8 border-2 border-riviera-azure shadow-md flex flex-col relative transition-shadow duration-300 ease-out hover:shadow-lg" style={{ background: '#0D2A3B' }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-riviera-azure text-white text-xs font-semibold px-4 py-1 rounded-full tracking-wide">Recommandé</span>
              </div>
              <div className="mb-6">
                <h3 className="font-display text-xl font-medium text-white mb-1 flex items-center gap-2"><Emoji symbol="✨" label="céleste" size={20} /> Pass Céleste</h3>
                <p className="text-[#DCE9EA] text-sm">Tout l&apos;univers Explorer, avec davantage de privilèges, d&apos;expériences exclusives et d&apos;attentions réservées aux membres Céleste.</p>
              </div>
              <div className="mb-6">
                <span className="font-display text-4xl text-white">14,90€</span>
                <span className="text-[#DCE9EA] text-sm ml-1">/ mois</span>
              </div>
              <ul className="space-y-3 mb-5 flex-1 text-sm text-white">
                {['Offres Découvertes illimitées', 'Expériences exclusives Céleste', 'Événements privés The Club'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#E3D4B4]">—</span>{f}</li>
                ))}
              </ul>
              <button
                disabled={subscription === 'celeste'}
                onClick={() => handleSubscription('celeste')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-300 ease-out ${subscription === 'celeste' ? 'bg-green-700 text-white cursor-default' : 'bg-white text-riviera-navy hover:bg-sand'}`}
              >
                {subscription === 'celeste' ? '✓ Pass Actif' : (user ? 'Devenir Membre' : 'Se connecter pour choisir')}
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
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Partagez l&apos;excellence. Soyez récompensé.</h2>
            <p className="text-white/80 text-lg">Invitez vos amis à rejoindre l&apos;élite de la région. Le programme ambassadeur The Club est conçu pour vous remercier à la hauteur de votre fidélité.</p>
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
      <section id="faq" className="py-20 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <h2 className="font-display text-[clamp(32px,4.2vw,54px)] text-riviera-navy">
              Questions <em className="italic">fréquentes</em>
            </h2>
          </div>
          <div className="max-w-3xl space-y-2">
            {faqData.map((faq, idx) => (
              <div key={idx} className="border-t border-[rgba(24,22,17,0.12)]">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-5 flex justify-between items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-riviera-navy rounded"
                  aria-expanded={openFaq === idx}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className="font-display text-[18px] text-riviera-navy pr-4">{faq.q}</span>
                  <svg className="w-4 h-4 text-riviera-azure flex-shrink-0 transition-transform duration-300 ease-out" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  className="transition-all duration-300 ease-out overflow-hidden"
                  style={{ maxHeight: openFaq === idx ? '200px' : '0' }}
                  aria-hidden={openFaq !== idx}
                >
                  <p className="pb-5 text-riviera-navy/60 text-[14px] leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
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
