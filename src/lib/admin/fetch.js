'use client';
import { supabase } from '@/lib/supabase';

/** Appel API admin authentifié. Retourne { data, error }. */
export async function adminFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Session expirée.' };

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { data: null, error: body.error || `Erreur ${res.status}` };
  }

  const data = await res.json();
  return { data, error: null };
}
