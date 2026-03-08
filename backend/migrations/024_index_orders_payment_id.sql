-- ============================================
-- 024: Index pe orders.payment_id pentru performanță
-- findByPaymentId făcea full table scan fără acest index
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
