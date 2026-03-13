-- Permite stocarea punctelor cu zecimale (ex. 5.25)
ALTER TABLE users
  MODIFY COLUMN points_balance DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE orders
  MODIFY COLUMN points_earned DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE points_transactions
  MODIFY COLUMN amount DECIMAL(10,2) NOT NULL;

