-- ============================================
-- Produse: recomandate pentru secțiunea "Recomandate pentru tine"
-- ============================================
-- Admin poate marca produse ca recomandate și seta ordinea afișării pe home.

SET @col_is_recommended := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'is_recommended'
);

SET @sql_is_recommended := IF(
  @col_is_recommended = 0,
  'ALTER TABLE products ADD COLUMN is_recommended BOOLEAN NOT NULL DEFAULT FALSE AFTER min_visibility_tier_id',
  'SELECT 1'
);

PREPARE stmt_is_recommended FROM @sql_is_recommended;
EXECUTE stmt_is_recommended;
DEALLOCATE PREPARE stmt_is_recommended;

SET @col_recommended_order := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'recommended_order'
);

SET @sql_recommended_order := IF(
  @col_recommended_order = 0,
  'ALTER TABLE products ADD COLUMN recommended_order INT NULL AFTER is_recommended',
  'SELECT 1'
);

PREPARE stmt_recommended_order FROM @sql_recommended_order;
EXECUTE stmt_recommended_order;
DEALLOCATE PREPARE stmt_recommended_order;

SET @idx_recommended := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND index_name = 'idx_products_recommended'
);

SET @create_idx_sql := IF(
  @idx_recommended = 0,
  'CREATE INDEX idx_products_recommended ON products (is_recommended, recommended_order)',
  'SELECT 1'
);

PREPARE stmt_idx FROM @create_idx_sql;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
