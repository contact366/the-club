"use client";
import { useState, useEffect } from 'react';
import Emoji from '@/components/Emoji';
import { supabase } from '@/lib/supabase';
import { generatePartnerSlug } from '@/lib/slugUtils';
import EstablishmentCard from '@/components/EstablishmentCard';

const VILLES = ["Toutes", "Nice", "Cannes", "Monaco", "Antibes", "Cagnes-sur-Mer"];

export default function GastronomiePage() {
  const [villeActive, setVilleActive] = useState("Toutes");
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(null);

  useEffect(() => {
    async function fetchPartners() {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, slug, address, category, photo_url, offer_decouverte, offer_permanente, discount_decouverte, discount_permanente')
        .ilike('category', '%gastronomie%')
        .order('name', { ascending: true });
      if (!error) setPartners(data || []);
      setLoading(false);
    }
    fetchPartners();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkMembership() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { setIsMember(false); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_type')
        .eq('id', user.id)
        .single();
      if (!cancelled) {
        setIsMember(!!profile?.subscription_type && profile.subscription_type !== 'none');
      }
    }
    checkMembership();
    return () => { cancelled = true; };
  }, []);

  const partnersFiltres = villeActive === "Toutes"
    ? partners
    : partners.filter((p) =>
        p.address && p.address.toLowerCase().includes(villeActive.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-[#F5F5F7]">

      {/* Hero */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl"><Emoji symbol="🍽️" label="gastronomie" size={48} /></span>
            <div>
              <div className="inline-block bg-riviera-gold text-riviera-navy text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">Jusqu'à -50%</div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-riviera-navy">Gastronomie</h1>
            </div>
          </div>
          <p className="text-gray-500 text-lg max-w-xl">Tables étoilées, bistrots cachés et coffee shops pointus.</p>
        </div>
      </section>

      {/* Filtres par ville */}
      <section className="bg-white border-b border-gray-200 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {VILLES.map((ville) => (
              <button
                key={ville}
                onClick={() => setVilleActive(ville)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  villeActive === ville
                    ? 'bg-riviera-navy text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ville}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grille des offres */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-lg">Chargement…</p>
          </div>
        ) : partnersFiltres.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnersFiltres.map((partner) => {
              let offerLabel;
              if (partner.offer_decouverte || partner.offer_permanente) {
                const discount = partner.discount_decouverte ?? partner.discount_permanente;
                offerLabel = discount ? `-${discount}%` : 'Offre exclusive';
              }
              return (
                <EstablishmentCard
                  key={partner.id}
                  href={`/experiences/${partner.slug || generatePartnerSlug(partner.name, partner.address)}`}
                  name={partner.name}
                  image={partner.photo_url}
                  city={partner.address}
                  offerLabel={offerLabel}
                  isMember={isMember}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-6xl mb-4"><Emoji symbol="🍽️" label="gastronomie" size={56} /></p>
            <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-2">Offres à venir</h2>
            <p className="text-gray-500">Les meilleures tables{villeActive !== "Toutes" ? ` à ${villeActive}` : " de la Riviera"} arrivent bientôt.</p>
          </div>
        )}
      </main>

    </div>
  );
}
