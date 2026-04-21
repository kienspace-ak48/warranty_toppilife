const warrantyService = require('../services/warrantyService');
const { getPublicBaseUrl } = require('../configs/publicUrl');
const QRCode = require('qrcode');

function activationErr(e) {
  const c = e && e.code;
  if (c === 'PRODUCT_TYPE_REQUIRED') return 'Chọn loại sản phẩm.';
  if (c === 'ORDER_CODE_REQUIRED') return 'Nhập mã đơn hàng.';
  if (c === 'SERIAL_REQUIRED') return 'Nhập số serial / mã tem.';
  if (c === 'CUSTOMER_NAME_REQUIRED') return 'Nhập họ tên.';
  if (c === 'CUSTOMER_PHONE_REQUIRED') return 'Nhập số điện thoại.';
  if (c === 'SERIAL_ALREADY_REGISTERED') return 'Serial này đã được đăng ký bảo hành.';
  if (c === 'PENDING_REQUEST_EXISTS') return 'Đã có yêu cầu kích hoạt đang chờ duyệt cho serial này.';
  if (c === 'PRODUCT_TYPE_NOT_FOUND') return 'Loại sản phẩm không hợp lệ.';
  return e.message || 'Không gửi được yêu cầu. Thử lại sau.';
}

async function loadActivationPageLists() {
  const [productTypes, serialGuideProductTypes] = await Promise.all([
    warrantyService.listProductTypesForPublicActivation(),
    warrantyService.getProductTypesForSerialGuideShowcase(),
  ]);
  return { productTypes, serialGuideProductTypes };
}

function activationDocTitle(res) {
  const h = res.locals && res.locals.activationPageIntro;
  return h && h.title ? h.title : 'Kích hoạt bảo hành';
}

const warrantyActivationController = () => {
  return {
    page: async (req, res) => {
      const { productTypes, serialGuideProductTypes } = await loadActivationPageLists();
      res.render('warranty/activation', {
        layout: 'layouts/main',
        title: activationDocTitle(res),
        tab: 'activate',
        productTypes,
        serialGuideProductTypes,
        formError: null,
        formValues: {},
        justSubmitted: false,
      });
    },

    submit: async (req, res) => {
      const { productTypes, serialGuideProductTypes } = await loadActivationPageLists();
      try {
        await warrantyService.submitWarrantyActivationRequestPublic(req.body || {});
        return res.render('warranty/activation', {
          layout: 'layouts/main',
          title: activationDocTitle(res),
          tab: 'activate',
          productTypes,
          serialGuideProductTypes,
          formError: null,
          formValues: {},
          justSubmitted: true,
        });
      } catch (e) {
        const body = req.body || {};
        return res.status(400).render('warranty/activation', {
          layout: 'layouts/main',
          title: activationDocTitle(res),
          tab: 'activate',
          productTypes,
          serialGuideProductTypes,
          formError: activationErr(e),
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
      }
    },

    qrPage: async (req, res) => {
      const base = getPublicBaseUrl(req);
      const targetUrl = `${base}/bao-hanh/kich-hoat`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#047857', light: '#ffffff' },
      });
      res.render('warranty/qr', {
        layout: 'layouts/main',
        title: 'Mã QR kích hoạt bảo hành',
        tab: 'qr',
        targetUrl,
        qrDataUrl,
      });
    },
  };
};

module.exports = warrantyActivationController;
