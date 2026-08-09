'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '◻', active: true },
  { href: '/admin/members', label: 'Membres', icon: '◻', active: true },
  { href: '/admin/partenaires', label: 'Partenaires', icon: '◻', active: false },
  { href: '/admin/offres', label: 'Offres', icon: '◻', active: false },
  { href: '/admin/utilisations', label: 'Utilisations', icon: '◻', active: false },
  { href: '/admin/statistiques', label: 'Statistiques', icon: '◻', active: false },
  { href: '/admin/club', label: 'Club', icon: '◻', active: false },
  { href: '/admin/parrainage', label: 'Parrainage', icon: '◻', active: false },
  { href: '/admin/administration', label: 'Administration', icon: '◻', active: false },
];

const NAV_ICONS = {
  '/admin/dashboard': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  '/admin/members': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  '/admin/partenaires': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  '/admin/offres': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  '/admin/utilisations': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  '/admin/statistiques': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  '/admin/club': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  '/admin/parrainage': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  '/admin/administration': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M21 12h-2M5 12H3M12 3V1M12 23v-2"/>
    </svg>
  ),
};

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/profil');
          return;
        }

        // Vérifier via l'API admin (vérification serveur réelle)
        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.status === 401) {
          router.replace('/profil');
          return;
        }
        if (res.status === 403) {
          setChecking(false);
          setAdminData(null);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        setAdminData({ email: user?.email || '' });
        setChecking(false);
      } catch {
        router.replace('/profil');
      }
    }
    checkAdmin();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/profil');
  }

  // Pendant la vérification
  if (checking) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#0f1117',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: '#e8d5a3',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'system-ui' }}>
            Vérification des accès…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Accès refusé
  if (!adminData) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#0f1117',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 500, marginBottom: 8, fontFamily: 'system-ui' }}>
            Accès refusé
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 32, fontFamily: 'system-ui' }}>
            Vous n'avez pas les permissions nécessaires pour accéder à cet espace.
          </p>
          <a
            href="/"
            style={{
              background: '#e8d5a3', color: '#0f1117',
              padding: '12px 28px', borderRadius: 100,
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
              fontFamily: 'system-ui',
            }}
          >
            Retour au site
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .admin-shell * { box-sizing: border-box; }
        .admin-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 16px; border-radius: 8px;
          color: rgba(255,255,255,0.5);
          text-decoration: none; font-size: 13.5px; font-weight: 500;
          transition: all 0.15s ease; cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
          white-space: nowrap;
        }
        .admin-nav-link:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.05); }
        .admin-nav-link.active { color: #e8d5a3; background: rgba(232,213,163,0.08); }
        .admin-nav-link.disabled { opacity: 0.4; cursor: default; pointer-events: none; }
        .admin-stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 24px;
          transition: border-color 0.15s ease;
        }
        .admin-stat-card:hover { border-color: rgba(232,213,163,0.2); }
      `}</style>

      {/* Full-screen admin shell — covers the public layout */}
      <div
        className="admin-shell"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#0f1117',
          display: 'flex', overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 10, display: 'block',
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          style={{
            width: 240, flexShrink: 0,
            background: '#161b27',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column',
            position: 'relative', zIndex: 20,
            transform: sidebarOpen ? 'translateX(0)' : undefined,
          }}
          className="hidden-mobile-sidebar"
        >
          {/* Logo */}
          <div style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #e8d5a3, #c9a96e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#0f1117',
              }}>
                TC
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>The Club</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Administration</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 4px 8px' }}>
              Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const isDisabled = !item.active && item.href !== '/admin/dashboard';

              if (isDisabled) {
                return (
                  <span key={item.href} className="admin-nav-link disabled">
                    <span style={{ opacity: 0.6 }}>{NAV_ICONS[item.href]}</span>
                    {item.label}
                    <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, color: 'rgba(255,255,255,0.3)' }}>
                      Bientôt
                    </span>
                  </span>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link${isActive ? ' active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {NAV_ICONS[item.href]}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Pied de sidebar */}
          <div style={{
            padding: '16px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              marginBottom: 8,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #e8d5a3, #c9a96e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#0f1117', flexShrink: 0,
              }}>
                {adminData.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {adminData.email}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Admin</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '9px 12px',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: 'rgba(255,255,255,0.4)',
                fontSize: 12, cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <header style={{
            height: 60, flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: 16,
          }}>
            {/* Hamburger mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', padding: 4,
                display: 'none',
              }}
              className="admin-hamburger"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                Espace Administration
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#4ade80',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                Connecté
              </span>
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflowY: 'auto', background: '#0f1117' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
