"use client";
import { useState, useEffect } from 'react';

// --- NOUVEAU : LE CSS DE L'ANIMATION AZUR ---
const azureAnimationStyles = `
  @keyframes azureFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .animate-azure-bg {
    /* Le dégradé Azur : Bleu nuit -> Bleu océan -> Turquoise profond */
    background: linear-gradient(-45deg, #020c1b, #0a2342, #004e92, #0077be);
    background-size: 300% 300%;
    /* Animation lente et fluide (15 secondes) */
    animation: azureFlow 15s ease infinite;
  }
`;
// -------------------------------------------

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fonction qui interroge l'API
    const fetchWeather = async (query) => {
      try {
        const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&q=${query}&days=3&lang=fr`);
        const data = await res.json();
        setWeather(data);
      } catch (error) {
        console.error("Erreur Météo:", error);
      } finally {
        setLoading(false);
      }
    };

    // 2. Géolocalisation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(`${position.coords.latitude},${position.coords.longitude}`);
        },
        (error) => {
          console.warn("GPS refusé, fallback Cagnes.");
          fetchWeather("Cagnes-sur-Mer"); 
        }
      );
    } else {
      fetchWeather("Cagnes-sur-Mer");
    }
  }, []);

  if (loading || !weather) {
    // Loader avec le même style pour éviter le "flash" blanc
    return (
      <>
      <style jsx>{`
        .bg-carbon-azure-loader {
          background-color: #020c1b;
          background-image: linear-gradient(135deg, rgba(0, 119, 190, 0.1) 0%, rgba(2, 12, 27, 0.3) 100%);
        }
      `}</style>
      <div className="animate-pulse bg-carbon-azure-loader h-32 rounded-[2rem] border border-blue-900/50 w-full max-w-md shadow-lg shadow-blue-900/20"></div>
      </>
    );
  }

  const getDayName = (dateStr, isTomorrow = false) => {
    if (isTomorrow) return "Demain";
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  const current = weather.current;
  const today = weather.forecast.forecastday[0].day;
  const tomorrow = weather.forecast.forecastday[1];
  const dayAfter = weather.forecast.forecastday[2];

  return (
    <>
      {/* 1. On injecte le CSS de l'animation ici */}
      <style jsx>{azureAnimationStyles}</style>

      {/* 2. On change la DIV principale avec l'animation azur fluide */}
      <div className="animate-azure-bg border border-white/20 rounded-[2rem] p-6 text-white flex justify-between items-center shadow-2xl shadow-blue-900/30 w-full max-w-md relative overflow-hidden">
        
        {/* Effet de reflet subtil par-dessus pour le côté "verre premium" */}
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>

        {/* PARTIE GAUCHE : Actuel & Min/Max du jour */}
        <div className="relative z-10">
          {/* On change la couleur du texte de la ville pour un bleu clair */}
          <h4 className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1 truncate max-w-[120px] drop-shadow-sm">
            {weather.location.name}
          </h4>
          <div className="flex items-center gap-2">
            {/* Ajout d'une petite ombre portée sur la température pour la faire ressortir */}
            <span className="text-4xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{Math.round(current.temp_c)}°</span>
            <img src={current.condition.icon} alt="Météo" className="w-12 h-12 drop-shadow-md" />
          </div>
          
          <div className="text-xs font-bold text-blue-200/80 mt-1 flex gap-2">
            <span>↓ {Math.round(today.mintemp_c)}°</span>
            <span>↑ {Math.round(today.maxtemp_c)}°</span>
          </div>
          <div className="text-xs text-blue-100 mt-1 font-medium capitalize">
            {current.condition.text}
          </div>
        </div>

        {/* PARTIE DROITE : Prévisions */}
        <div className="relative z-10 flex gap-4 sm:gap-6 text-center border-l border-white/20 pl-4 sm:pl-6">
          
          {/* Demain */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-blue-300 font-bold uppercase mb-1">
              {getDayName(tomorrow.date, true)}
            </span>
            <img src={tomorrow.day.condition.icon} alt="Demain" className="w-8 h-8 drop-shadow-sm" />
            <div className="text-xs font-bold mt-1">
              <span className="text-white">{Math.round(tomorrow.day.maxtemp_c)}°</span>
              <span className="text-blue-300/60 mx-1">/</span>
              <span className="text-blue-300/60">{Math.round(tomorrow.day.mintemp_c)}°</span>
            </div>
          </div>

          {/* Après-demain */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-blue-300 font-bold uppercase mb-1">
              {getDayName(dayAfter.date)}
            </span>
            <img src={dayAfter.day.condition.icon} alt="Jour 3" className="w-8 h-8 drop-shadow-sm" />
            <div className="text-xs font-bold mt-1">
              <span className="text-white">{Math.round(dayAfter.day.maxtemp_c)}°</span>
              <span className="text-blue-300/60 mx-1">/</span>
              <span className="text-blue-300/60">{Math.round(dayAfter.day.mintemp_c)}°</span>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}