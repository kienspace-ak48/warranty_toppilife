const CNAME = 'warranty.service.js ';
const mongoose = require('mongoose');
const slugify = require('slugify');
const WarrantyProductType = require('../models/warranty-product-type.model');
const WarrantyProduct = require('../models/warranty-product.model');
const WarrantyActivationRequest = require('../models/warranty-activation-request.model');
const {
  formatViDateTime: formatViDateTimeVN,
  formatViDateOnly: formatViDateOnlyVN,
  parseAdminDateTimeInput,
} = require('../utils/vnDateFormat');

class WarrantyService {
  constructor() {
    console.log(CNAME + 'initialized');
  }

  parseWarrantyDefaultDays(payload) {
    const raw = payload.warrantyDefaultDays;
    if (raw == null || String(raw).trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null;
  }

  parseShowOnPublicLookup(payload) {
    return !!(
      payload.showOnPublicLookup === 'on' ||
      payload.showOnPublicLookup === true ||
      payload.showOnPublicLookup === '1' ||
      payload.showOnPublicLookup === 'true'
    );
  }

  normalizeProductTypeSlug(rawSlug, name) {
    if (rawSlug && String(rawSlug).trim()) {
      return slugify(String(rawSlug).trim(), { lower: true, strict: true, locale: 'vi' });
    }
    if (name && String(name).trim()) {
      return slugify(String(name).trim(), { lower: true, strict: true, locale: 'vi' });
    }
    return '';
  }

  async listProductTypesForAdmin() {
    return WarrantyProductType.find().sort({ sortOrder: 1, name: 1 }).lean();
  }

  async getProductTypeByIdForAdmin(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return WarrantyProductType.findById(id).lean();
  }

  async createProductTypeAdmin(payload) {
    const name = String(payload.name || '').trim();
    if (!name) {
      const err = new Error('NAME_REQUIRED');
      err.code = 'NAME_REQUIRED';
      throw err;
    }
    const code = String(payload.code || '').trim();
    if (!code) {
      const err = new Error('CODE_REQUIRED');
      err.code = 'CODE_REQUIRED';
      throw err;
    }
    const dupCode = await WarrantyProductType.findOne({ code });
    if (dupCode) {
      const err = new Error('CODE_DUPLICATE');
      err.code = 'CODE_DUPLICATE';
      throw err;
    }
    const slug = this.normalizeProductTypeSlug(null, name);
    if (!slug) {
      const err = new Error('SLUG_REQUIRED');
      err.code = 'SLUG_REQUIRED';
      throw err;
    }
    const existsSlug = await WarrantyProductType.findOne({ slug });
    if (existsSlug) {
      const err = new Error('SLUG_DUPLICATE');
      err.code = 'SLUG_DUPLICATE';
      throw err;
    }
    const warrantyDefaultDays = this.parseWarrantyDefaultDays(payload);
    const warrantyMonths =
      warrantyDefaultDays != null
        ? Math.max(1, Math.ceil(warrantyDefaultDays / 30))
        : Math.max(1, Number(payload.warrantyMonths) || 12);
    const showOnPublicLookup = this.parseShowOnPublicLookup(payload);
    const doc = await WarrantyProductType.create({
      name,
      slug,
      code,
      warrantyMonths,
      warrantyDefaultDays,
      description: payload.description != null ? String(payload.description).trim() : '',
      imagePath: payload.imagePath != null ? String(payload.imagePath).trim() : '',
      imagePathBack: payload.imagePathBack != null ? String(payload.imagePathBack).trim() : '',
      sortOrder: Number(payload.sortOrder) || 0,
      isActive: true,
      showOnPublicLookup,
    });
    return doc.toObject();
  }

  async updateProductTypeAdmin(id, payload) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const doc = await WarrantyProductType.findById(id);
    if (!doc) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const name = payload.name != null ? String(payload.name).trim() : doc.name;
    if (!name) {
      const err = new Error('NAME_REQUIRED');
      err.code = 'NAME_REQUIRED';
      throw err;
    }
    const code = payload.code != null ? String(payload.code).trim() : doc.code || '';
    if (!code) {
      const err = new Error('CODE_REQUIRED');
      err.code = 'CODE_REQUIRED';
      throw err;
    }
    const dupCode = await WarrantyProductType.findOne({ code, _id: { $ne: id } });
    if (dupCode) {
      const err = new Error('CODE_DUPLICATE');
      err.code = 'CODE_DUPLICATE';
      throw err;
    }
    const slug = this.normalizeProductTypeSlug(null, name);
    if (!slug) {
      const err = new Error('SLUG_REQUIRED');
      err.code = 'SLUG_REQUIRED';
      throw err;
    }
    const dupSlug = await WarrantyProductType.findOne({ slug, _id: { $ne: id } });
    if (dupSlug) {
      const err = new Error('SLUG_DUPLICATE');
      err.code = 'SLUG_DUPLICATE';
      throw err;
    }
    doc.name = name;
    doc.slug = slug;
    doc.code = code;
    const daysUpd = this.parseWarrantyDefaultDays(payload);
    if (daysUpd != null) {
      doc.warrantyDefaultDays = daysUpd;
      doc.warrantyMonths = Math.max(1, Math.ceil(daysUpd / 30));
    } else {
      if (payload.warrantyDefaultDays !== undefined && String(payload.warrantyDefaultDays).trim() === '') {
        doc.warrantyDefaultDays = null;
      }
      if (payload.warrantyMonths !== undefined) {
        doc.warrantyMonths = Math.max(1, Number(payload.warrantyMonths) || doc.warrantyMonths);
      }
    }
    if (payload.description !== undefined) doc.description = String(payload.description).trim();
    if (payload.imagePath !== undefined) doc.imagePath = String(payload.imagePath).trim();
    if (payload.imagePathBack !== undefined) doc.imagePathBack = String(payload.imagePathBack).trim();
    if (payload.sortOrder !== undefined) doc.sortOrder = Number(payload.sortOrder) || 0;
    doc.showOnPublicLookup = this.parseShowOnPublicLookup(payload);
    await doc.save();
    return doc.toObject();
  }

  async updateProductTypeWarrantyModeAdmin(id, payload) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const doc = await WarrantyProductType.findById(id);
    if (!doc) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    doc.useTypeWarrantyPeriod = this.parseUseTypeWarrantyPeriodForType(payload);
    await doc.save();
    return { useTypeWarrantyPeriod: doc.useTypeWarrantyPeriod };
  }

  /** Radio 1/0 hoặc checkbox on — mặc định true (tính BH theo loại). */
  parseUseTypeWarrantyPeriodForType(payload) {
    const v = payload.useTypeWarrantyPeriod;
    if (v === '0' || v === 0 || v === false || String(v).toLowerCase() === 'false') return false;
    if (v === '1' || v === 1 || v === true || v === 'on' || String(v).toLowerCase() === 'true') return true;
    return true;
  }

  async deleteProductTypeAdmin(id) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const deleted = await WarrantyProductType.findByIdAndDelete(id);
    if (!deleted) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    return { mode: 'deleted' };
  }

  getWarrantyPeriodDaysFromType(pt) {
    if (!pt) return 360;
    if (pt.warrantyDefaultDays != null && pt.warrantyDefaultDays >= 1) {
      return Math.floor(pt.warrantyDefaultDays);
    }
    return Math.max(1, Number(pt.warrantyMonths) || 12) * 30;
  }

  computeWarrantyEndDate(purchaseDate, productType) {
    const t = purchaseDate instanceof Date ? purchaseDate : new Date(purchaseDate);
    if (Number.isNaN(t.getTime())) return null;
    const days = this.getWarrantyPeriodDaysFromType(productType);
    return new Date(t.getTime() + days * 24 * 60 * 60 * 1000);
  }

  formatViDateTime(d) {
    return formatViDateTimeVN(d);
  }

  formatViDateOnly(d) {
    return formatViDateOnlyVN(d);
  }

  getWarrantyStartDate(row) {
    if (row.warrantyActivatedAt) {
      const a = new Date(row.warrantyActivatedAt);
      if (!Number.isNaN(a.getTime())) return a;
    }
    const p = new Date(row.purchaseDate);
    return Number.isNaN(p.getTime()) ? null : p;
  }

  enrichWarrantyProductRow(row) {
    const pt = row.productTypeId && typeof row.productTypeId === 'object' ? row.productTypeId : null;
    const useType = !pt || pt.useTypeWarrantyPeriod !== false;
    let warrantyEndDate = null;
    let warrantyDaysUsed = null;
    if (useType) {
      const start = this.getWarrantyStartDate(row);
      warrantyEndDate = pt && start ? this.computeWarrantyEndDate(start, pt) : null;
      warrantyDaysUsed = pt ? this.getWarrantyPeriodDaysFromType(pt) : null;
    } else {
      const we = row.warrantyPeriodEnd ? new Date(row.warrantyPeriodEnd) : null;
      warrantyEndDate = we && !Number.isNaN(we.getTime()) ? we : null;
      warrantyDaysUsed = null;
    }
    const logs = Array.isArray(row.deviceLogs) ? this.sortDeviceLogsForDisplay(row.deviceLogs) : [];
    return {
      ...row,
      customerSegment: row.customerSegment || 'retail',
      deviceStatus: row.deviceStatus || 'in_warranty',
      deviceLogs: logs,
      warrantyEndDate,
      warrantyDaysUsed,
      usesTypeWarrantyPeriod: useType,
    };
  }

  parsePurchaseDate(payload) {
    const raw = payload.purchaseDate != null ? String(payload.purchaseDate).trim() : '';
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** Ngày (YYYY-MM-DD) hoặc datetime/ISO; rỗng → null */
  parseWarrantyActivatedAt(payload) {
    const raw = payload.warrantyActivatedAt != null ? String(payload.warrantyActivatedAt).trim() : '';
    if (!raw) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const day = Number(m[3]);
      const dt = new Date(y, mo, day, 12, 0, 0, 0);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  parseCustomerSegment(payload) {
    const v = String(payload.customerSegment || 'retail').trim();
    const ok = ['retail', 'dealer', 'agent'];
    if (!ok.includes(v)) {
      const err = new Error('CUSTOMER_SEGMENT_INVALID');
      err.code = 'CUSTOMER_SEGMENT_INVALID';
      throw err;
    }
    return v;
  }

  parseDeviceStatus(payload, fallback) {
    const v = String(payload.deviceStatus != null ? payload.deviceStatus : fallback || 'in_warranty').trim();
    const ok = ['active', 'in_warranty', 'warranty_expired', 'in_repair', 'replaced', 'inactive'];
    if (!ok.includes(v)) {
      const err = new Error('DEVICE_STATUS_INVALID');
      err.code = 'DEVICE_STATUS_INVALID';
      throw err;
    }
    return v;
  }

  /** Thêm log admin: mặc định hiển thị cho khách (true) trừ khi gửi logVisibleToCustomer=0 */
  parseLogVisibleToCustomer(payload) {
    const x = payload.logVisibleToCustomer;
    if (x === '0' || x === 0 || x === false || String(x).toLowerCase() === 'false') return false;
    return true;
  }

  /**
   * Hiển thị: bán/xuất → kích hoạt BH → ghi nhận (admin); cùng loại sắp theo ngày (cũ → mới).
   */
  sortDeviceLogsForDisplay(logs) {
    const kindOrder = { sale: 0, activation: 1, admin: 2 };
    return [...(logs || [])].sort((a, b) => {
      const ka = kindOrder[a.kind] ?? 99;
      const kb = kindOrder[b.kind] ?? 99;
      if (ka !== kb) return ka - kb;
      const ta = new Date(a.at).getTime();
      const tb = new Date(b.at).getTime();
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return ta - tb;
    });
  }

  buildInitialDeviceLogs(purchaseDate, warrantyActivatedAt, manualStart, manualEnd) {
    const saleAt = purchaseDate;
    const logs = [
      {
        at: saleAt,
        kind: 'sale',
        message: `Ghi nhận bán / xuất: ${this.formatViDateOnly(saleAt)}`,
        visibleToCustomer: true,
      },
    ];
    if (manualStart && manualEnd) {
      const ms = manualStart instanceof Date ? manualStart : new Date(manualStart);
      const me = manualEnd instanceof Date ? manualEnd : new Date(manualEnd);
      logs.push({
        at: ms,
        kind: 'activation',
        message: `Bảo hành ghi nhận: từ ${this.formatViDateOnly(ms)} đến ${this.formatViDateOnly(me)}`,
        visibleToCustomer: true,
      });
    } else {
      const actAt = warrantyActivatedAt || purchaseDate;
      logs.push({
        at: actAt,
        kind: 'activation',
        message: `Kích hoạt bảo hành: ${this.formatViDateOnly(actAt)}`,
        visibleToCustomer: true,
      });
    }
    return logs;
  }

  _parsePaginationQuery(query, defaultPageSize = 25, maxPageSize = 100) {
    const raw = query || {};
    let page = parseInt(raw.page, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    let pageSize = parseInt(raw.pageSize, 10);
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = defaultPageSize;
    if (pageSize > maxPageSize) pageSize = maxPageSize;
    return { page, pageSize, skip: (page - 1) * pageSize };
  }

  _escapeRegex(s) {
    return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Danh sách SP BH (admin): lọc loại, tìm theo tên/SĐT/serial, phân trang.
   */
  async listWarrantyProductsForAdmin(query) {
    const filter = {};
    const ptFilter = query && query.productTypeId;
    if (ptFilter && mongoose.isValidObjectId(String(ptFilter).trim())) {
      filter.productTypeId = String(ptFilter).trim();
    }
    const qRaw = query && query.q != null ? String(query.q).trim() : '';
    if (qRaw) {
      const rx = new RegExp(this._escapeRegex(qRaw), 'i');
      filter.$or = [{ customerName: rx }, { customerPhone: rx }, { serialNumber: rx }];
    }
    let { page, pageSize, skip } = this._parsePaginationQuery(query);
    const total = await WarrantyProduct.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > totalPages) {
      page = totalPages;
      skip = (page - 1) * pageSize;
    }
    const rows = await WarrantyProduct.find(filter)
      .populate('productTypeId', 'name code slug warrantyMonths warrantyDefaultDays useTypeWarrantyPeriod')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();
    const items = rows.map((r) => this.enrichWarrantyProductRow(r));
    return { items, total, page, pageSize, totalPages };
  }

  async getWarrantyProductByIdForAdmin(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const row = await WarrantyProduct.findById(id)
      .populate('productTypeId', 'name code slug warrantyMonths warrantyDefaultDays useTypeWarrantyPeriod')
      .lean();
    return row ? this.enrichWarrantyProductRow(row) : null;
  }

  async assertProductTypeExists(id) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('PRODUCT_TYPE_NOT_FOUND');
      err.code = 'PRODUCT_TYPE_NOT_FOUND';
      throw err;
    }
    const pt = await WarrantyProductType.findById(id).lean();
    if (!pt) {
      const err = new Error('PRODUCT_TYPE_NOT_FOUND');
      err.code = 'PRODUCT_TYPE_NOT_FOUND';
      throw err;
    }
    return pt;
  }

  async createWarrantyProductAdmin(payload) {
    const productTypeId = String(payload.productTypeId || '').trim();
    const pt = await this.assertProductTypeExists(productTypeId);
    const useType = pt.useTypeWarrantyPeriod !== false;
    const customerName = String(payload.customerName || '').trim();
    if (!customerName) {
      const err = new Error('CUSTOMER_NAME_REQUIRED');
      err.code = 'CUSTOMER_NAME_REQUIRED';
      throw err;
    }
    const customerPhone = String(payload.customerPhone || '').trim();
    if (!customerPhone) {
      const err = new Error('CUSTOMER_PHONE_REQUIRED');
      err.code = 'CUSTOMER_PHONE_REQUIRED';
      throw err;
    }
    const purchaseDate = this.parsePurchaseDate(payload);
    if (!purchaseDate) {
      const err = new Error('PURCHASE_DATE_INVALID');
      err.code = 'PURCHASE_DATE_INVALID';
      throw err;
    }
    const warrantyActivatedAtRaw = this.parseWarrantyActivatedAt(payload);
    const warrantyActivatedAt =
      warrantyActivatedAtRaw && !Number.isNaN(warrantyActivatedAtRaw.getTime())
        ? warrantyActivatedAtRaw
        : null;
    const customerSegment = this.parseCustomerSegment(payload);
    const deviceStatus = this.parseDeviceStatus(payload, 'in_warranty');
    const serialNumber = payload.serialNumber != null ? String(payload.serialNumber).trim() : '';
    if (serialNumber) {
      const dup = await WarrantyProduct.findOne({ productTypeId, serialNumber });
      if (dup) {
        const err = new Error('SERIAL_DUPLICATE');
        err.code = 'SERIAL_DUPLICATE';
        throw err;
      }
    }
    let warrantyPeriodStart = null;
    let warrantyPeriodEnd = null;
    let deviceLogs;
    if (useType) {
      deviceLogs = this.buildInitialDeviceLogs(purchaseDate, warrantyActivatedAt, null, null);
    } else {
      warrantyPeriodStart = this.parsePurchaseDate({ purchaseDate: payload.warrantyPeriodStart });
      warrantyPeriodEnd = this.parsePurchaseDate({ purchaseDate: payload.warrantyPeriodEnd });
      if (!warrantyPeriodStart || !warrantyPeriodEnd) {
        const err = new Error('WARRANTY_MANUAL_DATES_REQUIRED');
        err.code = 'WARRANTY_MANUAL_DATES_REQUIRED';
        throw err;
      }
      if (warrantyPeriodEnd.getTime() < warrantyPeriodStart.getTime()) {
        const err = new Error('WARRANTY_END_BEFORE_START');
        err.code = 'WARRANTY_END_BEFORE_START';
        throw err;
      }
      deviceLogs = this.buildInitialDeviceLogs(
        purchaseDate,
        warrantyActivatedAt,
        warrantyPeriodStart,
        warrantyPeriodEnd,
      );
    }
    let doc;
    try {
      doc = await WarrantyProduct.create({
        productTypeId,
        customerSegment,
        deviceStatus,
        customerName,
        customerPhone,
        customerEmail: payload.customerEmail != null ? String(payload.customerEmail).trim() : '',
        customerAddress: payload.customerAddress != null ? String(payload.customerAddress).trim() : '',
        serialNumber,
        purchaseDate,
        warrantyActivatedAt,
        warrantyPeriodStart,
        warrantyPeriodEnd,
        notes: payload.notes != null ? String(payload.notes).trim() : '',
        deviceLogs,
      });
    } catch (e) {
      if (e && e.code === 11000) {
        const err = new Error('SERIAL_DUPLICATE');
        err.code = 'SERIAL_DUPLICATE';
        throw err;
      }
      throw e;
    }
    return this.getWarrantyProductByIdForAdmin(doc._id.toString());
  }

  async updateWarrantyProductAdmin(id, payload) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const doc = await WarrantyProduct.findById(id);
    if (!doc) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    let productTypeId = doc.productTypeId;
    if (payload.productTypeId != null) {
      const nextPt = String(payload.productTypeId).trim();
      await this.assertProductTypeExists(nextPt);
      productTypeId = nextPt;
    }
    if (payload.customerName !== undefined) {
      const v = String(payload.customerName).trim();
      if (!v) {
        const err = new Error('CUSTOMER_NAME_REQUIRED');
        err.code = 'CUSTOMER_NAME_REQUIRED';
        throw err;
      }
      doc.customerName = v;
    }
    if (payload.customerPhone !== undefined) {
      const v = String(payload.customerPhone).trim();
      if (!v) {
        const err = new Error('CUSTOMER_PHONE_REQUIRED');
        err.code = 'CUSTOMER_PHONE_REQUIRED';
        throw err;
      }
      doc.customerPhone = v;
    }
    if (payload.customerEmail !== undefined) doc.customerEmail = String(payload.customerEmail).trim();
    if (payload.customerAddress !== undefined) doc.customerAddress = String(payload.customerAddress).trim();
    if (payload.customerSegment !== undefined) {
      doc.customerSegment = this.parseCustomerSegment({ ...payload, customerSegment: payload.customerSegment });
    }
    if (payload.deviceStatus !== undefined) {
      doc.deviceStatus = this.parseDeviceStatus(payload, doc.deviceStatus);
    }
    if (payload.warrantyActivatedAt !== undefined) {
      const raw = String(payload.warrantyActivatedAt || '').trim();
      doc.warrantyActivatedAt = raw ? this.parseWarrantyActivatedAt({ warrantyActivatedAt: raw }) : null;
    }
    const serialNumber =
      payload.serialNumber !== undefined ? String(payload.serialNumber).trim() : doc.serialNumber || '';
    if (serialNumber) {
      const dup = await WarrantyProduct.findOne({
        productTypeId,
        serialNumber,
        _id: { $ne: doc._id },
      });
      if (dup) {
        const err = new Error('SERIAL_DUPLICATE');
        err.code = 'SERIAL_DUPLICATE';
        throw err;
      }
    }
    doc.serialNumber = serialNumber;
    if (payload.purchaseDate !== undefined) {
      const d = this.parsePurchaseDate({ purchaseDate: payload.purchaseDate });
      if (!d) {
        const err = new Error('PURCHASE_DATE_INVALID');
        err.code = 'PURCHASE_DATE_INVALID';
        throw err;
      }
      doc.purchaseDate = d;
    }
    if (payload.notes !== undefined) doc.notes = String(payload.notes).trim();
    doc.productTypeId = productTypeId;

    const pt = await this.assertProductTypeExists(String(productTypeId));
    const useType = pt.useTypeWarrantyPeriod !== false;
    if (useType) {
      doc.warrantyPeriodStart = null;
      doc.warrantyPeriodEnd = null;
    } else {
      let ws =
        doc.warrantyPeriodStart != null ? new Date(doc.warrantyPeriodStart) : null;
      let we = doc.warrantyPeriodEnd != null ? new Date(doc.warrantyPeriodEnd) : null;
      if (payload.warrantyPeriodStart !== undefined) {
        const raw = String(payload.warrantyPeriodStart || '').trim();
        ws = raw ? this.parsePurchaseDate({ purchaseDate: raw }) : null;
      }
      if (payload.warrantyPeriodEnd !== undefined) {
        const raw = String(payload.warrantyPeriodEnd || '').trim();
        we = raw ? this.parsePurchaseDate({ purchaseDate: raw }) : null;
      }
      if (!ws || !we) {
        const err = new Error('WARRANTY_MANUAL_DATES_REQUIRED');
        err.code = 'WARRANTY_MANUAL_DATES_REQUIRED';
        throw err;
      }
      if (we.getTime() < ws.getTime()) {
        const err = new Error('WARRANTY_END_BEFORE_START');
        err.code = 'WARRANTY_END_BEFORE_START';
        throw err;
      }
      doc.warrantyPeriodStart = ws;
      doc.warrantyPeriodEnd = we;
    }

    const appendMsg = payload.appendLogMessage != null ? String(payload.appendLogMessage).trim() : '';
    if (appendMsg) {
      doc.deviceLogs.push({
        at: new Date(),
        kind: 'admin',
        message: appendMsg,
        visibleToCustomer: this.parseLogVisibleToCustomer(payload),
      });
    }
    try {
      await doc.save();
    } catch (e) {
      if (e && e.code === 11000) {
        const err = new Error('SERIAL_DUPLICATE');
        err.code = 'SERIAL_DUPLICATE';
        throw err;
      }
      throw e;
    }
    return this.getWarrantyProductByIdForAdmin(id);
  }

  async updateWarrantyProductLogAdmin(productId, logId, payload) {
    if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(logId)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const doc = await WarrantyProduct.findById(productId);
    if (!doc) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const sub = doc.deviceLogs.id(logId);
    if (!sub) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const msg = payload.message != null ? String(payload.message).trim() : '';
    if (!msg) {
      const err = new Error('LOG_MESSAGE_REQUIRED');
      err.code = 'LOG_MESSAGE_REQUIRED';
      throw err;
    }
    sub.message = msg;
    sub.visibleToCustomer = this.parseLogVisibleToCustomer(payload);
    const rawAt = payload.at != null ? String(payload.at).trim() : '';
    if (!rawAt) {
      const err = new Error('LOG_AT_INVALID');
      err.code = 'LOG_AT_INVALID';
      throw err;
    }
    const atDate = parseAdminDateTimeInput(rawAt);
    if (!atDate) {
      const err = new Error('LOG_AT_INVALID');
      err.code = 'LOG_AT_INVALID';
      throw err;
    }
    sub.at = atDate;
    await doc.save();
    return this.getWarrantyProductByIdForAdmin(productId);
  }

  async deleteWarrantyProductLogAdmin(productId, logId) {
    if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(logId)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const doc = await WarrantyProduct.findById(productId);
    if (!doc) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const sub = doc.deviceLogs.id(logId);
    if (!sub) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    sub.deleteOne();
    await doc.save();
    return this.getWarrantyProductByIdForAdmin(productId);
  }

  async deleteWarrantyProductAdmin(id) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const deleted = await WarrantyProduct.findByIdAndDelete(id);
    if (!deleted) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    return { mode: 'deleted' };
  }

  normalizePhoneDigits(v) {
    return String(v || '').replace(/\D/g, '');
  }

  /** Loại SP hiển thị trên tra cứu công khai (có ảnh minh họa). */
  async listProductTypesForPublicLookup() {
    return WarrantyProductType.find({
      isActive: { $ne: false },
      showOnPublicLookup: { $ne: false },
    })
      .sort({ sortOrder: 1, name: 1 })
      .select('name code slug imagePath imagePathBack description warrantyMonths warrantyDefaultDays')
      .lean();
  }

  /** Loại SP đang bật — chọn khi khách gửi yêu cầu kích hoạt online. */
  async listProductTypesForPublicActivation() {
    return WarrantyProductType.find({ isActive: { $ne: false } })
      .sort({ sortOrder: 1, name: 1 })
      .select('name code')
      .lean();
  }

  /**
   * Khối lật ảnh hướng dẫn serial — cùng nguồn với trang chủ (tra cứu công khai, có imagePath / imagePathBack).
   * Khác `listProductTypesForPublicActivation` (chỉ name/code cho dropdown).
   * Khi DB trống và bật WARRANTY_MOCK_SERIAL_GUIDE → trả mảng demo để dev xem layout.
   */
  async getProductTypesForSerialGuideShowcase() {
    const rows = await this.listProductTypesForPublicLookup();
    const mockEnv = process.env.WARRANTY_MOCK_SERIAL_GUIDE;
    const useMock =
      (!rows || !rows.length) &&
      (mockEnv === '1' || mockEnv === 'true' || mockEnv === 'yes');
    if (useMock) return this.getMockSerialGuideProductTypes();
    return rows || [];
  }

  /** Hai loại demo — ảnh trỏ /assets/image/logo.png (cùng file header). */
  getMockSerialGuideProductTypes() {
    const placeholder = '/assets/image/logo.png';
    return [
      {
        _id: '000000000000000000000001',
        name: '(Demo) Thiết bị ví dụ A — ToppiLife',
        code: 'DEMO-A',
        slug: 'demo-a',
        imagePath: placeholder,
        imagePathBack: placeholder,
      },
      {
        _id: '000000000000000000000002',
        name: '(Demo) Thiết bị ví dụ B — ToppiLife',
        code: 'DEMO-B',
        slug: 'demo-b',
        imagePath: placeholder,
        imagePathBack: placeholder,
      },
    ];
  }

  /**
   * Một ô tra cứu: khớp serial chính xác trước, không có kết quả thì tra theo SĐT (cùng logic normalize).
   */
  async lookupWarrantyProductsForPublicCombined(qRaw) {
    const q = String(qRaw || '').trim();
    if (!q) return [];
    const serialRows = await WarrantyProduct.find({ serialNumber: q })
      .populate('productTypeId', 'name code useTypeWarrantyPeriod warrantyMonths warrantyDefaultDays')
      .lean();
    if (serialRows && serialRows.length) {
      return serialRows.map((r) => this.toPublicWarrantyProductView(r));
    }
    return this.lookupWarrantyProductsForPublic(q, '');
  }

  /**
   * Tra cứu theo serial (ưu tiên) hoặc SĐT (so khớp số sau khi bỏ ký tự không phải số).
   */
  async lookupWarrantyProductsForPublic(phoneRaw, serialRaw) {
    const serial = String(serialRaw || '').trim();
    if (serial) {
      const rows = await WarrantyProduct.find({ serialNumber: serial })
        .populate('productTypeId', 'name code useTypeWarrantyPeriod warrantyMonths warrantyDefaultDays')
        .lean();
      return rows.map((r) => this.toPublicWarrantyProductView(r));
    }
    const digits = this.normalizePhoneDigits(phoneRaw);
    if (!digits || digits.length < 8) return [];
    const last9 = digits.slice(-9);
    const variants = [
      ...new Set([
        String(phoneRaw || '').trim(),
        digits,
        '0' + last9,
        '84' + last9,
        '+84' + last9,
      ]),
    ].filter(Boolean);
    const rows = await WarrantyProduct.find({ customerPhone: { $in: variants } })
      .populate('productTypeId', 'name code useTypeWarrantyPeriod warrantyMonths warrantyDefaultDays')
      .lean();
    const matched = rows.filter((r) => this.normalizePhoneDigits(r.customerPhone) === digits);
    return matched.map((r) => this.toPublicWarrantyProductView(r));
  }

  toPublicWarrantyProductView(row) {
    const enriched = this.enrichWarrantyProductRow(row);
    const pt = row.productTypeId && typeof row.productTypeId === 'object' ? row.productTypeId : null;
    const logs = this.sortDeviceLogsForDisplay(
      (row.deviceLogs || []).filter((l) => l.visibleToCustomer !== false),
    ).map((l) => ({
        at: l.at,
        kind: l.kind,
        message: l.message,
      }));
    return {
      _id: row._id,
      serialNumber: row.serialNumber || '',
      customerName: row.customerName,
      customerPhoneMasked: this.maskPhoneForPublic(row.customerPhone),
      purchaseDate: row.purchaseDate,
      warrantyEndDate: enriched.warrantyEndDate,
      productTypeName: pt ? pt.name : '',
      productTypeCode: pt ? pt.code : '',
      deviceLogs: logs,
    };
  }

  maskPhoneForPublic(phone) {
    const s = String(phone || '').trim();
    if (s.length < 6) return '—';
    return s.slice(0, 3) + '****' + s.slice(-3);
  }

  _dateToYmdLocal(d) {
    const t = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(t.getTime())) return '';
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const day = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async submitWarrantyActivationRequestPublic(payload) {
    const productTypeId = String(payload.productTypeId || '').trim();
    if (!productTypeId) {
      const err = new Error('PRODUCT_TYPE_REQUIRED');
      err.code = 'PRODUCT_TYPE_REQUIRED';
      throw err;
    }
    await this.assertProductTypeExists(productTypeId);
    const orderCode = String(payload.orderCode || '').trim();
    const serialNumber = String(payload.serialNumber || '').trim();
    const customerName = String(payload.customerName || '').trim();
    const customerPhone = String(payload.customerPhone || '').trim();
    const customerAddress = payload.customerAddress != null ? String(payload.customerAddress).trim() : '';
    if (!orderCode) {
      const err = new Error('ORDER_CODE_REQUIRED');
      err.code = 'ORDER_CODE_REQUIRED';
      throw err;
    }
    if (!serialNumber) {
      const err = new Error('SERIAL_REQUIRED');
      err.code = 'SERIAL_REQUIRED';
      throw err;
    }
    if (!customerName) {
      const err = new Error('CUSTOMER_NAME_REQUIRED');
      err.code = 'CUSTOMER_NAME_REQUIRED';
      throw err;
    }
    if (!customerPhone) {
      const err = new Error('CUSTOMER_PHONE_REQUIRED');
      err.code = 'CUSTOMER_PHONE_REQUIRED';
      throw err;
    }
    const dupProduct = await WarrantyProduct.findOne({ productTypeId, serialNumber }).lean();
    if (dupProduct) {
      const err = new Error('SERIAL_ALREADY_REGISTERED');
      err.code = 'SERIAL_ALREADY_REGISTERED';
      throw err;
    }
    const dupPending = await WarrantyActivationRequest.findOne({
      productTypeId,
      serialNumber,
      status: 'pending',
    }).lean();
    if (dupPending) {
      const err = new Error('PENDING_REQUEST_EXISTS');
      err.code = 'PENDING_REQUEST_EXISTS';
      throw err;
    }
    const doc = await WarrantyActivationRequest.create({
      productTypeId,
      orderCode,
      serialNumber,
      customerName,
      customerPhone,
      customerAddress,
      status: 'pending',
    });
    return { id: doc._id.toString() };
  }

  /**
   * Yêu cầu kích hoạt (admin): lọc trạng thái + loại SP, tìm theo mã đơn/serial/tên/SĐT, phân trang.
   */
  async listWarrantyActivationRequestsForAdmin(filter = {}) {
    const q = {};
    if (filter.status && ['pending', 'approved', 'rejected'].includes(filter.status)) {
      q.status = filter.status;
    }
    const ptId = filter.productTypeId && String(filter.productTypeId).trim();
    if (ptId && mongoose.isValidObjectId(ptId)) {
      q.productTypeId = ptId;
    }
    const qRaw = filter.q != null ? String(filter.q).trim() : '';
    if (qRaw) {
      const rx = new RegExp(this._escapeRegex(qRaw), 'i');
      q.$or = [
        { orderCode: rx },
        { serialNumber: rx },
        { customerName: rx },
        { customerPhone: rx },
      ];
    }
    let { page, pageSize, skip } = this._parsePaginationQuery(filter);
    const total = await WarrantyActivationRequest.countDocuments(q);
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > totalPages) {
      page = totalPages;
      skip = (page - 1) * pageSize;
    }
    const rows = await WarrantyActivationRequest.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('productTypeId', 'name code useTypeWarrantyPeriod warrantyMonths warrantyDefaultDays')
      .populate('resolvedWarrantyProductId', 'serialNumber')
      .lean();
    return { items: rows, total, page, pageSize, totalPages };
  }

  async approveWarrantyActivationRequestAdmin(id) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const reqDoc = await WarrantyActivationRequest.findById(id);
    if (!reqDoc) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (reqDoc.status !== 'pending') {
      const err = new Error('NOT_PENDING');
      err.code = 'NOT_PENDING';
      throw err;
    }
    const pt = await this.assertProductTypeExists(reqDoc.productTypeId.toString());
    const today = new Date();
    const purchaseDateStr = this._dateToYmdLocal(today);
    const useType = pt.useTypeWarrantyPeriod !== false;
    const notes = `[Kích hoạt online — yêu cầu ${reqDoc._id}] Mã đơn: ${reqDoc.orderCode}`;
    const payload = {
      productTypeId: reqDoc.productTypeId.toString(),
      customerName: reqDoc.customerName,
      customerPhone: reqDoc.customerPhone,
      customerAddress: reqDoc.customerAddress || '',
      serialNumber: reqDoc.serialNumber,
      purchaseDate: purchaseDateStr,
      warrantyActivatedAt: purchaseDateStr,
      customerSegment: ['retail', 'dealer', 'agent'].includes(reqDoc.customerSegment)
        ? reqDoc.customerSegment
        : 'retail',
      notes,
    };
    if (!useType) {
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
      const days = this.getWarrantyPeriodDaysFromType(pt);
      const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
      payload.warrantyPeriodStart = this._dateToYmdLocal(start);
      payload.warrantyPeriodEnd = this._dateToYmdLocal(end);
    }
    let created;
    try {
      created = await this.createWarrantyProductAdmin(payload);
    } catch (e) {
      if (e.code === 'SERIAL_DUPLICATE') {
        const err = new Error('SERIAL_CONFLICT_ON_APPROVE');
        err.code = 'SERIAL_CONFLICT_ON_APPROVE';
        throw err;
      }
      throw e;
    }
    reqDoc.status = 'approved';
    reqDoc.reviewedAt = new Date();
    reqDoc.adminNote = '';
    reqDoc.resolvedWarrantyProductId = created._id;
    reqDoc.segmentLockedFromList = true;
    await reqDoc.save();
    return { ok: true, warrantyProductId: created._id.toString() };
  }

  async rejectWarrantyActivationRequestAdmin(id, note) {
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const reqDoc = await WarrantyActivationRequest.findById(id);
    if (!reqDoc) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (reqDoc.status !== 'pending') {
      const err = new Error('NOT_PENDING');
      err.code = 'NOT_PENDING';
      throw err;
    }
    reqDoc.status = 'rejected';
    reqDoc.reviewedAt = new Date();
    reqDoc.adminNote = note != null ? String(note).trim().slice(0, 2000) : '';
    reqDoc.segmentLockedFromList = true;
    await reqDoc.save();
    return { ok: true };
  }

  /** Cập nhật phân loại kênh từ danh sách yêu cầu — chỉ khi còn pending và chưa khóa; một lần rồi khóa. Đã duyệt/từ chối → sửa qua SP. */
  async updateWarrantyActivationRequestSegmentAdmin(id, segmentRaw) {
    const allowed = new Set(['retail', 'dealer', 'agent']);
    const seg = segmentRaw != null ? String(segmentRaw).trim() : '';
    if (!allowed.has(seg)) {
      const err = new Error('INVALID_SEGMENT');
      err.code = 'INVALID_SEGMENT';
      throw err;
    }
    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const reqDoc = await WarrantyActivationRequest.findById(id);
    if (!reqDoc) {
      const err = new Error('NOT_FOUND');
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (reqDoc.status !== 'pending') {
      const err = new Error('SEGMENT_LOCKED_LIST');
      err.code = 'SEGMENT_LOCKED_LIST';
      throw err;
    }
    if (reqDoc.segmentLockedFromList) {
      const err = new Error('SEGMENT_LOCKED_LIST');
      err.code = 'SEGMENT_LOCKED_LIST';
      throw err;
    }
    reqDoc.customerSegment = seg;
    reqDoc.segmentLockedFromList = true;
    await reqDoc.save();
    if (reqDoc.resolvedWarrantyProductId) {
      await WarrantyProduct.updateOne(
        { _id: reqDoc.resolvedWarrantyProductId },
        { $set: { customerSegment: seg } },
      );
    }
    return { ok: true };
  }

  _parseYmdBoundary(str, endOfDay) {
    const raw = str != null ? String(str).trim() : '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** Ngày từ ô Excel / chuỗi (YYYY-MM-DD, DD/MM/YYYY, ISO). */
  parseFlexibleExcelDate(val) {
    if (val == null || val === '') return null;
    if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
    if (typeof val === 'number' && Number.isFinite(val) && val > 20000 && val < 1000000) {
      const utc = (val - 25569) * 86400 * 1000;
      const d = new Date(utc);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const s = String(val).trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0, 0);
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  async findProductTypeByCodeForImport(codeRaw) {
    const c = String(codeRaw || '').trim();
    if (!c) return null;
    return WarrantyProductType.findOne({
      code: new RegExp(`^${this._escapeRegex(c)}$`, 'i'),
    }).lean();
  }

  /**
   * Ngày bắt đầu / kết thúc BH cho file Excel: trùng logic hiển thị (enrich).
   * — Theo loại SP: tính từ ngày kích hoạt hoặc ngày mua + cấu hình loại (DB thường không lưu 2 field tay).
   * — Nhập tay: lấy warrantyPeriodStart / End trên document.
   */
  _excelWarrantyPeriodStrings(row, pt) {
    const useType = !pt || pt.useTypeWarrantyPeriod !== false;
    if (!useType) {
      return {
        wsStr: row.warrantyPeriodStart ? this._dateToYmdLocal(row.warrantyPeriodStart) : '',
        weStr: row.warrantyPeriodEnd ? this._dateToYmdLocal(row.warrantyPeriodEnd) : '',
      };
    }
    const start = this.getWarrantyStartDate(row);
    const end = start && pt ? this.computeWarrantyEndDate(start, pt) : null;
    return {
      wsStr: start ? this._dateToYmdLocal(start) : '',
      weStr: end ? this._dateToYmdLocal(end) : '',
    };
  }

  /**
   * Xuất Excel (.xlsx) — lọc theo purchaseDate hoặc createdAt trong [from, to] (YYYY-MM-DD).
   */
  async exportWarrantyProductsExcelBuffer({ fromStr, toStr, dateField }) {
    const XLSX = require('xlsx');
    const from = this._parseYmdBoundary(fromStr, false);
    const to = this._parseYmdBoundary(toStr, true);
    if (!from || !to) {
      const err = new Error('Chọn đủ ngày bắt đầu và ngày kết thúc (định dạng YYYY-MM-DD).');
      err.code = 'EXPORT_RANGE_INVALID';
      throw err;
    }
    if (from.getTime() > to.getTime()) {
      const err = new Error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      err.code = 'EXPORT_RANGE_INVALID';
      throw err;
    }
    const field = dateField === 'createdAt' ? 'createdAt' : 'purchaseDate';
    const rows = await WarrantyProduct.find({
      [field]: { $gte: from, $lte: to },
    })
      .populate('productTypeId', 'name code useTypeWarrantyPeriod warrantyMonths warrantyDefaultDays')
      .sort({ [field]: -1 })
      .lean();

    const headers = [
      'productTypeCode',
      'productTypeId',
      'customerName',
      'customerPhone',
      'serialNumber',
      'purchaseDate',
      'customerSegment',
      'deviceStatus',
      'customerEmail',
      'customerAddress',
      'notes',
      'warrantyPeriodStart',
      'warrantyPeriodEnd',
    ];

    const aoa = [headers];
    for (const row of rows) {
      const pt = row.productTypeId && typeof row.productTypeId === 'object' ? row.productTypeId : null;
      const ptId = pt ? String(pt._id || row.productTypeId) : String(row.productTypeId || '');
      const code = pt ? String(pt.code || '').trim() : '';
      const purchaseStr = row.purchaseDate ? this._dateToYmdLocal(row.purchaseDate) : '';
      const { wsStr, weStr } = this._excelWarrantyPeriodStrings(row, pt);
      aoa.push([
        code,
        ptId,
        row.customerName || '',
        row.customerPhone || '',
        row.serialNumber || '',
        purchaseStr,
        row.customerSegment || 'retail',
        row.deviceStatus || 'in_warranty',
        row.customerEmail || '',
        row.customerAddress || '',
        row.notes || '',
        wsStr,
        weStr,
      ]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'San_pham_BH');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  _importRowErrorMessage(e) {
    const c = e && e.code;
    if (c === 'PRODUCT_TYPE_NOT_FOUND') return 'Không tìm thấy loại SP.';
    if (c === 'CUSTOMER_NAME_REQUIRED') return 'Thiếu tên khách.';
    if (c === 'CUSTOMER_PHONE_REQUIRED') return 'Thiếu SĐT.';
    if (c === 'PURCHASE_DATE_INVALID') return 'Ngày mua không hợp lệ.';
    if (c === 'SERIAL_DUPLICATE') return 'Serial trùng trong loại SP.';
    if (c === 'WARRANTY_MANUAL_DATES_REQUIRED') return 'Loại SP nhập tay BH — cần warrantyPeriodStart & End.';
    if (c === 'WARRANTY_END_BEFORE_START') return 'Ngày hết BH trước ngày bắt đầu.';
    if (c === 'CUSTOMER_SEGMENT_INVALID') return 'Phân loại khách không hợp lệ.';
    if (c === 'DEVICE_STATUS_INVALID') return 'Trạng thái thiết bị không hợp lệ.';
    return e.message || 'Lỗi không xác định';
  }

  _normalizeExcelHeaderKey(k) {
    return String(k || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
  }

  _excelAoaGet(row, colMap, ...aliases) {
    for (const al of aliases) {
      const want = this._normalizeExcelHeaderKey(al);
      if (colMap[want] === undefined) continue;
      const j = colMap[want];
      let v = row[j];
      if (v !== undefined && v !== null && v !== '') {
        if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
        if (typeof v === 'number') return v;
        const s = String(v).trim();
        if (s !== '') return s;
      }
    }
    return undefined;
  }

  /**
   * Nhập Excel (.xlsx) — hàng 1 = header (giống file xuất / mẫu). Dùng thư viện `xlsx`.
   * @returns {{ created: number, errors: Array<{ row: number, message: string }> }}
   */
  async importWarrantyProductsFromExcelBuffer(buffer) {
    const XLSX = require('xlsx');
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      const err = new Error('File không có sheet.');
      err.code = 'IMPORT_EMPTY';
      throw err;
    }
    const ws = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true, blankrows: false });
    if (!aoa || !aoa.length || !aoa[0]) {
      const err = new Error('File không có tiêu đề cột.');
      err.code = 'IMPORT_EMPTY';
      throw err;
    }

    const headerCells = aoa[0];
    const colMap = {};
    headerCells.forEach((cell, idx) => {
      const key = this._normalizeExcelHeaderKey(cell);
      if (key) colMap[key] = idx;
    });

    let created = 0;
    const errors = [];

    for (let ri = 1; ri < aoa.length && ri < 50001; ri++) {
      const row = aoa[ri] || [];
      const r = ri + 1;
      const padded = [...row];
      while (padded.length < headerCells.length) padded.push(null);

      const any = padded.some((c) => {
        if (c == null) return false;
        if (c instanceof Date) return true;
        return String(c).trim() !== '';
      });
      if (!any) continue;

      const get = (...names) => this._excelAoaGet(padded, colMap, ...names);

      const productTypeCode = String(get('productTypeCode', 'maloai', 'ma_loai') ?? '').trim();
      let productTypeIdRaw = get('productTypeId', 'producttypeid');
      if (productTypeIdRaw != null && typeof productTypeIdRaw !== 'string' && typeof productTypeIdRaw !== 'object') {
        productTypeIdRaw = String(productTypeIdRaw).trim();
      } else {
        productTypeIdRaw = String(productTypeIdRaw ?? '').trim();
      }
      let productTypeId = '';

      if (mongoose.isValidObjectId(productTypeIdRaw)) {
        const pt = await WarrantyProductType.findById(productTypeIdRaw).lean();
        if (pt) productTypeId = String(pt._id);
      }
      if (!productTypeId && productTypeCode) {
        const pt = await this.findProductTypeByCodeForImport(productTypeCode);
        if (pt) productTypeId = String(pt._id);
      }

      const customerName = String(get('customerName', 'tenkhach', 'ho_ten') ?? '').trim();
      const purchaseRaw = get('purchaseDate', 'ngaymua', 'ngay_mua');
      const purchaseDate = this.parseFlexibleExcelDate(purchaseRaw);
      const customerSegment = String(get('customerSegment', 'phanloai') ?? 'retail').trim() || 'retail';
      const deviceStatus = String(get('deviceStatus', 'trangthai') ?? 'in_warranty').trim() || 'in_warranty';
      const customerEmail = String(get('customerEmail', 'email') ?? '').trim();
      const customerAddress = String(get('customerAddress', 'diachi', 'dia_chi') ?? '').trim();
      const notes = String(get('notes', 'ghichu', 'ghi_chu') ?? '').trim();
      const wpsRaw = get('warrantyPeriodStart', 'bh_bat_dau');
      const wpeRaw = get('warrantyPeriodEnd', 'bh_ket_thuc');
      const wpsD = wpsRaw != null ? this.parseFlexibleExcelDate(wpsRaw) : null;
      const wpeD = wpeRaw != null ? this.parseFlexibleExcelDate(wpeRaw) : null;
      const warrantyPeriodStart = wpsD ? this._dateToYmdLocal(wpsD) : '';
      const warrantyPeriodEnd = wpeD ? this._dateToYmdLocal(wpeD) : '';

      let phoneStr = get('customerPhone', 'sdt', 'dienthoai');
      if (typeof phoneStr === 'number' && Number.isFinite(phoneStr)) phoneStr = String(Math.round(phoneStr));
      else phoneStr = String(phoneStr ?? '').trim();

      let serialStr = get('serialNumber', 'serial');
      if (typeof serialStr === 'number' && Number.isFinite(serialStr)) serialStr = String(Math.round(serialStr));
      else serialStr = String(serialStr ?? '').trim();

      if (!customerName && !phoneStr && !serialStr && purchaseRaw == null) continue;

      const customerPhone = phoneStr;
      const serialNumber = serialStr;

      if (!productTypeId) {
        errors.push({ row: r, message: 'Thiếu hoặc sai mã loại SP (productTypeCode / productTypeId).' });
        continue;
      }

      const payload = {
        productTypeId,
        customerName,
        customerPhone,
        serialNumber,
        purchaseDate: purchaseDate ? this._dateToYmdLocal(purchaseDate) : '',
        customerSegment,
        deviceStatus,
        customerEmail,
        customerAddress,
        notes,
        warrantyPeriodStart,
        warrantyPeriodEnd,
      };

      try {
        await this.createWarrantyProductAdmin(payload);
        created += 1;
      } catch (e) {
        errors.push({ row: r, message: this._importRowErrorMessage(e) });
      }
    }

    return { created, errors };
  }

  /** File mẫu nhập (.xlsx) — dòng tiêu đề + 1 dòng ví dụ. */
  async buildWarrantyImportTemplateBuffer() {
    const XLSX = require('xlsx');
    const headers = [
      'productTypeCode',
      'productTypeId',
      'customerName',
      'customerPhone',
      'serialNumber',
      'purchaseDate',
      'customerSegment',
      'deviceStatus',
      'customerEmail',
      'customerAddress',
      'notes',
      'warrantyPeriodStart',
      'warrantyPeriodEnd',
    ];
    const aoa = [
      headers,
      [
        'ces-001',
        '',
        'Nguyen Van A',
        '0912345678',
        'SN123456',
        '2025-01-15',
        'retail',
        'in_warranty',
        '',
        '',
        '',
        '',
        '',
      ],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_nhap');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Số liệu tổng quan cho trang admin (biểu đồ).
   */
  async getAdminDashboardStats() {
    const now = new Date();
    const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    const [
      totalProducts,
      productTypeCount,
      pendingActivations,
      last7DaysCount,
      statusAgg,
      segmentAgg,
      monthlyAgg,
    ] = await Promise.all([
      WarrantyProduct.countDocuments(),
      WarrantyProductType.countDocuments({ isActive: { $ne: false } }),
      WarrantyActivationRequest.countDocuments({ status: 'pending' }),
      WarrantyProduct.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      WarrantyProduct.aggregate([{ $group: { _id: '$deviceStatus', c: { $sum: 1 } } }]),
      WarrantyProduct.aggregate([{ $group: { _id: '$customerSegment', c: { $sum: 1 } } }]),
      WarrantyProduct.aggregate([
        { $match: { createdAt: { $gte: sixMonthsStart } } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            c: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusLabelsVi = {
      active: 'Hoạt động',
      in_warranty: 'Trong hạn BH',
      warranty_expired: 'Hết BH',
      in_repair: 'Đang xử lý',
      replaced: 'Đổi trả',
      inactive: 'Ngưng theo dõi',
    };
    const segLabelsVi = { retail: 'Khách lẻ', dealer: 'Đại lý', agent: 'CTV' };

    const statusMap = Object.fromEntries((statusAgg || []).map((x) => [x._id, x.c]));
    const statusOrder = ['in_warranty', 'active', 'warranty_expired', 'in_repair', 'replaced', 'inactive'];
    const statusChart = { labels: [], data: [] };
    statusOrder.forEach((k) => {
      const n = statusMap[k] || 0;
      if (n > 0) {
        statusChart.labels.push(statusLabelsVi[k] || k);
        statusChart.data.push(n);
      }
    });
    Object.keys(statusMap).forEach((k) => {
      if (!statusOrder.includes(k) && statusMap[k] > 0) {
        statusChart.labels.push(statusLabelsVi[k] || k);
        statusChart.data.push(statusMap[k]);
      }
    });

    const segMap = Object.fromEntries((segmentAgg || []).map((x) => [x._id, x.c]));
    const segOrder = ['retail', 'dealer', 'agent'];
    const segmentChart = { labels: [], data: [] };
    segOrder.forEach((k) => {
      segmentChart.labels.push(segLabelsVi[k] || k);
      segmentChart.data.push(segMap[k] || 0);
    });

    const monthBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthBuckets.push({ y: d.getFullYear(), m: d.getMonth() + 1, label: `T${d.getMonth() + 1}/${d.getFullYear()}` });
    }
    const monthlyMap = new Map(
      (monthlyAgg || []).map((x) => [`${x._id.y}-${x._id.m}`, x.c]),
    );
    const trendChart = {
      labels: monthBuckets.map((b) => b.label),
      data: monthBuckets.map((b) => monthlyMap.get(`${b.y}-${b.m}`) || 0),
    };

    return {
      totalProducts,
      productTypeCount,
      pendingActivations,
      last7DaysCount,
      statusChart,
      segmentChart,
      trendChart,
    };
  }
}

module.exports = new WarrantyService();
