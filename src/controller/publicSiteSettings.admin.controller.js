const publicSiteSettingsService = require('../services/publicSiteSettingsService');

const publicSiteSettingsAdminController = () => {
  return {
    footerPage: async (req, res) => {
      const data = await publicSiteSettingsService.getForAdminFooterForm();
      res.render('admin/page-settings/footer', {
        layout: 'layouts/adminLayout',
        title: 'Chân trang — Hỗ trợ khách',
        data,
        flash: typeof req.query.flash === 'string' ? req.query.flash : '',
      });
    },

    footerSave: async (req, res) => {
      try {
        await publicSiteSettingsService.updateFooterFromAdminBody(req.body || {});
        res.redirect('/admin/page-settings/footer?flash=saved');
      } catch (e) {
        res.redirect(
          `/admin/page-settings/footer?flash=${encodeURIComponent(e.message || 'Lỗi lưu')}`,
        );
      }
    },

    quickNotesPage: async (req, res) => {
      const data = await publicSiteSettingsService.getForAdminQuickNotesForm();
      res.render('admin/page-settings/home-quick-notes', {
        layout: 'layouts/adminLayout',
        title: 'Nội dung công khai — Trang chủ & kích hoạt',
        data,
        flash: typeof req.query.flash === 'string' ? req.query.flash : '',
      });
    },

    quickNotesSave: async (req, res) => {
      try {
        await publicSiteSettingsService.updateQuickNotesFromAdminBody(req.body || {});
        res.redirect('/admin/page-settings/home-quick-notes?flash=saved');
      } catch (e) {
        res.redirect(
          `/admin/page-settings/home-quick-notes?flash=${encodeURIComponent(e.message || 'Lỗi lưu')}`,
        );
      }
    },
  };
};

module.exports = publicSiteSettingsAdminController;
