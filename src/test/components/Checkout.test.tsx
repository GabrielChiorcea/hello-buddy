/**
 * Teste pentru validare formular Checkout
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema de validare Checkout (reprodusă din aplicație)
const checkoutSchema = z.object({
  deliveryAddress: z
    .string()
    .trim()
    .min(5, 'Adresa trebuie să aibă minim 5 caractere')
    .max(200),
  deliveryCity: z
    .string()
    .trim()
    .min(2, 'Orașul trebuie să aibă minim 2 caractere')
    .max(100),
  phone: z
    .string()
    .trim()
    .min(10, 'Numărul de telefon trebuie să aibă minim 10 caractere')
    .max(15)
    .regex(/^[0-9+\s-]+$/, 'Format telefon invalid'),
  paymentMethod: z.enum(['cash', 'card']),
});

describe('Checkout - Schema validare Zod', () => {
  it('validează corect date valide', () => {
    const validData = {
      deliveryAddress: 'Str. Libertății nr. 10',
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'cash' as const,
    };

    expect(() => checkoutSchema.parse(validData)).not.toThrow();
  });

  it('respinge adresă cu mai puțin de 5 caractere', () => {
    const invalidData = {
      deliveryAddress: 'Str',
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'cash' as const,
    };

    expect(() => checkoutSchema.parse(invalidData)).toThrow();
  });

  it('respinge oraș cu mai puțin de 2 caractere', () => {
    const invalidData = {
      deliveryAddress: 'Str. Test nr. 10',
      deliveryCity: 'B',
      phone: '0721123456',
      paymentMethod: 'cash' as const,
    };

    expect(() => checkoutSchema.parse(invalidData)).toThrow();
  });

  it('respinge telefon prea scurt', () => {
    const invalidData = {
      deliveryAddress: 'Str. Test nr. 10',
      deliveryCity: 'București',
      phone: '072',
      paymentMethod: 'cash' as const,
    };

    expect(() => checkoutSchema.parse(invalidData)).toThrow();
  });

  it('respinge telefon cu caractere invalide', () => {
    const invalidData = {
      deliveryAddress: 'Str. Test nr. 10',
      deliveryCity: 'București',
      phone: '0721abc456',
      paymentMethod: 'cash' as const,
    };

    expect(() => checkoutSchema.parse(invalidData)).toThrow();
  });

  it('acceptă telefon cu caractere permise (+, -, spațiu)', () => {
    const validData = {
      deliveryAddress: 'Str. Test nr. 10',
      deliveryCity: 'București',
      phone: '+40 721-123-456',
      paymentMethod: 'cash' as const,
    };

    expect(() => checkoutSchema.parse(validData)).not.toThrow();
  });

  it('respinge metodă de plată invalidă', () => {
    const invalidData = {
      deliveryAddress: 'Str. Test nr. 10',
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'crypto',
    };

    expect(() => checkoutSchema.parse(invalidData)).toThrow();
  });

  it('face trim la spații în toate câmpurile', () => {
    const dataWithSpaces = {
      deliveryAddress: '  Str. Test nr. 10  ',
      deliveryCity: '  București  ',
      phone: '  0721123456  ',
      paymentMethod: 'cash' as const,
    };

    const result = checkoutSchema.parse(dataWithSpaces);
    expect(result.deliveryAddress).toBe('Str. Test nr. 10');
    expect(result.deliveryCity).toBe('București');
    expect(result.phone).toBe('0721123456');
  });

  it('respinge adresă prea lungă (peste 200 caractere)', () => {
    const invalidData = {
      deliveryAddress: 'a'.repeat(201),
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'cash' as const,
    };

    expect(() => checkoutSchema.parse(invalidData)).toThrow();
  });

  it('returnează erori detaliate pentru multiple câmpuri invalide', () => {
    const invalidData = {
      deliveryAddress: 'Str',
      deliveryCity: 'B',
      phone: 'abc',
      paymentMethod: 'cash' as const,
    };

    const result = checkoutSchema.safeParse(invalidData);
    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.deliveryAddress).toBeDefined();
      expect(errors.deliveryCity).toBeDefined();
      expect(errors.phone).toBeDefined();
    }
  });

  it('acceptă ambele metode de plată valide', () => {
    const cashData = {
      deliveryAddress: 'Str. Test nr. 10',
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'cash' as const,
    };

    const cardData = {
      deliveryAddress: 'Str. Test nr. 10',
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'card' as const,
    };

    expect(() => checkoutSchema.parse(cashData)).not.toThrow();
    expect(() => checkoutSchema.parse(cardData)).not.toThrow();
  });
});

describe('Checkout - Sanitizare XSS', () => {
  const sanitizeInput = (value: string): string => {
    return value.replace(/[<>]/g, '');
  };

  it('elimină taguri HTML din adresă', () => {
    const maliciousInput = '<script>alert("xss")</script>Str. Test';
    expect(sanitizeInput(maliciousInput)).toBe('scriptalert("xss")/scriptStr. Test');
  });

  it('elimină < și > din input', () => {
    expect(sanitizeInput('test<>value')).toBe('testvalue');
  });

  it('păstrează text normal', () => {
    expect(sanitizeInput('Str. Libertății nr. 10')).toBe('Str. Libertății nr. 10');
  });
});
