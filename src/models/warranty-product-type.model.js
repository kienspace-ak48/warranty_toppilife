const mongoose = require('mongoose');

const warrantyProductTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** URL / import — luôn suy ra từ `name` (slugify), không nhập tay. */
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** Mã hiển thị / tham chiếu do admin nhập (VD: CES-001), khác slug. */
    code: { type: String, trim: true, sparse: true, unique: true },
    /** Dùng khi không đặt warrantyDefaultDays (tương thích dữ liệu cũ). */
    warrantyMonths: { type: Number, required: true, min: 1 },
    /**
     * Nếu >= 1: tính hạn BH theo đúng số ngày (từ ngày bán / kích hoạt).
     * Nếu trống: dùng warrantyMonths.
     */
    warrantyDefaultDays: { type: Number, default: null },
    imagePath: { type: String, trim: true },
    /** Ảnh mặt sau / vị trí tem serial (tra cứu công khai). */
    imagePathBack: { type: String, trim: true },
    description: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    /** Hiển thị trên trang tra cứu công khai (khác với ẩn hẳn loại). */
    showOnPublicLookup: { type: Boolean, default: true },
    /**
     * true: hạn BH trên thiết bị = (ngày mua / kích hoạt) + số ngày/tháng của loại.
     * false: trên từng thiết bị nhập tay ngày bắt đầu / hết hạn BH.
     */
    useTypeWarrantyPeriod: { type: Boolean, default: true },
  },
  { timestamps: true },
);

warrantyProductTypeSchema.index({ isActive: 1, sortOrder: 1 });

module.exports =
  mongoose.models.WarrantyProductType ||
  mongoose.model('WarrantyProductType', warrantyProductTypeSchema);
