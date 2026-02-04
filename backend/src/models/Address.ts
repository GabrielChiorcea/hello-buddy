/**
 * Model Address - gestionare adrese de livrare
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';

export interface Address {
  id: string;
  userId: string;
  label: string;
  address: string;
  city: string;
  phone: string;
  notes: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AddressRow {
  id: string;
  user_id: string;
  label: string;
  address: string;
  city: string;
  phone: string;
  notes: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAddressInput {
  userId: string;
  label: string;
  address: string;
  city: string;
  phone: string;
  notes?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  address?: string;
  city?: string;
  phone?: string;
  notes?: string;
  isDefault?: boolean;
}

function mapRowToAddress(row: AddressRow): Address {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    address: row.address,
    city: row.city,
    phone: row.phone,
    notes: row.notes,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Găsește o adresă după ID
 */
export async function findById(id: string): Promise<Address | null> {
  const row = await queryOne<AddressRow>(
    'SELECT * FROM delivery_addresses WHERE id = ?',
    [id]
  );
  return row ? mapRowToAddress(row) : null;
}

/**
 * Listează adresele unui utilizator
 */
export async function findByUserId(userId: string): Promise<Address[]> {
  const rows = await query<AddressRow[]>(
    'SELECT * FROM delivery_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return rows.map(mapRowToAddress);
}

/**
 * Găsește adresa implicită a unui utilizator
 */
export async function findDefault(userId: string): Promise<Address | null> {
  const row = await queryOne<AddressRow>(
    'SELECT * FROM delivery_addresses WHERE user_id = ? AND is_default = TRUE',
    [userId]
  );
  return row ? mapRowToAddress(row) : null;
}

/**
 * Creează o adresă nouă
 */
export async function create(input: CreateAddressInput): Promise<Address> {
  const id = uuidv4();
  
  // Dacă este marcată ca implicită, demarchează celelalte
  if (input.isDefault) {
    await query(
      'UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = ?',
      [input.userId]
    );
  }
  
  // Dacă este prima adresă, o facem implicită automat
  const existingCount = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM delivery_addresses WHERE user_id = ?',
    [input.userId]
  );
  const isDefault = input.isDefault || existingCount?.count === 0;
  
  await query(
    `INSERT INTO delivery_addresses (id, user_id, label, address, city, phone, notes, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.userId, input.label, input.address, input.city, input.phone, input.notes || null, isDefault]
  );
  
  const address = await findById(id);
  if (!address) throw new Error('Eroare la crearea adresei');
  
  return address;
}

/**
 * Actualizează o adresă
 */
export async function update(id: string, input: UpdateAddressInput): Promise<Address | null> {
  const address = await findById(id);
  if (!address) return null;
  
  // Dacă devine implicită, demarchează celelalte
  if (input.isDefault && !address.isDefault) {
    await query(
      'UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = ?',
      [address.userId]
    );
  }
  
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.label !== undefined) {
    updates.push('label = ?');
    values.push(input.label);
  }
  if (input.address !== undefined) {
    updates.push('address = ?');
    values.push(input.address);
  }
  if (input.city !== undefined) {
    updates.push('city = ?');
    values.push(input.city);
  }
  if (input.phone !== undefined) {
    updates.push('phone = ?');
    values.push(input.phone);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes);
  }
  if (input.isDefault !== undefined) {
    updates.push('is_default = ?');
    values.push(input.isDefault);
  }
  
  if (updates.length === 0) return address;
  
  values.push(id);
  await query(
    `UPDATE delivery_addresses SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return findById(id);
}

/**
 * Setează o adresă ca implicită
 */
export async function setDefault(id: string, userId: string): Promise<Address | null> {
  // Demarchează toate adresele utilizatorului
  await query(
    'UPDATE delivery_addresses SET is_default = FALSE WHERE user_id = ?',
    [userId]
  );
  
  // Marchează adresa specificată
  await query(
    'UPDATE delivery_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  
  return findById(id);
}

/**
 * Șterge o adresă
 */
export async function deleteAddress(id: string, userId: string): Promise<boolean> {
  const address = await findById(id);
  if (!address || address.userId !== userId) return false;
  
  await query('DELETE FROM delivery_addresses WHERE id = ?', [id]);
  
  // Dacă era implicită, setăm alta ca implicită
  if (address.isDefault) {
    const remaining = await findByUserId(userId);
    if (remaining.length > 0) {
      await setDefault(remaining[0].id, userId);
    }
  }
  
  return true;
}
