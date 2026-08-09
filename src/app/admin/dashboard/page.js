'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Carte statistique ───────────────────────────────────────────
function StatCard({ label, value, description, color = '#e8d5a3', loading }) {
  return (
    <div className="admin-stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 2 }} />
      </div>
      {loading ? (
        <div style={{ height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ) : (
        <div style={{ color: '#fff', fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </div>
      )}
      {description && (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 }}>
          {description}
        </div>
      )}
    </div>
  );
}

// ─── Badge pass ──────────────────────────────────────────────────
const PASS_COLORS = {
  aventurier:       '#6b9e78',
  explorer:         '#4a90b8',
  celeste:          '#9b6bd4',
  sans_abonnement:  '#444',
};
const PASS_LABELS = {
  aventurier:       'Aventurier',
  explorer:         'Explorer',
  celeste:          'Céleste',
  sans_abonnement:  'Sans abonnement',
};

function PassBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          {count.toLocaleString('fr-FR')} <span style={{ fontSize: 11 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 100,
          background: color, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ─── Utilitaire date ─────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Page Dashboard ──────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setError('Session expirée.'); setLoading(false); return; }

        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Erreur ${res.status}`);
        }

        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = data?.stats || {};
  const pass = data?.passRepartition || {};
  const activite = data?.activiteRecente || [];
  const totalMembres = (pass.aventurier || 0) + (pass.explorer || 0) + (pass.celeste || 0) + (pass.sans_abonnement || 0);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200 }}>
      {/* Titre */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '6px 0 0' }}>
          Vue d'ensemble — données en temps réel depuis Supabase
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 28,
          color: '#fca5a5', fontSize: 13,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Membres"
          value={stats.membresActifs}
          description="Profils enregistrés"
          color="#6b9e78"
          loading={loading}
        />
        <StatCard
          label="Partenaires"
          value={stats.partenairesActifs}
          description="Établissements partenaires"
          color="#4a90b8"
          loading={loading}
        />
        <StatCard
          label="Offres actives"
          value={stats.offresActives}
          description="Offres disponibles"
          color="#e8d5a3"
          loading={loading}
        />
        <StatCard
          label="Utilisations"
          value={stats.totalUtilisations}
          description="Total toutes périodes"
          color="#9b6bd4"
          loading={loading}
        />
      </div>

      {/* Ligne 2 : Pass + Activité récente */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Répartition des pass */}
        <div className="admin-stat-card">
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 20 }}>
            Répartition des Pass
          </div>

          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))
          ) : totalMembres === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Aucune donnée.</p>
          ) : (
            ['aventurier', 'explorer', 'celeste', 'sans_abonnement'].map((key) =>
              pass[key] > 0 ? (
                <PassBar
                  key={key}
                  label={PASS_LABELS[key]}
                  count={pass[key]}
                  total={totalMembres}
                  color={PASS_COLORS[key]}
                />
              ) : null
            )
          )}

          {!loading && totalMembres > 0 && (
            <div style={{
              marginTop: 16, paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between',
              color: 'rgba(255,255,255,0.35)', fontSize: 12,
            }}>
              <span>Total profils</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                {totalMembres.toLocaleString('fr-FR')}
              </span>
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="admin-stat-card">
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 20 }}>
            Activité récente — Dernières utilisations
          </div>

          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                height: 44, background: 'rgba(255,255,255,0.04)', borderRadius: 6,
                marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))
          ) : activite.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 32, marginBottom: 8 }}>◌</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Aucune utilisation enregistrée.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Date', 'Membre', 'Offre', 'Partenaire', 'Type'].map((h) => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '0 12px 10px 0',
                        color: 'rgba(255,255,255,0.3)', fontWeight: 500, fontSize: 11,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activite.map((item, i) => (
                    <tr key={item.id || i} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <td style={{ padding: '10px 12px 10px 0', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                        {formatDate(item.date)}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'rgba(255,255,255,0.75)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.membre}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'rgba(255,255,255,0.6)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.offre}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'rgba(255,255,255,0.5)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.partenaire}
                      </td>
                      <td style={{ padding: '10px 0 10px 0' }}>
                        {item.offerType ? (
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500,
                          }}>
                            {item.offerType}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 340px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
