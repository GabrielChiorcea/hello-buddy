/**
 * Seed pentru cont admin
 */

import { v4 as uuidv4 } from 'uuid';
import { pool, query } from '../config/database.js';
import { hashPassword } from '../utils/password.js';

async function createAdmin() {
  console.log('👤 Creare cont admin...\n');
  
  try {
    const adminId = uuidv4();
    const passwordHash = await hashPassword('admin123secure');
    
    // Creează utilizatorul admin
    await query(
      `INSERT INTO users (id, email, password_hash, name, phone) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [adminId, 'admin@foodorder.com', passwordHash, 'Administrator', '+40700000000']
    );
    
    // Adaugă rolul admin
    await query(
      `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')
       ON DUPLICATE KEY UPDATE role = 'admin'`,
      [uuidv4(), adminId]
    );
    
    console.log('✅ Cont admin creat:');
    console.log('   Email: admin@foodorder.com');
    console.log('   Parolă: admin123secure');
    console.log('\n⚠️  Schimbați parola la prima autentificare!');
  } catch (error) {
    console.error('❌ Eroare creare admin:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
