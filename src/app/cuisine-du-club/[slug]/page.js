"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Emoji from "@/components/Emoji";
import { supabase } from "@/lib/supabase";
import { RECETTES } from "@/data/recettes";

const DIFFICULTE_COLORS = {
  Facile: "bg-green-100 text-green-800",
  Intermédiaire: "bg-orange-100 text-orange-800",
  Expert: "bg-red-100 text-red-800",
};

export default function RecettePage({ params }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    async function init() {
      const { slug: resolvedSlug } = await params;
      setSlug(resolvedSlug);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_type")
        .eq("id", user.id)
        .single();
      const sub = profile?.subscription_type;
      setHasAccess(!!sub && sub !== "none");
      setLoading(false);
    }
    init();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-riviera-sand flex items-center justify-center">
        <p className="text-gray-400 text-lg">Chargement…</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-riviera-sand flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-riviera-navy flex items-center justify-center">
              <Emoji symbol="🔒" label="cadenas" size={36} />
            </div>
          </div>
          <h1 className="font-serif text-3xl font-bold text-riviera-navy mb-4">
            Contenu réservé aux membres
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            Accédez aux recettes exclusives des chefs partenaires en rejoignant The Club.
          </p>
          <Link
            href="/#tarifs"
            className="inline-block bg-riviera-gold text-riviera-navy font-bold px-8 py-4 rounded-full text-base hover:opacity-90 transition-opacity duration-200"
          >
            Découvrir les Pass
          </Link>
        </div>
      </div>
    );
  }

  const recette = RECETTES.find((r) => r.slug === slug);

  if (!recette) {
    return (
      <div className="min-h-screen bg-riviera-sand flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-riviera-navy mb-2">
            Recette introuvable
          </h1>
          <p className="text-gray-500 mb-6">Cette recette n&apos;existe pas encore.</p>
          <Link
            href="/cuisine-du-club"
            className="inline-block bg-riviera-navy text-white font-bold px-6 py-3 rounded-full text-sm hover:opacity-90 transition-opacity duration-200"
          >
            ← Retour aux recettes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-riviera-sand">

      {/* HEADER RECETTE */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/cuisine-du-club"
            className="inline-flex items-center text-riviera-azure font-semibold text-sm hover:opacity-80 transition-opacity duration-200 mb-6"
          >
            ← Toutes les recettes
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${DIFFICULTE_COLORS[recette.difficulte] || "bg-gray-100 text-gray-700"}`}>
              {recette.difficulte}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
              {recette.typeCuisine}
            </span>
            {recette.isRecetteDeLaSemaine && (
              <span className="text-xs font-black px-3 py-1 rounded-full bg-riviera-gold text-riviera-navy uppercase tracking-widest">
                Recette de la semaine
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-riviera-navy mb-3">
            {recette.nom}
          </h1>
          <Link
            href={`/experiences/${recette.restaurantSlug}`}
            className="text-riviera-azure font-semibold text-lg hover:opacity-80 transition-opacity duration-200"
          >
            {recette.restaurant}
          </Link>
          <span className="text-gray-400 text-sm ml-3">
            <Emoji symbol="📍" label="localisation" size={14} /> {recette.localisation}
          </span>
        </div>
      </section>

      {/* PHOTO DU PLAT */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl overflow-hidden aspect-video shadow-lg">
          <img
            src={recette.photo}
            alt={recette.nom}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">

        {/* INTRODUCTION DU CHEF */}
        <section className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-shrink-0 text-riviera-gold">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.123.474-.197.474-.197L9.758 4.03c0 0-.218.052-.597.144C8.97 4.222 8.737 4.278 8.472 4.345c-.271.05-.56.187-.882.312C7.272 4.799 6.904 4.895 6.562 5.123c-.344.218-.741.4-1.091.692C5.132 6.116 4.723 6.377 4.421 6.76c-.33.358-.656.734-.909 1.162C3.219 8.33 3.02 8.778 2.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C2.535 17.474 4.338 19 6.5 19c2.485 0 4.5-2.015 4.5-4.5S8.985 10 6.5 10zM17.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.123.474-.197.474-.197L20.758 4.03c0 0-.218.052-.597.144-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.318.142-.686.238-1.028.466-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162C14.219 8.33 14.02 8.778 13.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C13.535 17.474 15.338 19 17.5 19c2.485 0 4.5-2.015 4.5-4.5S19.985 10 17.5 10z"/>
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-lg leading-relaxed italic">{recette.introChef}</p>
              <p className="text-riviera-navy font-semibold mt-3">— Chef de {recette.restaurant}</p>
            </div>
          </div>
        </section>

        {/* BLOC INFORMATIONS */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2"><Emoji symbol="⏱️" label="temps de préparation" size={32} /></p>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Préparation</p>
              <p className="font-bold text-riviera-navy text-lg">{recette.tempsPreparation}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2"><Emoji symbol="🔥" label="temps de cuisson" size={32} /></p>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Cuisson</p>
              <p className="font-bold text-riviera-navy text-lg">{recette.tempsCuisson}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2"><Emoji symbol="📊" label="difficulté" size={32} /></p>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Difficulté</p>
              <p className="font-bold text-riviera-navy text-lg">{recette.difficulte}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2"><Emoji symbol="👥" label="personnes" size={32} /></p>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Personnes</p>
              <p className="font-bold text-riviera-navy text-lg">{recette.nombrePersonnes}</p>
            </div>
          </div>
        </section>

        {/* INGRÉDIENTS */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-6">Ingrédients</h2>
          <div className="bg-riviera-sand/60 rounded-3xl p-8">
            <ul className="space-y-3">
              {recette.ingredients.map((ingredient, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-riviera-gold mt-2" />
                  <span className="text-gray-700">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ÉTAPES */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-6">Préparation</h2>
          <div className="space-y-4">
            {recette.etapes.map((etape, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-sm flex gap-5">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-riviera-gold flex items-center justify-center font-bold text-riviera-navy text-sm">
                  {i + 1}
                </div>
                <p className="text-gray-700 leading-relaxed pt-1">{etape}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CONSEIL DU CHEF */}
        <section>
          <div className="bg-riviera-sand border-l-4 border-riviera-gold rounded-3xl p-8">
            <div className="flex items-start gap-4">
              <Emoji symbol="⭐" label="conseil" size={28} />
              <div>
                <h3 className="font-serif text-xl font-bold text-riviera-navy mb-2">Conseil du chef</h3>
                <p className="text-gray-600 leading-relaxed">{recette.conseilChef}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ACCORD METS/VIN */}
        <section>
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <Emoji symbol="🍷" label="vin" size={28} />
              <div>
                <h3 className="font-serif text-xl font-bold text-riviera-navy mb-2">Accord mets &amp; vins</h3>
                <p className="text-gray-600 leading-relaxed">{recette.accordVin}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOC RESTAURANT PARTENAIRE */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-6">Le restaurant partenaire</h2>
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={recette.photoRestaurant}
                alt={recette.restaurant}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h3 className="absolute bottom-4 left-6 font-serif text-2xl font-bold text-white">
                {recette.restaurant}
              </h3>
            </div>
            <div className="p-8 space-y-3">
              <div className="flex items-start gap-3">
                <Emoji symbol="📍" label="adresse" size={18} />
                <p className="text-gray-600">{recette.adresseRestaurant}</p>
              </div>
              <div className="flex items-start gap-3">
                <Emoji symbol="🕐" label="horaires" size={18} />
                <p className="text-gray-600">{recette.horairesRestaurant}</p>
              </div>
              <div className="pt-4">
                <Link
                  href={`/experiences/${recette.restaurantSlug}`}
                  className="inline-block bg-riviera-gold text-riviera-navy font-bold px-6 py-3 rounded-full text-sm hover:opacity-90 transition-opacity duration-200"
                >
                  Découvrir l&apos;offre Instant&amp;You
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* NAVIGATION */}
        <div className="pt-4">
          <Link
            href="/cuisine-du-club"
            className="inline-flex items-center gap-2 text-riviera-navy font-semibold hover:text-riviera-azure transition-colors duration-200"
          >
            ← Retour à La Cuisine du Club
          </Link>
        </div>

      </div>
    </div>
  );
}
