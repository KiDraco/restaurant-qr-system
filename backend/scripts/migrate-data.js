require('dotenv').config();
const { db, initializeDatabase } = require('../src/config/database');

async function migrate() {
  console.log('🔄 Ejecutando migración de datos...\n');

  try {
    await initializeDatabase();

    // 1. Agregar image_url a items existentes según categoría
    console.log('📸 Actualizando imágenes del menú...');

    const imageByCategory = {
      'Pizzas': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
      'Empanadas': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop',
      'Bebidas': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
      'Postres': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop',
    };

    for (const [category, url] of Object.entries(imageByCategory)) {
      const result = await db.execute({
        sql: "UPDATE menu_items SET image_url = ? WHERE category = ? AND (image_url IS NULL OR image_url = '')",
        args: [url, category]
      });
      console.log(`  ✓ ${category}: ${result.rowsAffected} items actualizados`);
    }

    // 2. Crear promociones de ejemplo (si no existen)
    console.log('\n🏷️ Creando promociones de ejemplo...');

    const promotions = [
      { name: 'Happy Hour', description: '15% de descuento en todas las bebidas', discount_percentage: 15, active: 1 },
      { name: '2x1 Empanadas', description: 'Llevá 2 empanadas al precio de 1 (Martes)', discount_percentage: 50, active: 1 },
      { name: 'Combo Familiar', description: '10% de descuento en pizzas grandes', discount_percentage: 10, active: 1 },
    ];

    for (const promo of promotions) {
      try {
        // Check if promo name already exists
        const existing = await db.execute({
          sql: 'SELECT id FROM promotions WHERE name = ?',
          args: [promo.name]
        });

        if (existing.rows.length > 0) {
          console.log(`  - ${promo.name} ya existe, saltando...`);
          continue;
        }

        await db.execute({
          sql: 'INSERT INTO promotions (name, description, discount_percentage, active) VALUES (?, ?, ?, ?)',
          args: [promo.name, promo.description, promo.discount_percentage, promo.active]
        });
        console.log(`  ✓ ${promo.name} (${promo.discount_percentage}% off)`);
      } catch (err) {
        console.error(`  ⚠️ Error creando ${promo.name}:`, err.message);
      }
    }

    console.log('\n✅ Migración de datos completada!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrate();
