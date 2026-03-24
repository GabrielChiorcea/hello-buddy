-- GDPR: soft delete + anonimizare — păstrează user_id pentru comenzi, puncte, campanii, etc.
-- email / name / phone devin NULL; parola înlocuită la ștergere din aplicație.

SET @col_is_deleted = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_deleted'
);
SET @sql1 = IF(@col_is_deleted = 0,
  'ALTER TABLE users ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @col_deleted_at = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deleted_at'
);
SET @sql2 = IF(@col_deleted_at = 0,
  'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

ALTER TABLE users MODIFY email VARCHAR(255) NULL;
ALTER TABLE users MODIFY name VARCHAR(100) NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users (is_deleted);
