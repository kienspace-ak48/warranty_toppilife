const mongoose = require('mongoose');

const supportItemSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '' },
    value: { type: String, trim: true, default: '' },
    /** tel:, mailto:, https:// — để trống thì chỉ hiển thị text */
    href: { type: String, trim: true, default: '' },
    accent: { type: String, enum: ['green', 'blue', 'red'], default: 'green' },
    icon: { type: String, enum: ['phone', 'device', 'mail'], default: 'phone' },
  },
  { _id: false },
);

/** Một dòng trong khối "Lưu ý nhanh" (trang chủ) */
const quickNoteLineSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['bold_rest', 'link_line'], default: 'bold_rest' },
    bold: { type: String, trim: true, default: '' },
    rest: { type: String, trim: true, default: '' },
    prefix: { type: String, trim: true, default: '' },
    linkText: { type: String, trim: true, default: '' },
    linkHref: { type: String, trim: true, default: '' },
    suffix: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const publicSiteSettingsSchema = new mongoose.Schema(
  {
    /** Một bản ghi duy nhất cho site */
    key: { type: String, unique: true, default: 'default', index: true },
    supportSectionTitle: { type: String, trim: true, default: 'Cần hỗ trợ kích hoạt?' },
    supportItems: { type: [supportItemSchema], default: [] },
    homeQuickNotesTitle: { type: String, trim: true, default: 'Lưu ý nhanh' },
    /** Một khối HTML (TinyMCE) cho toàn bộ “Lưu ý nhanh” */
    homeQuickNotesBodyHtml: { type: String, default: '' },
    /** @deprecated — gộp vào homeQuickNotesBodyHtml */
    homeQuickNotesLineHtml: { type: [String], default: [] },
    /** @deprecated — dùng khi chưa migrate sang HTML */
    homeQuickNotesLines: { type: [quickNoteLineSchema], default: [] },
    /** @deprecated — migrate sang activationPageIntroBodyHtml */
    activationPageIntroLine1: { type: String, trim: true, default: '' },
    /** @deprecated — migrate sang activationPageIntroBodyHtml */
    activationPageIntroLine2: { type: String, trim: true, default: '' },
    /** Tiêu đề H1 trang kích hoạt bảo hành (khách) */
    activationPageTitle: { type: String, trim: true, default: '' },
    /** Khối HTML (TinyMCE) phần mô tả dưới tiêu đề */
    activationPageIntroBodyHtml: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.PublicSiteSettings ||
  mongoose.model('PublicSiteSettings', publicSiteSettingsSchema);
