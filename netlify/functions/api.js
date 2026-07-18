const serverless = require('serverless-http');
const app = require('../../backend/src/app');

exports.handler = serverless(app, {
  request: function (request, event, context) {
    // Netlify Functions recibe el path completo del endpoint.
    // Ej: /.netlify/functions/api/auth/login
    // Express espera: /api/auth/login
    const functionPrefix = '/.netlify/functions/api';
    if (event.path.startsWith(functionPrefix)) {
      const rest = event.path.slice(functionPrefix.length) || '/';
      if (rest === '/') {
        request.url = '/';
      } else {
        // Preservar /api para que coincida con las rutas de Express
        request.url = '/api' + rest;
      }
    }
  },
});
