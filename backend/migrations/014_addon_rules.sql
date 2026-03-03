-- ============================================
-- Plugin Add-ons Advanced: reguli per categorie
-- ============================================
-- Permite definirea de add-on-uri specifice per categorie de produse.
-- Ex: pentru categoria "Pizza" se recomandă doar sosurile X, Y, Z.

CREATE TABLE IF NOT EXISTS category_addon_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  addon_product_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addon_rule_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_addon_rule_product FOREIGN KEY (addon_product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT uq_category_addon UNIQUE (category_id, addon_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @idx_addon_category_exists := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'category_addon_rules'
    AND index_name = 'idx_addon_rules_category'
);

SET @create_idx_addon_category_sql := IF(
  @idx_addon_category_exists = 0,
  'CREATE INDEX idx_addon_rules_category ON category_addon_rules (category_id)',
  'SELECT 1'
);

PREPARE stmt_cat FROM @create_idx_addon_category_sql;
EXECUTE stmt_cat;
DEALLOCATE PREPARE stmt_cat;

SET @idx_addon_product_exists := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'category_addon_rules'
    AND index_name = 'idx_addon_rules_product'
);

SET @create_idx_addon_product_sql := IF(
  @idx_addon_product_exists = 0,
  'CREATE INDEX idx_addon_rules_product ON category_addon_rules (addon_product_id)',
  'SELECT 1'
);

PREPARE stmt_prod FROM @create_idx_addon_product_sql;
EXECUTE stmt_prod;
DEALLOCATE PREPARE stmt_prod;
