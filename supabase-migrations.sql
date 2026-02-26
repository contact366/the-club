-- ============================================================
-- The Club — Migrations Supabase : Espace Partenaire
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Ajouter la colonne affluence_status à la table partners
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS affluence_status text NOT NULL DEFAULT 'calme'
  CHECK (affluence_status IN ('calme', 'modere', 'plein'));

-- 2. Créer la table partner_accounts
CREATE TABLE IF NOT EXISTS partner_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id  uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'admin',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Activer RLS sur partner_accounts
ALTER TABLE partner_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Policies RLS pour partner_accounts
-- Un partenaire peut lire uniquement sa propre ligne
CREATE POLICY "partner_accounts_select_own"
  ON partner_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Seul le service role peut insérer / modifier / supprimer
CREATE POLICY "partner_accounts_insert_service"
  ON partner_accounts
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "partner_accounts_update_service"
  ON partner_accounts
  FOR UPDATE
  USING (false);

CREATE POLICY "partner_accounts_delete_service"
  ON partner_accounts
  FOR DELETE
  USING (false);

-- 5. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_partner_accounts_user_id    ON partner_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_partner_id ON partner_accounts(partner_id);
CREATE INDEX IF NOT EXISTS idx_utilisations_partner_id     ON utilisations(partner_id);
CREATE INDEX IF NOT EXISTS idx_utilisations_created_at     ON utilisations(created_at);
