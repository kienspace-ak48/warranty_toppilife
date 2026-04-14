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
