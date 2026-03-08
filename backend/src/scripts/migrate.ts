/**
 * Script pentru rulare migrări
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "../../migrations");

/**
 * Strip SQL comments (-- and /* *\/) so semicolons inside comments
 * don't break statement splitting.
 */
function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "") // /* ... */
    .replace(/--[^\n]*/g, ""); // -- to end of line
}

/**
 * Parse SQL file handling DELIMITER (MySQL CLI directive).
 * When DELIMITER // is used, statements are split by // instead of ;
 * so CREATE FUNCTION/PROCEDURE blocks stay intact.
 */
function parseSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let delimiter = ";";
  let buffer = "";

  const processBuffer = () => {
    const stripped = stripSqlComments(buffer);
    const parts = stripped
      .split(delimiter)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const p of parts) {
      if (p) statements.push(p);
    }
    buffer = "";
  };

  const lines = sql.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase().startsWith("DELIMITER ")) {
      processBuffer();
      delimiter = trimmed.slice(10).trim();
      continue;
    }
    buffer += line + "\n";
  }
  processBuffer();

  return statements.filter((s) => s);
}

async function runMigrations() {
  console.log("🔄 Rulare migrări...\n");

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const connection = await pool.getConnection();

  try {
    for (const file of files) {
      console.log(`📄 Execut: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      const statements = parseSqlStatements(sql);

      for (const statement of statements) {
        const s = statement.trim();
        if (!s) continue;
        if (s.toUpperCase().startsWith("DELIMITER ")) continue;
        await connection.query(statement);
      }

      console.log(`   ✅ Completat\n`);
    }

    console.log("✅ Toate migrările au fost executate cu succes!");
  } catch (error) {
    console.error("❌ Eroare la migrări:", error);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

runMigrations();
