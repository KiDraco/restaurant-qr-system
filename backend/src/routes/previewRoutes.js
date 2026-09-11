const express = require('express');
const router = express.Router();

// GET /api/preview?theme={base64Config}
// Renderiza una página HTML simple con el theme aplicado para el iframe preview
router.get('/', (req, res) => {
  const { theme } = req.query;
  let config = null;

  if (theme) {
    try {
      const decoded = Buffer.from(theme, 'base64').toString('utf-8');
      config = JSON.parse(decoded);
    } catch (e) {
      console.error('Invalid theme config base64:', e);
    }
  }

  // Valores por defecto si no hay theme
  if (!config) {
    config = {
      logo_url: null,
      colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' },
      font_family: 'system',
      background_type: 'color',
      background_value: '#FFFFFF'
    };
  }

  // Construir las CSS variables inline
  const vars = [];
  if (config.colors) {
    if (config.colors.primary) vars.push(`--theme-primary: ${config.colors.primary}`);
    if (config.colors.secondary) vars.push(`--theme-secondary: ${config.colors.secondary}`);
    if (config.colors.background) vars.push(`--theme-background: ${config.colors.background}`);
    if (config.colors.text) vars.push(`--theme-text: ${config.colors.text}`);
  }
  if (config.font_family) vars.push(`--theme-font: ${config.font_family}`);
  if (config.background_type === 'gradient' && config.background_value) vars.push(`--theme-gradient: ${config.background_value}`);
  if (config.background_type === 'image' && config.background_value) vars.push(`--theme-bg-image: url('${config.background_value}')`);
  if (config.background_type === 'color' && config.background_value) vars.push(`--theme-background: ${config.background_value}`);

  // Google Fonts link si es necesario
  let fontLink = '';
  if (config.font_family && config.font_family !== 'system') {
    fontLink = `
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2:wght@400;600&family=${encodeURIComponent(config.font_family)}" crossorigin="anonymous">
    <style>
      :root { font-family: '${config.font_family}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    </style>`;
  }

  // Generar algunas items de menú de ejemplo para el preview
  const sampleItems = [
    { name: 'Pizza Margherita', description: 'Muzzarella, tomate y albahaca', price: 8500, category: 'Pizzas' },
    { name: 'Pizza Napolitana', description: 'Muzzarella, tomate, ajo y oregano', price: 9000, category: 'Pizzas' },
    { name: 'Empanada de Carne', description: 'Carne cortada a cuchillo', price: 800, category: 'Empanadas' },
    { name: 'Coca Cola', description: '500ml', price: 1500, category: 'Bebidas' },
    { name: 'Flan Casero', description: 'Con dulce de leche y crema', price: 2500, category: 'Postres' }
  ];

  // Renderizar HTML simple
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vista Previa - Theme QR Menu</title>
  ${fontLink}
  <style>
    :root {
      ${vars.join('\n')}
    }
    body {
      margin: 0;
      font-family: var(--theme-font, 'system'), sans-serif;
      background: var(--theme-background, #FFFFFF);
      color: var(--theme-text, #2A2A2A);
    }
    .menu-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h1 {
      color: var(--theme-primary, #FF6B6B);
      font-size: 2.5rem;
    }
    .logo {
      width: 120px;
      margin: 0 auto;
    }
    .menu-section {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid var(--theme-secondary, '#4ECDC4');
      border-radius: 8px;
    }
    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }
    .menu-item-name {
      font-weight: 500;
    }
    .menu-item-price {
      color: var(--theme-primary, #FF6B6B);
      font-weight: bold;
    }
    .promo-banner {
      background: var(--theme-secondary, #4ECDC4);
      color: white;
      padding: 1rem;
      text-align: center;
      margin: 2rem 0;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="menu-container">
    <div class="header">
      ${config.logo_url ? `<img src="${config.logo_url}" alt="Logo" class="logo" />` : '<div class="logo" style="width: 120px; height: 120px; background: var(--theme-primary, #FF6B6B); color: white; display: flex; align-items: center; justify-content: center; font-size: 3rem;">QR</div>'}
      <h1>Menú QR Restaurante</h1>
    </div>
    
    <div class="promo-banner">
      <strong>¡Buen provecho!</strong>
    </div>

    <div class="menu-section">
      <h3>Pizzas</h3>
      ${sampleItems.filter(i => i.category === 'Pizzas').map(item => `
        <div class="menu-item">
          <span class="menu-item-name">${item.name}</span>
          <span class="menu-item-price">$${item.price}</span>
        </div>
      `).join('')}
    </div>

    <div class="menu-section">
      <h3>Empanadas</h3>
      ${sampleItems.filter(i => i.category === 'Empanadas').map(item => `
        <div class="menu-item">
          <span class="menu-item-name">${item.name}</span>
          <span class="menu-item-price">$${item.price}</span>
        </div>
      `).join('')}
    </div>

    <div class="menu-section">
      <h3>Bebidas</h3>
      ${sampleItems.filter(i => i.category === 'Bebidas').map(item => `
        <div class="menu-item">
          <span class="menu-item-name">${item.name}</span>
          <span class="menu-item-price">$${item.price}</span>
        </div>
      `).join('')}
    </div>

    <div class="menu-section">
      <h3>Postres</h3>
      ${sampleItems.filter(i => i.category === 'Postres').map(item => `
        <div class="menu-item">
          <span class="menu-item-name">${item.name}</span>
          <span class="menu-item-price">$${item.price}</span>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
  `;

  res.set('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;