const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: (err.issues || err.errors).map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(err);
  }
};

module.exports = { validate };
