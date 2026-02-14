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
