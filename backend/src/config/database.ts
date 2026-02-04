/**
 * Configurare conexiune MariaDB
 * Folosește pool de conexiuni pentru performanță optimă
 */

import mysql from 'mysql2/promise';
import { env } from './env.js';

// Creare pool de conexiuni
export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Returnează rezultatele ca obiecte, nu array-uri
  namedPlaceholders: true,
});

/**
 * Verifică conexiunea la baza de date
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexiune MariaDB reușită');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Eroare conexiune MariaDB:', error);
    return false;
  }
}

/**
 * Execută o interogare și returnează rezultatul
 */
export async function query<T>(
  sql: string, 
  params?: Record<string, unknown> | unknown[]
): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

/**
 * Execută o interogare și returnează primul rând
 */
export async function queryOne<T>(
  sql: string, 
  params?: Record<string, unknown> | unknown[]
): Promise<T | null> {
  const rows = await query<T[]>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Începe o tranzacție
 */
export async function beginTransaction() {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Închide pool-ul de conexiuni (pentru cleanup)
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('🔒 Pool conexiuni MariaDB închis');
}
