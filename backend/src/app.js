const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const requestRoutes = require('./routes/requestRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Importar middleware de autenticaci\u00f3n
const { verifyToken } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: 'Restaurant QR API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tables: '/api/tables',
      requests: '/api/requests',
      sessions: '/api/sessions',
      menu: '/api/menu',
      orders: '/api/orders',
      bill: '/api/bill'
    }
  });
});

// Rutas de autenticaci\u00f3n (p\u00fablicas para login/register)
app.use('/api/auth', authRoutes);

// Rutas admin protegidas con JWT
app.use('/api/tables', verifyToken, tableRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;