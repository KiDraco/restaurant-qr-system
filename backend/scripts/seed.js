require('dotenv').config();
const { db, initializeDatabase } = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  try {
    await initializeDatabase();

    // 1. Generar mesas
    console.log('📋 Generando 10 mesas...');
    for (let i = 1; i <= 10; i++) {
      const qrCode = uuidv4();
      try {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO tables (table_number, qr_code) VALUES (?, ?)',
          args: [i, qrCode]
        });
        console.log(`✓ Mesa ${i} creada con QR: ${qrCode}`);
      } catch (err) {
        console.error(`Error en mesa ${i}:`, err);
      }
    }

    // 2. Agregar productos al menú
    console.log('\n🍕 Agregando productos al menú...');

    const menuItems = [
      // Pizzas
      { name: 'Pizza Margherita', description: 'Muzzarella, tomate y albahaca', price: 8500, category: 'Pizzas', image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Pizza Napolitana', description: 'Muzzarella, tomate, ajo y orégano', price: 9000, category: 'Pizzas', image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
      { name: 'Pizza Calabresa', description: 'Muzzarella, longaniza calabresa', price: 9500, category: 'Pizzas', image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { name: 'Pizza Fugazzeta', description: 'Muzzarella, cebolla y orégano', price: 8800, category: 'Pizzas', image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
      // Empanadas
      { name: 'Empanada de Carne', description: 'Carne cortada a cuchillo', price: 800, category: 'Empanadas', image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop' },
      { name: 'Empanada de Jamón y Queso', description: 'Jamón cocido y queso', price: 750, category: 'Empanadas', image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop' },
      { name: 'Empanada de Pollo', description: 'Pollo y verduras', price: 800, category: 'Empanadas', image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop' },
      // Bebidas
      { name: 'Coca Cola', description: '500ml', price: 1500, category: 'Bebidas', image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop' },
      { name: 'Coca Cola Zero', description: '500ml', price: 1500, category: 'Bebidas', image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop' },
      { name: 'Sprite', description: '500ml', price: 1500, category: 'Bebidas', image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop' },
      { name: 'Agua Mineral', description: '500ml', price: 1000, category: 'Bebidas', image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop' },
      { name: 'Cerveza Quilmes', description: '1L', price: 2500, category: 'Bebidas', image_url: 'https://images.unsplash.com/photo-1518099074174-324611f0e82c?w=400&h=300&fit=crop' },
      // Postres
      { name: 'Flan Casero', description: 'Con dulce de leche y crema', price: 2500, category: 'Postres', image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop' },
      { name: 'Helado', description: '2 bochas a elección', price: 2000, category: 'Postres', image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop' },
      { name: 'Tiramisu', description: 'Postre italiano', price: 3000, category: 'Postres', image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' }
    ];

    for (const item of menuItems) {
      try {
        await db.execute({
          sql: 'INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
          args: [item.name, item.description, item.price, item.category, item.image_url]
        });
        console.log(`✓ ${item.name} - ${item.category} - $${item.price}`);
      } catch (err) {
        console.error(`Error agregando ${item.name}:`, err);
      }
    }

    // 3. Crear sesiones de ejemplo
    console.log('\n👥 Creando sesiones de ejemplo...');

    // Sesión mesa 1
    try {
      const session1 = await db.execute({
        sql: 'INSERT INTO table_sessions (table_number, total_amount) VALUES (?, ?)',
        args: [1, 15000]
      });
      const sessionId = session1.lastInsertRowid;
      console.log('✓ Sesión mesa 1 creada');

      await db.execute({
        sql: 'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        args: [sessionId, 1, 1, 1, 8500, 8500]
      });
      await db.execute({
        sql: 'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        args: [sessionId, 1, 8, 2, 1500, 3000]
      });
      await db.execute({
        sql: 'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        args: [sessionId, 1, 13, 1, 2500, 2500]
      });
    } catch (err) {
      console.error('Error creando sesión mesa 1:', err);
    }

    // Sesión mesa 3
    try {
      const session2 = await db.execute({
        sql: 'INSERT INTO table_sessions (table_number, total_amount) VALUES (?, ?)',
        args: [3, 22000]
      });
      const sessionId = session2.lastInsertRowid;
      console.log('✓ Sesión mesa 3 creada');

      await db.execute({
        sql: 'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        args: [sessionId, 3, 3, 2, 9500, 19000]
      });
      await db.execute({
        sql: 'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        args: [sessionId, 3, 9, 2, 1500, 3000]
      });
    } catch (err) {
      console.error('Error creando sesión mesa 3:', err);
    }

    // 4. Crear solicitudes de ejemplo
    console.log('\n🔔 Creando solicitudes de ejemplo...');

    try {
      await db.execute({
        sql: 'INSERT INTO requests (table_number, request_type) VALUES (?, ?)',
        args: [5, 'call_waiter']
      });
      console.log('✓ Solicitud: Mesa 5 - Llamar mesero');
    } catch (err) {
      console.error('Error:', err);
    }

    try {
      await db.execute({
        sql: 'INSERT INTO requests (table_number, request_type) VALUES (?, ?)',
        args: [7, 'request_bill']
      });
      console.log('✓ Solicitud: Mesa 7 - Pedir cuenta');
    } catch (err) {
      console.error('Error:', err);
    }

    // 5. Promociones de ejemplo
    console.log('\n🏷️ Creando promociones de ejemplo...');

    const promotions = [
      { name: 'Happy Hour', description: '15% de descuento en todas las bebidas', discount_percentage: 15, active: 1 },
      { name: '2x1 Empanadas', description: 'Llevá 2 empanadas al precio de 1 (Martes)', discount_percentage: 50, active: 1 },
      { name: 'Combo Familiar', description: '10% de descuento en pizzas grandes', discount_percentage: 10, active: 1 },
    ];

    for (const promo of promotions) {
      try {
        await db.execute({
          sql: 'INSERT INTO promotions (name, description, discount_percentage, active) VALUES (?, ?, ?, ?)',
          args: [promo.name, promo.description, promo.discount_percentage, promo.active]
        });
        console.log(`✓ Promoción: ${promo.name} (${promo.discount_percentage}% off)`);
      } catch (err) {
        console.error(`Error creando promoción ${promo.name}:`, err);
      }
    }

    console.log('\n✅ Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('- 10 mesas generadas');
    console.log('- 15 productos en el menú');
    console.log('- 2 sesiones activas (mesas 1 y 3)');
    console.log('- 2 solicitudes pendientes (mesas 5 y 7)');
    console.log('- 3 promociones de ejemplo');
    console.log('\n🚀 Puedes iniciar el servidor ahora: npm start\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
