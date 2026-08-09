"use client";
import { useState } from 'react';

const CITIES = [
  { id: 'all',    name: 'Toute la Côte d\'Azur', cx: 250, cy: 300 },
  { id: 'cannes', name: 'Cannes',                cx: 90,  cy: 350 },
  { id: 'antibes',name: 'Antibes',               cx: 145, cy: 335 },
  { id: 'cagnes', name: 'Cagnes-sur-Mer',        cx: 205, cy: 305 },
  { id: 'nice',   name: 'Nice',                  cx: 295, cy: 270 },
  { id: 'villefranche', name: 'Villefranche',    cx: 340, cy: 280 },
  { id: 'capferrat', name: 'Cap-Ferrat',         cx: 360, cy: 308 },
  { id: 'menton', name: 'Menton',                cx: 465, cy: 255 },
  { id: 'monaco', name: 'Monaco',                cx: 430, cy: 260 },
  { id: 'grasse', name: 'Grasse',                cx: 115, cy: 215 },
  { id: 'stpaul', name: 'Saint-Paul-de-Vence',   cx: 175, cy: 215 },
];

export default function RivieraMap({ partners = [], onCitySelect, selectedCity }) {
  const [hovered, setHovered] = useState(null);

  const getCount = (cityId) => {
    if (cityId === 'all') return partners.length;
    const cityName = CITIES.find(c => c.id === cityId)?.name || '';
    return partners.filter(p =>
      (p.address || '').toLowerCase().includes(cityName.split('-')[0].toLowerCase())
    ).length;
  };

  const active = selectedCity || 'all';
  const activeCity = CITIES.find(c => c.id === active) || CITIES[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center mt-12">
      {/* SVG Map */}
      <div className="relative w-full" style={{ aspectRatio: '500/360' }}>
        <svg viewBox="0 0 500 360" className="w-full h-full" aria-hidden="true">
          {/* Coastline decorative path */}
          <path
            d="M 50 310 C 90 295, 130 310, 165 308 C 195 306, 225 298, 265 285 C 305 272, 335 278, 370 280 C 405 282, 435 268, 470 258"
            stroke="#B7AA8E" strokeWidth="1.5" fill="none"
            strokeDasharray="2 8" strokeLinecap="round"
          />
          {/* Dashed line inland */}
          <path
            d="M 50 270 C 100 240, 150 210, 200 210 C 240 210, 265 230, 300 255"
            stroke="#2E7C93" strokeWidth="1" fill="none" opacity="0.35"
            strokeDasharray="4 6"
          />

          {/* City pins */}
          {CITIES.filter(c => c.id !== 'all').map((city) => {
            const isActive = active === city.id;
            const isHov   = hovered === city.id;
            return (
              <g key={city.id} style={{ cursor: 'pointer' }}
                onClick={() => onCitySelect(isActive ? 'all' : city.id)}
                onMouseEnter={() => setHovered(city.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle
                  cx={city.cx} cy={city.cy} r={isActive || isHov ? 9 : 6}
                  fill={isActive ? '#2E7C93' : '#0D2A3B'}
                  stroke="#F7F2E8" strokeWidth="2"
                  style={{ transition: 'all 0.3s' }}
                />
                <text
                  x={city.cx} y={city.cy + 20}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--font-mono, monospace)"
                  letterSpacing="0.06em"
                  fill={isActive ? '#2E7C93' : '#B7AA8E'}
                  style={{ textTransform: 'uppercase', pointerEvents: 'none', transition: 'fill 0.3s' }}
                >
                  {city.name.split('-')[0].split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* City info panel */}
      <div className="bg-white-warm rounded-[22px] p-10 border border-[rgba(24,22,17,0.07)]">
        <div className="eyebrow mb-4">Zone sélectionnée</div>
        <h3 className="font-display text-[30px] text-riviera-navy mb-1">{activeCity.name}</h3>
        <p
          className="text-riviera-azure mb-6"
          style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px' }}
        >
          {getCount(active)} expérience{getCount(active) !== 1 ? 's' : ''}
        </p>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { num: getCount(active), lbl: 'Établissements' },
            { num: partners.filter(p => (p.discount_decouverte || 0) >= 30).length, lbl: 'Offres -30%+' },
          ].map((item, i) => (
            <div key={i} className="border-t border-[rgba(24,22,17,0.07)] pt-3">
              <div className="font-display text-[26px] text-riviera-navy">{item.num}</div>
              <div className="text-[11.5px] text-stone uppercase tracking-[0.05em] mt-0.5">{item.lbl}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onCitySelect('all')}
          className="btn btn-primary btn-sm"
        >
          {active === 'all' ? 'Toutes les expériences' : `Explorer ${activeCity.name}`}
        </button>
      </div>
    </div>
  );
}
