const { isEmail } = require('validator');

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value.trim();
}

module.exports = function sanitize(keys = []) {
  return (req, res, next) => {
    keys.forEach((key) => {
      if (req.body[key] !== undefined) {
        let v = String(req.body[key]);
        v = v.replace(/<[^>]*>?/gm, '');
        v = sanitizeString(v);
        if (key === 'email') {
          v = v.toLowerCase();
          if (!isEmail(v)) {
            // Leave validation to zod; just normalize
          }
        }
        req.body[key] = v;
      }
    });
    next();
  };
};






