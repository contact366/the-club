-- ============================================================
-- The Club — Migration Admin Sprint 1
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Créer la table admin_users
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL CHECK (role IN ('super_admin', 'admin', 'partner_manager', 'support')),
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. Index pour les performances
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id  ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- ────────────────────────────────────────────────────────────
-- 3. Mise à jour automatique de updated_at
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Aucun utilisateur ordinaire ne peut lire, modifier ou créer
-- des entrées dans admin_users via l'API publique.
-- Seul le service role (utilisé exclusivement côté serveur)
-- peut accéder à cette table.

CREATE POLICY "admin_users_deny_all_anon"
  ON public.admin_users
  FOR ALL
  TO anon
  USING (false);

-- Les utilisateurs authentifiés ne peuvent pas non plus
-- lire cette table directement (le service role se charge
-- de la vérification côté serveur).
CREATE POLICY "admin_users_deny_all_authenticated"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (false);

-- ────────────────────────────────────────────────────────────
-- 5. Créer le premier super_admin
--    Remplacez 'VOTRE_USER_ID' par votre UUID Supabase Auth
-- ────────────────────────────────────────────────────────────
-- INSERT INTO public.admin_users (user_id, role, is_active)
-- VALUES ('VOTRE_USER_ID', 'super_admin', true);

-- ============================================================
-- Pour retrouver votre user_id :
--   SELECT id, email FROM auth.users WHERE email = 'votre@email.com';
-- ============================================================
