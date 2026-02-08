/**
 * Model User - operații CRUD pentru utilizatori
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

// Tipuri
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isBlocked: boolean;
  pointsBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  is_blocked: boolean;
  points_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
}

// Mapper pentru a transforma row-ul din DB în obiectul User
function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    isBlocked: row.is_blocked,
    pointsBalance: row.points_balance ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Găsește un utilizator după ID
 */
export async function findById(id: string): Promise<User | null> {
  const row = await queryOne<UserRow>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return row ? mapRowToUser(row) : null;
}

/**
 * Găsește un utilizator după email
 */
export async function findByEmail(email: string): Promise<User | null> {
  const row = await queryOne<UserRow>(
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase()]
  );
  return row ? mapRowToUser(row) : null;
}

/**
 * Găsește un utilizator după telefon (când telefonul există)
 */
export async function findByPhone(phone: string): Promise<User | null> {
  const normalized = phone.trim();
  if (!normalized) return null;
  const row = await queryOne<UserRow>(
    'SELECT * FROM users WHERE phone = ?',
    [normalized]
  );
  return row ? mapRowToUser(row) : null;
}

/**
 * Verifică credențialele și returnează utilizatorul
 */
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const row = await queryOne<UserRow>(
    'SELECT * FROM users WHERE email = ? AND is_blocked = FALSE',
    [email.toLowerCase()]
  );
  
  if (!row) return null;
  
  const isValid = await verifyPassword(password, row.password_hash);
  if (!isValid) return null;
  
  return mapRowToUser(row);
}

/**
 * Creează un utilizator nou
 */
export async function create(input: CreateUserInput): Promise<User> {
  const id = uuidv4();
  const passwordHash = await hashPassword(input.password);

  const normalizedPhone = input.phone?.trim();
  const phoneValue = normalizedPhone ? normalizedPhone : null;
  
  try {
    await query(
      `INSERT INTO users (id, email, password_hash, name, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.email.toLowerCase(), passwordHash, input.name, phoneValue]
    );
  } catch (e: any) {
    // Friendly error pentru duplicate (email/phone)
    const msg = String(e?.message || '');
    if (msg.includes('uq_users_phone') || msg.includes('Duplicate') && msg.includes('phone')) {
      throw new Error('Acest număr de telefon este deja folosit');
    }
    if (msg.includes('idx_users_email') || msg.includes('Duplicate') && msg.includes('email')) {
      throw new Error('Acest email este deja înregistrat');
    }
    throw e;
  }
  
  // Adaugă rolul implicit 'user'
  await query(
    `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'user')`,
    [uuidv4(), id]
  );
  
  const user = await findById(id);
  if (!user) throw new Error('Eroare la crearea utilizatorului');
  
  return user;
}

/**
 * Actualizează profilul unui utilizator
 */
export async function update(id: string, input: UpdateUserInput): Promise<User | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.phone !== undefined) {
    updates.push('phone = ?');
    values.push(input.phone);
  }
  
  if (updates.length === 0) return findById(id);
  
  values.push(id);
  await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return findById(id);
}

/**
 * Schimbă parola unui utilizator
 */
export async function changePassword(id: string, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);
  await query(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, id]
  );
  return true;
}

/**
 * Blochează/deblochează un utilizator
 */
export async function setBlocked(id: string, blocked: boolean): Promise<boolean> {
  await query(
    'UPDATE users SET is_blocked = ? WHERE id = ?',
    [blocked, id]
  );
  return true;
}

/**
 * Șterge un utilizator
 */
export async function deleteUser(id: string): Promise<boolean> {
  await query('DELETE FROM users WHERE id = ?', [id]);
  return true;
}

/**
 * Listează utilizatori cu paginare
 */
export async function findAll(
  page = 1,
  limit = 20,
  search?: string
): Promise<{ users: User[]; total: number }> {
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  let selectQuery = 'SELECT * FROM users';
  const params: unknown[] = [];
  
  if (search) {
    const whereClause = ' WHERE name LIKE ? OR email LIKE ?';
    countQuery += whereClause;
    selectQuery += whereClause;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  selectQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  
  const countResult = await queryOne<{ total: number }>(countQuery, params);
  const total = countResult?.total || 0;
  
  params.push(limit, (page - 1) * limit);
  const rows = await query<UserRow[]>(selectQuery, params);
  
  return {
    users: rows.map(mapRowToUser),
    total,
  };
}
