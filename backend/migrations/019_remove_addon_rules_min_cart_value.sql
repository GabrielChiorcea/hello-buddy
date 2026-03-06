-- Elimină coloana min_cart_value din regulile add-on (regula nu mai depinde de valoarea coșului)
ALTER TABLE category_addon_rules DROP COLUMN IF EXISTS min_cart_value;
