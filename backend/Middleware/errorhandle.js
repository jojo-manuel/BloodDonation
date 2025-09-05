const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return res.status(400).json({ success: false, message: 'Validation failed', details });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid resource identifier' });
  }
  if (err.name === 'ValidationError') {
    const details = Object.keys(err.errors).map((k) => ({ path: k, message: err.errors[k].message }));
    return res.status(400).json({ success: false, message: 'Validation failed', details });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = errorHandler;
