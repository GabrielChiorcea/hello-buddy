/**
 * Script complet de populare a bazei de date cu date de test
 * Include: categorii, produse, utilizatori, comenzi
 */

import { v4 as uuidv4 } from 'uuid';
import { pool, query } from '../config/database.js';
import { hashPassword } from '../utils/password.js';

// Categorii cu iconițe
const categories = [
  { name: 'pizza', displayName: 'Pizza', icon: '🍕', sortOrder: 1 },
  { name: 'burger', displayName: 'Burgeri', icon: '🍔', sortOrder: 2 },
  { name: 'paste', displayName: 'Paste', icon: '🍝', sortOrder: 3 },
  { name: 'salate', displayName: 'Salate', icon: '🥗', sortOrder: 4 },
  { name: 'desert', displayName: 'Deserturi', icon: '🍰', sortOrder: 5 },
  { name: 'bauturi', displayName: 'Băuturi', icon: '🥤', sortOrder: 6 },
];

// Produse pentru fiecare categorie
const products = [
  // Pizza (6 produse)
  { name: 'Pizza Margherita', description: 'Sos de roșii, mozzarella, busuioc proaspăt', price: 32, category: 'pizza', ingredients: [{ name: 'sos roșii', isAllergen: false }, { name: 'mozzarella', isAllergen: true }, { name: 'busuioc', isAllergen: false }], preparationTime: 20 },
  { name: 'Pizza Quattro Formaggi', description: 'Mozzarella, gorgonzola, parmesan, ricotta', price: 42, category: 'pizza', ingredients: [{ name: 'mozzarella', isAllergen: true }, { name: 'gorgonzola', isAllergen: true }, { name: 'parmesan', isAllergen: true }, { name: 'ricotta', isAllergen: true }], preparationTime: 25 },
  { name: 'Pizza Diavola', description: 'Sos de roșii, mozzarella, salam picant, ardei iuți', price: 38, category: 'pizza', ingredients: [{ name: 'sos roșii', isAllergen: false }, { name: 'mozzarella', isAllergen: true }, { name: 'salam picant', isAllergen: false }, { name: 'ardei iuți', isAllergen: false }], preparationTime: 20 },
  { name: 'Pizza Prosciutto e Funghi', description: 'Sos de roșii, mozzarella, șuncă, ciuperci', price: 40, category: 'pizza', ingredients: [{ name: 'sos roșii', isAllergen: false }, { name: 'mozzarella', isAllergen: true }, { name: 'șuncă', isAllergen: false }, { name: 'ciuperci', isAllergen: false }], preparationTime: 22 },
  { name: 'Pizza Tonno', description: 'Sos de roșii, mozzarella, ton, ceapă roșie', price: 44, category: 'pizza', ingredients: [{ name: 'sos roșii', isAllergen: false }, { name: 'mozzarella', isAllergen: true }, { name: 'ton', isAllergen: true }, { name: 'ceapă roșie', isAllergen: false }], preparationTime: 20 },
  { name: 'Pizza Vegetariana', description: 'Sos de roșii, mozzarella, legume de sezon', price: 36, category: 'pizza', ingredients: [{ name: 'sos roșii', isAllergen: false }, { name: 'mozzarella', isAllergen: true }, { name: 'ardei', isAllergen: false }, { name: 'ciuperci', isAllergen: false }, { name: 'măsline', isAllergen: false }], preparationTime: 22 },
  
  // Burgeri (4 produse)
  { name: 'Burger Classic', description: 'Carne de vită, salată, roșii, ceapă, sos special', price: 28, category: 'burger', ingredients: [{ name: 'carne vită', isAllergen: false }, { name: 'salată', isAllergen: false }, { name: 'roșii', isAllergen: false }, { name: 'ceapă', isAllergen: false }, { name: 'gluten', isAllergen: true }], preparationTime: 15 },
  { name: 'Cheeseburger', description: 'Carne de vită, cheddar, murături, sos special', price: 32, category: 'burger', ingredients: [{ name: 'carne vită', isAllergen: false }, { name: 'cheddar', isAllergen: true }, { name: 'murături', isAllergen: false }, { name: 'gluten', isAllergen: true }], preparationTime: 15 },
  { name: 'Bacon Burger', description: 'Carne de vită, bacon crocant, cheddar, BBQ', price: 36, category: 'burger', ingredients: [{ name: 'carne vită', isAllergen: false }, { name: 'bacon', isAllergen: false }, { name: 'cheddar', isAllergen: true }, { name: 'gluten', isAllergen: true }], preparationTime: 18 },
  { name: 'Veggie Burger', description: 'Burger vegetarian, avocado, hummus, legume', price: 30, category: 'burger', ingredients: [{ name: 'burger vegetal', isAllergen: true }, { name: 'avocado', isAllergen: false }, { name: 'hummus', isAllergen: true }, { name: 'gluten', isAllergen: true }], preparationTime: 15 },
  
  // Paste (4 produse)
  { name: 'Paste Carbonara', description: 'Spaghetti, ou, pancetta, parmesan, piper', price: 35, category: 'paste', ingredients: [{ name: 'spaghetti', isAllergen: true }, { name: 'ou', isAllergen: true }, { name: 'pancetta', isAllergen: false }, { name: 'parmesan', isAllergen: true }], preparationTime: 20 },
  { name: 'Paste Bolognese', description: 'Tagliatelle, sos de carne, parmesan', price: 34, category: 'paste', ingredients: [{ name: 'tagliatelle', isAllergen: true }, { name: 'carne tocată', isAllergen: false }, { name: 'roșii', isAllergen: false }, { name: 'parmesan', isAllergen: true }], preparationTime: 25 },
  { name: 'Paste Alfredo', description: 'Fettuccine, sos cremos, parmesan, pui', price: 38, category: 'paste', ingredients: [{ name: 'fettuccine', isAllergen: true }, { name: 'smântână', isAllergen: true }, { name: 'parmesan', isAllergen: true }, { name: 'pui', isAllergen: false }], preparationTime: 22 },
  { name: 'Paste Primavera', description: 'Penne, legume de sezon, ulei de măsline', price: 32, category: 'paste', ingredients: [{ name: 'penne', isAllergen: true }, { name: 'legume', isAllergen: false }, { name: 'ulei măsline', isAllergen: false }], preparationTime: 18 },
  
  // Salate (3 produse)
  { name: 'Salată Caesar', description: 'Salată romană, pui la grătar, parmesan, crutoane', price: 28, category: 'salate', ingredients: [{ name: 'salată romană', isAllergen: false }, { name: 'pui', isAllergen: false }, { name: 'parmesan', isAllergen: true }, { name: 'crutoane', isAllergen: true }], preparationTime: 12 },
  { name: 'Salată Grecească', description: 'Roșii, castraveți, măsline, brânză feta', price: 26, category: 'salate', ingredients: [{ name: 'roșii', isAllergen: false }, { name: 'castraveți', isAllergen: false }, { name: 'măsline', isAllergen: false }, { name: 'feta', isAllergen: true }], preparationTime: 10 },
  { name: 'Salată Nicoise', description: 'Ton, ou fiert, fasole verde, cartofi, măsline', price: 32, category: 'salate', ingredients: [{ name: 'ton', isAllergen: true }, { name: 'ou', isAllergen: true }, { name: 'fasole verde', isAllergen: false }, { name: 'cartofi', isAllergen: false }], preparationTime: 15 },
  
  // Deserturi (4 produse)
  { name: 'Tiramisu', description: 'Desert italian cu mascarpone și cafea', price: 22, category: 'desert', ingredients: [{ name: 'mascarpone', isAllergen: true }, { name: 'cafea', isAllergen: false }, { name: 'pișcoturi', isAllergen: true }], preparationTime: 5 },
  { name: 'Cheesecake', description: 'Cu fructe de pădure și blat crocant', price: 24, category: 'desert', ingredients: [{ name: 'brânză cremă', isAllergen: true }, { name: 'fructe pădure', isAllergen: false }, { name: 'blat', isAllergen: true }], preparationTime: 5 },
  { name: 'Panna Cotta', description: 'Cu sos de fructe de pădure', price: 20, category: 'desert', ingredients: [{ name: 'smântână', isAllergen: true }, { name: 'gelatină', isAllergen: false }, { name: 'fructe', isAllergen: false }], preparationTime: 5 },
  { name: 'Brownie cu Înghețată', description: 'Brownie cald cu înghețată de vanilie', price: 26, category: 'desert', ingredients: [{ name: 'ciocolată', isAllergen: true }, { name: 'ou', isAllergen: true }, { name: 'înghețată', isAllergen: true }], preparationTime: 8 },
  
  // Băuturi (5 produse)
  { name: 'Limonadă', description: 'Limonadă proaspătă cu mentă și ghețar', price: 12, category: 'bauturi', ingredients: [{ name: 'lămâie', isAllergen: false }, { name: 'mentă', isAllergen: false }], preparationTime: 3 },
  { name: 'Ice Tea', description: 'Ceai rece cu piersici', price: 10, category: 'bauturi', ingredients: [{ name: 'ceai', isAllergen: false }, { name: 'piersici', isAllergen: false }], preparationTime: 2 },
  { name: 'Smoothie Tropical', description: 'Mango, ananas, banană, lapte de cocos', price: 18, category: 'bauturi', ingredients: [{ name: 'mango', isAllergen: false }, { name: 'ananas', isAllergen: false }, { name: 'banană', isAllergen: false }, { name: 'lapte cocos', isAllergen: false }], preparationTime: 5 },
  { name: 'Cafea Espresso', description: 'Espresso dublu din boabe proaspăt prăjite', price: 8, category: 'bauturi', ingredients: [{ name: 'cafea', isAllergen: false }], preparationTime: 2 },
  { name: 'Apă Minerală', description: 'Apă minerală naturală 500ml', price: 6, category: 'bauturi', ingredients: [], preparationTime: 1 },
];

// Utilizatori test
const users = [
  { email: 'admin@foodorder.com', password: 'admin123secure', name: 'Admin FoodOrder', phone: '0721000001', roles: ['admin'] },
  { email: 'moderator@test.com', password: 'test123456', name: 'Moderator Test', phone: '0721000002', roles: ['moderator'] },
  { email: 'client1@test.com', password: 'test123456', name: 'Ion Popescu', phone: '0721000003', address: 'Str. Libertății nr. 10', city: 'București', roles: ['user'] },
  { email: 'client2@test.com', password: 'test123456', name: 'Maria Ionescu', phone: '0721000004', address: 'Bd. Unirii nr. 25', city: 'Cluj-Napoca', roles: ['user'] },
  { email: 'blocked@test.com', password: 'test123456', name: 'Utilizator Blocat', phone: '0721000005', roles: ['user'], blocked: true },
];

// Status comenzi posibile
const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const;

async function seedComplete() {
  console.log('🚀 Pornire seed complet...\n');
  
  try {
    // 1. Curățare date existente
    console.log('🧹 Curățare date existente...');
    await query('SET FOREIGN_KEY_CHECKS = 0');
    await query('TRUNCATE TABLE order_items');
    await query('TRUNCATE TABLE order_status_history');
    await query('TRUNCATE TABLE orders');
    await query('TRUNCATE TABLE product_ingredients');
    await query('TRUNCATE TABLE products');
    await query('TRUNCATE TABLE categories');
    await query('TRUNCATE TABLE delivery_addresses');
    await query('TRUNCATE TABLE user_roles');
    await query('TRUNCATE TABLE refresh_tokens');
    await query('TRUNCATE TABLE users');
    await query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   ✅ Date curățate\n');

    // 2. Inserare categorii
    console.log('📁 Inserare categorii...');
    const categoryIds: Record<string, string> = {};
    
    for (const cat of categories) {
      const id = uuidv4();
      categoryIds[cat.name] = id;
      await query(
        `INSERT INTO categories (id, name, display_name, icon, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [id, cat.name, cat.displayName, cat.icon, cat.sortOrder]
      );
      console.log(`   📂 ${cat.icon} ${cat.displayName}`);
    }
    console.log('   ✅ Categorii inserate\n');

    // 3. Inserare produse
    console.log('🍕 Inserare produse...');
    const productIds: string[] = [];
    const productPrices: Record<string, number> = {};
    
    for (const prod of products) {
      const id = uuidv4();
      productIds.push(id);
      productPrices[id] = prod.price;
      
      await query(
        `INSERT INTO products (id, name, description, price, category_id, preparation_time, is_available) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, prod.name, prod.description, prod.price, categoryIds[prod.category], prod.preparationTime, true]
      );
      
      // Inserare ingrediente
      for (const ing of prod.ingredients) {
        await query(
          `INSERT INTO product_ingredients (product_id, name, is_allergen) VALUES (?, ?, ?)`,
          [id, ing.name, ing.isAllergen]
        );
      }
    }
    console.log(`   ✅ ${products.length} produse inserate\n`);

    // 4. Inserare utilizatori
    console.log('👥 Inserare utilizatori...');
    const userIds: Record<string, string> = {};
    
    for (const user of users) {
      const id = uuidv4();
      userIds[user.email] = id;
      
      const passwordHash = await hashPassword(user.password);
      
      await query(
        `INSERT INTO users (id, email, password_hash, name, phone, is_blocked) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, user.email, passwordHash, user.name, user.phone, user.blocked || false]
      );
      
      // Inserare roluri
      for (const role of user.roles) {
        await query(
          `INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)`,
          [uuidv4(), id, role]
        );
      }
      
      // Adresă salvată pentru clienți
      if (user.address && user.city) {
        await query(
          `INSERT INTO delivery_addresses (id, user_id, label, address, city, phone, is_default) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), id, 'Acasă', user.address, user.city, user.phone, true]
        );
      }
      
      const roleStr = user.roles.join(', ');
      const blockedStr = user.blocked ? ' [BLOCAT]' : '';
      console.log(`   👤 ${user.email} (${roleStr})${blockedStr}`);
    }
    console.log('   ✅ Utilizatori inserați\n');

    // 5. Inserare comenzi pentru clienți
    console.log('📦 Inserare comenzi test...');
    
    // Comenzi pentru client1 (5 comenzi cu diferite statusuri)
    const client1Orders = [
      { status: 'delivered', daysAgo: 7, items: [{ idx: 0, qty: 2 }, { idx: 6, qty: 1 }] },
      { status: 'delivered', daysAgo: 5, items: [{ idx: 2, qty: 1 }, { idx: 20, qty: 2 }] },
      { status: 'ready', daysAgo: 0, items: [{ idx: 4, qty: 1 }, { idx: 10, qty: 1 }, { idx: 22, qty: 1 }] },
      { status: 'preparing', daysAgo: 0, items: [{ idx: 8, qty: 2 }] },
      { status: 'cancelled', daysAgo: 3, items: [{ idx: 1, qty: 1 }], cancelReason: 'Anulată de client' },
    ];
    
    for (const order of client1Orders) {
      await createOrder(
        userIds['client1@test.com'],
        order.items.map(i => ({ productId: productIds[i.idx], quantity: i.qty, price: productPrices[productIds[i.idx]] })),
        order.status,
        order.daysAgo,
        'Str. Libertății nr. 10',
        'București',
        '0721000003',
        order.cancelReason
      );
    }
    console.log(`   📦 5 comenzi pentru client1@test.com`);
    
    // Comenzi pentru client2 (3 comenzi)
    const client2Orders = [
      { status: 'delivered', daysAgo: 10, items: [{ idx: 12, qty: 1 }, { idx: 16, qty: 1 }, { idx: 21, qty: 2 }] },
      { status: 'confirmed', daysAgo: 0, items: [{ idx: 3, qty: 2 }, { idx: 7, qty: 1 }] },
      { status: 'pending', daysAgo: 0, items: [{ idx: 5, qty: 1 }] },
    ];
    
    for (const order of client2Orders) {
      await createOrder(
        userIds['client2@test.com'],
        order.items.map(i => ({ productId: productIds[i.idx], quantity: i.qty, price: productPrices[productIds[i.idx]] })),
        order.status,
        order.daysAgo,
        'Bd. Unirii nr. 25',
        'Cluj-Napoca',
        '0721000004'
      );
    }
    console.log(`   📦 3 comenzi pentru client2@test.com`);
    console.log('   ✅ Comenzi inserate\n');

    // Sumă
    console.log('═'.repeat(50));
    console.log('✅ SEED COMPLET FINALIZAT!');
    console.log('═'.repeat(50));
    console.log('\nDate create:');
    console.log(`   📁 ${categories.length} categorii`);
    console.log(`   🍕 ${products.length} produse`);
    console.log(`   👥 ${users.length} utilizatori`);
    console.log(`   📦 8 comenzi\n`);
    console.log('Credențiale test:');
    console.log('   Admin:     admin@foodorder.com / admin123secure');
    console.log('   Moderator: moderator@test.com / test123456');
    console.log('   Client1:   client1@test.com / test123456');
    console.log('   Client2:   client2@test.com / test123456');
    console.log('   Blocat:    blocked@test.com / test123456\n');

  } catch (error) {
    console.error('❌ Eroare seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createOrder(
  userId: string,
  items: { productId: string; quantity: number; price: number }[],
  status: string,
  daysAgo: number,
  address: string,
  city: string,
  phone: string,
  cancelReason?: string
) {
  const orderId = uuidv4();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= 75 ? 0 : 10;
  const total = subtotal + deliveryFee;
  
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  
  await query(
    `INSERT INTO orders (id, user_id, status, subtotal, delivery_fee, total, delivery_address, delivery_city, phone, payment_method, cancellation_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orderId, userId, status, subtotal, deliveryFee, total, address, city, phone, 'cash', cancelReason || null, createdAt]
  );
  
  // Inserare items
  for (const item of items) {
    await query(
      `INSERT INTO order_items (id, order_id, product_id, quantity, price_at_order) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), orderId, item.productId, item.quantity, item.price]
    );
  }
  
  // Inserare istoric status
  const statusHistory = getStatusHistory(status, createdAt);
  for (const hist of statusHistory) {
    await query(
      `INSERT INTO order_status_history (id, order_id, status, changed_at, note) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), orderId, hist.status, hist.changedAt, hist.note]
    );
  }
}

function getStatusHistory(finalStatus: string, createdAt: Date): { status: string; changedAt: Date; note: string }[] {
  const history: { status: string; changedAt: Date; note: string }[] = [];
  const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
  
  const finalIdx = statusOrder.indexOf(finalStatus);
  
  if (finalStatus === 'cancelled') {
    // Comanda anulată
    history.push({ status: 'pending', changedAt: new Date(createdAt), note: 'Comandă plasată' });
    const cancelledAt = new Date(createdAt);
    cancelledAt.setMinutes(cancelledAt.getMinutes() + 5);
    history.push({ status: 'cancelled', changedAt: cancelledAt, note: 'Anulată de client' });
  } else {
    // Parcurge statusurile în ordine
    for (let i = 0; i <= finalIdx; i++) {
      const statusTime = new Date(createdAt);
      statusTime.setMinutes(statusTime.getMinutes() + i * 15);
      
      const notes: Record<string, string> = {
        pending: 'Comandă plasată',
        confirmed: 'Comandă confirmată',
        preparing: 'Se prepară',
        ready: 'Gata de livrare',
        delivered: 'Comandă livrată',
      };
      
      history.push({ status: statusOrder[i], changedAt: statusTime, note: notes[statusOrder[i]] });
    }
  }
  
  return history;
}

seedComplete();
