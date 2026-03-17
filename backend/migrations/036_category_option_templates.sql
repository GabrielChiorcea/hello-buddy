-- Category-level option templates for product configuration

CREATE TABLE IF NOT EXISTS category_option_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_option_templates_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS category_option_template_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  min_selected INT DEFAULT 0,
  max_selected INT DEFAULT 1,
  is_required BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (template_id) REFERENCES category_option_templates(id) ON DELETE CASCADE,
  INDEX idx_template_groups_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS category_option_template_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_default BOOLEAN DEFAULT FALSE,
  is_multiple BOOLEAN DEFAULT FALSE,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES category_option_template_groups(id) ON DELETE CASCADE,
  INDEX idx_template_options_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE products
  ADD COLUMN follows_category_template BOOLEAN NOT NULL DEFAULT FALSE AFTER preparation_time,
  ADD COLUMN category_template_id INT NULL AFTER follows_category_template,
  ADD CONSTRAINT fk_products_category_template
    FOREIGN KEY (category_template_id) REFERENCES category_option_templates(id)
    ON DELETE SET NULL;

