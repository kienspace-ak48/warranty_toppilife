/**
 * URL gốc site hiển thị cho khách (QR kích hoạt bảo hành, in poster, v.v.).
 * Đặt trong .env: PUBLIC_BASE_URL — khi deploy không phụ thuộc Host header.
 *
 * Ví dụ:
 *   PUBLIC_BASE_URL=https://bhanh.toppilife.com
 *   PUBLIC_BASE_URL=http://localhost:8084
 *
 * Không đặt → lấy từ request (req.protocol + Host), phù hợp dev tạm thời.
 */

/**
 * Chỉ đọc biến môi trường (không nhìn request).
 * Luôn ưu tiên PUBLIC_BASE_URL nếu đã đặt — mọi NODE_ENV (dev/staging/prod).
 */
function getPublicBaseUrlFromEnv() {
  const u = process.env.PUBLIC_BASE_URL;
  if (u == null || !String(u).trim()) return '';
  return String(u).trim().replace(/\/$/, '');
}

/**
 * @param {import('express').Request} [req]
 * @returns {string}
 */
function getPublicBaseUrl(req) {
  const fromEnv = getPublicBaseUrlFromEnv();
  if (fromEnv) return fromEnv;
  if (!req || typeof req.get !== 'function') return '';
  const host = req.get('host');
  if (!host) return '';
  const proto = req.protocol || 'http';
  return `${proto}://${host}`;
}

module.exports = {
  getPublicBaseUrl,
  getPublicBaseUrlFromEnv,
};
