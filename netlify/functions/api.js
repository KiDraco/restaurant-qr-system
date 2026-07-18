const serverless = require('serverless-http');
const express = require('express');
const originalApp = require('../../backend/src/app');

const wrapper = express();

// Middleware: ajusta el path de Netlify Functions al formato que Express espera
// /.netlify/functions/api/auth/login → /api/auth/login
// /.netlify/functions/api → /
wrapper.use((req, res, next) => {
  const match = req.url.match(/^\/\.netlify\/functions\/api(\/.*)?$/);
  if (match) {
    const rest = match[1] || '/';
    req.url = rest === '/' ? '/' : '/api' + rest;
    // Limpiar caché de URL parseada para que Express use el nuevo path
    req._parsedUrl = undefined;
  }
  next();
});

wrapper.use(originalApp);

exports.handler = serverless(wrapper);
