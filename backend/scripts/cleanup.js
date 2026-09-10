require('dotenv').config();
const { db } = require('../src/config/database');

async function cleanup() {
  console.log('🧹 Final cleanup...\n');

  // Kill test pizza
  await db.execute({ sql: 'UPDATE menu_items SET available = 0 WHERE id = 1', args: [] });
  console.log('✓ Test Pizza disabled');

  // Remove remaining duplicates (same name, keep highest id)
  const dups = await db.execute(
    'SELECT LOWER(TRIM(name)) as n, MAX(id) as max_id FROM menu_items WHERE available = 1 GROUP BY n HAVING COUNT(*) > 1'
  );
  for (const dup of dups.rows) {
    await db.execute({
      sql: 'UPDATE menu_items SET available = 0 WHERE LOWER(TRIM(name)) = ? AND id != ? AND available = 1',
      args: [dup.n, dup.max_id]
    });
    console.log('✓ Duplicate disabled:', dup.n, 'keeping id:', dup.max_id);
  }

  // Set images for items without one
  const imageMap = {
    'Acompañamientos': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    'Ensaladas': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    'Hamburguesas': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    'Pastas': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
  };

  for (const [cat, url] of Object.entries(imageMap)) {
    const r = await db.execute({
      sql: "UPDATE menu_items SET image_url = ? WHERE category = ? AND available = 1 AND (image_url IS NULL OR image_url = '')",
      args: [url, cat]
    });
    if (r.rowsAffected > 0) {
      console.log(`✓ ${r.rowsAffected} image(s) set for ${cat}`);
    }
  }

  // Summary
  const total = await db.execute('SELECT COUNT(*) as cnt FROM menu_items WHERE available = 1');
  const cats = await db.execute('SELECT category, COUNT(*) as c FROM menu_items WHERE available = 1 GROUP BY category ORDER BY category');

  console.log(`\n📊 ${total.rows[0].cnt} active menu items:`);
  for (const row of cats.rows) {
    console.log(`  ${row.category}: ${row.c} items`);
  }

  process.exit(0);
}

cleanup();
