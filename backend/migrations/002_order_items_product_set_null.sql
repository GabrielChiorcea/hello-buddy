-- Permite ștergerea produselor care apar doar în comenzi livrate/anulate.
-- product_id devine NULL la ștergere (istoricul păstrează product_name, price_at_order).

ALTER TABLE order_items MODIFY product_id VARCHAR(36) NULL;

ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;

ALTER TABLE order_items ADD CONSTRAINT order_items_ibfk_2
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
