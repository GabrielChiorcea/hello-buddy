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
