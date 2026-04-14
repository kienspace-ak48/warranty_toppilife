const QRCode = require('qrcode');
const warrantyService = require('../services/warrantyService');
const { getPublicBaseUrl } = require('../configs/publicUrl');
const { saveProductTypeImageBuffer } = require('../utils/productTypeImageUpload');

function suggestedActivationUrl(req) {
  const base = (getPublicBaseUrl(req) || '').replace(/\/$/, '');
  return base ? `${base}/warranty/kich-hoat` : '';
}

/**
 * @param {string} raw
 * @returns {{ ok: true, href: string } | { ok: false, message: string }}
 */
function parseQrTargetUrl(raw) {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return { ok: false, message: 'Nhập đường link (URL).' };
  let toParse = s;
  if (!/^https?:\/\//i.test(s)) {
    toParse = `https://${s}`;
  }
  let u;
  try {
    u = new URL(toParse);
  } catch {
    return { ok: false, message: 'Đường link không hợp lệ.' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, message: 'Chỉ chấp nhận link http hoặc https.' };
  }
  if (u.href.length > 2048) return { ok: false, message: 'Link quá dài (tối đa 2048 ký tự).' };
  return { ok: true, href: u.href };
}

/** Form POST tới đúng route (Bảo hành vs Page setting). */
function qrFormActionFromReq(req) {
  const p = req.path || '';
  return p.includes('page-settings') ? '/admin/page-settings/qr-kich-hoat' : '/admin/warranty/qr';
}

function qrToolTitleFromReq(req) {
  const p = req.path || '';
  return p.includes('page-settings')
    ? 'Mã QR — Trang kích hoạt bảo hành'
    : 'Tạo mã QR kích hoạt';
}

function productTypeErr(e) {
  if (e.code === 'CODE_REQUIRED') return 'Nhập mã loại (code).';
  if (e.code === 'CODE_DUPLICATE') return 'Mã loại đã tồn tại.';
  if (e.code === 'SLUG_DUPLICATE') return 'Tên tạo slug URL trùng với loại khác — đổi tên.';
  if (e.code === 'SLUG_REQUIRED') return 'Không tạo được slug từ tên.';
  if (e.code === 'NAME_REQUIRED') return 'Nhập tên.';
  if (e.code === 'NOT_FOUND') return 'Không tìm thấy.';
  return e.message || 'Lỗi';
}

function activationRequestErr(e) {
  if (e.code === 'NOT_FOUND') return 'Không tìm thấy yêu cầu.';
  if (e.code === 'NOT_PENDING') return 'Yêu cầu đã được xử lý.';
  if (e.code === 'SERIAL_CONFLICT_ON_APPROVE') return 'Serial đã tồn tại trên hệ thống — không thể duyệt.';
  if (e.code === 'INVALID_SEGMENT') return 'Phân loại kênh không hợp lệ.';
  return e.message || 'Lỗi';
}

/** Query string cho danh sách admin (chỉ tham số lọc + trang), tránh kéo `open`, `edit`, `flash`. */
function adminListQs(base, overrides = {}) {
  const o = { ...base, ...overrides };
  const p = new URLSearchParams();
  if (o.productTypeId && String(o.productTypeId).trim()) p.set('productTypeId', String(o.productTypeId).trim());
  const qq = o.q != null ? String(o.q).trim() : '';
  if (qq) p.set('q', qq);
  if (o.status && ['pending', 'approved', 'rejected'].includes(o.status)) p.set('status', o.status);
  const psz = parseInt(o.pageSize, 10);
  if (Number.isFinite(psz) && psz > 0 && psz !== 25) p.set('pageSize', String(psz));
  const pg = parseInt(o.page, 10);
  if (Number.isFinite(pg) && pg > 1) p.set('page', String(pg));
  const str = p.toString();
  return str ? `?${str}` : '';
}

function warrantyProductErr(e) {
  if (e.code === 'CUSTOMER_NAME_REQUIRED') return 'Nhập tên khách hàng.';
  if (e.code === 'CUSTOMER_PHONE_REQUIRED') return 'Nhập số điện thoại khách.';
  if (e.code === 'PURCHASE_DATE_INVALID') return 'Ngày mua / kích hoạt không hợp lệ.';
  if (e.code === 'PRODUCT_TYPE_NOT_FOUND') return 'Loại sản phẩm không tồn tại.';
  if (e.code === 'SERIAL_DUPLICATE') return 'Serial trùng trong cùng loại sản phẩm.';
  if (e.code === 'CUSTOMER_SEGMENT_INVALID') return 'Phân loại khách không hợp lệ.';
  if (e.code === 'DEVICE_STATUS_INVALID') return 'Trạng thái thiết bị không hợp lệ.';
  if (e.code === 'WARRANTY_MANUAL_DATES_REQUIRED') return 'Nhập đủ ngày bắt đầu và ngày hết hạn bảo hành.';
  if (e.code === 'WARRANTY_END_BEFORE_START') return 'Ngày hết hạn BH phải sau ngày bắt đầu.';
  if (e.code === 'NOT_FOUND') return 'Không tìm thấy.';
  if (e.code === 'LOG_MESSAGE_REQUIRED') return 'Nhập nội dung nhật ký.';
  if (e.code === 'LOG_AT_INVALID') return 'Thời điểm nhật ký không hợp lệ.';
  return e.message || 'Lỗi';
}

const warrantyAdminController = () => {
  return {
    adminDashboard: async (req, res) => {
      const dashboard = await warrantyService.getAdminDashboardStats();
      res.render('admin/index', {
        layout: 'layouts/adminLayout',
        title: 'Tổng quan bảo hành',
        dashboard,
      });
    },

    listProductTypes: async (req, res) => {
      const items = await warrantyService.listProductTypesForAdmin();
      res.render('admin/warranty/product-types/list', {
        layout: 'layouts/adminLayout',
        title: 'Loại sản phẩm',
        items,
        flash: req.query.flash || '',
        openModalAdd: req.query.open === 'add',
        openModalEditId: typeof req.query.edit === 'string' ? req.query.edit.trim() : '',
      });
    },

    getProductTypeApi: async (req, res) => {
      try {
        const item = await warrantyService.getProductTypeByIdForAdmin(req.params.id);
        if (!item) return res.status(404).json({ error: 'Không tìm thấy.' });
        res.json({ item });
      } catch (e) {
        res.status(500).json({ error: e.message || 'Lỗi' });
      }
    },

    createProductType: async (req, res) => {
      try {
        await warrantyService.createProductTypeAdmin(req.body || {});
        res.json({ ok: true, message: 'Đã tạo loại sản phẩm.' });
      } catch (e) {
        res.status(400).json({ error: productTypeErr(e) });
      }
    },

    updateProductType: async (req, res) => {
      try {
        await warrantyService.updateProductTypeAdmin(req.params.id, req.body || {});
        res.json({ ok: true, message: 'Đã cập nhật.' });
      } catch (e) {
        res.status(400).json({ error: productTypeErr(e) });
      }
    },

    updateProductTypeWarrantyMode: async (req, res) => {
      try {
        const result = await warrantyService.updateProductTypeWarrantyModeAdmin(req.params.id, req.body || {});
        res.json({
          ok: true,
          message: 'Đã cập nhật cách tính BH.',
          useTypeWarrantyPeriod: result.useTypeWarrantyPeriod,
        });
      } catch (e) {
        res.status(400).json({ error: productTypeErr(e) });
      }
    },

    uploadProductTypeImage: async (req, res) => {
      try {
        if (!req.file) return res.status(400).json({ error: 'Chưa chọn ảnh.' });
        const path = await saveProductTypeImageBuffer(req.file);
        res.json({ path });
      } catch (e) {
        console.error('[uploadProductTypeImage]', e);
        res.status(500).json({ error: e.message || 'Lưu ảnh lỗi.' });
      }
    },

    deleteProductType: async (req, res) => {
      try {
        await warrantyService.deleteProductTypeAdmin(req.params.id);
        res.json({ ok: true, message: 'Đã xóa loại sản phẩm.', mode: 'deleted' });
      } catch (e) {
        res.status(400).json({ error: e.message || 'Không xóa được' });
      }
    },

    // ========================= Warranty Products ========================= //
    listWarrantyProducts: async (req, res) => {
      const q = req.query || {};
      const listQuery = {
        productTypeId: typeof q.productTypeId === 'string' ? q.productTypeId.trim() : '',
        q: typeof q.q === 'string' ? q.q.trim() : '',
        pageSize: q.pageSize,
        page: q.page,
      };
      const [result, productTypes] = await Promise.all([
        warrantyService.listWarrantyProductsForAdmin(listQuery),
        warrantyService.listProductTypesForAdmin(),
      ]);
      res.render('admin/warranty/products/list', {
        layout: 'layouts/adminLayout',
        title: 'Sản phẩm bảo hành',
        items: result.items,
        productTypes,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
        filterProductTypeId: listQuery.productTypeId,
        searchQ: listQuery.q,
        listQuery,
        listQs: (overrides) => adminListQs(listQuery, overrides),
        flash: q.flash || '',
        openModalAdd: q.open === 'add',
        openModalEditId: typeof q.edit === 'string' ? q.edit.trim() : '',
      });
    },

    getWarrantyProductApi: async (req, res) => {
      try {
        const item = await warrantyService.getWarrantyProductByIdForAdmin(req.params.id);
        if (!item) return res.status(404).json({ error: 'Không tìm thấy.' });
        res.json({ item });
      } catch (e) {
        res.status(500).json({ error: e.message || 'Lỗi' });
      }
    },

    createWarrantyProduct: async (req, res) => {
      try {
        await warrantyService.createWarrantyProductAdmin(req.body || {});
        res.json({ ok: true, message: 'Đã thêm sản phẩm.' });
      } catch (e) {
        res.status(400).json({ error: warrantyProductErr(e) });
      }
    },

    updateWarrantyProduct: async (req, res) => {
      try {
        await warrantyService.updateWarrantyProductAdmin(req.params.id, req.body || {});
        res.json({ ok: true, message: 'Đã cập nhật.' });
      } catch (e) {
        res.status(400).json({ error: warrantyProductErr(e) });
      }
    },

    updateWarrantyProductLog: async (req, res) => {
      try {
        const item = await warrantyService.updateWarrantyProductLogAdmin(
          req.params.productId,
          req.params.logId,
          req.body || {},
        );
        res.json({ ok: true, item });
      } catch (e) {
        res.status(400).json({ error: warrantyProductErr(e) });
      }
    },

    deleteWarrantyProductLog: async (req, res) => {
      try {
        const item = await warrantyService.deleteWarrantyProductLogAdmin(
          req.params.productId,
          req.params.logId,
        );
        res.json({ ok: true, item });
      } catch (e) {
        res.status(400).json({ error: warrantyProductErr(e) });
      }
    },

    deleteWarrantyProduct: async (req, res) => {
      try {
        await warrantyService.deleteWarrantyProductAdmin(req.params.id);
        res.json({ ok: true, message: 'Đã xóa.', mode: 'deleted' });
      } catch (e) {
        res.status(400).json({ error: warrantyProductErr(e) });
      }
    },

    exportWarrantyProductsExcel: async (req, res) => {
      try {
        const buf = await warrantyService.exportWarrantyProductsExcelBuffer({
          fromStr: req.query.from,
          toStr: req.query.to,
          dateField: req.query.dateField,
        });
        const from = String(req.query.from || '').replace(/\s/g, '') || 'export';
        const to = String(req.query.to || '').replace(/\s/g, '') || 'export';
        const fn = `san-pham-bao-hanh_${from}_${to}.xlsx`;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${fn}"`);
        res.send(buf);
      } catch (e) {
        res.redirect(
          `/admin/warranty/products?flash=${encodeURIComponent(e.message || 'Xuất Excel lỗi')}`,
        );
      }
    },

    downloadWarrantyImportTemplate: async (req, res) => {
      try {
        const buf = await warrantyService.buildWarrantyImportTemplateBuffer();
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename="mau-nhap-san-pham-bao-hanh.xlsx"');
        res.send(buf);
      } catch (e) {
        res.redirect(
          `/admin/warranty/products?flash=${encodeURIComponent(e.message || 'Tải mẫu lỗi')}`,
        );
      }
    },

    importWarrantyProductsExcel: async (req, res) => {
      try {
        if (!req.file || !req.file.buffer) {
          return res.redirect(
            `/admin/warranty/products?flash=${encodeURIComponent('Chọn file .xlsx')}`,
          );
        }
        const result = await warrantyService.importWarrantyProductsFromExcelBuffer(req.file.buffer);
        let msg = `Đã nhập ${result.created} dòng.`;
        if (result.errors.length) {
          msg += ` ${result.errors.length} dòng lỗi.`;
          const sample = result.errors.slice(0, 8).map((x) => `Dòng ${x.row}: ${x.message}`);
          msg += ` ${sample.join(' | ')}`;
          if (result.errors.length > 8) msg += ' …';
        }
        res.redirect(`/admin/warranty/products?flash=${encodeURIComponent(msg)}`);
      } catch (e) {
        res.redirect(
          `/admin/warranty/products?flash=${encodeURIComponent(e.message || 'Nhập Excel lỗi')}`,
        );
      }
    },

    listActivationRequests: async (req, res) => {
      const q = req.query || {};
      const status = typeof q.status === 'string' ? q.status.trim() : '';
      const listQuery = {
        productTypeId: typeof q.productTypeId === 'string' ? q.productTypeId.trim() : '',
        q: typeof q.q === 'string' ? q.q.trim() : '',
        pageSize: q.pageSize,
        page: q.page,
        status: status && ['pending', 'approved', 'rejected'].includes(status) ? status : '',
      };
      const [result, productTypes] = await Promise.all([
        warrantyService.listWarrantyActivationRequestsForAdmin(listQuery),
        warrantyService.listProductTypesForAdmin(),
      ]);
      res.render('admin/warranty/activation-requests/list', {
        layout: 'layouts/adminLayout',
        title: 'Yêu cầu kích hoạt BH',
        items: result.items,
        productTypes,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
        filterStatus: listQuery.status,
        filterProductTypeId: listQuery.productTypeId,
        searchQ: listQuery.q,
        listQuery,
        listQs: (overrides) => adminListQs(listQuery, overrides),
      });
    },

    approveActivationRequest: async (req, res) => {
      try {
        await warrantyService.approveWarrantyActivationRequestAdmin(req.params.id);
        res.json({ ok: true, message: 'Đã duyệt và tạo sản phẩm bảo hành.' });
      } catch (e) {
        res.status(400).json({ error: activationRequestErr(e) });
      }
    },

    rejectActivationRequest: async (req, res) => {
      try {
        await warrantyService.rejectWarrantyActivationRequestAdmin(req.params.id, (req.body && req.body.note) || '');
        res.json({ ok: true, message: 'Đã từ chối yêu cầu.' });
      } catch (e) {
        res.status(400).json({ error: activationRequestErr(e) });
      }
    },

    updateActivationRequestSegment: async (req, res) => {
      try {
        await warrantyService.updateWarrantyActivationRequestSegmentAdmin(
          req.params.id,
          req.body && req.body.customerSegment,
        );
        res.json({ ok: true, message: 'Đã cập nhật phân loại kênh.' });
      } catch (e) {
        res.status(400).json({ error: activationRequestErr(e) });
      }
    },

    /** Trang công cụ: dán URL production → tạo QR (in / chụp màn hình), không phụ thuộc domain cũ. */
    qrToolPage: async (req, res) => {
      const suggestedUrl = suggestedActivationUrl(req);
      const formAction = qrFormActionFromReq(req);
      const pageTitle = qrToolTitleFromReq(req);
      res.render('admin/warranty/qr-tool', {
        layout: 'layouts/adminLayout',
        title: pageTitle,
        formAction,
        suggestedUrl,
        formUrl: suggestedUrl,
        qrDataUrl: null,
        targetUrl: null,
        qrSource: null,
        error: null,
      });
    },

    qrToolGenerate: async (req, res) => {
      const suggestedUrl = suggestedActivationUrl(req);
      const formAction = qrFormActionFromReq(req);
      const pageTitle = qrToolTitleFromReq(req);
      const action =
        req.body && req.body.action != null ? String(req.body.action).trim() : 'custom';

      const renderErr = (status, err, formUrlOverride) =>
        res.status(status).render('admin/warranty/qr-tool', {
          layout: 'layouts/adminLayout',
          title: pageTitle,
          formAction,
          suggestedUrl,
          formUrl: formUrlOverride != null ? formUrlOverride : suggestedUrl,
          qrDataUrl: null,
          targetUrl: null,
          qrSource: null,
          error: err,
        });

      const renderOk = async (href, formUrlForInput, qrSource) => {
        try {
          const qrDataUrl = await QRCode.toDataURL(href, {
            width: 320,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: { dark: '#047857', light: '#ffffff' },
          });
          return res.render('admin/warranty/qr-tool', {
            layout: 'layouts/adminLayout',
            title: pageTitle,
            formAction,
            suggestedUrl,
            formUrl: formUrlForInput,
            qrDataUrl,
            targetUrl: href,
            qrSource,
            error: null,
          });
        } catch (e) {
          return renderErr(500, e.message || 'Không tạo được mã QR.', formUrlForInput);
        }
      };

      /** Giống trang khách /warranty/ma-qr (PUBLIC_BASE_URL + /warranty/kich-hoat). */
      if (action === 'public_activation') {
        if (!suggestedUrl) {
          return renderErr(
            400,
            'Chưa xác định được URL công khai: đặt PUBLIC_BASE_URL trong .env (hoặc mở admin qua đúng host/port để hệ thống suy ra).',
            '',
          );
        }
        return renderOk(suggestedUrl, suggestedUrl, 'public_activation');
      }

      const raw = (req.body && req.body.url) != null ? String(req.body.url) : '';
      const parsed = parseQrTargetUrl(raw);
      if (!parsed.ok) {
        return renderErr(400, parsed.message, raw.trim());
      }
      return renderOk(parsed.href, parsed.href, 'custom');
    },
  };
};

module.exports = warrantyAdminController;
