/**
 * Adaugă coloana welcome_bonus_awarded pe users dacă lipsește.
 * Folosește-l când ai DB existent și npm run migrate nu mai poate rula 001 din nou.
 */
import { pool } from '../config/database.js';

async function main() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'welcome_bonus_awarded'`
  );
  const count = Number((rows as { c: number }[])[0]?.c ?? 0);
  if (count > 0) {
    console.log('✓ Coloana welcome_bonus_awarded există deja.');
    process.exit(0);
    return;
  }
  await pool.query(
    'ALTER TABLE users ADD COLUMN welcome_bonus_awarded INT NOT NULL DEFAULT 0'
  );
  console.log('✓ Adăugat welcome_bonus_awarded pe users.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
