import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Crée un client Supabase avec le service role key.
 * À utiliser UNIQUEMENT côté serveur (API routes).
 */
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Vérifie l'identité de l'appelant via le Bearer token,
 * puis contrôle sa présence dans admin_users avec is_active = true.
 *
 * Retourne { adminUser, supabaseAdmin } si autorisé.
 * Retourne { error: NextResponse } si refusé.
 *
 * L'identité provient exclusivement du JWT Supabase.
 * Le rôle provient exclusivement de public.admin_users.
 * Aucune donnée du body ou des headers customs n'est acceptée.
 */
export async function requireAdmin(req) {
  // 1. Extraire le Bearer token
  const authHeader = req.headers.get('authorization') || '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!accessToken) {
    return {
      error: NextResponse.json(
        { error: 'Non authentifié.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    };
  }

  const supabaseAdmin = createAdminClient();

  // 2. Valider le token JWT et récupérer l'utilisateur
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: 'Session invalide ou expirée.', code: 'INVALID_SESSION' },
        { status: 401 }
      ),
    };
  }

  // 3. Vérifier admin_users (rôle vient exclusivement de cette table)
  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('id, user_id, role, is_active')
    .eq('user_id', user.id)
    .single();

  if (adminError || !adminUser) {
    return {
      error: NextResponse.json(
        { error: 'Accès refusé.', code: 'NOT_ADMIN' },
        { status: 403 }
      ),
    };
  }

  // 4. Vérifier que le compte admin est actif
  if (!adminUser.is_active) {
    return {
      error: NextResponse.json(
        { error: 'Compte administrateur désactivé.', code: 'ADMIN_DISABLED' },
        { status: 403 }
      ),
    };
  }

  return { adminUser, supabaseAdmin, user };
}

/**
 * Comme requireAdmin(), mais vérifie en plus que le rôle
 * fait partie de la liste autorisée.
 *
 * Exemple : requireRole(req, ['super_admin', 'admin'])
 */
export async function requireRole(req, allowedRoles = []) {
  const result = await requireAdmin(req);
  if (result.error) return result;

  if (!allowedRoles.includes(result.adminUser.role)) {
    return {
      error: NextResponse.json(
        { error: 'Permissions insuffisantes.', code: 'INSUFFICIENT_ROLE' },
        { status: 403 }
      ),
    };
  }

  return result;
}
