-- ============================================
-- Free Product Campaigns plugin: tables + feature flag
-- ============================================

-- Feature flag plugin free products
INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_free_products_enabled', 'false', 'Activează/dezactivează plugin-ul de produse gratuite pe rank (tiers)')
ON DUPLICATE KEY UPDATE id = id;

-- Tabel principal: campanii de produse gratuite pe rank
CREATE TABLE IF NOT EXISTS free_product_campaigns (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tier_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    custom_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_free_product_campaigns_dates (start_date, end_date),
    INDEX idx_free_product_campaigns_tier (tier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel legătură: produse incluse în campania de produse gratuite
CREATE TABLE IF NOT EXISTS free_product_campaign_products (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES free_product_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_campaign_product (campaign_id, product_id),
    INDEX idx_free_product_campaign_products_campaign (campaign_id),
    INDEX idx_free_product_campaign_products_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

