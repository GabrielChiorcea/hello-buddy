-- =============================================================================
-- Bază de date FoodOrder — migrare consolidată (fostele 001–042)
-- Un singur fișier echivalent cu rularea secvențială a tuturor migrărilor.
-- =============================================================================

-- ============================================================================
-- 001_schema.sql
-- ============================================================================

-- ============================================
-- Schema completă bază de date - FoodOrder
-- Versiune consolidată
-- ============================================

-- ============================================
-- 1. UTILIZATORI
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_created_at (created_at),
    UNIQUE INDEX uq_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. ROLURI UTILIZATORI
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('admin', 'moderator', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role),
    INDEX idx_user_roles_user_id (user_id),
    INDEX idx_user_roles_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Funcție pentru verificare rol
DELIMITER //

CREATE OR REPLACE FUNCTION has_role(p_user_id VARCHAR(36), p_role VARCHAR(20))
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE role_exists BOOLEAN DEFAULT FALSE;
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id AND role = p_role
    ) INTO role_exists;
    RETURN role_exists;
END //

DELIMITER ;

-- ============================================
-- 3. REFRESH TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_expires (expires_at),
    INDEX idx_refresh_tokens_hash (token_hash(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event pentru curățare automată token-uri expirate
DELIMITER //
CREATE EVENT IF NOT EXISTS cleanup_expired_refresh_tokens
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() 
       OR (revoked = TRUE AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY));
END //
DELIMITER ;

-- ============================================
-- 4. CATEGORII (folosesc doar iconițe emoji, nu imagini)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_categories_sort_order (sort_order),
    INDEX idx_categories_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. PRODUSE (fără rating/reviews)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    category_id VARCHAR(36) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_products_category (category_id),
    INDEX idx_products_is_available (is_available),
    FULLTEXT INDEX idx_products_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. INGREDIENTE PRODUSE
-- ============================================
CREATE TABLE IF NOT EXISTS product_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_allergen BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_ingredients_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. ADRESE LIVRARE
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_addresses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    label VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    notes TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_addresses_user (user_id),
    INDEX idx_addresses_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. COMENZI
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 10.00,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled') DEFAULT 'pending',
    delivery_address VARCHAR(255) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    notes TEXT,
    payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash',
    estimated_delivery TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created_at (created_at),
    INDEX idx_orders_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. PRODUSE ÎN COMANDĂ
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    product_image VARCHAR(500),
    quantity INT NOT NULL DEFAULT 1,
    price_at_order DECIMAL(10, 2) NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. ISTORIC STATUS COMENZI
-- ============================================
CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled') NOT NULL,
    changed_by VARCHAR(36),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status_history_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. SETĂRI APLICAȚIE
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    id VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Setări implicite
INSERT INTO app_settings (id, value, description) VALUES
    ('delivery_fee', '10.00', 'Taxa de livrare standard (RON)'),
    ('min_order_amount', '30.00', 'Suma minimă pentru comandă (RON)'),
    ('free_delivery_threshold', '100.00', 'Livrare gratuită de la această sumă (RON)'),
    ('opening_time', '10:00', 'Ora de deschidere'),
    ('closing_time', '22:00', 'Ora de închidere'),
    ('preparation_time_default', '30', 'Timp estimat de preparare (minute)'),
    ('delivery_time_estimate', '45', 'Timp estimat de livrare (minute)'),
    ('max_items_per_order', '20', 'Număr maxim de produse per comandă'),
    ('contact_phone', '+40 700 000 000', 'Telefon contact'),
    ('contact_email', 'contact@foodorder.ro', 'Email contact')
ON DUPLICATE KEY UPDATE value = VALUES(value);


-- ============================================================================
-- 002_order_items_product_set_null.sql
-- ============================================================================

-- Permite ștergerea produselor care apar doar în comenzi livrate/anulate.
-- product_id devine NULL la ștergere (istoricul păstrează product_name, price_at_order).

ALTER TABLE order_items MODIFY product_id VARCHAR(36) NULL;

ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;

ALTER TABLE order_items ADD CONSTRAINT order_items_ibfk_2
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;


-- ============================================================================
-- 003_remove_users_address_city.sql
-- ============================================================================

-- Remove address and city from users table
-- Addresses are managed exclusively in delivery_addresses
-- Idempotent: verifica daca coloanele exista inainte de drop
DROP PROCEDURE IF EXISTS migr_003_drop_user_cols;

DELIMITER //
CREATE PROCEDURE migr_003_drop_user_cols()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address') > 0 THEN
    ALTER TABLE users DROP COLUMN address;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'city') > 0 THEN
    ALTER TABLE users DROP COLUMN city;
  END IF;
END //
DELIMITER ;

CALL migr_003_drop_user_cols();
DROP PROCEDURE migr_003_drop_user_cols;


-- ============================================================================
-- 004_points_gamification.sql
-- ============================================================================

-- ============================================
-- Gamificare puncte loialitate
-- ============================================

-- users: adăugare points_balance (idempotent)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'points_balance');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN points_balance INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- orders: adăugare coloane puncte (idempotent)
SET @col_earned = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'points_earned');
SET @sql2 = IF(@col_earned = 0, 'ALTER TABLE orders ADD COLUMN points_earned INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @col_used = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'points_used');
SET @sql3 = IF(@col_used = 0, 'ALTER TABLE orders ADD COLUMN points_used INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

SET @col_discount = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'discount_from_points');
SET @sql4 = IF(@col_discount = 0, 'ALTER TABLE orders ADD COLUMN discount_from_points DECIMAL(10, 2) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Tabel points_rewards - praguri configurate de admin
CREATE TABLE IF NOT EXISTS points_rewards (
    id VARCHAR(36) PRIMARY KEY,
    points_cost INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_points_rewards_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel points_transactions - istoric
CREATE TABLE IF NOT EXISTS points_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) NULL,
    amount INT NOT NULL,
    type ENUM('earned', 'spent') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_points_transactions_user (user_id),
    INDEX idx_points_transactions_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Setări puncte în app_settings
INSERT INTO app_settings (id, value, description) VALUES
    ('points_per_order', '5', 'Puncte fixe per comandă livrată'),
    ('points_per_ron', '0', 'Puncte per RON cheltuit (ex: 10 = 1 punct per 10 RON)')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Prag implicit: 10 puncte = 5 lei reducere (doar daca nu exista niciun prag)
INSERT INTO points_rewards (id, points_cost, discount_amount, is_active)
SELECT UUID(), 10, 5.00, TRUE
FROM DUAL
WHERE (SELECT COUNT(*) FROM points_rewards) = 0;


-- ============================================================================
-- 005_plugin_points_feature_flag.sql
-- ============================================================================

-- ============================================
-- Feature flag plugin puncte
-- ============================================

-- Adaugă setarea plugin_points_enabled (activat implicit)
INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_points_enabled', 'true', 'Activează/dezactivează plugin-ul de puncte loialitate')
ON DUPLICATE KEY UPDATE id = id;


-- ============================================================================
-- 006_orders_fulfillment_type.sql
-- ============================================================================

-- ============================================
-- Comenzi în locație și număr de masă
-- ============================================

-- orders: adăugare fulfillment_type (idempotent)
SET @col_ft = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'fulfillment_type');
SET @sql_ft = IF(@col_ft = 0, "ALTER TABLE orders ADD COLUMN fulfillment_type ENUM('delivery','in_location') NOT NULL DEFAULT 'delivery'", 'SELECT 1');
PREPARE stmt_ft FROM @sql_ft;
EXECUTE stmt_ft;
DEALLOCATE PREPARE stmt_ft;

-- orders: adăugare table_number (idempotent)
SET @col_tn = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'table_number');
SET @sql_tn = IF(@col_tn = 0, 'ALTER TABLE orders ADD COLUMN table_number VARCHAR(20) NULL', 'SELECT 1');
PREPARE stmt_tn FROM @sql_tn;
EXECUTE stmt_tn;
DEALLOCATE PREPARE stmt_tn;

-- Setare has_tables în app_settings (opțional, default true - afișează câmp număr masă în admin)
INSERT INTO app_settings (id, value, description) VALUES
    ('has_tables', 'true', 'Dacă locația are mese - afișează câmpul număr masă pentru comenzi în locație')
ON DUPLICATE KEY UPDATE id = id;


-- ============================================================================
-- 007_password_reset_tokens.sql
-- ============================================================================

-- ============================================
-- Token-uri pentru resetare parolă
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_password_reset_tokens_user (user_id),
    INDEX idx_password_reset_tokens_expires (expires_at),
    INDEX idx_password_reset_tokens_hash (token_hash(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 008_payment_drafts.sql
-- ============================================================================

-- ============================================
-- Draft-uri pentru plată cu card (Stripe/Netopia)
-- ============================================

CREATE TABLE IF NOT EXISTS payment_drafts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    payload JSON NOT NULL,
    amount_ron DECIMAL(10, 2) NOT NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'stripe',
    gateway_payment_id VARCHAR(255) NULL,
    status ENUM('pending', 'completed', 'expired') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payment_drafts_user (user_id),
    INDEX idx_payment_drafts_status (status),
    INDEX idx_payment_drafts_gateway_id (gateway_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- orders: coloană opțională pentru reconciliere plată (idempotent)
SET @col_pid = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_id');
SET @sql_pid = IF(@col_pid = 0, 'ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt_pid FROM @sql_pid;
EXECUTE stmt_pid;
DEALLOCATE PREPARE stmt_pid;


-- ============================================================================
-- 009_points_welcome_bonus.sql
-- ============================================================================

-- ============================================
-- Puncte cadou la înregistrare + flag popup văzut
-- ============================================

-- Setare puncte cadou la înregistrare (plugin puncte)
INSERT INTO app_settings (id, value, description) VALUES
    ('points_welcome_bonus', '5', 'Puncte cadou la înregistrare (afișat în popup la prima autentificare)')
ON DUPLICATE KEY UPDATE id = id;

-- Coloană pe users: a văzut popup-ul „Ai câștigat X puncte”
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'welcome_bonus_seen');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN welcome_bonus_seen TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Utilizatori existenți: nu afișa popup-ul după deploy
UPDATE users SET welcome_bonus_seen = 1 WHERE welcome_bonus_seen = 0;


-- ============================================================================
-- 010_streak_campaigns.sql
-- ============================================================================

-- ============================================
-- Streak Campaigns plugin: tables + feature flag
-- ============================================

-- Feature flag plugin streak
INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_streak_enabled', 'true', 'Activează/dezactivează plugin-ul de campanii streak')
ON DUPLICATE KEY UPDATE id = id;

-- streak_campaigns
CREATE TABLE IF NOT EXISTS streak_campaigns (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    streak_type ENUM('consecutive_days', 'days_per_week', 'working_days') NOT NULL,
    orders_required INT NOT NULL,
    bonus_points INT NOT NULL DEFAULT 0,
    custom_text TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reset_on_miss BOOLEAN NOT NULL DEFAULT TRUE,
    points_expire_after_campaign BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_streak_campaigns_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_streak_campaigns (enrollment + progress)
CREATE TABLE IF NOT EXISTS user_streak_campaigns (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    campaign_id VARCHAR(36) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_streak_count INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMP NULL,
    bonus_awarded_at TIMESTAMP NULL,
    UNIQUE KEY uq_user_campaign (user_id, campaign_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES streak_campaigns(id) ON DELETE CASCADE,
    INDEX idx_user_streak_campaigns_campaign (campaign_id),
    INDEX idx_user_streak_campaigns_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- streak_logs (one row per user_campaign per calendar day with an order delivered)
CREATE TABLE IF NOT EXISTS streak_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_streak_campaign_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) NULL,
    order_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_campaign_date (user_streak_campaign_id, order_date),
    FOREIGN KEY (user_streak_campaign_id) REFERENCES user_streak_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_streak_logs_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 011_plugin_welcome_bonus.sql
-- ============================================================================

-- ============================================
-- Plugin Welcome Bonus – feature flag
-- ============================================

INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_welcome_bonus_enabled', 'true', 'Activează/dezactivează plugin-ul de puncte cadou la prima autentificare (popup + alocare puncte)')
ON DUPLICATE KEY UPDATE id = id;


-- ============================================================================
-- 012_plugin_addons.sql
-- ============================================================================

-- ============================================
-- Plugin Add-ons – feature flag
-- ============================================

INSERT INTO app_settings (id, value, description) VALUES
    ('plugin_addons_enabled', 'true', 'Activează secțiunea Adaugă la comandă în coș – sugestii sosuri, băuturi, desert, garnituri – pe viitor reguli per produs și add-on cu puncte')
ON DUPLICATE KEY UPDATE id = id;


-- ============================================================================
-- 013_products_is_addon.sql
-- ============================================================================

-- ============================================
-- Produse: flag add-on la coș
-- ============================================
-- Permite marcarea din Admin a produselor care apar în secțiunea "Adaugă la comandă" din coș.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT FALSE;

SET @idx_exists := (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'products'
      AND index_name = 'idx_products_is_addon'
);

SET @create_index_sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_products_is_addon ON products (is_addon)',
    'SELECT 1'
);

PREPARE stmt FROM @create_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ============================================================================
-- 014_addon_rules.sql
-- ============================================================================

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


-- ============================================================================
-- 015_products_priority_drain.sql
-- ============================================================================

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



-- ============================================================================
-- 016_addon_rules_extensions.sql
-- ============================================================================

-- ============================================
-- Plugin Add-ons Advanced: extensii pentru category_addon_rules
-- ============================================
-- Adaugă:
--  - priority       – ordonare manuală a regulilor/sugestiilor
--  - time_start/end – interval orar (dayparting)
--  - min_cart_value – valoare minimă a coșului pentru aplicarea regulii

ALTER TABLE category_addon_rules
ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0 AFTER addon_product_id,
ADD COLUMN IF NOT EXISTS time_start TIME NULL AFTER priority,
ADD COLUMN IF NOT EXISTS time_end TIME NULL AFTER time_start,
ADD COLUMN IF NOT EXISTS min_cart_value DECIMAL(10, 2) NULL AFTER time_end;



-- ============================================================================
-- 017_addon_rule_conversions.sql
-- ============================================================================

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



-- ============================================================================
-- 018_loyalty_tiers.sql
-- ============================================================================

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



-- ============================================================================
-- 019_remove_addon_rules_min_cart_value.sql
-- ============================================================================

-- Elimină coloana min_cart_value din regulile add-on (regula nu mai depinde de valoarea coșului)
ALTER TABLE category_addon_rules DROP COLUMN IF EXISTS min_cart_value;


-- ============================================================================
-- 020_default_newbe_tier.sql
-- ============================================================================

-- ============================================
-- Tier implicit "Newbe" pentru utilizatori noi (0 XP)
-- ============================================
-- Orice utilizator nou are total_xp = 0; tier-ul se determină din getTierForXp(totalXp).
-- Un tier cu xp_threshold = 0 asigură că utilizatorii noi au rank-ul "Newbe".

INSERT INTO loyalty_tiers (id, name, xp_threshold, points_multiplier, badge_icon, sort_order, benefit_description)
VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'Incepator',
    0,
    1.00,
    NULL,
    0,
    'Nivelul de start pentru utilizatori noi'
)
ON DUPLICATE KEY UPDATE
    name = 'Incepator',
    xp_threshold = 0,
    points_multiplier = 1.00,
    sort_order = 0,
    benefit_description = 'Nivelul de start pentru utilizatori noi';


-- ============================================================================
-- 021_remove_tiers_xp_per_order_and_secret_addons.sql
-- ============================================================================

-- Elimină setările scoase din admin: XP fix per comandă și Add-on-uri secrete pe nivel.
-- XP se acordă doar pe baza RON cheltuiți (tiers_xp_per_ron). Add-on-urile secrete pe nivel nu mai sunt folosite.

DELETE FROM app_settings WHERE id IN (
  'tiers_xp_per_order',
  'tiers_secret_addons_enabled'
);


-- ============================================================================
-- 022_streak_v2_engine.sql
-- ============================================================================

-- ============================================
-- Streak V2: Motor de reguli complet
-- Recurență (calendar/rolling/consecutive), Praguri (scăriță),
-- Validare (min order, cooldown, excluded products), Resetare (soft decay)
-- Idempotent: poate rula de mai multe ori (adaugă/șterge doar când e cazul).
-- ============================================

-- 1a. Modifică ENUM streak_type (idempotent dacă deja are valorile)
ALTER TABLE streak_campaigns
  MODIFY COLUMN streak_type ENUM('calendar_weekly','rolling','consecutive') NOT NULL DEFAULT 'consecutive';

-- 1b. Adaugă coloane doar dacă nu există; șterge points_expire_after_campaign doar dacă există
DELIMITER //
CREATE PROCEDURE run_022_streak_columns()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_campaigns' AND COLUMN_NAME = 'rolling_window_days') = 0 THEN
    ALTER TABLE streak_campaigns ADD COLUMN rolling_window_days INT NOT NULL DEFAULT 7 AFTER streak_type;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_campaigns' AND COLUMN_NAME = 'reward_type') = 0 THEN
    ALTER TABLE streak_campaigns ADD COLUMN reward_type ENUM('single','steps','multiplier') NOT NULL DEFAULT 'single' AFTER bonus_points;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_campaigns' AND COLUMN_NAME = 'base_multiplier') = 0 THEN
    ALTER TABLE streak_campaigns ADD COLUMN base_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00 AFTER reward_type;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_campaigns' AND COLUMN_NAME = 'multiplier_increment') = 0 THEN
    ALTER TABLE streak_campaigns ADD COLUMN multiplier_increment DECIMAL(4,2) NOT NULL DEFAULT 0.00 AFTER base_multiplier;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_campaigns' AND COLUMN_NAME = 'reset_type') = 0 THEN
    ALTER TABLE streak_campaigns ADD COLUMN reset_type ENUM('hard','soft_decay') NOT NULL DEFAULT 'hard' AFTER multiplier_increment;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_campaigns' AND COLUMN_NAME = 'min_order_value') = 0 THEN
    ALTER TABLE streak_campaigns ADD COLUMN min_order_value DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER reset_type;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_campaigns' AND COLUMN_NAME = 'cooldown_hours') = 0 THEN
    ALTER TABLE streak_campaigns ADD COLUMN cooldown_hours INT NOT NULL DEFAULT 0 AFTER min_order_value;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_campaigns' AND COLUMN_NAME = 'points_expire_after_campaign') > 0 THEN
    ALTER TABLE streak_campaigns DROP COLUMN points_expire_after_campaign;
  END IF;
END //
DELIMITER ;

CALL run_022_streak_columns();
DROP PROCEDURE IF EXISTS run_022_streak_columns;

-- 2. Tabel pentru praguri incrementale (scăriță)
CREATE TABLE IF NOT EXISTS streak_reward_steps (
  id VARCHAR(36) PRIMARY KEY,
  campaign_id VARCHAR(36) NOT NULL,
  step_number INT NOT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  label VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_campaign_step (campaign_id, step_number),
  FOREIGN KEY (campaign_id) REFERENCES streak_campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel pentru produse excluse
CREATE TABLE IF NOT EXISTS streak_excluded_products (
  campaign_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (campaign_id, product_id),
  FOREIGN KEY (campaign_id) REFERENCES streak_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Adaugă current_level la user_streak_campaigns (doar dacă nu există)
DELIMITER //
CREATE PROCEDURE run_022_user_streak_columns()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_streak_campaigns' AND COLUMN_NAME = 'current_level') = 0 THEN
    ALTER TABLE user_streak_campaigns ADD COLUMN current_level INT NOT NULL DEFAULT 0 AFTER current_streak_count;
  END IF;
END //
DELIMITER ;

CALL run_022_user_streak_columns();
DROP PROCEDURE IF EXISTS run_022_user_streak_columns;

-- 5. Adaugă order_value la streak_logs (doar dacă nu există)
DELIMITER //
CREATE PROCEDURE run_022_streak_logs_columns()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streak_logs' AND COLUMN_NAME = 'order_value') = 0 THEN
    ALTER TABLE streak_logs ADD COLUMN order_value DECIMAL(10,2) NULL AFTER order_date;
  END IF;
END //
DELIMITER ;

CALL run_022_streak_logs_columns();
DROP PROCEDURE IF EXISTS run_022_streak_logs_columns;


-- ============================================================================
-- 023_drop_cooldown_hours.sql
-- ============================================================================

-- Remove cooldown_hours column from streak_campaigns
ALTER TABLE streak_campaigns DROP COLUMN cooldown_hours;


-- ============================================================================
-- 024_index_orders_payment_id.sql
-- ============================================================================

-- ============================================
-- 024: Index pe orders.payment_id pentru performanță
-- findByPaymentId făcea full table scan fără acest index
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);


-- ============================================================================
-- 025_push_subscriptions.sql
-- ============================================================================

-- Push notification subscriptions table (MySQL)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  notify_order_status TINYINT(1) NOT NULL DEFAULT 1,
  notify_promotions TINYINT(1) NOT NULL DEFAULT 0,
  notify_streak_reminders TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_push_subscriptions_endpoint (endpoint(255)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);


-- ============================================================================
-- 026_analytics_tables.sql
-- ============================================================================

-- ============================================
-- Tabele pre-agregate pentru analitice
-- Populare prin MariaDB Scheduled Events
-- ============================================

-- 1. Vânzări zilnice agregate
CREATE TABLE IF NOT EXISTS analytics_daily_sales (
    report_date DATE PRIMARY KEY,
    total_orders INT NOT NULL DEFAULT 0,
    cancelled_orders INT NOT NULL DEFAULT 0,
    gross_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_delivery_fees DECIMAL(12, 2) NOT NULL DEFAULT 0,
    avg_order_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unique_customers INT NOT NULL DEFAULT 0,
    new_customers INT NOT NULL DEFAULT 0,
    delivery_count INT NOT NULL DEFAULT 0,
    in_location_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ads_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Analitice puncte loialitate zilnice
CREATE TABLE IF NOT EXISTS analytics_daily_points (
    report_date DATE PRIMARY KEY,
    points_earned INT NOT NULL DEFAULT 0,
    points_spent INT NOT NULL DEFAULT 0,
    redemptions_count INT NOT NULL DEFAULT 0,
    discount_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    unique_earners INT NOT NULL DEFAULT 0,
    unique_redeemers INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_adp_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Snapshot distribuție tiers (zilnic)
CREATE TABLE IF NOT EXISTS analytics_daily_tiers (
    report_date DATE NOT NULL,
    tier_id VARCHAR(36) NOT NULL,
    tier_name VARCHAR(100) NOT NULL,
    user_count INT NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_orders INT NOT NULL DEFAULT 0,
    avg_order_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (report_date, tier_id),
    INDEX idx_adt_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Snapshot campanii streak (zilnic)
CREATE TABLE IF NOT EXISTS analytics_daily_streaks (
    report_date DATE NOT NULL,
    campaign_id VARCHAR(36) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    enrolled_count INT NOT NULL DEFAULT 0,
    completed_count INT NOT NULL DEFAULT 0,
    active_count INT NOT NULL DEFAULT 0,
    avg_streak INT NOT NULL DEFAULT 0,
    points_awarded INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (report_date, campaign_id),
    INDEX idx_adst_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Analitice orare de vârf (pe oră, per zi)
CREATE TABLE IF NOT EXISTS analytics_hourly_orders (
    report_date DATE NOT NULL,
    hour_of_day TINYINT NOT NULL,
    order_count INT NOT NULL DEFAULT 0,
    revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (report_date, hour_of_day),
    INDEX idx_aho_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- EVENT-URI PROGRAMATE (rulează zilnic la 02:00)
-- ============================================

DELIMITER //

-- Event 1: Agregare vânzări zilnice (actualizează ieri)
CREATE EVENT IF NOT EXISTS evt_analytics_daily_sales
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
BEGIN
  DECLARE v_date DATE DEFAULT DATE_SUB(CURDATE(), INTERVAL 1 DAY);

  INSERT INTO analytics_daily_sales (
    report_date, total_orders, cancelled_orders, gross_revenue, net_revenue,
    total_delivery_fees, avg_order_value, unique_customers, new_customers,
    delivery_count, in_location_count
  )
  SELECT
    v_date,
    COUNT(CASE WHEN o.status != 'cancelled' THEN 1 END),
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END),
    COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total - o.delivery_fee ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.delivery_fee ELSE 0 END), 0),
    COALESCE(AVG(CASE WHEN o.status != 'cancelled' THEN o.total END), 0),
    COUNT(DISTINCT CASE WHEN o.status != 'cancelled' THEN o.user_id END),
    (SELECT COUNT(*) FROM users u2 WHERE DATE(u2.created_at) = v_date),
    COUNT(CASE WHEN o.status != 'cancelled' AND COALESCE(o.fulfillment_type, 'delivery') = 'delivery' THEN 1 END),
    COUNT(CASE WHEN o.status != 'cancelled' AND o.fulfillment_type = 'in_location' THEN 1 END)
  FROM orders o
  WHERE DATE(o.created_at) = v_date
  ON DUPLICATE KEY UPDATE
    total_orders = VALUES(total_orders),
    cancelled_orders = VALUES(cancelled_orders),
    gross_revenue = VALUES(gross_revenue),
    net_revenue = VALUES(net_revenue),
    total_delivery_fees = VALUES(total_delivery_fees),
    avg_order_value = VALUES(avg_order_value),
    unique_customers = VALUES(unique_customers),
    new_customers = VALUES(new_customers),
    delivery_count = VALUES(delivery_count),
    in_location_count = VALUES(in_location_count);
END //

-- Event 2: Agregare puncte zilnice
CREATE EVENT IF NOT EXISTS evt_analytics_daily_points
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR + INTERVAL 5 MINUTE)
DO
BEGIN
  DECLARE v_date DATE DEFAULT DATE_SUB(CURDATE(), INTERVAL 1 DAY);

  INSERT INTO analytics_daily_points (
    report_date, points_earned, points_spent, redemptions_count,
    discount_total, unique_earners, unique_redeemers
  )
  SELECT
    v_date,
    COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0),
    COUNT(CASE WHEN pt.type = 'spent' THEN 1 END),
    COALESCE((
      SELECT SUM(o2.discount_from_points)
      FROM orders o2
      WHERE DATE(o2.created_at) = v_date AND o2.discount_from_points > 0
    ), 0),
    COUNT(DISTINCT CASE WHEN pt.type = 'earned' THEN pt.user_id END),
    COUNT(DISTINCT CASE WHEN pt.type = 'spent' THEN pt.user_id END)
  FROM points_transactions pt
  WHERE DATE(pt.created_at) = v_date
  ON DUPLICATE KEY UPDATE
    points_earned = VALUES(points_earned),
    points_spent = VALUES(points_spent),
    redemptions_count = VALUES(redemptions_count),
    discount_total = VALUES(discount_total),
    unique_earners = VALUES(unique_earners),
    unique_redeemers = VALUES(unique_redeemers);
END //

-- Event 3: Snapshot distribuție tiers
CREATE EVENT IF NOT EXISTS evt_analytics_daily_tiers
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR + INTERVAL 10 MINUTE)
DO
BEGIN
  DECLARE v_date DATE DEFAULT DATE_SUB(CURDATE(), INTERVAL 1 DAY);

  DELETE FROM analytics_daily_tiers WHERE report_date = v_date;

  INSERT INTO analytics_daily_tiers (
    report_date, tier_id, tier_name, user_count, total_revenue, total_orders, avg_order_value
  )
  SELECT
    v_date,
    COALESCE(lt.id, 'none'),
    COALESCE(lt.name, 'Fără nivel'),
    COUNT(DISTINCT u.id),
    COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0),
    COUNT(CASE WHEN o.status != 'cancelled' THEN o.id END),
    COALESCE(AVG(CASE WHEN o.status != 'cancelled' THEN o.total END), 0)
  FROM users u
  LEFT JOIN loyalty_tiers lt ON u.tier_id = lt.id
  LEFT JOIN orders o ON o.user_id = u.id AND DATE(o.created_at) = v_date
  GROUP BY lt.id, lt.name;
END //

-- Event 4: Snapshot campanii streak
CREATE EVENT IF NOT EXISTS evt_analytics_daily_streaks
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR + INTERVAL 15 MINUTE)
DO
BEGIN
  DECLARE v_date DATE DEFAULT DATE_SUB(CURDATE(), INTERVAL 1 DAY);

  DELETE FROM analytics_daily_streaks WHERE report_date = v_date;

  INSERT INTO analytics_daily_streaks (
    report_date, campaign_id, campaign_name, enrolled_count, completed_count,
    active_count, avg_streak, points_awarded
  )
  SELECT
    v_date,
    sc.id,
    sc.name,
    COUNT(DISTINCT usc.id),
    COUNT(DISTINCT CASE WHEN usc.completed_at IS NOT NULL THEN usc.id END),
    COUNT(DISTINCT CASE WHEN usc.completed_at IS NULL AND usc.current_streak_count > 0 THEN usc.id END),
    COALESCE(AVG(usc.current_streak_count), 0),
    COALESCE(SUM(CASE WHEN usc.bonus_awarded_at IS NOT NULL THEN sc.bonus_points ELSE 0 END), 0)
  FROM streak_campaigns sc
  LEFT JOIN user_streak_campaigns usc ON usc.campaign_id = sc.id
  WHERE sc.start_date <= v_date
  GROUP BY sc.id, sc.name;
END //

-- Event 5: Orare de vârf
CREATE EVENT IF NOT EXISTS evt_analytics_hourly_orders
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR + INTERVAL 20 MINUTE)
DO
BEGIN
  DECLARE v_date DATE DEFAULT DATE_SUB(CURDATE(), INTERVAL 1 DAY);

  DELETE FROM analytics_hourly_orders WHERE report_date = v_date;

  INSERT INTO analytics_hourly_orders (report_date, hour_of_day, order_count, revenue)
  SELECT
    v_date,
    HOUR(o.created_at),
    COUNT(*),
    COALESCE(SUM(o.total), 0)
  FROM orders o
  WHERE DATE(o.created_at) = v_date AND o.status != 'cancelled'
  GROUP BY HOUR(o.created_at);
END //

DELIMITER ;


-- ============================================================================
-- 027_free_product_campaigns.sql
-- ============================================================================

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



-- ============================================================================
-- 028_free_product_campaigns_min_order_value.sql
-- ============================================================================

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



-- ============================================================================
-- 029_orders_discount_from_free_products.sql
-- ============================================================================

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



-- ============================================================================
-- 030_products_recommended.sql
-- ============================================================================

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


-- ============================================================================
-- 031_points_decimal_precision.sql
-- ============================================================================

-- Permite stocarea punctelor cu zecimale (ex. 5.25)
ALTER TABLE users
  MODIFY COLUMN points_balance DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE orders
  MODIFY COLUMN points_earned DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE points_transactions
  MODIFY COLUMN amount DECIMAL(10,2) NOT NULL;



-- ============================================================================
-- 032_drop_streak_excluded_products.sql
-- ============================================================================

-- Remove streak_excluded_products: feature not used (no admin UI to manage exclusions)
DROP TABLE IF EXISTS streak_excluded_products;


-- ============================================================================
-- 033_drop_push_subscriptions.sql
-- ============================================================================

-- Remove push notifications feature: drop subscriptions table
DROP TABLE IF EXISTS push_subscriptions;


-- ============================================================================
-- 034_free_products_category_based.sql
-- ============================================================================

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


-- ============================================================================
-- 035_product_options_and_order_item_configuration.sql
-- ============================================================================

-- Product options groups and options, plus order item configuration

-- Groups of options per product (e.g. Size, Crust type)
CREATE TABLE IF NOT EXISTS product_option_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  min_selected INT DEFAULT 0,
  max_selected INT DEFAULT 1,
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_option_groups_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual options inside a group (e.g. Large, Medium, Extra cheese)
CREATE TABLE IF NOT EXISTS product_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_default BOOLEAN DEFAULT FALSE,
  is_multiple BOOLEAN DEFAULT FALSE,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES product_option_groups(id) ON DELETE CASCADE,
  INDEX idx_product_options_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Store chosen configuration and final unit price per order item
ALTER TABLE order_items
  ADD COLUMN configuration JSON NULL AFTER price_at_order,
  ADD COLUMN unit_price_with_configuration DECIMAL(10, 2) NULL AFTER configuration;



-- ============================================================================
-- 036_category_option_templates.sql
-- ============================================================================

-- Category-level option templates for product configuration

CREATE TABLE IF NOT EXISTS category_option_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_option_templates_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS category_option_template_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  min_selected INT DEFAULT 0,
  max_selected INT DEFAULT 1,
  is_required BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (template_id) REFERENCES category_option_templates(id) ON DELETE CASCADE,
  INDEX idx_template_groups_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS category_option_template_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_default BOOLEAN DEFAULT FALSE,
  is_multiple BOOLEAN DEFAULT FALSE,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES category_option_template_groups(id) ON DELETE CASCADE,
  INDEX idx_template_options_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE products
  ADD COLUMN follows_category_template BOOLEAN NOT NULL DEFAULT FALSE AFTER preparation_time,
  ADD COLUMN category_template_id INT NULL AFTER follows_category_template,
  ADD CONSTRAINT fk_products_category_template
    FOREIGN KEY (category_template_id) REFERENCES category_option_templates(id)
    ON DELETE SET NULL;



-- ============================================================================
-- 037_users_soft_delete_gdpr.sql
-- ============================================================================

-- GDPR: soft delete + anonimizare — păstrează user_id pentru comenzi, puncte, campanii, etc.
-- email / name / phone devin NULL; parola înlocuită la ștergere din aplicație.

SET @col_is_deleted = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_deleted'
);
SET @sql1 = IF(@col_is_deleted = 0,
  'ALTER TABLE users ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @col_deleted_at = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deleted_at'
);
SET @sql2 = IF(@col_deleted_at = 0,
  'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

ALTER TABLE users MODIFY email VARCHAR(255) NULL;
ALTER TABLE users MODIFY name VARCHAR(100) NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users (is_deleted);


-- ============================================================================
-- 038_analytics_query_indexes.sql
-- ============================================================================

-- Indexuri pentru interogări analitice pe interval (created_at)

CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions (created_at);

-- Join users + orders cu filtru pe dată (top clienți)
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at ON orders (user_id, created_at);


-- ============================================================================
-- 039_analytics_daily_category.sql
-- ============================================================================

-- Agregare zilnică venit pe categorie (analitice)
-- Populare prin event zilnic + opțional backfill din backend

CREATE TABLE IF NOT EXISTS analytics_daily_category (
    report_date DATE NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    orders_count INT NOT NULL DEFAULT 0,
    items_sold INT NOT NULL DEFAULT 0,
    revenue DECIMAL(14, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (report_date, category_id),
    INDEX idx_adc_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //

CREATE EVENT IF NOT EXISTS evt_analytics_daily_category
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURDATE()) + INTERVAL 1 DAY + INTERVAL 2 HOUR + INTERVAL 25 MINUTE)
DO
BEGIN
  DECLARE v_date DATE DEFAULT DATE_SUB(CURDATE(), INTERVAL 1 DAY);

  DELETE FROM analytics_daily_category WHERE report_date = v_date;

  INSERT INTO analytics_daily_category (
    report_date, category_id, category_name, orders_count, items_sold, revenue
  )
  SELECT
    v_date,
    c.id,
    c.display_name,
    COUNT(DISTINCT o.id),
    COALESCE(SUM(oi.quantity), 0),
    COALESCE(SUM(oi.quantity * oi.price_at_order), 0)
  FROM categories c
  INNER JOIN products p ON c.id = p.category_id
  INNER JOIN order_items oi ON p.id = oi.product_id
  INNER JOIN orders o ON oi.order_id = o.id
  WHERE o.status != 'cancelled' AND DATE(o.created_at) = v_date
  GROUP BY c.id, c.display_name;
END //

DELIMITER ;


-- ============================================================================
-- 040_analytics_backfill_procedure.sql
-- ============================================================================

-- Backfill analytics tables by day range.
-- Usage after migration:
--   CALL sp_backfill_analytics(90);
-- Optional cleanup:
--   DROP PROCEDURE sp_backfill_analytics;

DELIMITER //

DROP PROCEDURE IF EXISTS sp_backfill_analytics //
CREATE PROCEDURE sp_backfill_analytics(IN p_days INT)
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE v_date DATE;

  SET p_days = IFNULL(p_days, 90);
  IF p_days < 1 THEN
    SET p_days = 1;
  END IF;
  IF p_days > 365 THEN
    SET p_days = 365;
  END IF;

  SET i = p_days;
  WHILE i >= 1 DO
    SET v_date = DATE_SUB(CURDATE(), INTERVAL i DAY);

    INSERT INTO analytics_daily_sales (
      report_date, total_orders, cancelled_orders, gross_revenue, net_revenue,
      total_delivery_fees, avg_order_value, unique_customers, new_customers,
      delivery_count, in_location_count
    )
    SELECT
      v_date,
      COUNT(CASE WHEN o.status != 'cancelled' THEN 1 END),
      COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END),
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total - o.delivery_fee ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.delivery_fee ELSE 0 END), 0),
      COALESCE(AVG(CASE WHEN o.status != 'cancelled' THEN o.total END), 0),
      COUNT(DISTINCT CASE WHEN o.status != 'cancelled' THEN o.user_id END),
      (SELECT COUNT(*) FROM users u2 WHERE DATE(u2.created_at) = v_date),
      COUNT(CASE WHEN o.status != 'cancelled' AND COALESCE(o.fulfillment_type, 'delivery') = 'delivery' THEN 1 END),
      COUNT(CASE WHEN o.status != 'cancelled' AND o.fulfillment_type = 'in_location' THEN 1 END)
    FROM orders o
    WHERE DATE(o.created_at) = v_date
    ON DUPLICATE KEY UPDATE
      total_orders = VALUES(total_orders),
      cancelled_orders = VALUES(cancelled_orders),
      gross_revenue = VALUES(gross_revenue),
      net_revenue = VALUES(net_revenue),
      total_delivery_fees = VALUES(total_delivery_fees),
      avg_order_value = VALUES(avg_order_value),
      unique_customers = VALUES(unique_customers),
      new_customers = VALUES(new_customers),
      delivery_count = VALUES(delivery_count),
      in_location_count = VALUES(in_location_count);

    INSERT INTO analytics_daily_points (
      report_date, points_earned, points_spent, redemptions_count,
      discount_total, unique_earners, unique_redeemers
    )
    SELECT
      v_date,
      COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0),
      COUNT(CASE WHEN pt.type = 'spent' THEN 1 END),
      COALESCE((
        SELECT SUM(o2.discount_from_points)
        FROM orders o2
        WHERE DATE(o2.created_at) = v_date AND o2.discount_from_points > 0
      ), 0),
      COUNT(DISTINCT CASE WHEN pt.type = 'earned' THEN pt.user_id END),
      COUNT(DISTINCT CASE WHEN pt.type = 'spent' THEN pt.user_id END)
    FROM points_transactions pt
    WHERE DATE(pt.created_at) = v_date
    ON DUPLICATE KEY UPDATE
      points_earned = VALUES(points_earned),
      points_spent = VALUES(points_spent),
      redemptions_count = VALUES(redemptions_count),
      discount_total = VALUES(discount_total),
      unique_earners = VALUES(unique_earners),
      unique_redeemers = VALUES(unique_redeemers);

    DELETE FROM analytics_daily_tiers WHERE report_date = v_date;
    INSERT INTO analytics_daily_tiers (
      report_date, tier_id, tier_name, user_count, total_revenue, total_orders, avg_order_value
    )
    SELECT
      v_date,
      COALESCE(lt.id, 'none'),
      COALESCE(lt.name, 'Fara nivel'),
      COUNT(DISTINCT u.id),
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0),
      COUNT(CASE WHEN o.status != 'cancelled' THEN o.id END),
      COALESCE(AVG(CASE WHEN o.status != 'cancelled' THEN o.total END), 0)
    FROM users u
    LEFT JOIN loyalty_tiers lt ON u.tier_id = lt.id
    LEFT JOIN orders o ON o.user_id = u.id AND DATE(o.created_at) = v_date
    GROUP BY lt.id, lt.name;

    DELETE FROM analytics_daily_streaks WHERE report_date = v_date;
    INSERT INTO analytics_daily_streaks (
      report_date, campaign_id, campaign_name, enrolled_count, completed_count,
      active_count, avg_streak, points_awarded
    )
    SELECT
      v_date,
      sc.id,
      sc.name,
      COUNT(DISTINCT usc.id),
      COUNT(DISTINCT CASE WHEN usc.completed_at IS NOT NULL THEN usc.id END),
      COUNT(DISTINCT CASE WHEN usc.completed_at IS NULL AND usc.current_streak_count > 0 THEN usc.id END),
      COALESCE(AVG(usc.current_streak_count), 0),
      COALESCE(SUM(CASE WHEN usc.bonus_awarded_at IS NOT NULL THEN sc.bonus_points ELSE 0 END), 0)
    FROM streak_campaigns sc
    LEFT JOIN user_streak_campaigns usc ON usc.campaign_id = sc.id
    WHERE sc.start_date <= v_date
    GROUP BY sc.id, sc.name;

    DELETE FROM analytics_hourly_orders WHERE report_date = v_date;
    INSERT INTO analytics_hourly_orders (report_date, hour_of_day, order_count, revenue)
    SELECT
      v_date,
      HOUR(o.created_at),
      COUNT(*),
      COALESCE(SUM(o.total), 0)
    FROM orders o
    WHERE DATE(o.created_at) = v_date AND o.status != 'cancelled'
    GROUP BY HOUR(o.created_at);

    DELETE FROM analytics_daily_category WHERE report_date = v_date;
    INSERT INTO analytics_daily_category (
      report_date, category_id, category_name, orders_count, items_sold, revenue
    )
    SELECT
      v_date,
      c.id,
      c.display_name,
      COUNT(DISTINCT o.id),
      COALESCE(SUM(oi.quantity), 0),
      COALESCE(SUM(oi.quantity * oi.price_at_order), 0)
    FROM categories c
    INNER JOIN products p ON c.id = p.category_id
    INNER JOIN order_items oi ON p.id = oi.product_id
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'cancelled' AND DATE(o.created_at) = v_date
    GROUP BY c.id, c.display_name;

    SET i = i - 1;
  END WHILE;
END //

DELIMITER ;


-- ============================================================================
-- 041_streak_campaign_image.sql
-- ============================================================================

-- Add representative image per streak campaign
ALTER TABLE streak_campaigns
  ADD COLUMN image_url VARCHAR(1024) NULL AFTER custom_text;


-- ============================================================================
-- 042_coupons_module.sql
-- ============================================================================

-- ============================================
-- Coupons module (catalog + user wallet + redemptions)
-- ============================================

INSERT INTO app_settings (id, value, description) VALUES
  ('plugin_coupons_enabled', 'true', 'Activează/dezactivează modulul de cupoane')
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  points_cost INT NOT NULL,
  required_tier_id VARCHAR(36) NULL,
  target_product_id VARCHAR(36) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_coupons_active (is_active),
  INDEX idx_coupons_target_product (target_product_id),
  INDEX idx_coupons_required_tier (required_tier_id),
  INDEX idx_coupons_dates (starts_at, expires_at),
  CONSTRAINT fk_coupons_target_product FOREIGN KEY (target_product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_coupons_required_tier FOREIGN KEY (required_tier_id) REFERENCES loyalty_tiers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_coupons (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  coupon_id VARCHAR(36) NOT NULL,
  status ENUM('active', 'used', 'expired') NOT NULL DEFAULT 'active',
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  used_at DATETIME NULL,
  used_order_id VARCHAR(36) NULL,
  INDEX idx_user_coupons_user (user_id),
  INDEX idx_user_coupons_coupon (coupon_id),
  INDEX idx_user_coupons_status (status),
  INDEX idx_user_coupons_expires (expires_at),
  CONSTRAINT fk_user_coupons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_coupons_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_coupons_order FOREIGN KEY (used_order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_coupon_redemptions (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  user_coupon_id VARCHAR(36) NOT NULL,
  coupon_id VARCHAR(36) NOT NULL,
  target_product_id VARCHAR(36) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_coupon_redemptions_order (order_id),
  INDEX idx_order_coupon_redemptions_user_coupon (user_coupon_id),
  CONSTRAINT fk_ocr_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_ocr_user_coupon FOREIGN KEY (user_coupon_id) REFERENCES user_coupons(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ocr_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ocr_product FOREIGN KEY (target_product_id) REFERENCES products(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_order_user_coupon (order_id, user_coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE orders
  ADD COLUMN discount_from_coupons DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER discount_from_free_products;

