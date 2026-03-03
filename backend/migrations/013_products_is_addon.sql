-- ============================================
-- Produse: flag add-on la coș
-- ============================================
-- Permite marcarea din Admin a produselor care apar în secțiunea "Adaugă la comandă" din coș.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT FALSE;

SET @idx_exists := (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'products'
      AND index_name = 'idx_products_is_addon'
);

SET @create_index_sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_products_is_addon ON products (is_addon)',
    'SELECT 1'
);

PREPARE stmt FROM @create_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
