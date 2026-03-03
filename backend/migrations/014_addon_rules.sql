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
);

CREATE INDEX idx_addon_rules_category ON category_addon_rules (category_id);
CREATE INDEX idx_addon_rules_product ON category_addon_rules (addon_product_id);
