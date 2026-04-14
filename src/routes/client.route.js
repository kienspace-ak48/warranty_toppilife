const express = require('express');
const router = express.Router();
const homeController = require('../controller/home.controller')();
const warrantyLookup = require('../controller/warranty.lookup.controller')();
const warrantyActivation = require('../controller/warranty.activation.controller')();
const { warrantyLookupSearchLimiter } = require('../middlewares/warrantyLookupRateLimit');
const { warrantyActivationSubmitLimiter } = require('../middlewares/warrantyActivationRateLimit');

router.get('/', homeController.Index);
router.get('/warranty/tra-cuu', warrantyLookupSearchLimiter, warrantyLookup.page);
router.get('/warranty/kich-hoat', warrantyActivation.page);
router.post('/warranty/kich-hoat', warrantyActivationSubmitLimiter, warrantyActivation.submit);
router.get('/warranty/ma-qr', warrantyActivation.qrPage);

module.exports = router;