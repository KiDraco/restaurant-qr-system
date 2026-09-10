require('dotenv').config();
const { db } = require('../src/config/database');

async function dedup() {
  console.log('🧹 Limpiando duplicados del menú...\n');

  try {
    // Get all items grouped by normalized name
    const result = await db.execute('SELECT id, name, category, image_url, price, available FROM menu_items ORDER BY name, id');
    const rows = result.rows;

    const groups = {};
    for (const row of rows) {
      const key = row.name.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    let kept = 0;
    let removed = 0;

    for (const [key, items] of Object.entries(groups)) {
      if (items.length <= 1) {
        kept++;
        continue;
      }

      // Sort by id ascending - keep the LAST one (highest id = most recent)
      items.sort((a, b) => a.id - b.id);
      const keep = items.pop(); // Keep the latest

      // Mark all others as unavailable
      for (const dup of items) {
        await db.execute({
          sql: 'UPDATE menu_items SET available = 0 WHERE id = ?',
          args: [dup.id]
        });
        removed++;
        console.log(`  ✗ ${dup.name} (id:${dup.id}) → desactivado, se queda id:${keep.id}`);
      }
      kept++;
    }

    console.log(`\n✅ ${kept} items únicos preservados, ${removed} duplicados desactivados`);

    // Now rename items to have consistent names
    const renames = {
      'pizza margarita': 'Pizza Margherita',
      'coca-cola': 'Coca Cola',
    };

    for (const [oldName, newName] of Object.entries(renames)) {
      const affected = await db.execute({
        sql: 'UPDATE menu_items SET name = ? WHERE LOWER(name) = ? AND available = 1',
        args: [newName, oldName]
      });
      if (affected.rowsAffected > 0) {
        console.log(`  ✓ Renombrado "${oldName}" → "${newName}"`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dedup();
