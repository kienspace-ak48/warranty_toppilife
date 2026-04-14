const publicSiteSettingsService = require('../services/publicSiteSettingsService');

/**
 * Nạp cấu hình chân trang + khối trang chủ (Lưu ý nhanh) cho layout khách.
 */
async function loadPublicSiteSettings(req, res, next) {
  try {
    const pack = await publicSiteSettingsService.getLayoutLocals();
    res.locals.supportFooter = pack.supportFooter;
    res.locals.homeQuickNotes = pack.homeQuickNotes;
    next();
  } catch (e) {
    res.locals.supportFooter = { title: 'Cần hỗ trợ kích hoạt?', items: [] };
    res.locals.homeQuickNotes = { title: 'Lưu ý nhanh', bodyHtml: '' };
    next();
  }
}

module.exports = { loadPublicSiteSettings };
