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
      { name: 'Pizza Margherita', description: 'Muzzarella, tomate y albahaca', price: 8500, category: 'Pizzas' },
      { name: 'Pizza Napolitana', description: 'Muzzarella, tomate, ajo y orégano', price: 9000, category: 'Pizzas' },
      { name: 'Pizza Calabresa', description: 'Muzzarella, longaniza calabresa', price: 9500, category: 'Pizzas' },
      { name: 'Pizza Fugazzeta', description: 'Muzzarella, cebolla y orégano', price: 8800, category: 'Pizzas' },
      // Empanadas
      { name: 'Empanada de Carne', description: 'Carne cortada a cuchillo', price: 800, category: 'Empanadas' },
      { name: 'Empanada de Jamón y Queso', description: 'Jamón cocido y queso', price: 750, category: 'Empanadas' },
      { name: 'Empanada de Pollo', description: 'Pollo y verduras', price: 800, category: 'Empanadas' },
      // Bebidas
      { name: 'Coca Cola', description: '500ml', price: 1500, category: 'Bebidas' },
      { name: 'Coca Cola Zero', description: '500ml', price: 1500, category: 'Bebidas' },
      { name: 'Sprite', description: '500ml', price: 1500, category: 'Bebidas' },
      { name: 'Agua Mineral', description: '500ml', price: 1000, category: 'Bebidas' },
      { name: 'Cerveza Quilmes', description: '1L', price: 2500, category: 'Bebidas' },
      // Postres
      { name: 'Flan Casero', description: 'Con dulce de leche y crema', price: 2500, category: 'Postres' },
      { name: 'Helado', description: '2 bochas a elección', price: 2000, category: 'Postres' },
      { name: 'Tiramisu', description: 'Postre italiano', price: 3000, category: 'Postres' }
    ];

    for (const item of menuItems) {
      try {
        await db.execute({
          sql: 'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)',
          args: [item.name, item.description, item.price, item.category]
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

    console.log('\n✅ Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('- 10 mesas generadas');
    console.log('- 15 productos en el menú');
    console.log('- 2 sesiones activas (mesas 1 y 3)');
    console.log('- 2 solicitudes pendientes (mesas 5 y 7)');
    console.log('\n🚀 Puedes iniciar el servidor ahora: npm start\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
