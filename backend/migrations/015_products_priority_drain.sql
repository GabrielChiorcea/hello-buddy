-- ============================================
-- Produse: flag priority_drain pentru lichidare stoc / expirare rapidă
-- ============================================
-- Permite prioritizarea produselor cu stoc limitat sau cu expirare apropiată
-- în listele de sugestii (ex: Smart Add-ons).

ALTER TABLE products
ADD COLUMN IF NOT EXISTS priority_drain BOOLEAN DEFAULT FALSE;

SET @idx_priority_drain_exists := (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'products'
      AND index_name = 'idx_products_priority_drain'
);

SET @create_idx_priority_drain_sql := IF(
    @idx_priority_drain_exists = 0,
    'CREATE INDEX idx_products_priority_drain ON products (priority_drain)',
    'SELECT 1'
);

PREPARE stmt_priority_drain FROM @create_idx_priority_drain_sql;
EXECUTE stmt_priority_drain;
DEALLOCATE PREPARE stmt_priority_drain;

