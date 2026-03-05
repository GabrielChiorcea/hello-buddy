-- ============================================
-- Loyalty Tiers (XP Levels + Secret Add-ons)
-- ============================================

-- Tabel loyalty_tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    xp_threshold INT NOT NULL,
    points_multiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    badge_icon VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    benefit_description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_loyalty_tiers_threshold (xp_threshold),
    INDEX idx_loyalty_tiers_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- users: adăugare total_xp (idempotent)
SET @col_total_xp := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'total_xp'
);
SET @sql_total_xp := IF(
  @col_total_xp = 0,
  'ALTER TABLE users ADD COLUMN total_xp INT NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt_total_xp FROM @sql_total_xp;
EXECUTE stmt_total_xp;
DEALLOCATE PREPARE stmt_total_xp;

-- users: adăugare tier_id (idempotent, fără constrângere FK strictă pentru simplitate)
SET @col_tier_id := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'tier_id'
);
SET @sql_tier_id := IF(
  @col_tier_id = 0,
  'ALTER TABLE users ADD COLUMN tier_id VARCHAR(36) NULL',
  'SELECT 1'
);
PREPARE stmt_tier_id FROM @sql_tier_id;
EXECUTE stmt_tier_id;
DEALLOCATE PREPARE stmt_tier_id;

-- products: adăugare min_visibility_tier_id (idempotent)
SET @col_min_vis_tier := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'min_visibility_tier_id'
);
SET @sql_min_vis_tier := IF(
  @col_min_vis_tier = 0,
  'ALTER TABLE products ADD COLUMN min_visibility_tier_id VARCHAR(36) NULL',
  'SELECT 1'
);
PREPARE stmt_min_vis_tier FROM @sql_min_vis_tier;
EXECUTE stmt_min_vis_tier;
DEALLOCATE PREPARE stmt_min_vis_tier;

INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_tiers_enabled', 'true', 'Activează sistemul de niveluri (tiers) bazat pe XP'),
    ('tiers_xp_per_ron', '1', 'Câți XP primește utilizatorul pentru fiecare RON cheltuit'),
    ('tiers_xp_per_order', '0', 'XP fix per comandă livrată (0 = dezactivat)'),
    ('tiers_secret_addons_enabled', 'true', 'Activează vizibilitatea produselor/add-on-urilor în funcție de nivel'),
    ('tiers_notify_on_level_up', 'true', 'Trimite notificare automată când utilizatorul crește în nivel'),
    ('tiers_notify_message', 'Felicitări! Ai ajuns la nivelul [Nume Nivel]. De acum câștigi cu [X]% mai multe puncte!', 'Mesaj trimis la level-up. Suportă [Nume Nivel] și [X]%')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

