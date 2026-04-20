const publicSiteSettingsService = require('../services/publicSiteSettingsService');

const publicSiteApiController = () => {
  return {
    siteSettingsJson: async (req, res) => {
      try {
        const payload = await publicSiteSettingsService.getPublicJsonPayload();
        res.set('Cache-Control', 'public, max-age=60');
        res.json(payload);
      } catch (e) {
        res.status(500).json({ error: 'internal_error' });
      }
    },
  };
};

module.exports = publicSiteApiController;
