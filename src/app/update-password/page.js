'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();

  // États du formulaire
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState(null);

  // Supabase détecte automatiquement la session PASSWORD_RECOVERY
  // depuis le fragment URL (#access_token=...&type=recovery)
  // injecté par le lien de réinitialisation.
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking]         = useState(true);

  useEffect(() => {
    // Écouter l'événement PASSWORD_RECOVERY déclenché par Supabase
    // après parsing du fragment URL du lien de récupération.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setChecking(false);
      }
    });

    // Vérifier aussi si une session active existe déjà
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    // updateUser ne transmet jamais le mot de passe à nos serveurs —
    // il passe directement de Supabase Auth côté client à Supabase.
    const { error: updateErr } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateErr) {
      setError(updateErr.message || 'Erreur lors de la mise à jour du mot de passe.');
      return;
    }

    setSuccess(true);
    // Déconnexion propre après changement de mot de passe
    await supabase.auth.signOut();
  }

  // ── Styles de base ────────────────────────────────────────────
  const pageStyle = {
    minHeight: '100vh',
    background: '#0f1117',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  };

  const cardStyle = {
    background: '#161b27',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '36px 32px',
    maxWidth: 420,
    width: '100%',
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 9,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: 6,
  };

  const labelStyle = {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  };

  const btnStyle = {
    width: '100%',
    padding: '12px',
    background: '#e8d5a3',
    color: '#0f1117',
    border: 'none',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    fontFamily: 'inherit',
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };

  // ── Vérification en cours ──────────────────────────────────────
  if (checking) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            borderTopColor: '#e8d5a3',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Vérification du lien…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Lien invalide / expiré ────────────────────────────────────
  if (!sessionReady) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Lien invalide ou expiré
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Ce lien de réinitialisation est invalide ou a déjà été utilisé.<br />
              Veuillez en demander un nouveau.
            </p>
          </div>
          <a
            href="/"
            style={{
              display: 'block', textAlign: 'center',
              padding: '11px 20px', borderRadius: 9,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none',
            }}
          >
            Retour à l'accueil
          </a>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Succès ────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 24,
            }}>
              ✓
            </div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Mot de passe mis à jour
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Votre mot de passe a été modifié avec succès.<br />
              Vous pouvez maintenant vous reconnecter.
            </p>
          </div>
          <a
            href="/profil"
            style={{
              display: 'block', textAlign: 'center',
              padding: '12px 20px', borderRadius: 9,
              background: '#e8d5a3', color: '#0f1117',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'linear-gradient(135deg, #e8d5a3, #c9a96e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#0f1117',
          }}>
            TC
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>The Club</span>
        </div>

        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Nouveau mot de passe
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 24px' }}>
          Choisissez un mot de passe sécurisé (8 caractères minimum).
        </p>

        {/* Erreur */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 8, padding: '10px 14px',
            color: '#fca5a5', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              required
              minLength={8}
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={labelStyle}>Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              required
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" style={btnStyle} disabled={loading}>
            {loading && (
              <div style={{
                width: 15, height: 15, borderRadius: '50%',
                border: '2px solid rgba(15,17,23,0.2)',
                borderTopColor: '#0f1117',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
            {loading ? 'Mise à jour…' : 'Définir le nouveau mot de passe'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(232,213,163,0.4) !important; }
      `}</style>
    </div>
  );
}
