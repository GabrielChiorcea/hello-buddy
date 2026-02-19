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
