"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Emoji from "@/components/Emoji";
import { supabase } from "@/lib/supabase";
import { RECETTES } from "@/data/recettes";

const TYPES_CUISINE = ["Tous", "Méditerranéenne", "Provençale", "Italienne", "Japonaise", "Fusion", "Pâtisserie"];
const DIFFICULTES = ["Toutes", "Facile", "Intermédiaire", "Expert"];
const RESTAURANTS = ["Tous", ...Array.from(new Set(RECETTES.map((r) => r.restaurant)))];

const DIFFICULTE_COLORS = {
  Facile: "bg-green-100 text-green-800",
  Intermédiaire: "bg-orange-100 text-orange-800",
  Expert: "bg-red-100 text-red-800",
};

export default function CuisineDuClubPage() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [filtreRestaurant, setFiltreRestaurant] = useState("Tous");
  const [filtreCuisine, setFiltreCuisine] = useState("Tous");
  const [filtreDifficulte, setFiltreDifficulte] = useState("Toutes");
  const recettesRef = useRef(null);

  useEffect(() => {
    async function checkAccess() {
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
    checkAccess();
  }, []);

  const recettesSemaine = RECETTES.filter((r) => r.isRecetteDeLaSemaine);
  const recetteFiltered = RECETTES.filter((r) => {
    if (r.isRecetteDeLaSemaine) return false;
    if (filtreRestaurant !== "Tous" && r.restaurant !== filtreRestaurant) return false;
    if (filtreCuisine !== "Tous" && r.typeCuisine !== filtreCuisine) return false;
    if (filtreDifficulte !== "Toutes" && r.difficulte !== filtreDifficulte) return false;
    return true;
  });

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

  return (
    <div className="min-h-screen bg-riviera-sand">

      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&q=80"
          alt="Chef en cuisine gastronomique"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-24">
          <div className="inline-block bg-riviera-gold text-riviera-navy text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            Membres exclusifs
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            La Cuisine du Club
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-4 italic">
            Chaque semaine, un chef partenaire partage une recette signature à refaire chez vous.
          </p>
          <p className="text-base md:text-lg text-white/70 max-w-3xl mx-auto mb-10">
            The Club ne se vit pas seulement au restaurant. Les chefs de notre réseau ouvrent leurs cuisines et dévoilent certaines de leurs recettes emblématiques pour les membres du club.
          </p>
          <button
            onClick={() => recettesRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="inline-block bg-riviera-gold text-riviera-navy font-bold px-8 py-4 rounded-full text-base hover:opacity-90 transition-opacity duration-200"
          >
            Explorer les recettes
          </button>
        </div>
      </section>

      {/* RECETTE DE LA SEMAINE */}
      {recettesSemaine.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <div className="inline-block bg-riviera-gold text-riviera-navy text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">
              Recette de la semaine
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-riviera-navy">
              À la une cette semaine
            </h2>
          </div>
          {recettesSemaine.map((recette) => (
            <div
              key={recette.slug}
              className="relative rounded-3xl overflow-hidden shadow-xl group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[480px] overflow-hidden">
                  <img
                    src={recette.photo}
                    alt={recette.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:hidden" />
                  <span className="absolute top-4 left-4 bg-riviera-gold text-riviera-navy text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                    Recette de la semaine
                  </span>
                </div>
                <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${DIFFICULTE_COLORS[recette.difficulte] || "bg-gray-100 text-gray-700"}`}>
                      {recette.difficulte}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                      {recette.typeCuisine}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-riviera-navy mb-2">
                    {recette.nom}
                  </h3>
                  <p className="text-riviera-azure font-semibold text-sm mb-1">
                    {recette.restaurant}
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    <Emoji symbol="📍" label="localisation" size={14} /> {recette.localisation}
                  </p>
                  <p className="text-gray-600 mb-6">{recette.description}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/cuisine-du-club/${recette.slug}`}
                      className="inline-block bg-riviera-navy text-white font-bold px-6 py-3 rounded-full text-sm hover:opacity-90 transition-opacity duration-200"
                    >
                      Voir la recette
                    </Link>
                    <Link
                      href={`/experiences/${recette.restaurantSlug}`}
                      className="inline-block border-2 border-riviera-navy text-riviera-navy font-bold px-6 py-3 rounded-full text-sm hover:bg-riviera-navy hover:text-white transition-colors duration-200"
                    >
                      Découvrir le restaurant
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* RECETTES DES CHEFS */}
      <section ref={recettesRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-riviera-navy mb-2">
            Recettes des chefs
          </h2>
          <p className="text-gray-500 text-lg">Les créations de nos chefs partenaires à refaire chez vous.</p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex flex-wrap gap-2">
            {RESTAURANTS.map((r) => (
              <button
                key={r}
                onClick={() => setFiltreRestaurant(r)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  filtreRestaurant === r
                    ? "bg-riviera-navy text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="w-full flex flex-wrap gap-2">
            {TYPES_CUISINE.map((t) => (
              <button
                key={t}
                onClick={() => setFiltreCuisine(t)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  filtreCuisine === t
                    ? "bg-riviera-azure text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
            {DIFFICULTES.map((d) => (
              <button
                key={d}
                onClick={() => setFiltreDifficulte(d)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  filtreDifficulte === d
                    ? "bg-riviera-gold text-riviera-navy shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Grille de recettes */}
        {recetteFiltered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recetteFiltered.map((recette) => (
              <Link
                key={recette.slug}
                href={`/cuisine-du-club/${recette.slug}`}
                className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-md group cursor-pointer block"
              >
                <img
                  src={recette.photo}
                  alt={recette.nom}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${DIFFICULTE_COLORS[recette.difficulte] || "bg-gray-100 text-gray-700"}`}>
                    {recette.difficulte}
                  </span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/90 text-riviera-navy">
                    {recette.typeCuisine}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 p-5">
                  <h3 className="text-white font-bold text-lg mb-1">{recette.nom}</h3>
                  <p className="text-gray-300 text-xs mb-2">{recette.restaurant}</p>
                  <p className="text-gray-400 text-xs">
                    <Emoji symbol="⏱️" label="temps" size={12} /> {recette.tempsPreparation}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4"><Emoji symbol="🍳" label="cuisine" size={48} /></p>
            <p className="text-gray-500 text-lg">Aucune recette ne correspond à vos filtres.</p>
          </div>
        )}
      </section>

      {/* SECTION CONCEPT */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed italic">
            &ldquo;Instant&amp;You est un club qui célèbre la gastronomie locale. Les chefs partenaires partagent certaines de leurs créations pour permettre aux membres de prolonger l&apos;expérience chez eux.&rdquo;
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-riviera-navy py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Envie de goûter la version originale ?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Découvrez les restaurants partenaires et leurs offres exclusives pour les membres Instant&amp;You.
          </p>
          <Link
            href="/gastronomie"
            className="inline-block bg-riviera-gold text-riviera-navy font-bold px-8 py-4 rounded-full text-base hover:opacity-90 transition-opacity duration-200"
          >
            Explorer les restaurants
          </Link>
        </div>
      </section>

    </div>
  );
}
