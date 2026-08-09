'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PassBadge, StatutBadge, MemberAvatar, ErrorBanner,
  SectionCard, InfoRow, AdminBtn, ConfirmModal, Toast, Spinner,
  fmtDate, fmtDatetime, memberFullName,
} from '@/components/admin/AdminUI';
import { adminFetch } from '@/lib/admin/fetch';

// ─── Formulaire de modification ───────────────────────────────────
function EditModal({ profile, open, onClose, onSaved }) {
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (open && profile) {
      setForm({
        first_name:  profile.first_name  || '',
        last_name:   profile.last_name   || '',
        email:       profile.email       || '',
        phone:       profile.phone       || '',
        gender:      profile.gender      || '',
        birth_date:  profile.birth_date  || '',
        newsletter:  profile.newsletter  ?? false,
        sms_alerts:  profile.sms_alerts  ?? false,
      });
      setError(null);
    }
  }, [open, profile]);

  if (!open) return null;

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: err } = await adminFetch(`/api/admin/members/${profile.id}`, {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (err) { setError(err); return; }
    onSaved(data.profile);
  }

  const INPUT = {
    width: '100%', padding: '9px 12px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  };
  const LABEL = { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: 28, maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0, fontFamily: 'inherit' }}>Modifier le membre</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[['first_name', 'Prénom'], ['last_name', 'Nom']].map(([key, lbl]) => (
              <div key={key}>
                <label style={LABEL}>{lbl}</label>
                <input style={INPUT} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={LABEL}>Email</label>
            <input style={INPUT} type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={LABEL}>Téléphone</label>
              <input style={INPUT} value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label style={LABEL}>Genre</label>
              <select style={{ ...INPUT, cursor: 'pointer' }} value={form.gender || ''} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="" style={{ background: '#1a1f2e' }}>—</option>
                <option value="male"   style={{ background: '#1a1f2e' }}>Homme</option>
                <option value="female" style={{ background: '#1a1f2e' }}>Femme</option>
                <option value="other"  style={{ background: '#1a1f2e' }}>Autre</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={LABEL}>Date de naissance</label>
            <input style={INPUT} type="date" value={form.birth_date?.slice(0, 10) || ''} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            {[['newsletter', 'Newsletter'], ['sms_alerts', 'SMS alerts']].map(([key, lbl]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                <input type="checkbox" checked={!!form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                {lbl}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <AdminBtn onClick={onClose} disabled={loading}>Annuler</AdminBtn>
            <AdminBtn type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner size={13} /> : null}
              Enregistrer
            </AdminBtn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal changement de Pass ────────────────────────────────────
function ChangePlanModal({ memberId, currentPlan, open, onClose, onChanged }) {
  const PLANS = [
    { value: 'aventurier', label: 'Aventurier' },
    { value: 'explorer',   label: 'Explorer'   },
    { value: 'celeste',    label: 'Céleste'     },
    { value: 'none',       label: 'Sans abonnement' },
  ];
  const [selected, setSelected] = useState(currentPlan || 'none');
  const [confirm, setConfirm]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => { if (open) { setSelected(currentPlan || 'none'); setConfirm(false); setError(null); } }, [open, currentPlan]);

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await adminFetch(`/api/admin/members/${memberId}/change-plan`, {
      method: 'POST',
      body: JSON.stringify({ plan: selected }),
    });
    setLoading(false);
    if (err) { setError(err); return; }
    onChanged(data.profile);
  }

  const INPUT = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, maxWidth: 420, width: '100%' }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 6px', fontFamily: 'inherit' }}>Modifier le Pass</h3>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 20px', padding: '8px 12px', background: 'rgba(232,213,163,0.07)', borderRadius: 6, border: '1px solid rgba(232,213,163,0.15)' }}>
          ⚠ Modification administrative manuelle — ne modifie pas Stripe
        </p>
        {error && <ErrorBanner message={error} />}
        {!confirm ? (
          <>
            <select
              value={selected} onChange={e => setSelected(e.target.value)}
              style={{ ...INPUT, width: '100%', padding: '10px 12px', marginBottom: 20, cursor: 'pointer' }}
            >
              {PLANS.map(p => <option key={p.value} value={p.value} style={{ background: '#1a1f2e' }}>{p.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <AdminBtn onClick={onClose}>Annuler</AdminBtn>
              <AdminBtn variant="primary" onClick={() => setConfirm(true)}>Continuer</AdminBtn>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
              Confirmer le changement de Pass vers <strong style={{ color: '#e8d5a3' }}>{PLANS.find(p => p.value === selected)?.label}</strong> ?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <AdminBtn onClick={() => setConfirm(false)} disabled={loading}>Retour</AdminBtn>
              <AdminBtn variant="primary" onClick={handleConfirm} disabled={loading}>
                {loading ? <Spinner size={13} /> : null}
                Confirmer
              </AdminBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page fiche membre ───────────────────────────────────────────
export default function MemberDetailPage({ params }) {
  const { id } = use(params);
  const router  = useRouter();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [editOpen, setEditOpen]         = useState(false);
  const [planOpen, setPlanOpen]         = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]               = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: d, error: err } = await adminFetch(`/api/admin/members/${id}`);
      if (err) { setError(err); setLoading(false); return; }
      setData(d);
      setLoading(false);
    }
    load();
  }, [id]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleSaved(updatedProfile) {
    setData(d => ({ ...d, profile: { ...d.profile, ...updatedProfile } }));
    setEditOpen(false);
    showToast('Membre mis à jour.');
  }

  function handlePlanChanged(updatedProfile) {
    setData(d => ({ ...d, profile: { ...d.profile, ...updatedProfile } }));
    setPlanOpen(false);
    showToast('Pass modifié.');
  }

  async function handleResetPassword() {
    setActionLoading(true);
    const { error: err } = await adminFetch(`/api/admin/members/${id}/reset-password`, { method: 'POST' });
    setActionLoading(false);
    setResetConfirm(false);
    if (err) showToast(err, 'error');
    else showToast('Lien de réinitialisation envoyé.');
  }

  async function handleDelete() {
    setActionLoading(true);
    const { error: err } = await adminFetch(`/api/admin/members/${id}`, { method: 'DELETE' });
    setActionLoading(false);
    if (err) { showToast(err, 'error'); setDeleteConfirm(false); return; }
    router.push('/admin/members');
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Spinner size={32} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '32px 28px' }}>
        <ErrorBanner message={error || 'Membre introuvable.'} />
        <Link href="/admin/members" style={{ color: '#e8d5a3', fontSize: 13 }}>← Retour aux membres</Link>
      </div>
    );
  }

  const { profile, badges, credits, usage, favorites } = data;
  const fullName = memberFullName(profile);

  // Crédits totaux disponibles
  const totalCredits = credits.reduce((sum, c) => sum + (Number(c.amount) || Number(c.credits) || 0), 0);

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.35} }`}</style>

      <EditModal profile={profile} open={editOpen} onClose={() => setEditOpen(false)} onSaved={handleSaved} />
      <ChangePlanModal memberId={id} currentPlan={profile.subscription_type} open={planOpen} onClose={() => setPlanOpen(false)} onChanged={handlePlanChanged} />

      <ConfirmModal
        open={resetConfirm}
        title="Réinitialisation du mot de passe"
        message={`Envoyer un lien de réinitialisation à ${profile.email} ?`}
        confirmLabel="Envoyer le lien"
        onConfirm={handleResetPassword}
        onCancel={() => setResetConfirm(false)}
        loading={actionLoading}
      />
      <ConfirmModal
        open={deleteConfirm}
        title="Supprimer le compte"
        message={`Cette action est irréversible. Le compte de ${fullName} (${profile.email}) sera définitivement supprimé, y compris le compte Supabase Auth et les abonnements Stripe actifs.`}
        confirmLabel="Supprimer définitivement"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
        loading={actionLoading}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '28px 28px 48px', maxWidth: 960 }}>

        {/* Breadcrumb + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link href="/admin/members" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none' }}>
              ← Membres
            </Link>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.02em' }}>{fullName}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <AdminBtn small onClick={() => setEditOpen(true)}>✏ Modifier</AdminBtn>
            <AdminBtn small onClick={() => setPlanOpen(true)}>🎫 Modifier le Pass</AdminBtn>
            <AdminBtn small onClick={() => setResetConfirm(true)}>🔑 Réinit. mot de passe</AdminBtn>
            <AdminBtn small danger onClick={() => setDeleteConfirm(true)}>🗑 Supprimer</AdminBtn>
          </div>
        </div>

        {/* Profil résumé */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 20 }}>
          <MemberAvatar profile={profile} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{fullName}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>{profile.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <PassBadge value={profile.subscription_type} />
            <StatutBadge profile={profile} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Identité */}
          <SectionCard title="Identité">
            <InfoRow label="Prénom"       value={profile.first_name} />
            <InfoRow label="Nom"          value={profile.last_name} />
            <InfoRow label="Email"        value={profile.email} />
            <InfoRow label="Téléphone"    value={profile.phone} />
            <InfoRow label="Genre"        value={profile.gender} />
            <InfoRow label="Date de naiss." value={fmtDate(profile.birth_date)} />
            <InfoRow label="Inscrit le"   value={fmtDate(profile.created_at)} />
          </SectionCard>

          {/* Abonnement */}
          <SectionCard title="Abonnement">
            <InfoRow label="Pass" value={<PassBadge value={profile.subscription_type} />} />
            <InfoRow label="Statut" value={<StatutBadge profile={profile} />} />
            <InfoRow label="Début d'abonnement" value={fmtDate(profile.subscription_started_at)} />
            <InfoRow label="Expiration" value={fmtDate(profile.expires_at)} />
            <InfoRow label="Stripe Customer ID" value={profile.stripe_customer_id
              ? <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{profile.stripe_customer_id}</span>
              : null} />
            <InfoRow label="Subscription" value={profile.subscription
              ? <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{profile.subscription}</span>
              : null} />
            <InfoRow label="Insider access" value={profile.insider_access ? 'Oui' : 'Non'} />
          </SectionCard>

          {/* Économies & Parrainage */}
          <SectionCard title="Économies & Parrainage">
            <InfoRow label="Montant économisé" value={profile.montant_economise != null ? `${Number(profile.montant_economise).toLocaleString('fr-FR')} €` : null} />
            <InfoRow label="Code parrainage"   value={profile.referral_code} />
            <InfoRow label="Filleuls"          value={profile.referral_count != null ? String(profile.referral_count) : null} />
            <InfoRow label="Parrainé par"      value={profile.referred_by} />
          </SectionCard>

          {/* Préférences */}
          <SectionCard title="Préférences">
            <InfoRow label="Newsletter"    value={profile.newsletter ? 'Activée' : 'Désactivée'} />
            <InfoRow label="SMS alerts"    value={profile.sms_alerts ? 'Activées' : 'Désactivées'} />
            <InfoRow label="CGU acceptées" value={fmtDatetime(profile.cgu_accepted_at)} />
          </SectionCard>

          {/* Badges */}
          <SectionCard title={`Badges (${badges.length})`}>
            {badges.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0 }}>Aucun badge.</p>
            ) : (
              badges.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{b.badges?.name || b.badges?.code || 'Badge'}</span>
                    {b.is_unlocked && <span style={{ marginLeft: 6, fontSize: 10, color: '#e8d5a3' }}>✓ Débloqué</span>}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {b.current_count} / {b.badges?.required_count ?? '?'}
                  </span>
                </div>
              ))
            )}
          </SectionCard>

          {/* Crédits */}
          <SectionCard title="Crédits bonus">
            {credits.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0 }}>Aucun crédit.</p>
            ) : (
              <>
                <InfoRow label="Total disponible" value={`${totalCredits.toLocaleString('fr-FR')}`} />
                {credits.map((c, i) => (
                  <div key={c.id || i} style={{ padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{fmtDate(c.created_at)}</span>
                    <span style={{ color: '#e8d5a3', fontSize: 13 }}>{Number(c.amount || c.credits || 0).toLocaleString('fr-FR')}</span>
                  </div>
                ))}
              </>
            )}
          </SectionCard>

        </div>

        {/* Favoris */}
        <SectionCard title={`Favoris (${favorites.length})`}>
          {favorites.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0 }}>Aucun favori.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {favorites.map(f => (
                <span key={f.id} style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {f.partners?.name || f.partner_id}
                  {f.partners?.category && <span style={{ marginLeft: 6, opacity: 0.5 }}>· {f.partners.category}</span>}
                </span>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Utilisations récentes */}
        <SectionCard title={`Dernières utilisations (${usage.length})`}>
          {usage.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0 }}>Aucune utilisation.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Date', 'Offre', 'Partenaire', 'Type'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0 12px 10px 0', color: 'rgba(255,255,255,0.3)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usage.map((u, i) => (
                    <tr key={u.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px 10px 0', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{fmtDatetime(u.used_at)}</td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'rgba(255,255,255,0.7)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.offers?.title || '—'}</td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'rgba(255,255,255,0.5)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.offers?.partners?.name || '—'}</td>
                      <td style={{ padding: '10px 0 10px 0' }}>
                        {u.offer_type ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}>{u.offer_type}</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Suspension — à venir */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suspension / Réactivation</div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: '4px 0 0', lineHeight: 1.5 }}>
              Aucune colonne de suspension n&apos;existe dans <code style={{ fontFamily: 'monospace' }}>profiles</code>.<br />
              Cette action sera disponible lors d&apos;un prochain sprint avec la colonne dédiée.
            </p>
          </div>
          <span style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>À venir</span>
        </div>

      </div>
    </>
  );
}
