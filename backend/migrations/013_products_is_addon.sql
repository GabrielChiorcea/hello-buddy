-- ============================================
-- Produse: flag add-on la coș
-- ============================================
-- Permite marcarea din Admin a produselor care apar în secțiunea "Adaugă la comandă" din coș.

ALTER TABLE products
ADD COLUMN is_addon BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_products_is_addon ON products (is_addon);
