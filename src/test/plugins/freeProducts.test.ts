/**
 * Teste de bază pentru pluginul Free Products (produse gratis pe rank)
 * Verificăm doar contractul de tipuri și comportament așteptat la nivel de model/order.
 */

import { describe, it, expect } from 'vitest';

describe('Free Products - Contract tipuri', () => {
  it('Order poate avea discountFromFreeProducts', () => {
    const order = {
      id: 'order-1',
      userId: 'user-1',
      subtotal: 50,
      deliveryFee: 0,
      total: 50,
      discountFromPoints: 0,
      discountFromFreeProducts: 20,
    };

    expect(order.discountFromFreeProducts).toBe(20);
    expect(order.total + order.discountFromFreeProducts).toBe(70);
  });
});

describe('Free Products - Exemplu de aplicare logică (pur funcțional)', () => {
  function applyFreeProducts(
    items: Array<{ productId: string; price: number; quantity: number }>,
    freeProductIds: string[]
  ) {
    let subtotal = 0;
    let discountFromFreeProducts = 0;

    for (const item of items) {
      if (freeProductIds.includes(item.productId)) {
        discountFromFreeProducts += item.price * item.quantity;
      } else {
        subtotal += item.price * item.quantity;
      }
    }

    return { subtotal, discountFromFreeProducts, total: subtotal };
  }

  it('marchează produsele eligibile ca gratuite', () => {
    const items = [
      { productId: 'p1', price: 10, quantity: 2 }, // free
      { productId: 'p2', price: 20, quantity: 1 }, // paid
    ];
    const freeIds = ['p1'];

    const result = applyFreeProducts(items, freeIds);

    expect(result.subtotal).toBe(20); // doar p2
    expect(result.discountFromFreeProducts).toBe(20); // p1 * 2
    expect(result.total).toBe(20);
  });

  it('fără produse gratuite => discount 0', () => {
    const items = [{ productId: 'p1', price: 10, quantity: 1 }];
    const result = applyFreeProducts(items, []);

    expect(result.subtotal).toBe(10);
    expect(result.discountFromFreeProducts).toBe(0);
  });
}

