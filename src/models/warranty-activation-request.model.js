const mongoose = require('mongoose');

const warrantyActivationRequestSchema = new mongoose.Schema(
  {
    productTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarrantyProductType',
      required: true,
      index: true,
    },
    orderCode: { type: String, required: true, trim: true },
    serialNumber: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerAddress: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    /** Phân loại kênh (admin) — khi duyệt sẽ ghi vào SP bảo hành */
    customerSegment: {
      type: String,
      enum: ['retail', 'dealer', 'agent'],
      default: 'retail',
      index: true,
    },
    /** Đã chỉnh phân loại từ danh sách yêu cầu lần đầu → khóa; hoặc sau duyệt/từ chối. Sửa tiếp qua trang sản phẩm. */
    segmentLockedFromList: { type: Boolean, default: false, index: true },
    adminNote: { type: String, trim: true, default: '' },
    resolvedWarrantyProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarrantyProduct',
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

warrantyActivationRequestSchema.index({ productTypeId: 1, serialNumber: 1, status: 1 });
warrantyActivationRequestSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.WarrantyActivationRequest ||
  mongoose.model('WarrantyActivationRequest', warrantyActivationRequestSchema);
