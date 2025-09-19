const { isEmail } = require('validator');

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value.trim();
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#39;',
      '`': '&#x60;',
      '=': '&#x3D;',
      '/': '&#x2F;'
    })[s];
  });
}

module.exports = function sanitize(keys = []) {
  return (req, res, next) => {
    keys.forEach((key) => {
      if (req.body[key] !== undefined) {
        let v = String(req.body[key]);
        v = v.replace(/<[^>]*>?/gm, '');
        v = sanitizeString(v);
        v = escapeHtml(v);
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






