const rateLimit = require('express-rate-limit');

/** Giảm brute-force mật khẩu qua POST /auth/login */
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Quá nhiều lần thử đăng nhập. Vui lòng đợi vài phút.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLoginLimiter };
