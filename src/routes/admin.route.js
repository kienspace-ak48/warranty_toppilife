const express = require('express');
const multer = require('multer');
const warrantyAdmin = require('../controller/warranty.admin.controller')();
const publicSiteSettingsAdmin = require('../controller/publicSiteSettings.admin.controller')();

const uploadProductTypeMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mt = (file.mimetype || '').toLowerCase();
    if (
      /^image\/(jpeg|jpg|pjpeg|png|x-png|gif|webp)$/i.test(mt) ||
      (mt === 'application/octet-stream' && /\.(jpe?g|png|gif|webp)$/i.test(file.originalname || ''))
    ) {
      return cb(null, true);
    }
    cb(new Error('UNSUPPORTED_TYPE'));
  },
});

const uploadWarrantyExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    if (
      /\.xlsx$/i.test(name) ||
      (file.mimetype || '').toLowerCase() ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file .xlsx'));
  },
});

const router = express.Router();

/** Bookmark cũ /admin/login — đăng nhập thực tế tại /auth/login (middleware chặn /admin khi chưa có JWT). */
router.get('/login', (req, res) => {
  res.redirect(302, '/auth/login');
});

router.get('/', warrantyAdmin.adminDashboard);

router.get('/warranty/product-types', warrantyAdmin.listProductTypes);
router.get('/warranty/product-types/new', (req, res) => {
  res.redirect('/admin/warranty/product-types?open=add');
});
router.get('/warranty/product-types/api/:id', warrantyAdmin.getProductTypeApi);
router.post('/warranty/product-types', warrantyAdmin.createProductType);
router.post(
  '/warranty/product-types/upload',
  (req, res, next) => {
    uploadProductTypeMemory.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error:
            err.message === 'UNSUPPORTED_TYPE'
              ? 'Chỉ chấp nhận ảnh JPEG, PNG, GIF hoặc WebP.'
              : err.message || 'Upload lỗi.',
        });
      }
      next();
    });
  },
  warrantyAdmin.uploadProductTypeImage,
);
router.get('/warranty/product-types/:id/edit', (req, res) => {
  res.redirect('/admin/warranty/product-types?edit=' + encodeURIComponent(req.params.id));
});
router.post('/warranty/product-types/:id/warranty-mode', warrantyAdmin.updateProductTypeWarrantyMode);
router.post('/warranty/product-types/:id', warrantyAdmin.updateProductType);
router.post('/warranty/product-types/:id/delete', warrantyAdmin.deleteProductType);

router.get('/warranty/activation-requests', warrantyAdmin.listActivationRequests);
router.post('/warranty/activation-requests/:id/approve', warrantyAdmin.approveActivationRequest);
router.post('/warranty/activation-requests/:id/reject', warrantyAdmin.rejectActivationRequest);
router.post('/warranty/activation-requests/:id/segment', warrantyAdmin.updateActivationRequestSegment);

/** Trùng với Page setting — chỉ giữ một menu; bookmark cũ vẫn hoạt động. */
router.get('/warranty/qr', (req, res) => {
  res.redirect(302, '/admin/page-settings/qr-kich-hoat');
});
router.post('/warranty/qr', warrantyAdmin.qrToolGenerate);

router.get('/warranty/products', warrantyAdmin.listWarrantyProducts);
router.get('/warranty/products/export', warrantyAdmin.exportWarrantyProductsExcel);
router.get('/warranty/products/import-template', warrantyAdmin.downloadWarrantyImportTemplate);
router.post(
  '/warranty/products/import',
  (req, res, next) => {
    uploadWarrantyExcel.single('file')(req, res, (err) => {
      if (err) {
        return res.redirect(
          '/admin/warranty/products?flash=' + encodeURIComponent(err.message || 'File không hợp lệ'),
        );
      }
      next();
    });
  },
  warrantyAdmin.importWarrantyProductsExcel,
);
router.get('/warranty/products/new', (req, res) => {
  res.redirect('/admin/warranty/products?open=add');
});
router.get('/warranty/products/api/:id', warrantyAdmin.getWarrantyProductApi);
router.post('/warranty/products', warrantyAdmin.createWarrantyProduct);
router.post(
  '/warranty/products/:productId/logs/:logId/update',
  warrantyAdmin.updateWarrantyProductLog,
);
router.post(
  '/warranty/products/:productId/logs/:logId/delete',
  warrantyAdmin.deleteWarrantyProductLog,
);
router.get('/warranty/products/:id/edit', (req, res) => {
  res.redirect('/admin/warranty/products?edit=' + encodeURIComponent(req.params.id));
});
router.post('/warranty/products/:id', warrantyAdmin.updateWarrantyProduct);
router.post('/warranty/products/:id/delete', warrantyAdmin.deleteWarrantyProduct);

router.get('/page-settings/footer', publicSiteSettingsAdmin.footerPage);
router.post('/page-settings/footer', publicSiteSettingsAdmin.footerSave);
router.get('/page-settings/home-quick-notes', publicSiteSettingsAdmin.quickNotesPage);
router.post('/page-settings/home-quick-notes', publicSiteSettingsAdmin.quickNotesSave);
router.get('/page-settings/lookup-tra-cuu', publicSiteSettingsAdmin.lookupPage);
router.post('/page-settings/lookup-tra-cuu', publicSiteSettingsAdmin.lookupPageSave);
router.get('/page-settings/qr-kich-hoat', warrantyAdmin.qrToolPage);
router.post('/page-settings/qr-kich-hoat', warrantyAdmin.qrToolGenerate);

router.get('/warranty/public-footer', (req, res) => {
  res.redirect(302, '/admin/page-settings/footer');
});
router.post('/warranty/public-footer', publicSiteSettingsAdmin.footerSave);

module.exports = router;
