const PublicSiteSettings = require('../models/public-site-settings.model');

const DEFAULT_KEY = 'default';

/** URL iframe chính sách bảo hành khi admin chưa cấu hình */
const DEFAULT_POLICY_IFRAME_SRC = 'https://www.toppilife.vn/iframe/bao-hanh';

const DEFAULT_ACTIVATION_TITLE = 'Kích hoạt bảo hành';
const DEFAULT_ACTIVATION_INTRO_LINE1 =
  'Lưu ý ở đầu: Dành cho khách mua trên sàn thương mại điện tử(Shopee, Tiktok) hoặc đại lý của ToppiLife: điền thông tin bên dưới. Hệ thống gửi yêu cầu về cửa hàng để xác nhận trước khi bảo hành có hiệu lực.';
const DEFAULT_ACTIVATION_INTRO_LINE2 =
  'Lưu ý: Vui lòng kích hoạt bảo hành trong vòng 7 ngày kể từ khi nhận hàng. Sau 7 ngày, hệ thống sẽ không xử lý yêu cầu kích hoạt bảo hành.';

function defaultActivationIntroHtml() {
  return (
    `<p>${escHtml(DEFAULT_ACTIVATION_INTRO_LINE1)}</p>` +
    `<p>${escHtml(DEFAULT_ACTIVATION_INTRO_LINE2)}</p>`
  );
}

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
    linkHref: '/bao-hanh/chinh-sach',
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

/** Chỉ cho phép http(s); trả về chuỗi URL hợp lệ hoặc rỗng */
function sanitizePolicyIframeSrc(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString();
  } catch {
    return '';
  }
}

function resolvedPolicyIframeSrc(doc) {
  const cleaned = sanitizePolicyIframeSrc(doc && doc.policyPageIframeSrc);
  return cleaned || DEFAULT_POLICY_IFRAME_SRC;
}

function originFromPolicySrc(src) {
  try {
    return new URL(src).origin;
  } catch {
    return '';
  }
}

const DEFAULT_LOOKUP_HERO_BADGE = 'ToppiLife';
const DEFAULT_LOOKUP_HERO_TITLE = 'KIỂM TRA THỜI HẠN BẢO HÀNH ĐIỆN TỬ';

function defaultLookupHeroIntroHtml() {
  return (
    '<p>Nhập <strong class="font-semibold text-white">số điện thoại</strong> hoặc ' +
    '<strong class="font-semibold text-white">mã serial / tem</strong> đã đăng ký để xem thông tin và nhật ký hiển thị cho khách hàng.</p>'
  );
}

function defaultLookupHeroExtraHtml() {
  return (
    '<p>Không biết serial nằm ở đâu? Xem ảnh minh họa theo từng loại máy trên ' +
    '<a href="/" class="font-semibold text-white underline decoration-white/40 underline-offset-2 transition hover:decoration-white">trang chủ</a> ' +
    '(hướng dẫn tìm serial).</p>'
  );
}

const DEFAULT_LOOKUP_FORM_CARD_TITLE = 'Tra cứu';
const DEFAULT_LOOKUP_FORM_CARD_SUBTITLE = 'Một ô — nhập số điện thoại hoặc serial / mã tem đã đăng ký.';
const DEFAULT_LOOKUP_FORM_FIELD_LABEL = 'Số điện thoại hoặc serial / mã tem';
const DEFAULT_LOOKUP_FORM_PLACEHOLDER = 'VD: 0859123456 hoặc mã trên tem';
const DEFAULT_LOOKUP_FORM_BUTTON_LABEL = 'Tra cứu';

function defaultLookupFormFootnoteHtml() {
  return (
    '<p>Serial khớp chính xác; số điện thoại khớp theo dãy số (có thể nhập nhiều định dạng).</p>'
  );
}

function lookupPageForLayout(doc) {
  const d = doc || {};
  const heroIntroRaw = String(d.lookupHeroIntroHtml ?? '').trim();
  const heroExtraRaw = String(d.lookupHeroExtraHtml ?? '').trim();
  const footRaw = String(d.lookupFormFootnoteHtml ?? '').trim();
  return {
    heroBadge: String(d.lookupHeroBadge ?? '').trim() || DEFAULT_LOOKUP_HERO_BADGE,
    heroTitle: String(d.lookupHeroTitle ?? '').trim() || DEFAULT_LOOKUP_HERO_TITLE,
    heroIntroHtml: sanitizeQuickNotesHtml(heroIntroRaw) || defaultLookupHeroIntroHtml(),
    heroExtraHtml: sanitizeQuickNotesHtml(heroExtraRaw) || defaultLookupHeroExtraHtml(),
    formCardTitle: String(d.lookupFormCardTitle ?? '').trim() || DEFAULT_LOOKUP_FORM_CARD_TITLE,
    formCardSubtitle: String(d.lookupFormCardSubtitle ?? '').trim() || DEFAULT_LOOKUP_FORM_CARD_SUBTITLE,
    formFieldLabel: String(d.lookupFormFieldLabel ?? '').trim() || DEFAULT_LOOKUP_FORM_FIELD_LABEL,
    formPlaceholder: String(d.lookupFormPlaceholder ?? '').trim() || DEFAULT_LOOKUP_FORM_PLACEHOLDER,
    formButtonLabel: String(d.lookupFormButtonLabel ?? '').trim() || DEFAULT_LOOKUP_FORM_BUTTON_LABEL,
    formFootnoteHtml: sanitizeQuickNotesHtml(footRaw) || defaultLookupFormFootnoteHtml(),
  };
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

function ensureActivationIntroHtml(doc) {
  let html = String(doc.activationPageIntroBodyHtml || '').trim();
  if (html) return sanitizeQuickNotesHtml(html);

  const raw1 = doc && String(doc.activationPageIntroLine1 || '').trim();
  const raw2 = doc && String(doc.activationPageIntroLine2 || '').trim();
  if (raw1 || raw2) {
    const line1 = raw1 || DEFAULT_ACTIVATION_INTRO_LINE1;
    const line2 = raw2 || DEFAULT_ACTIVATION_INTRO_LINE2;
    return `<p>${escHtml(line1)}</p><p>${escHtml(line2)}</p>`;
  }

  return defaultActivationIntroHtml();
}

function activationPageHeroFromDoc(doc) {
  return {
    title: String(doc.activationPageTitle || '').trim() || DEFAULT_ACTIVATION_TITLE,
    bodyHtml: ensureActivationIntroHtml(doc),
  };
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

  /** Dùng khi getLayoutLocals lỗi (middleware fallback) */
  fallbackActivationPageIntro() {
    return {
      title: DEFAULT_ACTIVATION_TITLE,
      bodyHtml: defaultActivationIntroHtml(),
    };
  }

  fallbackLookupPage() {
    return lookupPageForLayout({});
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
      activationPageIntro: activationPageHeroFromDoc(doc),
      policyPageIframeSrc: resolvedPolicyIframeSrc(doc),
      policyPageIframeOrigin: originFromPolicySrc(resolvedPolicyIframeSrc(doc)),
      lookupPage: lookupPageForLayout(doc),
    };
  }

  /** Dữ liệu công khai cho API / ứng dụng khách */
  async getPublicJsonPayload() {
    const doc = await this.getOrCreateDoc();
    return {
      policyPageIframeSrc: resolvedPolicyIframeSrc(doc),
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

  async getForAdminLookupPageForm() {
    const doc = await this.getOrCreateDoc();
    const L = lookupPageForLayout(doc);
    return {
      lookupHeroBadge: String(doc.lookupHeroBadge ?? '').trim() || L.heroBadge,
      lookupHeroTitle: String(doc.lookupHeroTitle ?? '').trim() || L.heroTitle,
      lookupHeroIntroHtml: String(doc.lookupHeroIntroHtml ?? '').trim() || L.heroIntroHtml,
      lookupHeroExtraHtml: String(doc.lookupHeroExtraHtml ?? '').trim() || L.heroExtraHtml,
      lookupFormCardTitle: String(doc.lookupFormCardTitle ?? '').trim() || L.formCardTitle,
      lookupFormCardSubtitle: String(doc.lookupFormCardSubtitle ?? '').trim() || L.formCardSubtitle,
      lookupFormFieldLabel: String(doc.lookupFormFieldLabel ?? '').trim() || L.formFieldLabel,
      lookupFormPlaceholder: String(doc.lookupFormPlaceholder ?? '').trim() || L.formPlaceholder,
      lookupFormButtonLabel: String(doc.lookupFormButtonLabel ?? '').trim() || L.formButtonLabel,
      lookupFormFootnoteHtml: String(doc.lookupFormFootnoteHtml ?? '').trim() || L.formFootnoteHtml,
    };
  }

  async updateLookupPageFromAdminBody(body) {
    const b = body || {};
    const lookupHeroBadge = String(b.lookupHeroBadge ?? '').trim();
    const lookupHeroTitle = String(b.lookupHeroTitle ?? '').trim();
    const lookupHeroIntroHtml = sanitizeQuickNotesHtml(String(b.lookupHeroIntroHtml ?? ''));
    const lookupHeroExtraHtml = sanitizeQuickNotesHtml(String(b.lookupHeroExtraHtml ?? ''));
    const lookupFormCardTitle = String(b.lookupFormCardTitle ?? '').trim();
    const lookupFormCardSubtitle = String(b.lookupFormCardSubtitle ?? '').trim();
    const lookupFormFieldLabel = String(b.lookupFormFieldLabel ?? '').trim();
    const lookupFormPlaceholder = String(b.lookupFormPlaceholder ?? '').trim();
    const lookupFormButtonLabel = String(b.lookupFormButtonLabel ?? '').trim();
    const lookupFormFootnoteHtml = sanitizeQuickNotesHtml(String(b.lookupFormFootnoteHtml ?? ''));

    await PublicSiteSettings.findOneAndUpdate(
      { key: DEFAULT_KEY },
      {
        $set: {
          lookupHeroBadge,
          lookupHeroTitle,
          lookupHeroIntroHtml,
          lookupHeroExtraHtml,
          lookupFormCardTitle,
          lookupFormCardSubtitle,
          lookupFormFieldLabel,
          lookupFormPlaceholder,
          lookupFormButtonLabel,
          lookupFormFootnoteHtml,
        },
      },
      { upsert: true, new: true },
    );
  }

  async getForAdminQuickNotesForm() {
    const doc = await this.getOrCreateDoc();
    const hero = activationPageHeroFromDoc(doc);
    return {
      homeQuickNotesTitle: doc.homeQuickNotesTitle || 'Lưu ý nhanh',
      homeQuickNotesBodyHtml: ensureBodyHtml(doc),
      activationPageTitle: hero.title,
      activationPageIntroBodyHtml: ensureActivationIntroHtml(doc),
      policyPageIframeSrc: String(doc.policyPageIframeSrc || '').trim(),
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
    const activationPageTitle =
      String((body && body.activationPageTitle) || '').trim() || DEFAULT_ACTIVATION_TITLE;
    const actHtmlRaw = sanitizeQuickNotesHtml((body && body.activationPageIntroBodyHtml) || '');
    const activationPageIntroBodyHtml = actHtmlRaw || defaultActivationIntroHtml();
    const policyPageIframeSrc = sanitizePolicyIframeSrc(
      body && body.policyPageIframeSrc != null ? body.policyPageIframeSrc : '',
    );

    await PublicSiteSettings.findOneAndUpdate(
      { key: DEFAULT_KEY },
      {
        $set: {
          homeQuickNotesTitle: title,
          homeQuickNotesBodyHtml: bodyHtml,
          activationPageTitle,
          activationPageIntroBodyHtml,
          policyPageIframeSrc,
        },
        $unset: {
          homeQuickNotesLines: '',
          homeQuickNotesLineHtml: '',
          activationPageIntroLine1: '',
          activationPageIntroLine2: '',
        },
      },
      { upsert: true, new: true },
    );
  }
}

const publicSiteSettingsService = new PublicSiteSettingsService();
publicSiteSettingsService.DEFAULT_POLICY_IFRAME_SRC = DEFAULT_POLICY_IFRAME_SRC;
module.exports = publicSiteSettingsService;
