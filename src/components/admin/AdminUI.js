'use client';

/**
 * Composants UI partagés pour les pages Admin.
 * Dark-mode only, cohérent avec le shell Admin Sprint 1.
 */

// ── Spinner ──────────────────────────────────────────────────────
export function Spinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.08)`,
      borderTopColor: '#e8d5a3',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// ── Badge Pass ───────────────────────────────────────────────────
const PASS_STYLES = {
  aventurier: { bg: 'rgba(107,158,120,0.15)', color: '#6b9e78', label: 'Aventurier' },
  explorer:   { bg: 'rgba(74,144,184,0.15)',  color: '#4a90b8', label: 'Explorer'   },
  celeste:    { bg: 'rgba(155,107,212,0.15)', color: '#9b6bd4', label: 'Céleste'    },
  céleste:    { bg: 'rgba(155,107,212,0.15)', color: '#9b6bd4', label: 'Céleste'    },
  none:       { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', label: 'Sans abonnement' },
};

export function PassBadge({ value }) {
  const key = (value || '').toLowerCase().trim();
  const s = PASS_STYLES[key] || PASS_STYLES.none;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 6,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

// ── Badge Statut ─────────────────────────────────────────────────
export function statutFromProfile(profile) {
  if (!profile) return 'inconnu';
  const type = (profile.subscription_type || '').toLowerCase().trim();
  if (!type || type === 'none') return 'sans_abonnement';
  if (!profile.expires_at) return 'actif';
  return new Date(profile.expires_at) >= new Date() ? 'actif' : 'expire';
}

const STATUT_STYLES = {
  actif:            { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', label: 'Actif'            },
  expire:           { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', label: 'Expiré'           },
  sans_abonnement:  { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', label: 'Sans abonnement' },
  inconnu:          { bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', label: '—'              },
};

export function StatutBadge({ profile }) {
  const key = statutFromProfile(profile);
  const s = STATUT_STYLES[key] || STATUT_STYLES.inconnu;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 6,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {key === 'actif' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />}
      {s.label}
    </span>
  );
}

// ── Avatar ───────────────────────────────────────────────────────
export function MemberAvatar({ profile, size = 36 }) {
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean).map(n => n[0].toUpperCase()).join('') || (profile?.email?.[0]?.toUpperCase() || '?');
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={initials}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #e8d5a3, #c9a96e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.38), fontWeight: 700, color: '#0f1117',
    }}>
      {initials}
    </div>
  );
}

// ── Formatters ───────────────────────────────────────────────────
export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function memberFullName(profile) {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || '—';
}

// ── Loading skeleton ─────────────────────────────────────────────
export function SkeletonRow({ cols = 7 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div style={{
            height: 13, borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
            animation: 'pulse 1.4s ease-in-out infinite',
            width: i === 0 ? 32 : undefined,
          }} />
        </td>
      ))}
    </tr>
  );
}

// ── Empty state ──────────────────────────────────────────────────
export function EmptyState({ icon = '◌', title, description }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>{icon}</div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500, margin: '0 0 6px' }}>{title}</p>
      {description && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>{description}</p>}
    </div>
  );
}

// ── Error banner ─────────────────────────────────────────────────
export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 10, padding: '12px 16px', color: '#fca5a5', fontSize: 13, marginBottom: 20,
    }}>
      ⚠ {message}
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────
export function SectionCard({ title, children, action }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, overflow: 'hidden', marginBottom: 16,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {title}
        </div>
        {action}
      </div>
      <div style={{ padding: '18px 20px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Info row ─────────────────────────────────────────────────────
export function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, flexShrink: 0, paddingRight: 16, minWidth: 160 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'right', wordBreak: 'break-all' }}>{value ?? '—'}</span>
    </div>
  );
}

// ── AdminBtn ─────────────────────────────────────────────────────
export function AdminBtn({ onClick, children, variant = 'ghost', small, disabled, danger, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '7px 14px' : '9px 18px',
    borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.45 : 1,
    fontFamily: 'inherit', border: 'none', lineHeight: 1.4,
  };
  const variants = {
    primary: { background: '#e8d5a3', color: '#0f1117' },
    ghost:   { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' },
    danger:  { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' },
  };
  const chosen = danger ? variants.danger : (variants[variant] || variants.ghost);
  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...chosen }}>
      {children}
    </button>
  );
}

// ── ConfirmModal ─────────────────────────────────────────────────
export function ConfirmModal({ open, title, message, confirmLabel = 'Confirmer', danger, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: '28px 28px 24px', maxWidth: 420, width: '100%',
      }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 10px', fontFamily: 'inherit' }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.7 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <AdminBtn onClick={onCancel} disabled={loading}>Annuler</AdminBtn>
          <AdminBtn onClick={onConfirm} variant={danger ? 'danger' : 'primary'} disabled={loading} danger={danger}>
            {loading ? <Spinner size={13} /> : null}
            {confirmLabel}
          </AdminBtn>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  const colors = {
    success: { bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', color: '#4ade80' },
    error:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  color: '#f87171' },
  };
  const c = colors[type] || colors.success;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99998,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: '12px 16px',
      color: c.color, fontSize: 13, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340,
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}
