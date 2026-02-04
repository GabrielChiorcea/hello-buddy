/**
 * Teste pentru validarea inputurilor
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Scheme de validare (reproduse din aplicație)
const emailSchema = z.string().trim().email('Format email invalid').max(255);

const passwordSchema = z
  .string()
  .min(6, 'Parola trebuie să aibă minim 6 caractere')
  .max(100);

const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Numărul de telefon trebuie să aibă minim 10 caractere')
  .max(15)
  .regex(/^[0-9+\s-]+$/, 'Format telefon invalid');

const addressSchema = z
  .string()
  .trim()
  .min(5, 'Adresa trebuie să aibă minim 5 caractere')
  .max(200);

const citySchema = z
  .string()
  .trim()
  .min(2, 'Orașul trebuie să aibă minim 2 caractere')
  .max(100);

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Numele trebuie să aibă minim 2 caractere')
  .max(100);

// Funcție de sanitizare XSS
const sanitizeInput = (value: string): string => {
  return value.replace(/[<>]/g, '');
};

describe('Validare Email', () => {
  it('acceptă email valid', () => {
    expect(() => emailSchema.parse('test@example.com')).not.toThrow();
    expect(() => emailSchema.parse('user.name@domain.ro')).not.toThrow();
    expect(() => emailSchema.parse('user+tag@subdomain.domain.com')).not.toThrow();
  });

  it('respinge email fără @', () => {
    expect(() => emailSchema.parse('invalidemail')).toThrow();
  });

  it('respinge email fără domeniu', () => {
    expect(() => emailSchema.parse('test@')).toThrow();
  });

  it('respinge email gol', () => {
    expect(() => emailSchema.parse('')).toThrow();
  });

  it('face trim la spații', () => {
    const result = emailSchema.parse('  test@example.com  ');
    expect(result).toBe('test@example.com');
  });

  it('respinge email prea lung', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    expect(() => emailSchema.parse(longEmail)).toThrow();
  });
});

describe('Validare Parolă', () => {
  it('acceptă parolă validă (6+ caractere)', () => {
    expect(() => passwordSchema.parse('123456')).not.toThrow();
    expect(() => passwordSchema.parse('parolaSecurizata123!')).not.toThrow();
  });

  it('respinge parolă prea scurtă', () => {
    expect(() => passwordSchema.parse('12345')).toThrow();
    expect(() => passwordSchema.parse('abc')).toThrow();
  });

  it('respinge parolă goală', () => {
    expect(() => passwordSchema.parse('')).toThrow();
  });

  it('respinge parolă prea lungă', () => {
    const longPassword = 'a'.repeat(101);
    expect(() => passwordSchema.parse(longPassword)).toThrow();
  });
});

describe('Validare Telefon', () => {
  it('acceptă telefon valid', () => {
    expect(() => phoneSchema.parse('0721123456')).not.toThrow();
    expect(() => phoneSchema.parse('+40721123456')).not.toThrow();
    expect(() => phoneSchema.parse('072-112-3456')).not.toThrow();
    expect(() => phoneSchema.parse('0721 123 456')).not.toThrow();
  });

  it('respinge telefon prea scurt', () => {
    expect(() => phoneSchema.parse('072112')).toThrow();
  });

  it('respinge telefon cu litere', () => {
    expect(() => phoneSchema.parse('0721abc456')).toThrow();
  });

  it('respinge telefon cu caractere speciale', () => {
    expect(() => phoneSchema.parse('0721@123456')).toThrow();
  });

  it('face trim la spații', () => {
    const result = phoneSchema.parse('  0721123456  ');
    expect(result).toBe('0721123456');
  });
});

describe('Validare Adresă', () => {
  it('acceptă adresă validă', () => {
    expect(() => addressSchema.parse('Str. Libertății nr. 10')).not.toThrow();
    expect(() => addressSchema.parse('Bd. Unirii nr. 25, Bloc A, Ap. 12')).not.toThrow();
  });

  it('respinge adresă prea scurtă', () => {
    expect(() => addressSchema.parse('Str')).toThrow();
    expect(() => addressSchema.parse('Ab12')).toThrow();
  });

  it('respinge adresă goală', () => {
    expect(() => addressSchema.parse('')).toThrow();
  });

  it('respinge adresă prea lungă', () => {
    const longAddress = 'a'.repeat(201);
    expect(() => addressSchema.parse(longAddress)).toThrow();
  });

  it('face trim la spații', () => {
    const result = addressSchema.parse('  Str. Test nr. 1  ');
    expect(result).toBe('Str. Test nr. 1');
  });
});

describe('Validare Oraș', () => {
  it('acceptă oraș valid', () => {
    expect(() => citySchema.parse('București')).not.toThrow();
    expect(() => citySchema.parse('Cluj-Napoca')).not.toThrow();
    expect(() => citySchema.parse('Piatra Neamț')).not.toThrow();
  });

  it('respinge oraș prea scurt', () => {
    expect(() => citySchema.parse('A')).toThrow();
  });

  it('respinge oraș gol', () => {
    expect(() => citySchema.parse('')).toThrow();
  });
});

describe('Validare Nume', () => {
  it('acceptă nume valid', () => {
    expect(() => nameSchema.parse('Ion Popescu')).not.toThrow();
    expect(() => nameSchema.parse('Maria-Elena')).not.toThrow();
  });

  it('respinge nume prea scurt', () => {
    expect(() => nameSchema.parse('I')).toThrow();
  });

  it('respinge nume gol', () => {
    expect(() => nameSchema.parse('')).toThrow();
  });
});

describe('Sanitizare XSS', () => {
  it('elimină taguri HTML < >', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('img src="x" onerror="alert(1)"');
  });

  it('păstrează text normal', () => {
    expect(sanitizeInput('Text normal fără taguri')).toBe('Text normal fără taguri');
  });

  it('elimină multiple caractere < >', () => {
    expect(sanitizeInput('<<script>>')).toBe('script');
  });

  it('funcționează pe string gol', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('păstrează caractere speciale permise', () => {
    expect(sanitizeInput('Str. Test nr. 10, Ap. 5')).toBe('Str. Test nr. 10, Ap. 5');
    expect(sanitizeInput('email+tag@test.com')).toBe('email+tag@test.com');
  });
});

describe('Scheme combinate - Checkout', () => {
  const checkoutSchema = z.object({
    deliveryAddress: addressSchema,
    deliveryCity: citySchema,
    phone: phoneSchema,
    paymentMethod: z.enum(['cash', 'card']),
  });

  it('acceptă date checkout valide', () => {
    const validData = {
      deliveryAddress: 'Str. Libertății nr. 10',
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'cash' as const,
    };
    
    expect(() => checkoutSchema.parse(validData)).not.toThrow();
  });

  it('respinge adresă invalidă', () => {
    const invalidData = {
      deliveryAddress: 'Str',
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'cash' as const,
    };
    
    expect(() => checkoutSchema.parse(invalidData)).toThrow();
  });

  it('respinge metodă de plată invalidă', () => {
    const invalidData = {
      deliveryAddress: 'Str. Libertății nr. 10',
      deliveryCity: 'București',
      phone: '0721123456',
      paymentMethod: 'bitcoin',
    };
    
    expect(() => checkoutSchema.parse(invalidData)).toThrow();
  });

  it('returnează erori detaliate', () => {
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
});

describe('Scheme combinate - Signup', () => {
  const signupSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
  });

  it('acceptă date signup valide', () => {
    const validData = {
      name: 'Ion Popescu',
      email: 'ion@test.com',
      phone: '0721123456',
      password: 'parola123',
      confirmPassword: 'parola123',
    };
    
    expect(() => signupSchema.parse(validData)).not.toThrow();
  });

  it('respinge parole care nu coincid', () => {
    const invalidData = {
      name: 'Ion Popescu',
      email: 'ion@test.com',
      phone: '0721123456',
      password: 'parola123',
      confirmPassword: 'altaparola',
    };
    
    expect(() => signupSchema.parse(invalidData)).toThrow();
  });
});
