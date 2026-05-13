-- Elimină evenimentele MariaDB/MySQL pentru agregări analytics (înlocuite de apel API/cron către sp_backfill_analytics).
-- Rulabil idempotent după instalări vechi care aveau aceste CREATE EVENT în 001.

DROP EVENT IF EXISTS evt_analytics_daily_sales;
DROP EVENT IF EXISTS evt_analytics_daily_points;
DROP EVENT IF EXISTS evt_analytics_daily_tiers;
DROP EVENT IF EXISTS evt_analytics_daily_streaks;
DROP EVENT IF EXISTS evt_analytics_hourly_orders;
DROP EVENT IF EXISTS evt_analytics_daily_product_pairs;
DROP EVENT IF EXISTS evt_analytics_daily_category;
