const PublicSiteSettings = require('../models/public-site-settings.model');

const DEFAULT_KEY = 'default';

const MOCK_ITEMS = [
  {
    label: 'HOTLINE',
    value: '0866.094.096',
    href: 'tel:0866094096',
    accent: 'green',
    icon: 'phone',
  },
  {
    label: 'ZALO CHAT',
    value: 'Hỗ trợ 24/7',
    href: 'https://zalo.me/',
    accent: 'blue',
    icon: 'device',
  },
  {
    label: 'EMAIL',
    value: 'info@toppilife.vn',
    href: 'mailto:info@toppilife.vn',
    accent: 'red',
    icon: 'mail',
  },
];

const DEFAULT_QUICK_LINES = [
  {
    kind: 'bold_rest',
    bold: 'Tra cứu',
    rest: ' cần đúng serial hoặc số điện thoại đã dùng khi đăng ký bảo hành.',
    prefix: '',
    linkText: '',
    linkHref: '',
    suffix: '',
  },
  {
    kind: 'bold_rest',
    bold: 'Kích hoạt online',
    rest: ' dành khi mua ngoài cửa hàng trực tiếp: điền mã đơn và thông tin — cửa hàng sẽ duyệt trước khi bảo hành có hiệu lực.',
    prefix: '',
    linkText: '',
    linkHref: '',
    suffix: '',
  },
  {
    kind: 'link_line',
    bold: '',
    rest: '',
    prefix: 'Xem thêm ',
    linkText: 'chính sách bảo hành',
    linkHref: '/warranty/chinh-sach',
    suffix: ' và điều kiện áp dụng.',
  },
];

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function normalizeQuickLine(row, i) {
  const base = DEFAULT_QUICK_LINES[i] || DEFAULT_QUICK_LINES[0];
  const kind = row && row.kind === 'link_line' ? 'link_line' : 'bold_rest';
  if (kind === 'link_line') {
    return {
      kind: 'link_line',
      bold: '',
      rest: '',
      prefix: String(row.prefix != null ? row.prefix : '').trim() || base.prefix,
      linkText: String(row.linkText != null ? row.linkText : '').trim() || base.linkText,
      linkHref: String(row.linkHref != null ? row.linkHref : '').trim() || base.linkHref,
      suffix: String(row.suffix != null ? row.suffix : '').trim() || base.suffix,
    };
  }
  return {
    kind: 'bold_rest',
    bold: String(row.bold != null ? row.bold : '').trim() || base.bold,
    rest: String(row.rest != null ? row.rest : '').trim() || base.rest,
    prefix: '',
    linkText: '',
    linkHref: '',
    suffix: '',
  };
}

function normalizeQuickLines(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_QUICK_LINES.map((x) => ({ ...x }));
  }
  return [0, 1, 2].map((i) => normalizeQuickLine(raw[i] || {}, i));
}

function legacyLinesToHtmlArray(lines) {
  const normalized = normalizeQuickLines(lines);
  return normalized.map((line) => {
    if (line.kind === 'link_line') {
      const href = escAttr(line.linkHref || '#');
      return `<p>${escHtml(line.prefix)}<a href="${href}" class="text-[#39B54A] font-semibold underline">${escHtml(line.linkText)}</a>${escHtml(line.suffix)}</p>`;
    }
    return `<p><strong class="text-slate-900">${escHtml(line.bold)}</strong>${escHtml(line.rest)}</p>`;
  });
}

function sanitizeQuickNotesHtml(html) {
  let s = String(html ?? '');
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  s = s.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  return s.trim();
}

/** Chuỗi HTML đầy đủ cho khối Lưu ý nhanh */
function ensureBodyHtml(doc) {
  let body = String(doc.homeQuickNotesBodyHtml || '').trim();
  if (body) return body;

  const lineArr = doc.homeQuickNotesLineHtml;
  if (Array.isArray(lineArr) && lineArr.some((x) => String(x || '').trim())) {
    return lineArr
      .map((h) => String(h || '').trim())
      .filter(Boolean)
      .join('');
  }

  return legacyLinesToHtmlArray(doc.homeQuickNotesLines || DEFAULT_QUICK_LINES).join('');
}

function normalizeItems(raw) {
  if (!Array.isArray(raw) || !raw.length) return MOCK_ITEMS.map((x) => ({ ...x }));
  return raw.slice(0, 3).map((row, i) => {
    const base = MOCK_ITEMS[i] || MOCK_ITEMS[0];
    return {
      label: String(row.label != null ? row.label : '').trim() || base.label,
      value: String(row.value != null ? row.value : '').trim() || base.value,
      href: String(row.href != null ? row.href : '').trim(),
      accent: ['green', 'blue', 'red'].includes(row.accent) ? row.accent : base.accent,
      icon: ['phone', 'device', 'mail'].includes(row.icon) ? row.icon : base.icon,
    };
  });
}

class PublicSiteSettingsService {
  async getOrCreateDoc() {
    let doc = await PublicSiteSettings.findOne({ key: DEFAULT_KEY }).lean();
    if (!doc) {
      const bodyHtml = legacyLinesToHtmlArray(DEFAULT_QUICK_LINES).join('');
      doc = await PublicSiteSettings.create({
        key: DEFAULT_KEY,
        supportSectionTitle: 'Cần hỗ trợ kích hoạt?',
        supportItems: MOCK_ITEMS,
        homeQuickNotesTitle: 'Lưu ý nhanh',
        homeQuickNotesLines: DEFAULT_QUICK_LINES,
        homeQuickNotesLineHtml: legacyLinesToHtmlArray(DEFAULT_QUICK_LINES),
        homeQuickNotesBodyHtml: bodyHtml,
      });
      doc = doc.toObject();
    }
    const patch = {};
    if (!doc.supportItems || doc.supportItems.length === 0) {
      patch.supportItems = MOCK_ITEMS;
    }
    if (!doc.homeQuickNotesLines || doc.homeQuickNotesLines.length === 0) {
      patch.homeQuickNotesTitle = doc.homeQuickNotesTitle || 'Lưu ý nhanh';
      patch.homeQuickNotesLines = DEFAULT_QUICK_LINES;
    }

    const merged = { ...doc, ...patch };
    const bodyHtml = ensureBodyHtml(merged);
    if (!String(doc.homeQuickNotesBodyHtml || '').trim() && bodyHtml) {
      patch.homeQuickNotesBodyHtml = bodyHtml;
    }

    if (Object.keys(patch).length) {
      await PublicSiteSettings.updateOne({ key: DEFAULT_KEY }, { $set: patch });
      doc = { ...doc, ...patch };
    }
    return doc;
  }

  async getLayoutLocals() {
    const doc = await this.getOrCreateDoc();
    return {
      supportFooter: {
        title: doc.supportSectionTitle || 'Cần hỗ trợ kích hoạt?',
        items: normalizeItems(doc.supportItems),
      },
      homeQuickNotes: {
        title: doc.homeQuickNotesTitle || 'Lưu ý nhanh',
        bodyHtml: ensureBodyHtml(doc),
      },
    };
  }

  async getSupportFooterForLayout() {
    const pack = await this.getLayoutLocals();
    return pack.supportFooter;
  }

  async getForAdminFooterForm() {
    const doc = await this.getOrCreateDoc();
    return {
      supportSectionTitle: doc.supportSectionTitle || 'Cần hỗ trợ kích hoạt?',
      items: normalizeItems(doc.supportItems),
    };
  }

  async getForAdminQuickNotesForm() {
    const doc = await this.getOrCreateDoc();
    return {
      homeQuickNotesTitle: doc.homeQuickNotesTitle || 'Lưu ý nhanh',
      homeQuickNotesBodyHtml: ensureBodyHtml(doc),
    };
  }

  async updateFooterFromAdminBody(body) {
    const title = String((body && body.supportSectionTitle) || '').trim() || 'Cần hỗ trợ kích hoạt?';
    const rawItems = body && body.items;
    let arr = [];
    if (Array.isArray(rawItems)) {
      arr = rawItems;
    } else if (rawItems && typeof rawItems === 'object') {
      arr = [0, 1, 2].map((i) => rawItems[i] || rawItems[String(i)] || {});
    }
    const supportItems = normalizeItems(arr);

    await PublicSiteSettings.findOneAndUpdate(
      { key: DEFAULT_KEY },
      { $set: { supportSectionTitle: title, supportItems } },
      { upsert: true, new: true },
    );
  }

  async updateQuickNotesFromAdminBody(body) {
    const title = String((body && body.homeQuickNotesTitle) || '').trim() || 'Lưu ý nhanh';
    const bodyHtml = sanitizeQuickNotesHtml((body && body.homeQuickNotesBodyHtml) || '');

    await PublicSiteSettings.findOneAndUpdate(
      { key: DEFAULT_KEY },
      {
        $set: {
          homeQuickNotesTitle: title,
          homeQuickNotesBodyHtml: bodyHtml,
        },
        $unset: { homeQuickNotesLines: '', homeQuickNotesLineHtml: '' },
      },
      { upsert: true, new: true },
    );
  }
}

module.exports = new PublicSiteSettingsService();
