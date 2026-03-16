-- ============================================
-- Migrare: campaniile de produse gratuite trec de la produse individuale la categorii
-- ============================================

-- Adăugăm coloana category_id pe campanie
ALTER TABLE free_product_campaigns
  ADD COLUMN category_id VARCHAR(36) NULL AFTER tier_id;

-- Adăugăm index + FK
ALTER TABLE free_product_campaigns
  ADD INDEX idx_free_product_campaigns_category (category_id),
  ADD CONSTRAINT fk_free_product_campaigns_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Eliminăm tabelul de legătură produse-campanie (nu mai e necesar)
DROP TABLE IF EXISTS free_product_campaign_products;
