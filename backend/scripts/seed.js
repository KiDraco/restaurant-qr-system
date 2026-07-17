require('dotenv').config();
const { db, initializeDatabase } = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

console.log('🌱 Iniciando seed de base de datos...\n');

// Inicializar base de datos
initializeDatabase();

setTimeout(() => {
  db.serialize(async () => {
    try {
      // 1. Generar mesas
      console.log('📋 Generando 10 mesas...');
      for (let i = 1; i <= 10; i++) {
        const qrCode = uuidv4();
        db.run(
          'INSERT OR IGNORE INTO tables (table_number, qr_code) VALUES (?, ?)',
          [i, qrCode],
          (err) => {
            if (err) console.error(`Error en mesa ${i}:`, err);
            else console.log(`✓ Mesa ${i} creada con QR: ${qrCode}`);
          }
        );
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

      menuItems.forEach((item, index) => {
        setTimeout(() => {
          db.run(
            'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)',
            [item.name, item.description, item.price, item.category],
            function(err) {
              if (err) console.error(`Error agregando ${item.name}:`, err);
              else console.log(`✓ ${item.name} - ${item.category} - $${item.price}`);
            }
          );
        }, index * 100);
      });

      // 3. Crear algunas sesiones de ejemplo
      console.log('\n👥 Creando sesiones de ejemplo...');
      
      setTimeout(() => {
        // Sesión mesa 1
        db.run(
          'INSERT INTO table_sessions (table_number, total_amount) VALUES (?, ?)',
          [1, 15000],
          function(err) {
            if (err) console.error('Error creando sesión mesa 1:', err);
            else {
              console.log('✓ Sesión mesa 1 creada');
              const sessionId = this.lastID;
              
              // Agregar órdenes a la sesión
              db.run(
                'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
                [sessionId, 1, 1, 1, 8500, 8500]
              );
              db.run(
                'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
                [sessionId, 1, 8, 2, 1500, 3000]
              );
              db.run(
                'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
                [sessionId, 1, 13, 1, 2500, 2500]
              );
            }
          }
        );

        // Sesión mesa 3
        db.run(
          'INSERT INTO table_sessions (table_number, total_amount) VALUES (?, ?)',
          [3, 22000],
          function(err) {
            if (err) console.error('Error creando sesión mesa 3:', err);
            else {
              console.log('✓ Sesión mesa 3 creada');
              const sessionId = this.lastID;
              
              db.run(
                'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
                [sessionId, 3, 3, 2, 9500, 19000]
              );
              db.run(
                'INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
                [sessionId, 3, 9, 2, 1500, 3000]
              );
            }
          }
        );

        // 4. Crear algunas solicitudes de ejemplo
        console.log('\n🔔 Creando solicitudes de ejemplo...');
        
        setTimeout(() => {
          db.run(
            'INSERT INTO requests (table_number, request_type) VALUES (?, ?)',
            [5, 'call_waiter'],
            (err) => {
              if (err) console.error('Error:', err);
              else console.log('✓ Solicitud: Mesa 5 - Llamar mesero');
            }
          );
          
          db.run(
            'INSERT INTO requests (table_number, request_type) VALUES (?, ?)',
            [7, 'request_bill'],
            (err) => {
              if (err) console.error('Error:', err);
              else console.log('✓ Solicitud: Mesa 7 - Pedir cuenta');
            }
          );

          setTimeout(() => {
            console.log('\n✅ Seed completado exitosamente!');
            console.log('\n📊 Resumen:');
            console.log('- 10 mesas generadas');
            console.log('- 15 productos en el menú');
            console.log('- 2 sesiones activas (mesas 1 y 3)');
            console.log('- 2 solicitudes pendientes (mesas 5 y 7)');
            console.log('\n🚀 Puedes iniciar el servidor ahora: npm start\n');
            
            db.close();
            process.exit(0);
          }, 1000);
        }, 1000);
      }, 2000);

    } catch (error) {
      console.error('❌ Error en seed:', error);
      process.exit(1);
    }
  });
}, 1000);