-- ============================================
-- Streak V2: Motor de reguli complet
-- Recurență (calendar/rolling/consecutive), Praguri (scăriță),
-- Validare (min order, cooldown, excluded products), Resetare (soft decay)
-- ============================================

-- 1. Adaugă coloane noi la streak_campaigns
ALTER TABLE streak_campaigns
  MODIFY COLUMN streak_type ENUM('calendar_weekly','rolling','consecutive') NOT NULL DEFAULT 'consecutive',
  ADD COLUMN rolling_window_days INT NOT NULL DEFAULT 7 AFTER streak_type,
  ADD COLUMN reward_type ENUM('single','steps','multiplier') NOT NULL DEFAULT 'single' AFTER bonus_points,
  ADD COLUMN base_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00 AFTER reward_type,
  ADD COLUMN multiplier_increment DECIMAL(4,2) NOT NULL DEFAULT 0.00 AFTER base_multiplier,
  ADD COLUMN reset_type ENUM('hard','soft_decay') NOT NULL DEFAULT 'hard' AFTER reset_on_miss,
  ADD COLUMN min_order_value DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER reset_type,
  ADD COLUMN cooldown_hours INT NOT NULL DEFAULT 0 AFTER min_order_value;

-- Scoatem points_expire_after_campaign (nu era implementat)
ALTER TABLE streak_campaigns DROP COLUMN points_expire_after_campaign;
-- reset_on_miss e acum înlocuit de reset_type, dar îl păstrăm temporar pt backward compat
-- Îl scoatem:
ALTER TABLE streak_campaigns DROP COLUMN reset_on_miss;

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

-- 4. Adaugă current_level la user_streak_campaigns (pentru soft decay)
ALTER TABLE user_streak_campaigns
  ADD COLUMN current_level INT NOT NULL DEFAULT 0 AFTER current_streak_count;

-- 5. Adaugă order_value la streak_logs (pentru validare valoare minimă)
ALTER TABLE streak_logs
  ADD COLUMN order_value DECIMAL(10,2) NULL AFTER order_date;

-- 6. Migrate existing data: consecutive_days -> consecutive, days_per_week/working_days -> calendar_weekly
-- (best effort; working_days nu mai e tip separat, devine calendar_weekly cu ordersRequired <= 5)
-- Nu e nevoie — ENUM a fost modificat direct, datele vechi cu valori invalide vor trebui curățate manual.
