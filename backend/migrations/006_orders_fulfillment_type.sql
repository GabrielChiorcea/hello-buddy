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
