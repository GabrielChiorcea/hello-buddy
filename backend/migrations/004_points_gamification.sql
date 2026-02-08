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
