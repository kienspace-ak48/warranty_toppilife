const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserEntity = require('../models/user.model');
const { authLoginLimiter } = require('../middlewares/authLoginRateLimit');

/** Hash cố định để so sánh timing khi không có user (tránh lộ user tồn tại hay không) */
const PASSWORD_TIMING_DUMMY = bcrypt.hashSync('__login_timing_dummy__', 10);

function isUserActive(user) {
  if (!user) return false;
  const s = user.status;
  return s === true || s === 'true' || s === 1 || s === '1';
}

function cookieMaxAgeMs(expiresIn) {
  const m = String(expiresIn || '8h').trim().match(/^(\d+)\s*([smhd])$/i);
  if (!m) return 8 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (mult[u] || 3600000);
}

router.get('/login', (req, res) => {
  res.render('page/login', { layout: false, mess: '' });
});

/** Phải khớp option với res.cookie khi đăng nhập, nếu không trình duyệt có thể không xóa cookie. */
function clearAuthCookie(res) {
  res.clearCookie('token', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

function logout(req, res) {
  clearAuthCookie(res);
  res.redirect(302, '/auth/login');
}

/** Header admin dùng POST; GET giữ cho link/bookmark */
router.post('/logout', logout);
router.get('/logout', logout);
/**
 * Chỉ bật khi cần tạo user đầu tiên (local/staging). Production: KHÔNG đặt AUTH_ALLOW_BOOTSTRAP_REGISTER.
 * GET /auth/register — lỗ hổng nếu mở công khai: tạo admin + mật khẩu cố định.
 */
router.get('/register', async (req, res) => {
  if (process.env.AUTH_ALLOW_BOOTSTRAP_REGISTER !== 'true') {
    return res.status(404).send('Not found');
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123@', salt);
    const user = new UserEntity({
      fullName: 'Toppilife Admin',
      username: 'toppilife_warranty',
      password: hashedPassword,
      email: 'toppilife.warranty@gmail.com',
      role: 'super_admin',
      status: true,
    });
    const result = await user.save();
    return res.status(200).json({ message: 'User created successfully', data: { id: result._id, email: result.email } });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', authLoginLimiter, async (req, res) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  const maxAge = cookieMaxAgeMs(expiresIn);
  if (!secret || String(secret).length < 16) {
    return res.status(503).render('page/login', {
      layout: false,
      mess: 'Máy chủ chưa cấu hình JWT_SECRET (tối thiểu 16 ký tự).',
    });
  }

  const rawUser = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  let user = null;
  try {
    user = await UserEntity.findOne({
      $or: [{ email: rawUser }, { username: rawUser }],
    });
  } catch {
    user = null;
  }

  const hashToCompare = user && user.password ? user.password : PASSWORD_TIMING_DUMMY;
  const passwordOk = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordOk || !isUserActive(user)) {
    return res.status(401).render('page/login', {
      layout: false,
      mess: 'Sai email hoặc mật khẩu, hoặc tài khoản đã bị khóa.',
    });
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: String(user._id),
        role: user.role,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
      secret,
      { expiresIn },
    );
  } catch {
    return res.status(500).render('page/login', {
      layout: false,
      mess: 'Cấu hình JWT_EXPIRES_IN không hợp lệ.',
    });
  }

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  res.redirect('/admin');
});

module.exports = router;
