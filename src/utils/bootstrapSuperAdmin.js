const User = require('../models/user.model');

/**
 * Một lần khi chưa có super_admin: gán role super_admin cho user có username khớp biến môi trường.
 * Đặt BOOTSTRAP_SUPER_ADMIN_USERNAME (ví dụ username đăng nhập hiện có), khởi động lại app, rồi gỡ biến.
 */
async function bootstrapSuperAdminIfNeeded() {
  const username = (process.env.BOOTSTRAP_SUPER_ADMIN_USERNAME || '').trim().toLowerCase();
  if (!username) return;
  try {
    const exists = await User.exists({ role: 'super_admin' });
    if (exists) return;
    const u = await User.findOne({ username });
    if (!u) {
      console.warn(`[auth] BOOTSTRAP_SUPER_ADMIN_USERNAME="${username}" không khớp user — bỏ qua.`);
      return;
    }
    u.role = 'super_admin';
    await u.save();
    console.log(`[auth] Đã gán super_admin cho user "${username}". Gỡ BOOTSTRAP_SUPER_ADMIN_USERNAME khỏi .env sau khi xong.`);
  } catch (e) {
    console.error('[auth] bootstrapSuperAdminIfNeeded:', e.message);
  }
}

module.exports = { bootstrapSuperAdminIfNeeded };
