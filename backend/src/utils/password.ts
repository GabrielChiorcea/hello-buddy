/**
 * Utilități pentru hash-uire parole cu bcrypt
 */

import bcrypt from 'bcrypt';

// Numărul de runde pentru salt (12 este un bun echilibru între securitate și performanță)
const SALT_ROUNDS = 12;

/**
 * Hash-uiește o parolă
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifică dacă parola se potrivește cu hash-ul
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validează puterea unei parole
 * Returnează array cu erori găsite (gol dacă parola e validă)
 */
export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Parola trebuie să aibă cel puțin 8 caractere');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin o literă mare');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin o literă mică');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Parola trebuie să conțină cel puțin o cifră');
  }
  
  return errors;
}
