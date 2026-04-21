/**
 * Chỉ super_admin được vào các route quản trị tài khoản.
 */
function requireSuperAdmin(req, res, next) {
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }
  return res.status(403).render('admin/system/forbidden', {
    layout: 'layouts/adminLayout',
    title: 'Không có quyền',
  });
}

module.exports = requireSuperAdmin;
