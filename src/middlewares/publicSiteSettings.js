const publicSiteSettingsService = require('../services/publicSiteSettingsService');

/**
 * Nạp cấu hình chân trang + khối trang chủ (Lưu ý nhanh) cho layout khách.
 */
async function loadPublicSiteSettings(req, res, next) {
  try {
    const pack = await publicSiteSettingsService.getLayoutLocals();
    res.locals.supportFooter = pack.supportFooter;
    res.locals.homeQuickNotes = pack.homeQuickNotes;
    res.locals.activationPageIntro = pack.activationPageIntro;
    res.locals.policyPageIframeSrc = pack.policyPageIframeSrc;
    res.locals.policyPageIframeOrigin = pack.policyPageIframeOrigin;
    res.locals.lookupPage = pack.lookupPage;
    next();
  } catch (e) {
    res.locals.supportFooter = { title: 'Cần hỗ trợ kích hoạt?', items: [] };
    res.locals.homeQuickNotes = { title: 'Lưu ý nhanh', bodyHtml: '' };
    res.locals.activationPageIntro = publicSiteSettingsService.fallbackActivationPageIntro();
    res.locals.policyPageIframeSrc = publicSiteSettingsService.DEFAULT_POLICY_IFRAME_SRC;
    try {
      res.locals.policyPageIframeOrigin = new URL(
        publicSiteSettingsService.DEFAULT_POLICY_IFRAME_SRC,
      ).origin;
    } catch {
      res.locals.policyPageIframeOrigin = '';
    }
    res.locals.lookupPage = publicSiteSettingsService.fallbackLookupPage();
    next();
  }
}

module.exports = { loadPublicSiteSettings };
