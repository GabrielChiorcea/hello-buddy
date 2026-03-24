-- Indexuri pentru interogări analitice pe interval (created_at)

CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions (created_at);

-- Join users + orders cu filtru pe dată (top clienți)
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at ON orders (user_id, created_at);
