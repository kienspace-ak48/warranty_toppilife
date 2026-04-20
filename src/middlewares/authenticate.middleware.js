const jwt = require('jsonwebtoken');

function getBearerToken(req) {
  const h = req.headers.authorization;
  if (h && typeof h === 'string' && h.startsWith('Bearer ')) {
    const t = h.slice(7).trim();
    if (t) return t;
  }
  const c = req.cookies && req.cookies.token;
  if (c && typeof c === 'string') {
    const t = c.trim();
    if (t) return t;
  }
  return null;
}

function authenticate(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret || String(secret).length < 16) {
    console.error('JWT_SECRET missing or too short; refusing admin access.');
    return res.status(503).send('Cấu hình đăng nhập chưa an toàn (JWT_SECRET).');
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.redirect('/auth/login');
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || typeof decoded !== 'object') {
      return res.redirect('/auth/login');
    }
    req.user = decoded;
    next();
  } catch {
    return res.redirect('/auth/login');
  }
}

module.exports = authenticate;
