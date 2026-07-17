const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de SQLite
  if (err.code) {
    switch (err.code) {
      case 'SQLITE_CONSTRAINT':
        return res.status(409).json({
          error: 'Conflicto de datos',
          message: 'El registro ya existe o viola una restricción'
        });
      case 'SQLITE_BUSY':
        return res.status(503).json({
          error: 'Base de datos ocupada',
          message: 'Intente nuevamente en un momento'
        });
      default:
        return res.status(500).json({
          error: 'Error de base de datos',
          message: err.message
        });
    }
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;