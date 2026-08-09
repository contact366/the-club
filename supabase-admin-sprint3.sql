-- ============================================================
-- The Club — Migration Admin Sprint 3 : CRM Partenaires
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Ajouter la colonne is_active à public.partners
--    (non existante, indispensable pour la gestion Admin)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Mettre tous les partenaires existants comme actifs par défaut
UPDATE public.partners SET is_active = true WHERE is_active IS NULL;

-- Index pour les filtres Admin
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners(is_active);
CREATE INDEX IF NOT EXISTS idx_partners_category  ON public.partners(category);

-- ────────────────────────────────────────────────────────────
-- 2. Index supplémentaires pour les performances
-- ────────────────────────────────────────────────────────────

-- Offres par partenaire (utilisé dans la liste et la fiche)
CREATE INDEX IF NOT EXISTS idx_offers_partner_id    ON public.offers(partner_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_active     ON public.offers(is_active);

-- Utilisations par établissement (stats partenaire)
CREATE INDEX IF NOT EXISTS idx_utilisations_establishment_id ON public.utilisations(establishment_id);

-- ────────────────────────────────────────────────────────────
-- Vérification
-- ────────────────────────────────────────────────────────────
-- SELECT id, name, is_active FROM public.partners ORDER BY name LIMIT 20;
