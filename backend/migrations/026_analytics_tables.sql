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
