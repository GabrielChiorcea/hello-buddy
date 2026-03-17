-- Product options groups and options, plus order item configuration

-- Groups of options per product (e.g. Size, Crust type)
CREATE TABLE IF NOT EXISTS product_option_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  min_selected INT DEFAULT 0,
  max_selected INT DEFAULT 1,
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_option_groups_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual options inside a group (e.g. Large, Medium, Extra cheese)
CREATE TABLE IF NOT EXISTS product_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_default BOOLEAN DEFAULT FALSE,
  is_multiple BOOLEAN DEFAULT FALSE,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES product_option_groups(id) ON DELETE CASCADE,
  INDEX idx_product_options_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Store chosen configuration and final unit price per order item
ALTER TABLE order_items
  ADD COLUMN configuration JSON NULL AFTER price_at_order,
  ADD COLUMN unit_price_with_configuration DECIMAL(10, 2) NULL AFTER configuration;

