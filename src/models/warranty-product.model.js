const mongoose = require('mongoose');

const deviceLogSchema = new mongoose.Schema(
  {
    at: { type: Date, required: true },
    kind: { type: String, enum: ['sale', 'activation', 'admin'], required: true },
    message: { type: String, required: true, trim: true },
    /** Tra cứu công khai: chỉ hiện log có visibleToCustomer !== false */
    visibleToCustomer: { type: Boolean, default: true },
  },
  { _id: true },
);

const warrantyProductSchema = new mongoose.Schema(
  {
    /** Loại sản phẩm (cấu hình BH mặc định theo loại). */
    productTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarrantyProductType',
      required: true,
      index: true,
    },
    /** Phân loại kênh: khách lẻ / đại lý / CTV */
    customerSegment: {
      type: String,
      enum: ['retail', 'dealer', 'agent'],
      default: 'retail',
      index: true,
    },
    /** Trạng thái thiết bị (cập nhật thủ công). */
    deviceStatus: {
      type: String,
      enum: ['active', 'in_warranty', 'warranty_expired', 'in_repair', 'replaced', 'inactive'],
      default: 'in_warranty',
      index: true,
    },
    /** Khách hàng */
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, default: '' },
    customerAddress: { type: String, trim: true, default: '' },
    /** Thiết bị / tem */
    serialNumber: { type: String, trim: true, default: '' },
    /** Ngày bán / xuất — luôn có. */
    purchaseDate: { type: Date, required: true },
    /**
     * Thời điểm kích hoạt bảo hành (có thể khác ngày bán).
     * Trống → tính BH từ purchaseDate (khi loại SP dùng BH theo cấu hình).
     */
    warrantyActivatedAt: { type: Date, default: null },
    /** Khi loại SP tắt "BH theo loại": nhập tay (ngày). */
    warrantyPeriodStart: { type: Date, default: null },
    warrantyPeriodEnd: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
    /** Lịch sử: bán, kích hoạt, ghi chú admin (lỗi, xử lý…). */
    deviceLogs: { type: [deviceLogSchema], default: [] },
  },
  { timestamps: true },
);

warrantyProductSchema.index({ productTypeId: 1, createdAt: -1 });
warrantyProductSchema.index(
  { productTypeId: 1, serialNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { serialNumber: { $type: 'string', $gt: '' } },
  },
);

module.exports =
  mongoose.models.WarrantyProduct || mongoose.model('WarrantyProduct', warrantyProductSchema);
