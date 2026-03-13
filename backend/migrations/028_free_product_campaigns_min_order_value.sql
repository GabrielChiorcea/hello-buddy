-- ============================================
-- Free Product Campaigns: min_order_value
-- ============================================

SET @col_min_order_value := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'free_product_campaigns'
    AND COLUMN_NAME = 'min_order_value'
);

SET @sql_min_order_value := IF(
  @col_min_order_value = 0,
  'ALTER TABLE free_product_campaigns ADD COLUMN min_order_value DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER end_date',
  'SELECT 1'
);

PREPARE stmt_min_order_value FROM @sql_min_order_value;
EXECUTE stmt_min_order_value;
DEALLOCATE PREPARE stmt_min_order_value;

