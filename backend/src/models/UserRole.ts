/**
 * Model UserRole - gestionare roluri utilizatori
 * IMPORTANT: Rolurile sunt stocate separat pentru securitate
 */

import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "../config/database.js";

export type AppRole = "admin" | "moderator" | "user";

export interface UserRole {
  id: string;
  userId: string;
  role: AppRole;
  createdAt: Date;
}

interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: Date;
}

/**
 * Verifică dacă un utilizator are un anumit rol
 * Aceasta este funcția principală folosită în middleware
 */
export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const result = await queryOne<{ role_exists: number }>(
    `SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?) as role_exists`,
    [userId, role],
  );
  return result?.role_exists === 1;
}

/**
 * Verifică dacă utilizatorul este admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin");
}

/**
 * Obține toate rolurile unui utilizator
 */
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const rows = await query<UserRoleRow[]>("SELECT * FROM user_roles WHERE user_id = ?", [userId]);
  return rows.map((r) => r.role);
}

/**
 * Adaugă un rol unui utilizator
 */
export async function addRole(userId: string, role: AppRole): Promise<boolean> {
  try {
    await query("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)", [uuidv4(), userId, role]);
    return true;
  } catch (error) {
    // Dacă rolul există deja, returnăm true
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return true;
    }
    throw error;
  }
}

/**
 * Elimină un rol de la un utilizator
 */
export async function removeRole(userId: string, role: AppRole): Promise<boolean> {
  await query("DELETE FROM user_roles WHERE user_id = ? AND role = ?", [userId, role]);
  return true;
}

/**
 * Setează rolurile unui utilizator (înlocuiește toate rolurile existente)
 */
export async function setRoles(userId: string, roles: AppRole[]): Promise<boolean> {
  // Șterge toate rolurile existente
  await query("DELETE FROM user_roles WHERE user_id = ?", [userId]);

  // Adaugă noile roluri
  for (const role of roles) {
    await query("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)", [uuidv4(), userId, role]);
  }

  return true;
}

/**
 * Găsește toți utilizatorii cu un anumit rol
 */
export async function findUsersByRole(role: AppRole): Promise<string[]> {
  const rows = await query<{ user_id: string }[]>("SELECT user_id FROM user_roles WHERE role = ?", [role]);
  return rows.map((r) => r.user_id);
}
