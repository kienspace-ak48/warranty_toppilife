const rateLimit = require('express-rate-limit');
const warrantyService = require('../services/warrantyService');

const windowMs = Number(process.env.WARRANTY_ACTIVATION_RATE_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.WARRANTY_ACTIVATION_RATE_MAX || 20);

/** Giới hạn POST kích hoạt bảo hành theo IP */
const warrantyActivationSubmitLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    const body = req.body || {};
    Promise.all([
      warrantyService.listProductTypesForPublicActivation(),
      warrantyService.getProductTypesForSerialGuideShowcase(),
    ])
      .then(([productTypes, serialGuideProductTypes]) => {
        res.status(429).render('warranty/activation', {
          layout: 'layouts/main',
          title: 'Kích hoạt bảo hành',
          tab: 'activate',
          productTypes,
          serialGuideProductTypes,
          formError: 'Bạn gửi quá nhiều lần trong thời gian ngắn. Vui lòng đợi vài phút rồi thử lại.',
          formValues: {
            productTypeId: body.productTypeId || '',
            orderCode: body.orderCode || '',
            serialNumber: body.serialNumber || '',
            customerName: body.customerName || '',
            customerPhone: body.customerPhone || '',
            customerAddress: body.customerAddress || '',
          },
          justSubmitted: false,
        });
      })
      .catch(next);
  },
});

module.exports = { warrantyActivationSubmitLimiter };
