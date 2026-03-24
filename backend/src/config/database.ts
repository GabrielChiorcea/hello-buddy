/**
 * Configurare conexiune MariaDB
 * Folosește pool de conexiuni pentru performanță optimă
 */

import mysql from 'mysql2/promise';
import { env } from './env.js';

const poolOptions = {
  waitForConnections: true,
  connectionLimit: 25,
  maxIdle: 15,
  idleTimeout: 30000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true,
};

// Creare pool de conexiuni (scriere / tranzacții)
export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ...poolOptions,
});

/** Pool read-only opțional (replică) — aceleași credențiale, alt host */
export const poolRead: mysql.Pool | null = env.DB_READ_HOST
  ? mysql.createPool({
      host: env.DB_READ_HOST,
      port: env.DB_READ_PORT ?? env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ...poolOptions,
    })
  : null;

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
 * Execută o interogare pe pool-ul principal (scrieri, backfill)
 */
export async function query<T>(
  sql: string,
  params?: Record<string, unknown> | unknown[]
): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

/**
 * Citiri pentru rapoarte analitice — folosește replica dacă e configurată
 */
export async function analyticsQuery<T>(
  sql: string,
  params?: Record<string, unknown> | unknown[]
): Promise<T> {
  const executor = poolRead ?? pool;
  const [rows] = await executor.execute(sql, params);
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
 * Închide pool-urile de conexiuni (pentru cleanup)
 */
export async function closePool(): Promise<void> {
  await pool.end();
  if (poolRead) await poolRead.end();
  console.log('🔒 Pool conexiuni MariaDB închis');
}
