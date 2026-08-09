'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { EmptyState, ErrorBanner, SkeletonRow } from '@/components/admin/AdminUI';
import { adminFetch } from '@/lib/admin/fetch';

const PAGE_SIZE = 25;

const CATEGORIES = [
  'all', 'Gastronomie', 'Bien-être', 'Loisirs', 'Expériences',
  'E-billetterie', 'Cuisine du Club', 'Exclu Web',
];

const STATUS_OPTIONS = [
  { value: 'all',    label: 'Tous les statuts' },
  { value: 'actif',  label: 'Actif'            },
  { value: 'inactif', label: 'Inactif'         },
];

function StatusBadge({ isActive }) {
  return isActive === false
    ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:6, background:'rgba(239,68,68,0.1)', color:'#f87171', fontSize:11, fontWeight:600 }}>Inactif</span>
    : <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:6, background:'rgba(74,222,128,0.1)', color:'#4ade80', fontSize:11, fontWeight:600 }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:'#4ade80', flexShrink:0 }} />Actif
      </span>;
}

function PartnerAvatar({ partner, size = 36 }) {
  const img = partner.photo_url || partner.image_url;
  if (img) {
    return <img src={img} alt={partner.name} style={{ width:size, height:size, borderRadius:8, objectFit:'cover', flexShrink:0 }} />;
  }
  const initial = (partner.name || '?')[0].toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:8, flexShrink:0, background:'rgba(74,144,184,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#4a90b8' }}>
      {initial}
    </div>
  );
}

export default function PartnersPage() {
  const [partners, setPartners]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('all');
  const [statut, setStatut]       = useState('all');
  const debounceRef               = useRef(null);

  const fetchPartners = useCallback(async (p, s, cat, stat) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(p), search: s, category: cat, statut: stat });
    const { data, error: err } = await adminFetch(`/api/admin/partners?${params}`);
    if (err) { setError(err); setLoading(false); return; }
    setPartners(data.partners || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPartners(page, search, category, statut); }, [page, category, statut, fetchPartners]); // eslint-disable-line

  function handleSearch(val) {
    setSearch(val); setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPartners(1, val, category, statut), 380);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const TH = {
    textAlign:'left', padding:'11px 12px',
    color:'rgba(255,255,255,0.3)', fontWeight:600, fontSize:11,
    textTransform:'uppercase', letterSpacing:'0.07em',
    borderBottom:'1px solid rgba(255,255,255,0.07)', whiteSpace:'nowrap',
  };
  const SEL = {
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:8, padding:'8px 12px', color:'rgba(255,255,255,0.7)',
    fontSize:13, fontFamily:'inherit', cursor:'pointer', outline:'none',
  };

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}} .ptr:hover td{background:rgba(255,255,255,0.025)} .ptr td{transition:background .12s}`}</style>
      <div style={{ padding:'32px 28px', maxWidth:1360 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:24, fontWeight:600, margin:0, letterSpacing:'-0.02em' }}>Partenaires</h1>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, margin:'6px 0 0' }}>
              Gestion des établissements partenaires du Club
              {!loading && <span style={{ marginLeft:8, color:'rgba(255,255,255,0.25)' }}>— {total.toLocaleString('fr-FR')} partenaire{total!==1?'s':''}</span>}
            </p>
          </div>
          <Link href="/admin/partners/new" style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px',
            background:'#e8d5a3', color:'#0f1117', borderRadius:9, fontSize:13, fontWeight:600,
            textDecoration:'none',
          }}>
            + Ajouter un partenaire
          </Link>
        </div>

        <ErrorBanner message={error} />

        {/* Filtres */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:'1 1 220px', minWidth:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"
              style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher par nom, catégorie, ville…"
              style={{ width:'100%', paddingLeft:36, padding:'9px 12px 9px 36px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
          </div>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} style={SEL}>
            {CATEGORIES.map(c => <option key={c} value={c} style={{ background:'#1a1f2e' }}>{c === 'all' ? 'Toutes catégories' : c}</option>)}
          </select>
          <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} style={SEL}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background:'#1a1f2e' }}>{o.label}</option>)}
          </select>
        </div>

        {/* Tableau */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width:48 }}></th>
                  <th style={TH}>Partenaire</th>
                  <th style={TH}>Catégorie</th>
                  <th style={TH}>Adresse</th>
                  <th style={TH}>Offres</th>
                  <th style={TH}>Utilisations</th>
                  <th style={TH}>Affluence</th>
                  <th style={TH}>Statut</th>
                  <th style={{ ...TH, width:60 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({length:8}).map((_,i) => <SkeletonRow key={i} cols={9} />)
                  : partners.length === 0
                    ? <tr><td colSpan={9}><EmptyState title="Aucun partenaire trouvé" description="Essayez une autre recherche ou cliquez sur « + Ajouter un partenaire »." /></td></tr>
                    : partners.map(p => <PartnerRow key={p.id} partner={p} />)
                }
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>Page {page} / {totalPages}</span>
              <div style={{ display:'flex', gap:8 }}>
                {[['← Précédent', page <= 1, () => setPage(p => p-1)], ['Suivant →', page >= totalPages, () => setPage(p => p+1)]].map(([lbl, dis, fn]) => (
                  <button key={lbl} onClick={fn} disabled={dis} style={{ padding:'7px 14px', borderRadius:7, fontSize:12, fontWeight:500, background:dis?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:dis?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.6)', cursor:dis?'not-allowed':'pointer', fontFamily:'inherit' }}>{lbl}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const AFFLUENCE_LABELS = { calme:'Calme 🟢', modere:'Modéré 🟡', plein:'Plein 🔴' };

function PartnerRow({ partner }) {
  const TD = { padding:'12px', color:'rgba(255,255,255,0.65)', verticalAlign:'middle' };
  const city = partner.address?.split(',').pop()?.trim() || partner.address || '—';
  return (
    <tr className="ptr">
      <td style={{ ...TD, padding:'12px 12px 12px 16px' }}>
        <PartnerAvatar partner={partner} size={34} />
      </td>
      <td style={{ ...TD, color:'rgba(255,255,255,0.85)', fontWeight:500, whiteSpace:'nowrap', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>
        {partner.name}
      </td>
      <td style={{ ...TD, color:'rgba(255,255,255,0.45)', fontSize:12 }}>
        {partner.category || '—'}
      </td>
      <td style={{ ...TD, color:'rgba(255,255,255,0.4)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>
        {city}
      </td>
      <td style={{ ...TD, textAlign:'center', color:'#e8d5a3', fontWeight:600 }}>
        {partner.offer_count || 0}
      </td>
      <td style={{ ...TD, textAlign:'center', color:'rgba(255,255,255,0.5)' }}>
        {(partner.usage_count || 0).toLocaleString('fr-FR')}
      </td>
      <td style={{ ...TD, fontSize:12, color:'rgba(255,255,255,0.4)' }}>
        {AFFLUENCE_LABELS[partner.affluence_status] || '—'}
      </td>
      <td style={TD}><StatusBadge isActive={partner.is_active} /></td>
      <td style={{ ...TD, padding:'12px 16px 12px 8px' }}>
        <Link href={`/admin/partners/${partner.id}`} style={{ display:'inline-flex', alignItems:'center', padding:'5px 12px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.55)', fontSize:12, textDecoration:'none', whiteSpace:'nowrap' }}>
          Voir →
        </Link>
      </td>
    </tr>
  );
}
