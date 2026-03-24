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
