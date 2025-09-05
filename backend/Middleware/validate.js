// Middleware/validate.js
// Zod-based validation middleware for body, query, and params.

const { ZodError } = require('zod');

/**
 * Build a validation middleware using supplied zod schemas
 * @param {{ body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny }} schemas
 */
module.exports = function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) req.query = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.issues && err.issues[0];
        const message = first?.message || 'Validation error';
        return res.status(400).json({ success: false, message, errors: err.issues });
      }
      return res.status(400).json({ success: false, message: err.message || 'Validation error' });
    }
  };
}



