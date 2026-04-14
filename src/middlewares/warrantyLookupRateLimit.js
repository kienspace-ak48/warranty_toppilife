const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.WARRANTY_LOOKUP_RATE_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.WARRANTY_LOOKUP_RATE_MAX || 60);

function hasLookupQuery(req) {
  const qq = req.query && typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const p = req.query && typeof req.query.phone === 'string' ? req.query.phone.trim() : '';
  const s = req.query && typeof req.query.serial === 'string' ? req.query.serial.trim() : '';
  return !!(qq || p || s);
}

/**
 * Giới hạn lượt tra cứu (GET có phone hoặc serial). Mở trang không gõ tra cứu không tính.
 */
const warrantyLookupSearchLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !hasLookupQuery(req),
  handler: (req, res, next) => {
    const q =
      (req.query && typeof req.query.q === 'string' && req.query.q.trim()) ||
      (req.query && typeof req.query.serial === 'string' && req.query.serial.trim()) ||
      (req.query && typeof req.query.phone === 'string' && req.query.phone.trim()) ||
      '';
    res.status(429).render('warranty/lookup', {
      layout: 'layouts/main',
      title: 'Tra cứu bảo hành',
      tab: 'lookup',
      results: [],
      query: { q },
      searched: false,
      rateLimited: true,
      notifyNoResults: false,
    });
  },
});

module.exports = { warrantyLookupSearchLimiter };
