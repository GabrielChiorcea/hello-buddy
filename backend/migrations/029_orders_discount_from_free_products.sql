-- ============================================
-- Add discount_from_free_products column to orders
-- ============================================

SET @col_discount_from_free_products := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'discount_from_free_products'
);

SET @sql_discount_from_free_products := IF(
  @col_discount_from_free_products = 0,
  'ALTER TABLE orders ADD COLUMN discount_from_free_products DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER discount_from_points',
  'SELECT 1'
);

PREPARE stmt_discount_from_free_products FROM @sql_discount_from_free_products;
EXECUTE stmt_discount_from_free_products;
DEALLOCATE PREPARE stmt_discount_from_free_products;

