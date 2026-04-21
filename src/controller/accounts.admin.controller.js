const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

function normalizeUsername(s) {
  return String(s || '').trim().toLowerCase();
}

function validateEmail(email) {
  const e = String(email || '').trim();
  if (e.length < 5 || e.length > 120) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

function parseStatus(s) {
  return s === '1' || s === 'true' || s === true || s === 'on' || s === 1;
}

function isUserActiveRaw(s) {
  return s === true || s === 'true' || s === 1 || s === '1';
}

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

function pickForm(body) {
  const b = body || {};
  return {
    fullName: String(b.fullName || '').trim(),
    username: String(b.username || '').trim(),
    email: String(b.email || '').trim(),
    status: parseStatus(b.status),
  };
}

/**
 * @param {object} body
 * @param {boolean} passwordRequired
 * @returns {string} lỗi hoặc rỗng
 */
function validateAdminBody(body, passwordRequired) {
  const fullName = String((body || {}).fullName || '').trim();
  if (!fullName) return 'Nhập họ tên.';
  if (fullName.length > 120) return 'Họ tên quá dài.';

  const username = normalizeUsername((body || {}).username);
  if (username.length < 3 || username.length > 40) return 'Username từ 3 đến 40 ký tự.';
  if (!/^[a-z0-9._-]+$/.test(username)) return 'Username chỉ gồm chữ thường, số, dấu chấm, gạch dưới, gạch ngang.';

  const email = validateEmail((body || {}).email);
  if (!email) return 'Email không hợp lệ.';

  const pw = typeof (body || {}).password === 'string' ? body.password : '';
  if (passwordRequired) {
    if (pw.length < 8) return 'Mật khẩu tối thiểu 8 ký tự.';
  } else if (pw.trim()) {
    if (pw.length < 8) return 'Mật khẩu mới tối thiểu 8 ký tự.';
  }

  return '';
}

function renderForm(res, opts) {
  res.render('admin/system/account-form', {
    layout: 'layouts/adminLayout',
    title: opts.title,
    mode: opts.mode,
    editingId: opts.editingId || '',
    editingRole: opts.editingRole || 'admin',
    formValues: opts.formValues,
    formError: opts.formError || '',
  });
}

const accountsAdminController = () => {
  return {
    list: async (req, res) => {
      const users = await User.find({ role: { $in: ['admin', 'super_admin'] } })
        .sort({ role: -1, createdAt: 1 })
        .select('-password')
        .lean();
      res.render('admin/system/accounts-list', {
        layout: 'layouts/adminLayout',
        title: 'Tài khoản đăng nhập',
        users,
        flash: typeof req.query.flash === 'string' ? req.query.flash : '',
      });
    },

    newForm: (req, res) => {
      renderForm(res, {
        title: 'Thêm tài khoản admin',
        mode: 'create',
        formValues: { fullName: '', username: '', email: '', status: true },
        formError: '',
      });
    },

    create: async (req, res) => {
      const body = req.body || {};
      const err = validateAdminBody(body, true);
      if (err) {
        return res.status(400).render('admin/system/account-form', {
          layout: 'layouts/adminLayout',
          title: 'Thêm tài khoản admin',
          mode: 'create',
          editingId: '',
          editingRole: 'admin',
          formValues: pickForm(body),
          formError: err,
        });
      }
      try {
        const hashed = await hashPassword(String(body.password));
        await User.create({
          fullName: String(body.fullName).trim(),
          username: normalizeUsername(body.username),
          email: validateEmail(body.email),
          password: hashed,
          role: 'admin',
          status: parseStatus(body.status),
        });
        res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Đã tạo tài khoản.'));
      } catch (e) {
        const msg =
          e && e.code === 11000 ? 'Username hoặc email đã tồn tại.' : e.message || 'Lỗi lưu';
        return res.status(400).render('admin/system/account-form', {
          layout: 'layouts/adminLayout',
          title: 'Thêm tài khoản admin',
          mode: 'create',
          editingId: '',
          editingRole: 'admin',
          formValues: pickForm(body),
          formError: msg,
        });
      }
    },

    editForm: async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('ID không hợp lệ.'));
      }
      const u = await User.findById(id).lean();
      if (!u || (u.role !== 'admin' && u.role !== 'super_admin')) {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Không tìm thấy tài khoản.'));
      }
      const currentId = String(req.user.userId);
      if (u.role === 'super_admin' && String(u._id) !== currentId) {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Không được sửa tài khoản super_admin khác.'));
      }
      renderForm(res, {
        title: u.role === 'super_admin' ? 'Tài khoản super admin' : 'Sửa tài khoản admin',
        mode: 'edit',
        editingId: String(u._id),
        editingRole: u.role,
        formValues: {
          fullName: u.fullName,
          username: u.username,
          email: u.email,
          status: isUserActiveRaw(u.status),
        },
        formError: '',
      });
    },

    update: async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('ID không hợp lệ.'));
      }
      const u = await User.findById(id);
      if (!u || (u.role !== 'admin' && u.role !== 'super_admin')) {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Không tìm thấy tài khoản.'));
      }
      const currentId = String(req.user.userId);
      if (u.role === 'super_admin' && String(u._id) !== currentId) {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Không được sửa tài khoản super_admin khác.'));
      }

      const body = req.body || {};
      const err = validateAdminBody(body, false);
      if (err) {
        return res.status(400).render('admin/system/account-form', {
          layout: 'layouts/adminLayout',
          title: u.role === 'super_admin' ? 'Tài khoản super admin' : 'Sửa tài khoản admin',
          mode: 'edit',
          editingId: String(u._id),
          editingRole: u.role,
          formValues: pickForm(body),
          formError: err,
        });
      }

      const nu = normalizeUsername(body.username);
      const ne = validateEmail(body.email);
      const dup = await User.findOne({
        _id: { $ne: u._id },
        $or: [{ username: nu }, { email: ne }],
      });
      if (dup) {
        return res.status(400).render('admin/system/account-form', {
          layout: 'layouts/adminLayout',
          title: u.role === 'super_admin' ? 'Tài khoản super admin' : 'Sửa tài khoản admin',
          mode: 'edit',
          editingId: String(u._id),
          editingRole: u.role,
          formValues: pickForm(body),
          formError: 'Username hoặc email đã được dùng cho tài khoản khác.',
        });
      }

      u.fullName = String(body.fullName).trim();
      u.username = nu;
      u.email = ne;
      u.status = parseStatus(body.status);

      const pw = typeof body.password === 'string' ? body.password : '';
      if (pw.trim()) {
        u.password = await hashPassword(pw);
      }

      try {
        await u.save();
        res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Đã cập nhật.'));
      } catch (e) {
        const msg = e && e.code === 11000 ? 'Username hoặc email đã tồn tại.' : e.message || 'Lỗi lưu';
        return res.status(400).render('admin/system/account-form', {
          layout: 'layouts/adminLayout',
          title: u.role === 'super_admin' ? 'Tài khoản super admin' : 'Sửa tài khoản admin',
          mode: 'edit',
          editingId: String(u._id),
          editingRole: u.role,
          formValues: pickForm(body),
          formError: msg,
        });
      }
    },

    delete: async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('ID không hợp lệ.'));
      }
      if (String(id) === String(req.user.userId)) {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Không thể xóa chính mình.'));
      }
      const u = await User.findById(id);
      if (!u || u.role !== 'admin') {
        return res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Chỉ có thể xóa tài khoản admin.'));
      }
      await u.deleteOne();
      res.redirect('/admin/system/accounts?flash=' + encodeURIComponent('Đã xóa tài khoản.'));
    },
  };
};

module.exports = accountsAdminController;
