const express = require('express');
const router = express.Router();
const homeController = require('../controller/home.controller')();
const warrantyLookup = require('../controller/warranty.lookup.controller')();
const warrantyActivation = require('../controller/warranty.activation.controller')();
const { warrantyLookupSearchLimiter } = require('../middlewares/warrantyLookupRateLimit');
const { warrantyActivationSubmitLimiter } = require('../middlewares/warrantyActivationRateLimit');
const { loadPublicSiteSettings } = require('../middlewares/publicSiteSettings');
const publicSiteApi = require('../controller/publicSite.api.controller')();

/** Chuyển vĩnh viễn từ /warranty/... (cũ) sang /bao-hanh/... (chuẩn SEO) */
function redirectLegacyToBaoHanh(req, res) {
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(301, req.path.replace(/^\/warranty\b/, '/bao-hanh') + qs);
}

router.get('/api/public/site-settings', publicSiteApi.siteSettingsJson);

router.use(loadPublicSiteSettings);

router.get('/', homeController.Index);

router.get('/bao-hanh/tra-cuu', warrantyLookupSearchLimiter, warrantyLookup.page);
router.post('/bao-hanh/kich-hoat', warrantyActivationSubmitLimiter, warrantyActivation.submit);
router.get('/bao-hanh/kich-hoat', warrantyActivation.page);
router.get('/bao-hanh/ma-qr', warrantyActivation.qrPage);
router.get('/bao-hanh/chinh-sach', warrantyActivation.policyPage);

router.get('/warranty/tra-cuu', redirectLegacyToBaoHanh);
router.get('/warranty/kich-hoat', redirectLegacyToBaoHanh);
router.get('/warranty/ma-qr', redirectLegacyToBaoHanh);
router.get('/warranty/chinh-sach', redirectLegacyToBaoHanh);
router.post('/warranty/kich-hoat', warrantyActivationSubmitLimiter, warrantyActivation.submit);

module.exports = router;
