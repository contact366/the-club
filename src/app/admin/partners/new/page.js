'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ErrorBanner, AdminBtn, Spinner } from '@/components/admin/AdminUI';
import { adminFetch } from '@/lib/admin/fetch';

const CATEGORIES = ['Gastronomie','Bien-être','Loisirs','Expériences','E-billetterie','Cuisine du Club','Exclu Web'];

const INPUT = {
  width:'100%', padding:'10px 12px',
  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)',
  borderRadius:8, color:'#fff', fontSize:13, fontFamily:'inherit',
  outline:'none', boxSizing:'border-box',
};
const LABEL = { color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 };
const SECTION_TITLE = { color:'rgba(255,255,255,0.3)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', margin:'28px 0 16px', paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' };

export default function NewPartnerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [form, setForm] = useState({
    name: '', category: '', address: '', phone: '', website: '', instagram: '',
    photo_url: '', offer_decouverte: '', offer_permanente: '',
    discount_decouverte: '', discount_permanente: '',
    pin_code: '', is_active: true,
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError('Le nom du partenaire est obligatoire.'); return; }

    setLoading(true);
    const payload = { ...form };
    if (payload.discount_decouverte !== '') payload.discount_decouverte = parseFloat(payload.discount_decouverte);
    if (payload.discount_permanente !== '') payload.discount_permanente = parseFloat(payload.discount_permanente);

    const { data, error: err } = await adminFetch('/api/admin/partners', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (err) { setError(err); return; }
    router.push(`/admin/partners/${data.partner.id}`);
  }

  return (
    <>
      <style>{`input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)} input:focus,textarea:focus,select:focus{border-color:rgba(232,213,163,0.4)!important}`}</style>
      <div style={{ padding:'32px 28px', maxWidth:760 }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom:20 }}>
          <Link href="/admin/partners" style={{ color:'rgba(255,255,255,0.3)', fontSize:12, textDecoration:'none' }}>← Partenaires</Link>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:600, margin:'8px 0 0', letterSpacing:'-0.02em' }}>Nouveau partenaire</h1>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit}>

          {/* Identité */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'22px 24px', marginBottom:16 }}>
            <div style={SECTION_TITLE}>Identité</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={LABEL}>Nom <span style={{ color:'#f87171' }}>*</span></label>
                <input style={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom de l'établissement" required />
              </div>
              <div>
                <label style={LABEL}>Catégorie</label>
                <select style={{ ...INPUT, cursor:'pointer' }} value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="" style={{ background:'#1a1f2e' }}>— Choisir —</option>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background:'#1a1f2e' }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>PIN partenaire</label>
                <input style={INPUT} value={form.pin_code} onChange={e => set('pin_code', e.target.value)} placeholder="Code à 4 chiffres" maxLength={6} />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={LABEL}>Adresse</label>
              <input style={INPUT} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Adresse complète" />
            </div>
          </div>

          {/* Contact */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'22px 24px', marginBottom:16 }}>
            <div style={SECTION_TITLE}>Contact & Présence en ligne</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={LABEL}>Téléphone</label>
                <input style={INPUT} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+33 4 93 …" />
              </div>
              <div>
                <label style={LABEL}>Site web</label>
                <input style={INPUT} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <label style={LABEL}>Instagram</label>
                <input style={INPUT} value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="https://instagram.com/…" />
              </div>
              <div>
                <label style={LABEL}>URL photo / image</label>
                <input style={INPUT} value={form.photo_url} onChange={e => set('photo_url', e.target.value)} placeholder="https://…/photo.jpg" />
              </div>
            </div>
          </div>

          {/* Offres */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'22px 24px', marginBottom:16 }}>
            <div style={SECTION_TITLE}>Offres & Avantages</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={LABEL}>Description offre Découverte</label>
                <input style={INPUT} value={form.offer_decouverte} onChange={e => set('offer_decouverte', e.target.value)} placeholder="ex: -50% à la découverte" />
              </div>
              <div>
                <label style={LABEL}>Description offre Permanente</label>
                <input style={INPUT} value={form.offer_permanente} onChange={e => set('offer_permanente', e.target.value)} placeholder="ex: -20% sur la carte" />
              </div>
              <div>
                <label style={LABEL}>Réduction Découverte (%)</label>
                <input style={INPUT} type="number" min="0" max="100" step="1" value={form.discount_decouverte} onChange={e => set('discount_decouverte', e.target.value)} placeholder="50" />
              </div>
              <div>
                <label style={LABEL}>Réduction Permanente (%)</label>
                <input style={INPUT} type="number" min="0" max="100" step="1" value={form.discount_permanente} onChange={e => set('discount_permanente', e.target.value)} placeholder="20" />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'18px 24px', marginBottom:24 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ width:16, height:16, cursor:'pointer' }} />
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>Partenaire actif (visible dans l&apos;Admin)</span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Link href="/admin/partners" style={{ display:'inline-flex', alignItems:'center', padding:'9px 18px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', fontSize:13, textDecoration:'none' }}>
              Annuler
            </Link>
            <AdminBtn type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner size={13} /> : null}
              Créer le partenaire
            </AdminBtn>
          </div>
        </form>
      </div>
    </>
  );
}
