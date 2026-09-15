/**
 * Migration script: Convert legacy single-page canvas_json to multi-page format
 * 
 * Run with: node backend/scripts/migrate-themes-multipage.js
 * Or add to database.js initializeDatabase()
 */

const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DB_URL || 'file:./restaurant.db',
  authToken: process.env.TURSO_DB_TOKEN,
});

// Helper to convert BigInt to Number
function convertBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertBigInt(value);
    }
    return result;
  }
  return obj;
}

// Default page configurations for each type
const DEFAULT_PAGES = [
  {
    id: 'scan',
    name: 'Login / QR',
    type: 'scan',
    icon: '📱',
    elements: [
      {
        id: crypto.randomUUID(),
        type: 'text',
        x: 50,
        y: 80,
        width: 275,
        height: 60,
        zIndex: 0,
        locked: false,
        visible: true,
        config: { content: 'Bienvenido', fontSize: 28, fontFamily: 'system-ui', color: '#2A2A2A', textAlign: 'center', fontWeight: 'bold' },
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        x: 50,
        y: 150,
        width: 275,
        height: 40,
        zIndex: 1,
        locked: false,
        visible: true,
        config: { content: 'Escanea el QR de tu mesa', fontSize: 16, fontFamily: 'system-ui', color: '#666666', textAlign: 'center' },
      },
      {
        id: crypto.randomUUID(),
        type: 'image',
        x: 100,
        y: 220,
        width: 175,
        height: 175,
        zIndex: 2,
        locked: false,
        visible: true,
        config: { src: '', alt: 'Código QR', borderRadius: 12 },
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        x: 50,
        y: 420,
        width: 275,
        height: 40,
        zIndex: 3,
        locked: false,
        visible: true,
        config: { content: 'O ingresa tu número de mesa:', fontSize: 14, fontFamily: 'system-ui', color: '#666666', textAlign: 'center' },
      },
      {
        id: crypto.randomUUID(),
        type: 'action-button',
        x: 50,
        y: 480,
        width: 275,
        height: 56,
        zIndex: 4,
        locked: false,
        visible: true,
        config: { action: 'scanAnother', label: 'Escanear mesa', icon: 'qrcode', variant: 'primary', size: 'lg', fullWidth: true },
      },
    ],
    config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFF8F0' }, grid: { enabled: true, size: 8 } },
  },
  {
    id: 'table',
    name: 'Mesa Principal',
    type: 'table',
    icon: '🍽️',
    elements: [
      {
        id: crypto.randomUUID(),
        type: 'table-number',
        x: 20,
        y: 30,
        width: 335,
        height: 60,
        zIndex: 0,
        locked: false,
        visible: true,
        config: { prefix: 'Mesa ', fontSize: 36, fontWeight: 'bold', color: '#2A2A2A', textAlign: 'center' },
      },
      {
        id: crypto.randomUUID(),
        type: 'total-amount',
        x: 20,
        y: 100,
        width: 335,
        height: 50,
        zIndex: 1,
        locked: false,
        visible: true,
        config: { prefix: 'Total: ', fontSize: 24, fontWeight: 'bold', color: '#FF6B6B', textAlign: 'center' },
      },
      {
        id: crypto.randomUUID(),
        type: 'action-button',
        x: 20,
        y: 170,
        width: 335,
        height: 56,
        zIndex: 2,
        locked: false,
        visible: true,
        config: { action: 'viewMenu', label: 'Ver Menú', icon: 'utensils', variant: 'primary', size: 'lg', fullWidth: true },
      },
      {
        id: crypto.randomUUID(),
        type: 'action-button',
        x: 20,
        y: 240,
        width: 335,
        height: 56,
        zIndex: 3,
        locked: false,
        visible: true,
        config: { action: 'callWaiter', label: 'Llamar Mesero', icon: 'bell', variant: 'secondary', size: 'lg', fullWidth: true },
      },
      {
        id: crypto.randomUUID(),
        type: 'action-button',
        x: 20,
        y: 310,
        width: 335,
        height: 56,
        zIndex: 4,
        locked: false,
        visible: true,
        config: { action: 'viewBill', label: 'Ver Cuenta', icon: 'receipt', variant: 'outline', size: 'lg', fullWidth: true },
      },
      {
        id: crypto.randomUUID(),
        type: 'action-button',
        x: 20,
        y: 380,
        width: 335,
        height: 56,
        zIndex: 5,
        locked: false,
        visible: true,
        config: { action: 'requestBill', label: 'Pedir Cuenta', icon: 'dollar-sign', variant: 'primary', size: 'lg', fullWidth: true },
      },
      {
        id: crypto.randomUUID(),
        type: 'action-button',
        x: 20,
        y: 450,
        width: 335,
        height: 56,
        zIndex: 6,
        locked: false,
        visible: true,
        config: { action: 'scanAnother', label: 'Escanear otra mesa', icon: 'chevron-left', variant: 'ghost', size: 'md', fullWidth: true },
      },
    ],
    config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } },
  },
  {
    id: 'menu',
    name: 'Menú',
    type: 'menu',
    icon: '📖',
    elements: [
      {
        id: crypto.randomUUID(),
        type: 'category-tabs',
        x: 10,
        y: 10,
        width: 355,
        height: 50,
        zIndex: 0,
        locked: false,
        visible: true,
        config: {},
      },
      {
        id: crypto.randomUUID(),
        type: 'search-bar',
        x: 10,
        y: 70,
        width: 355,
        height: 48,
        zIndex: 1,
        locked: false,
        visible: true,
        config: { placeholder: 'Buscar platos...' },
      },
      {
        id: crypto.randomUUID(),
        type: 'menu-list',
        x: 10,
        y: 130,
        width: 355,
        height: 450,
        zIndex: 2,
        locked: false,
        visible: true,
        config: { layout: 'list', showCategoryTitle: true, showProductImage: true, showProductDescription: true, showPrice: true },
      },
      {
        id: crypto.randomUUID(),
        type: 'cart-summary',
        x: 10,
        y: 590,
        width: 355,
        height: 60,
        zIndex: 3,
        locked: false,
        visible: true,
        config: { showItemCount: true, showTotal: true },
      },
    ],
    config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } },
  },
  {
    id: 'bill',
    name: 'Cuenta',
    type: 'bill',
    icon: '🧾',
    elements: [
      {
        id: crypto.randomUUID(),
        type: 'text',
        x: 20,
        y: 30,
        width: 335,
        height: 40,
        zIndex: 0,
        locked: false,
        visible: true,
        config: { content: 'Cuenta Detallada', fontSize: 24, fontWeight: 'bold', color: '#2A2A2A', textAlign: 'center' },
      },
      {
        id: crypto.randomUUID(),
        type: 'table-number',
        x: 20,
        y: 80,
        width: 335,
        height: 40,
        zIndex: 1,
        locked: false,
        visible: true,
        config: { prefix: 'Mesa ', fontSize: 20, textAlign: 'center' },
      },
      {
        id: crypto.randomUUID(),
        type: 'bill-items',
        x: 10,
        y: 130,
        width: 355,
        height: 350,
        zIndex: 2,
        locked: false,
        visible: true,
        config: { showQuantity: true, showUnitPrice: true, showSubtotal: true },
      },
      {
        id: crypto.randomUUID(),
        type: 'total-amount',
        x: 20,
        y: 500,
        width: 335,
        height: 60,
        zIndex: 3,
        locked: false,
        visible: true,
        config: { prefix: 'Total a pagar: ', fontSize: 28, fontWeight: 'bold', color: '#FF6B6B', textAlign: 'center' },
      },
      {
        id: crypto.randomUUID(),
        type: 'action-button',
        x: 20,
        y: 580,
        width: 335,
        height: 56,
        zIndex: 4,
        locked: false,
        visible: true,
        config: { action: 'requestBill', label: 'Solicitar Cuenta para Pagar', icon: 'dollar-sign', variant: 'primary', size: 'lg', fullWidth: true },
      },
      {
        id: crypto.randomUUID(),
        type: 'action-button',
        x: 20,
        y: 650,
        width: 335,
        height: 56,
        zIndex: 5,
        locked: false,
        visible: true,
        config: { action: 'viewMenu', label: 'Volver al Menú', icon: 'utensils', variant: 'secondary', size: 'lg', fullWidth: true },
      },
    ],
    config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FAFAFA' }, grid: { enabled: true, size: 8 } },
  },
];

async function migrateThemes() {
  try {
    console.log('🔄 Iniciando migración de themes a multi-page...');
    
    // Get all themes
    const result = await client.execute('SELECT * FROM themes');
    const themes = convertBigInt(result.rows);
    
    console.log(`📋 Encontrados ${themes.length} themes para migrar`);
    
    for (const theme of themes) {
      // Skip if already has multi-page format
      if (theme.canvas_json) {
        try {
          const canvas = typeof theme.canvas_json === 'string' ? JSON.parse(theme.canvas_json) : theme.canvas_json;
          if (canvas.pages && Array.isArray(canvas.pages)) {
            console.log(`  ⏭️  "${theme.name}" ya tiene formato multi-page`);
            continue;
          }
        } catch (e) {
          // Invalid JSON, will migrate
        }
      }
      
      console.log(`  🔧 Migrando "${theme.name}"...`);
      
      // Build globalConfig from legacy config
      const legacyConfig = theme.config ? (typeof theme.config === 'string' ? JSON.parse(theme.config) : theme.config) : {};
      const globalConfig = {
        colors: legacyConfig.colors || { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' },
        font_family: legacyConfig.font_family || 'system-ui',
        background_config: legacyConfig.background_type && legacyConfig.background_value
          ? { type: legacyConfig.background_type, value: legacyConfig.background_value }
          : { type: 'color', value: legacyConfig.background_value || '#FFFFFF' },
      };
      
      // Use legacy canvas elements as base for 'menu' page, others get defaults
      let legacyElements = [];
      if (theme.canvas_json) {
        try {
          const canvas = typeof theme.canvas_json === 'string' ? JSON.parse(theme.canvas_json) : theme.canvas_json;
          if (canvas.elements && Array.isArray(canvas.elements)) {
            legacyElements = canvas.elements.map(el => ({
              ...el,
              id: el.id || crypto.randomUUID(),
              zIndex: el.zIndex ?? 0,
              locked: el.locked ?? false,
              visible: el.visible !== false,
            }));
          }
        } catch (e) {
          console.warn(`    ⚠️  Error parsing canvas_json for "${theme.name}":`, e.message);
        }
      }
      
      // Build pages array
      const pages = DEFAULT_PAGES.map(page => {
        // For menu page, merge legacy elements if they exist
        if (page.type === 'menu' && legacyElements.length > 0) {
          return {
            ...page,
            elements: [...page.elements, ...legacyElements.map((el, i) => ({ ...el, zIndex: page.elements.length + i }))],
            config: { ...page.config, page_format: theme.page_format || 'mobile-portrait', background_config: theme.background_config ? JSON.parse(theme.background_config) : page.config.background_config },
          };
        }
        return {
          ...page,
          config: { ...page.config, page_format: theme.page_format || 'mobile-portrait', background_config: theme.background_config ? JSON.parse(theme.background_config) : page.config.background_config },
        };
      });
      
      const newCanvasJson = JSON.stringify({
        pages,
        globalConfig,
      });
      
      // Update theme
      await client.execute({
        sql: `UPDATE themes SET canvas_json = ?, config = ? WHERE id = ?`,
        args: [newCanvasJson, JSON.stringify(globalConfig), theme.id],
      });
      
      console.log(`    ✅ "${theme.name}" migrado (${pages.length} páginas)`);
    }
    
    console.log('✅ Migración completada');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.close();
  }
}

// Run if called directly
if (require.main === module) {
  migrateThemes().catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { migrateThemes };