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
