// @libsql/client devuelve BigInt; JSON no lo serializa sin esto
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return Number(this);
  };
}

const serverless = require('serverless-http');
const express = require('express');
const originalApp = require('../../backend/src/app');
const { initializeDatabase } = require('../../backend/src/config/database');

const wrapper = express();

let dbInitialized = false;
const initPromise = initializeDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('✅ Base de datos inicializada');
  })
  .catch((err) => {
    console.error('❌ Error inicializando base de datos:', err);
  });

// Middleware: espera a que la DB esté lista
wrapper.use((req, res, next) => {
  if (!dbInitialized) {
    return initPromise
      .then(() => next())
      .catch((err) =>
        res.status(500).json({ error: 'Error de inicialización', message: err.message })
      );
  }
  next();
});

// Middleware: ajusta el path de Netlify Functions al formato que Express espera
wrapper.use((req, res, next) => {
  const match = req.url.match(/^\/\.netlify\/functions\/api(\/.*)?$/);
  if (match) {
    const rest = match[1] || '/';
    req.url = rest === '/' ? '/' : '/api' + rest;
    req._parsedUrl = undefined;
  }
  next();
});

wrapper.use(originalApp);

exports.handler = serverless(wrapper);
