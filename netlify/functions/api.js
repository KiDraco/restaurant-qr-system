const serverless = require('serverless-http');
const express = require('express');
const originalApp = require('../../backend/src/app');

const wrapper = express();

// Middleware: ajusta el path de Netlify Functions al formato que Express espera
wrapper.use((req, res, next) => {
  // Debug: devolver el path original si es /debug
  if (req.url === '/debug' || req.url === '/.netlify/functions/api/debug') {
    return res.json({ originalUrl: req.url, url: req.url, method: req.method });
  }

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
