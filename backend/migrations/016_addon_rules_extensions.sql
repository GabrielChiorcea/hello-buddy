-- ============================================
-- Plugin Add-ons Advanced: extensii pentru category_addon_rules
-- ============================================
-- Adaugă:
--  - priority       – ordonare manuală a regulilor/sugestiilor
--  - time_start/end – interval orar (dayparting)
--  - min_cart_value – valoare minimă a coșului pentru aplicarea regulii

ALTER TABLE category_addon_rules
ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0 AFTER addon_product_id,
ADD COLUMN IF NOT EXISTS time_start TIME NULL AFTER priority,
ADD COLUMN IF NOT EXISTS time_end TIME NULL AFTER time_start,
ADD COLUMN IF NOT EXISTS min_cart_value DECIMAL(10, 2) NULL AFTER time_end;

