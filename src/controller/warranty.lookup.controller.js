const warrantyService = require('../services/warrantyService');

const warrantyLookupController = () => {
  return {
    page: async (req, res) => {
      const qRaw = typeof req.query.q === 'string' ? req.query.q : '';
      const phoneLegacy = typeof req.query.phone === 'string' ? req.query.phone : '';
      const serialLegacy = typeof req.query.serial === 'string' ? req.query.serial : '';
      let q = String(qRaw).trim();
      if (!q && (String(phoneLegacy).trim() || String(serialLegacy).trim())) {
        q = String(serialLegacy).trim() || String(phoneLegacy).trim();
      }
      const hasQuery = q.length > 0;

      let results = [];
      if (hasQuery) {
        results = await warrantyService.lookupWarrantyProductsForPublicCombined(q);
      }

      const notifyNoResults = hasQuery && (!results || !results.length);

      res.render('warranty/lookup', {
        layout: 'layouts/main',
        title: 'Tra cứu bảo hành',
        tab: 'lookup',
        results,
        query: { q },
        searched: hasQuery,
        notifyNoResults,
      });
    },
  };
};

module.exports = warrantyLookupController;
