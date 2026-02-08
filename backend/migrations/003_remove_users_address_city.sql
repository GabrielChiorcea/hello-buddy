-- Remove address and city from users table
-- Addresses are managed exclusively in delivery_addresses
-- Idempotent: verifica daca coloanele exista inainte de drop
DROP PROCEDURE IF EXISTS migr_003_drop_user_cols;

DELIMITER //
CREATE PROCEDURE migr_003_drop_user_cols()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address') > 0 THEN
    ALTER TABLE users DROP COLUMN address;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'city') > 0 THEN
    ALTER TABLE users DROP COLUMN city;
  END IF;
END //
DELIMITER ;

CALL migr_003_drop_user_cols();
DROP PROCEDURE migr_003_drop_user_cols;
