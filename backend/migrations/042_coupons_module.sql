-- ============================================
-- Coupons module (catalog + user wallet + redemptions)
-- ============================================

INSERT INTO app_settings (id, value, description) VALUES
  ('plugin_coupons_enabled', 'true', 'Activează/dezactivează modulul de cupoane')
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  points_cost INT NOT NULL,
  required_tier_id VARCHAR(36) NULL,
  target_product_id VARCHAR(36) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_coupons_active (is_active),
  INDEX idx_coupons_target_product (target_product_id),
  INDEX idx_coupons_required_tier (required_tier_id),
  INDEX idx_coupons_dates (starts_at, expires_at),
  CONSTRAINT fk_coupons_target_product FOREIGN KEY (target_product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_coupons_required_tier FOREIGN KEY (required_tier_id) REFERENCES loyalty_tiers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_coupons (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  coupon_id VARCHAR(36) NOT NULL,
  status ENUM('active', 'used', 'expired') NOT NULL DEFAULT 'active',
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  used_at DATETIME NULL,
  used_order_id VARCHAR(36) NULL,
  INDEX idx_user_coupons_user (user_id),
  INDEX idx_user_coupons_coupon (coupon_id),
  INDEX idx_user_coupons_status (status),
  INDEX idx_user_coupons_expires (expires_at),
  CONSTRAINT fk_user_coupons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_coupons_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_coupons_order FOREIGN KEY (used_order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_coupon_redemptions (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  user_coupon_id VARCHAR(36) NOT NULL,
  coupon_id VARCHAR(36) NOT NULL,
  target_product_id VARCHAR(36) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_coupon_redemptions_order (order_id),
  INDEX idx_order_coupon_redemptions_user_coupon (user_coupon_id),
  CONSTRAINT fk_ocr_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_ocr_user_coupon FOREIGN KEY (user_coupon_id) REFERENCES user_coupons(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ocr_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ocr_product FOREIGN KEY (target_product_id) REFERENCES products(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_order_user_coupon (order_id, user_coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE orders
  ADD COLUMN discount_from_coupons DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER discount_from_free_products;
