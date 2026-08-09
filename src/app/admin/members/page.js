'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  PassBadge, StatutBadge, MemberAvatar, SkeletonRow, EmptyState, ErrorBanner,
  fmtDate, memberFullName,
} from '@/components/admin/AdminUI';
import { adminFetch } from '@/lib/admin/fetch';

const PAGE_SIZE = 25;

const PASS_OPTIONS = [
  { value: 'all',              label: 'Tous les Pass' },
  { value: 'aventurier',       label: 'Aventurier'    },
  { value: 'explorer',         label: 'Explorer'      },
  { value: 'celeste',          label: 'Céleste'       },
  { value: 'sans_abonnement',  label: 'Sans abonnement' },
];

const STATUT_OPTIONS = [
  { value: 'all',              label: 'Tous les statuts' },
  { value: 'actif',            label: 'Actif'            },
  { value: 'expire',           label: 'Expiré'           },
  { value: 'sans_abonnement',  label: 'Sans abonnement'  },
];

// ─── Sélecteur de filtre ─────────────────────────────────────────
function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.7)',
        fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1f2e' }}>{o.label}</option>)}
    </select>
  );
}

// ─── Page liste membres ──────────────────────────────────────────
export default function MembersPage() {
  const [members, setMembers]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [pass, setPass]         = useState('all');
  const [statut, setStatut]     = useState('all');
  const searchRef               = useRef(null);
  const debounceRef             = useRef(null);

  const fetchMembers = useCallback(async (currentPage, currentSearch, currentPass, currentStatut) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(currentPage),
      search: currentSearch,
      pass: currentPass,
      statut: currentStatut,
    });
    const { data, error: err } = await adminFetch(`/api/admin/members?${params}`);
    if (err) { setError(err); setLoading(false); return; }
    setMembers(data.members || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, []);

  // Chargement initial + changements de filtres
  useEffect(() => {
    fetchMembers(page, search, pass, statut);
  }, [page, pass, statut, fetchMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce sur la recherche
  function handleSearch(value) {
    setSearch(value);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMembers(1, value, pass, statut);
    }, 380);
  }

  function handleFilterChange(setter) {
    return (val) => { setter(val); setPage(1); };
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const TH_STYLE = {
    textAlign: 'left', padding: '11px 12px',
    color: 'rgba(255,255,255,0.3)', fontWeight: 600, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:.35; } }
        .mem-row:hover td  { background: rgba(255,255,255,0.025); }
        .mem-row td        { transition: background 0.12s; }
      `}</style>

      <div style={{ padding: '32px 28px', maxWidth: 1280 }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Membres</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '6px 0 0' }}>
              Gestion des membres du Club
              {!loading && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.25)' }}>— {total.toLocaleString('fr-FR')} membre{total !== 1 ? 's' : ''}</span>}
            </p>
          </div>
        </div>

        <ErrorBanner message={error} />

        {/* Barre de recherche + filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher par prénom, nom, email…"
              style={{
                width: '100%', paddingLeft: 36, padding: '9px 12px 9px 36px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: '#fff', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <FilterSelect value={pass} onChange={handleFilterChange(setPass)} options={PASS_OPTIONS} />
          <FilterSelect value={statut} onChange={handleFilterChange(setStatut)} options={STATUT_OPTIONS} />
        </div>

        {/* Tableau */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...TH_STYLE, width: 44 }}></th>
                  <th style={TH_STYLE}>Membre</th>
                  <th style={TH_STYLE}>Email</th>
                  <th style={TH_STYLE}>Pass</th>
                  <th style={TH_STYLE}>Statut</th>
                  <th style={TH_STYLE}>Inscription</th>
                  <th style={TH_STYLE}>Expiration</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Économie</th>
                  <th style={{ ...TH_STYLE, width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
                  : members.length === 0
                    ? (
                      <tr>
                        <td colSpan={9}>
                          <EmptyState
                            title="Aucun membre trouvé"
                            description={search ? 'Essayez une autre recherche ou réinitialisez les filtres.' : 'Aucun membre dans la base.'}
                          />
                        </td>
                      </tr>
                    )
                    : members.map(m => (
                      <MemberRow key={m.id} member={m} />
                    ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                Page {page} / {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <PaginBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</PaginBtn>
                <PaginBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</PaginBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Ligne du tableau ────────────────────────────────────────────
function MemberRow({ member }) {
  const name = memberFullName(member);
  const savings = member.montant_economise != null
    ? `${Number(member.montant_economise).toLocaleString('fr-FR')} €`
    : '—';

  const TD = { padding: '13px 12px', color: 'rgba(255,255,255,0.7)', verticalAlign: 'middle' };

  return (
    <tr className="mem-row">
      <td style={{ ...TD, padding: '13px 12px 13px 16px' }}>
        <MemberAvatar profile={member} size={32} />
      </td>
      <td style={{ ...TD, color: 'rgba(255,255,255,0.85)', fontWeight: 500, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </td>
      <td style={{ ...TD, color: 'rgba(255,255,255,0.5)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {member.email || '—'}
      </td>
      <td style={TD}><PassBadge value={member.subscription_type} /></td>
      <td style={TD}><StatutBadge profile={member} /></td>
      <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{fmtDate(member.created_at)}</td>
      <td style={{ ...TD, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{fmtDate(member.expires_at)}</td>
      <td style={{ ...TD, textAlign: 'right', color: '#e8d5a3', fontWeight: 500 }}>{savings}</td>
      <td style={{ ...TD, padding: '13px 16px 13px 8px' }}>
        <Link
          href={`/admin/members/${member.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', padding: '5px 12px',
            borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.55)', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Voir →
        </Link>
      </td>
    </tr>
  );
}

function PaginBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
        background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}
