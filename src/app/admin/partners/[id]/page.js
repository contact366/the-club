'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  SectionCard, InfoRow, AdminBtn, ConfirmModal, Toast, Spinner,
  ErrorBanner, EmptyState, fmtDate, fmtDatetime,
} from '@/components/admin/AdminUI';
import { adminFetch } from '@/lib/admin/fetch';

// ─── Helpers ────────────────────────────────────────────────────
const CATEGORIES = ['Gastronomie','Bien-être','Loisirs','Expériences','E-billetterie','Cuisine du Club','Exclu Web'];
const INPUT  = { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' };
const LABEL  = { color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5 };

function StatusBadge({ isActive }) {
  return isActive === false
    ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, background:'rgba(239,68,68,0.1)', color:'#f87171', fontSize:11, fontWeight:600 }}>Inactif</span>
    : <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, background:'rgba(74,222,128,0.1)', color:'#4ade80', fontSize:11, fontWeight:600 }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:'#4ade80' }} />Actif
      </span>;
}

function PartnerLogo({ partner, size=52 }) {
  const img = partner.photo_url || partner.image_url;
  if (img) return <img src={img} alt={partner.name} style={{ width:size, height:size, borderRadius:10, objectFit:'cover', flexShrink:0 }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:10, background:'rgba(74,144,184,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#4a90b8', flexShrink:0 }}>
      {(partner.name||'?')[0].toUpperCase()}
    </div>
  );
}

// ─── Modal modification partenaire ───────────────────────────────
function EditPartnerModal({ partner, open, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && partner) {
      setForm({
        name:                 partner.name                 || '',
        category:             partner.category             || '',
        address:              partner.address              || '',
        phone:                partner.phone                || '',
        website:              partner.website              || '',
        instagram:            partner.instagram            || '',
        photo_url:            partner.photo_url            || '',
        offer_decouverte:     partner.offer_decouverte     || '',
        offer_permanente:     partner.offer_permanente     || '',
        discount_decouverte:  partner.discount_decouverte  ?? '',
        discount_permanente:  partner.discount_permanente  ?? '',
        pin_code:             partner.pin_code             || '',
        is_active:            partner.is_active            ?? true,
      });
      setError(null);
    }
  }, [open, partner]);

  if (!open) return null;

  function s(k, v) { setForm(f => ({...f, [k]:v})); }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    const payload = { ...form };
    if (payload.discount_decouverte !== '') payload.discount_decouverte = parseFloat(payload.discount_decouverte);
    else delete payload.discount_decouverte;
    if (payload.discount_permanente !== '') payload.discount_permanente = parseFloat(payload.discount_permanente);
    else delete payload.discount_permanente;

    const { data, error: err } = await adminFetch(`/api/admin/partners/${partner.id}`, { method:'PATCH', body:JSON.stringify(payload) });
    setLoading(false);
    if (err) { setError(err); return; }
    onSaved(data.partner);
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#1a1f2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:28, maxWidth:640, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ color:'#fff', fontSize:16, fontWeight:600, margin:0, fontFamily:'inherit' }}>Modifier le partenaire</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
        </div>
        {error && <ErrorBanner message={error} />}
        <form onSubmit={handleSave}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={LABEL}>Nom *</label>
              <input style={INPUT} value={form.name||''} onChange={e => s('name', e.target.value)} required />
            </div>
            <div>
              <label style={LABEL}>Catégorie</label>
              <select style={{ ...INPUT, cursor:'pointer' }} value={form.category||''} onChange={e => s('category', e.target.value)}>
                <option value="" style={{ background:'#1a1f2e' }}>—</option>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background:'#1a1f2e' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>PIN</label>
              <input style={INPUT} value={form.pin_code||''} onChange={e => s('pin_code', e.target.value)} maxLength={6} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={LABEL}>Adresse</label>
              <input style={INPUT} value={form.address||''} onChange={e => s('address', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Téléphone</label>
              <input style={INPUT} value={form.phone||''} onChange={e => s('phone', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Site web</label>
              <input style={INPUT} value={form.website||''} onChange={e => s('website', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Instagram</label>
              <input style={INPUT} value={form.instagram||''} onChange={e => s('instagram', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>URL photo</label>
              <input style={INPUT} value={form.photo_url||''} onChange={e => s('photo_url', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Offre Découverte</label>
              <input style={INPUT} value={form.offer_decouverte||''} onChange={e => s('offer_decouverte', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Offre Permanente</label>
              <input style={INPUT} value={form.offer_permanente||''} onChange={e => s('offer_permanente', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Réduction Découverte (%)</label>
              <input style={INPUT} type="number" min="0" max="100" value={form.discount_decouverte??''} onChange={e => s('discount_decouverte', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Réduction Permanente (%)</label>
              <input style={INPUT} type="number" min="0" max="100" value={form.discount_permanente??''} onChange={e => s('discount_permanente', e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'rgba(255,255,255,0.6)', fontSize:13 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={e => s('is_active', e.target.checked)} style={{ width:16, height:16, cursor:'pointer' }} />
              Partenaire actif
            </label>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <AdminBtn onClick={onClose} disabled={loading}>Annuler</AdminBtn>
            <AdminBtn type="submit" variant="primary" disabled={loading}>{loading ? <Spinner size={13}/> : null}Enregistrer</AdminBtn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Carte offre ────────────────────────────────────────────────
function OfferCard({ offer }) {
  function benefitStr(type, value, label) {
    if (label) return label;
    if (type === 'percentage' && value) return `-${value}%`;
    if (value) return String(value);
    return '—';
  }
  return (
    <div style={{ padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div>
          <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500 }}>{offer.title || 'Sans titre'}</span>
          {offer.offer_type && <span style={{ marginLeft:8, padding:'2px 7px', borderRadius:4, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.4)', fontSize:10 }}>{offer.offer_type}</span>}
        </div>
        <span style={{ padding:'2px 8px', borderRadius:5, background: offer.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', color: offer.is_active ? '#4ade80' : '#f87171', fontSize:10, fontWeight:600 }}>
          {offer.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          ['Aventurier', offer.aventurier_enabled, offer.aventurier_benefit_type, offer.aventurier_benefit_value, offer.aventurier_benefit_label, '#6b9e78'],
          ['Explorer',   offer.explorer_enabled,   offer.explorer_benefit_type,   offer.explorer_benefit_value,   offer.explorer_benefit_label,   '#4a90b8'],
          ['Céleste',    offer.celeste_enabled,     offer.celeste_benefit_type,    offer.celeste_benefit_value,    offer.celeste_benefit_label,    '#9b6bd4'],
        ].map(([name, enabled, type, value, label, color]) => (
          <span key={name} style={{ fontSize:11, color: enabled ? color : 'rgba(255,255,255,0.2)', fontWeight:500 }}>
            {name}: {enabled ? benefitStr(type, value, label) : 'Non inclus'}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Page fiche partenaire ────────────────────────────────────────
export default function PartnerDetailPage({ params }) {
  const { id } = use(params);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editOpen, setEditOpen]         = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState(false);
  const [toggling, setToggling]         = useState(false);
  const [toast, setToast]               = useState(null);

  useEffect(() => {
    async function load() {
      const { data: d, error: err } = await adminFetch(`/api/admin/partners/${id}`);
      if (err) { setError(err); setLoading(false); return; }
      setData(d); setLoading(false);
    }
    load();
  }, [id]);

  function showToast(msg, type='success') { setToast({msg, type}); setTimeout(()=>setToast(null), 3500); }

  function handleSaved(updated) {
    setData(d => ({ ...d, partner: { ...d.partner, ...updated } }));
    setEditOpen(false);
    showToast('Partenaire mis à jour.');
  }

  async function handleToggle() {
    setToggling(true);
    const newActive = !data.partner.is_active;
    const { error: err } = await adminFetch(`/api/admin/partners/${id}`, {
      method:'PATCH', body:JSON.stringify({ is_active: newActive }),
    });
    setToggling(false); setToggleConfirm(false);
    if (err) { showToast(err, 'error'); return; }
    setData(d => ({ ...d, partner: { ...d.partner, is_active: newActive } }));
    showToast(newActive ? 'Partenaire activé.' : 'Partenaire désactivé.');
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:300 }}>
      <Spinner size={32} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding:'32px 28px' }}>
      <ErrorBanner message={error || 'Partenaire introuvable.'} />
      <Link href="/admin/partners" style={{ color:'#e8d5a3', fontSize:13 }}>← Retour aux partenaires</Link>
    </div>
  );

  const { partner, offers, accounts, stats } = data;
  const isActive = partner.is_active;

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

      <EditPartnerModal partner={partner} open={editOpen} onClose={()=>setEditOpen(false)} onSaved={handleSaved} />
      <ConfirmModal
        open={toggleConfirm}
        title={isActive ? 'Désactiver le partenaire' : 'Activer le partenaire'}
        message={isActive
          ? `Désactiver ${partner.name} ? L'historique, les offres et les statistiques sont conservés.`
          : `Activer ${partner.name} ?`}
        confirmLabel={isActive ? 'Désactiver' : 'Activer'}
        danger={isActive}
        onConfirm={handleToggle}
        onCancel={()=>setToggleConfirm(false)}
        loading={toggling}
      />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      <div style={{ padding:'28px 28px 48px', maxWidth:1000 }}>

        {/* Breadcrumb + actions */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22, flexWrap:'wrap', gap:12 }}>
          <div>
            <Link href="/admin/partners" style={{ color:'rgba(255,255,255,0.3)', fontSize:12, textDecoration:'none' }}>← Partenaires</Link>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:600, margin:'6px 0 0', letterSpacing:'-0.02em' }}>{partner.name}</h1>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <AdminBtn small onClick={()=>setEditOpen(true)}>✏ Modifier</AdminBtn>
            <AdminBtn small danger={isActive} onClick={()=>setToggleConfirm(true)}>
              {isActive ? '⏸ Désactiver' : '▶ Activer'}
            </AdminBtn>
          </div>
        </div>

        {/* Résumé */}
        <div style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, marginBottom:20 }}>
          <PartnerLogo partner={partner} size={52} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'#fff', fontSize:16, fontWeight:600 }}>{partner.name}</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginTop:2 }}>{partner.category || '—'}</div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <StatusBadge isActive={partner.is_active} />
            {partner.affluence_status && (
              <span style={{ padding:'4px 10px', borderRadius:6, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', fontSize:11 }}>
                {{calme:'🟢 Calme', modere:'🟡 Modéré', plein:'🔴 Plein'}[partner.affluence_status] || partner.affluence_status}
              </span>
            )}
          </div>
        </div>

        {/* Statistiques rapides */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:20 }}>
          {[
            ['Utilisations', stats.totalUsages.toLocaleString('fr-FR'), '#e8d5a3'],
            ['Membres uniques', stats.uniqueUsers.toLocaleString('fr-FR'), '#4a90b8'],
            ['CA généré', `${stats.totalRevenue.toLocaleString('fr-FR')} €`, '#6b9e78'],
            ['Économies membres', `${stats.totalSavings.toLocaleString('fr-FR')} €`, '#9b6bd4'],
            ['Offres actives', offers.filter(o=>o.is_active).length, '#e8d5a3'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'16px' }}>
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>{label}</div>
              <div style={{ color:'#fff', fontSize:22, fontWeight:600, letterSpacing:'-0.02em' }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          {/* Identité */}
          <SectionCard title="Identité">
            <InfoRow label="Nom"         value={partner.name} />
            <InfoRow label="Catégorie"   value={partner.category} />
            <InfoRow label="Adresse"     value={partner.address} />
            <InfoRow label="Téléphone"   value={partner.phone} />
            <InfoRow label="Site web"    value={partner.website ? <a href={partner.website} target="_blank" rel="noopener noreferrer" style={{ color:'#4a90b8' }}>{partner.website}</a> : null} />
            <InfoRow label="Instagram"   value={partner.instagram ? <a href={partner.instagram} target="_blank" rel="noopener noreferrer" style={{ color:'#4a90b8' }}>{partner.instagram}</a> : null} />
            <InfoRow label="Slug"        value={partner.slug} />
          </SectionCard>

          {/* Offres textuelles */}
          <SectionCard title="Offres & Avantages">
            <InfoRow label="Offre Découverte"       value={partner.offer_decouverte} />
            <InfoRow label="Réduction Découverte"   value={partner.discount_decouverte != null ? `${partner.discount_decouverte}%` : null} />
            <InfoRow label="Offre Permanente"       value={partner.offer_permanente} />
            <InfoRow label="Réduction Permanente"   value={partner.discount_permanente != null ? `${partner.discount_permanente}%` : null} />
            <InfoRow label="PIN partenaire"         value={partner.pin_code ? <span style={{ fontFamily:'monospace', fontSize:18, color:'#e8d5a3', letterSpacing:'0.15em' }}>{partner.pin_code}</span> : null} />
          </SectionCard>
        </div>

        {/* Offres (table offers) */}
        <SectionCard title={`Offres du catalogue (${offers.length})`}>
          {offers.length === 0 ? (
            <EmptyState title="Aucune offre dans le catalogue" description="Les offres seront gérées dans le module Offres (Sprint 4)." />
          ) : (
            offers.map(o => <OfferCard key={o.id} offer={o} />)
          )}
        </SectionCard>

        {/* Compte partenaire */}
        <SectionCard title={`Compte partenaire (${accounts.length})`}>
          {accounts.length === 0 ? (
            <div style={{ color:'rgba(255,255,255,0.25)', fontSize:13 }}>
              Aucun compte partenaire.{' '}
              <span style={{ color:'rgba(255,255,255,0.15)', fontSize:11 }}>
                La création d&apos;un compte partenaire enverra les accès à l&apos;espace partenaire existant.
              </span>
            </div>
          ) : (
            accounts.map(acc => (
              <div key={acc.id} style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <span style={{ color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:500 }}>
                      {acc.profiles?.first_name || ''} {acc.profiles?.last_name || ''} {acc.profiles?.email ? `(${acc.profiles.email})` : ''}
                    </span>
                    <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11, marginTop:2 }}>Rôle : {acc.role} · Créé le {fmtDate(acc.created_at)}</div>
                  </div>
                  <span style={{ padding:'3px 8px', borderRadius:5, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', fontSize:11 }}>
                    {acc.user_id ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))
          )}
          <div style={{ marginTop:12 }}>
            <span style={{ padding:'6px 14px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.25)', fontSize:11, fontWeight:600 }}>
              Création de compte → Sprint dédié
            </span>
          </div>
        </SectionCard>

        {/* Activité récente */}
        <SectionCard title={`Activité récente (${stats.recentUsages.length} dernières)`}>
          {stats.recentUsages.length === 0 ? (
            <EmptyState title="Aucune utilisation" description="Aucune consommation enregistrée pour ce partenaire." />
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {['Date', 'Type', 'Montant', 'Économie'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'0 12px 10px 0', color:'rgba(255,255,255,0.3)', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsages.map((u, i) => (
                    <tr key={u.id||i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'9px 12px 9px 0', color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap' }}>{fmtDatetime(u.created_at)}</td>
                      <td style={{ padding:'9px 12px 9px 0' }}>
                        {u.offer_type && <span style={{ padding:'2px 7px', borderRadius:4, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)', fontSize:11 }}>{u.offer_type}</span>}
                      </td>
                      <td style={{ padding:'9px 12px 9px 0', color:'rgba(255,255,255,0.6)' }}>{u.original_amount != null ? `${Number(u.original_amount).toLocaleString('fr-FR')} €` : '—'}</td>
                      <td style={{ padding:'9px 0 9px 0', color:'#6b9e78' }}>{u.saved_amount != null ? `-${Number(u.saved_amount).toLocaleString('fr-FR')} €` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Affluence — section info */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Affluence & Historique détaillé</div>
            <p style={{ color:'rgba(255,255,255,0.25)', fontSize:12, margin:'4px 0 0', lineHeight:1.5 }}>
              Les tables <code style={{ fontFamily:'monospace' }}>partner_stats_daily</code>, <code style={{ fontFamily:'monospace' }}>partner_visits</code> et <code style={{ fontFamily:'monospace' }}>affluence_history</code> existent mais ne sont pas encore alimentées par l&apos;app.
              L&apos;affluence en temps réel est gérée via l&apos;espace partenaire public existant.
            </p>
          </div>
          <span style={{ padding:'5px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.25)', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>À venir</span>
        </div>

      </div>
    </>
  );
}
