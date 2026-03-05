-- ============================================
-- Analytics: conversii produse adăugate din secțiunea Add-ons
-- ============================================
-- Înregistrează evenimente de tip „origin_addons” pentru a măsura
-- rata de conversie a regulilor și produselor recomandate.

CREATE TABLE IF NOT EXISTS addon_rule_conversions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  rule_id INT NULL,
  origin VARCHAR(32) NOT NULL,
  cart_id VARCHAR(64) NULL,
  cart_value DECIMAL(10, 2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_addon_conv_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_addon_conv_rule
    FOREIGN KEY (rule_id) REFERENCES category_addon_rules(id) ON DELETE SET NULL,
  
  INDEX idx_addon_conv_rule (rule_id),
  INDEX idx_addon_conv_created_at (created_at),
  INDEX idx_addon_conv_origin (origin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

