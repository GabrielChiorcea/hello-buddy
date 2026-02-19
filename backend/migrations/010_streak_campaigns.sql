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
