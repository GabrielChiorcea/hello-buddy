/**
 * Seed pentru date inițiale - produse și categorii
 */

import { v4 as uuidv4 } from 'uuid';
import { pool, query } from '../config/database.js';

const categories = [
  { name: 'pizza', displayName: 'Pizza', icon: '🍕', sortOrder: 1 },
  { name: 'burger', displayName: 'Burgeri', icon: '🍔', sortOrder: 2 },
  { name: 'paste', displayName: 'Paste', icon: '🍝', sortOrder: 3 },
  { name: 'salate', displayName: 'Salate', icon: '🥗', sortOrder: 4 },
  { name: 'desert', displayName: 'Deserturi', icon: '🍰', sortOrder: 5 },
  { name: 'bauturi', displayName: 'Băuturi', icon: '🥤', sortOrder: 6 },
];

const products = [
  { name: 'Pizza Margherita', description: 'Sos de roșii, mozzarella, busuioc', price: 32, category: 'pizza', ingredients: ['sos roșii', 'mozzarella', 'busuioc'] },
  { name: 'Pizza Quattro Formaggi', description: 'Mozzarella, gorgonzola, parmesan, ricotta', price: 42, category: 'pizza', ingredients: ['mozzarella', 'gorgonzola', 'parmesan', 'ricotta'] },
  { name: 'Burger Classic', description: 'Carne de vită, salată, roșii, ceapă', price: 28, category: 'burger', ingredients: ['carne vită', 'salată', 'roșii', 'ceapă'] },
  { name: 'Cheeseburger', description: 'Carne de vită, cheddar, murături, sos special', price: 32, category: 'burger', ingredients: ['carne vită', 'cheddar', 'murături'] },
  { name: 'Paste Carbonara', description: 'Spaghetti, ou, pancetta, parmesan', price: 35, category: 'paste', ingredients: ['spaghetti', 'ou', 'pancetta', 'parmesan'] },
  { name: 'Paste Bolognese', description: 'Tagliatelle, sos de carne, parmesan', price: 34, category: 'paste', ingredients: ['tagliatelle', 'carne tocată', 'roșii', 'parmesan'] },
  { name: 'Salată Caesar', description: 'Salată romană, pui, parmesan, crutoane', price: 28, category: 'salate', ingredients: ['salată romană', 'pui', 'parmesan', 'crutoane'] },
  { name: 'Tiramisu', description: 'Desert italian cu mascarpone și cafea', price: 22, category: 'desert', ingredients: ['mascarpone', 'cafea', 'pișcoturi'] },
  { name: 'Cheesecake', description: 'Cu fructe de pădure', price: 24, category: 'desert', ingredients: ['brânză cremă', 'fructe pădure'] },
  { name: 'Limonadă', description: 'Limonadă proaspătă cu mentă', price: 12, category: 'bauturi', ingredients: ['lămâie', 'mentă', 'zahăr'] },
];

async function seed() {
  console.log('🌱 Populare date inițiale...\n');
  
  try {
    // Inserează categorii
    console.log('📁 Inserare categorii...');
    const categoryIds: Record<string, string> = {};
    
    for (const cat of categories) {
      const id = uuidv4();
      categoryIds[cat.name] = id;
      await query(
        `INSERT INTO categories (id, name, display_name, icon, sort_order) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), icon = VALUES(icon)`,
        [id, cat.name, cat.displayName, cat.icon, cat.sortOrder]
      );
    }
    console.log('   ✅ Categorii inserate\n');
    
    // Inserează produse
    console.log('🍕 Inserare produse...');
    for (const prod of products) {
      const id = uuidv4();
      await query(
        `INSERT INTO products (id, name, description, price, category_id) VALUES (?, ?, ?, ?, ?)`,
        [id, prod.name, prod.description, prod.price, categoryIds[prod.category]]
      );
      
      // Inserează ingrediente
      for (const ing of prod.ingredients) {
        await query(
          `INSERT INTO product_ingredients (product_id, name, is_allergen) VALUES (?, ?, ?)`,
          [id, ing, false]
        );
      }
    }
    console.log('   ✅ Produse inserate\n');
    
    console.log('✅ Seed completat cu succes!');
  } catch (error) {
    console.error('❌ Eroare seed:', error);
  } finally {
    await pool.end();
  }
}

seed();
