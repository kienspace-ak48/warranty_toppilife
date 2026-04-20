/** Múi giờ hiển thị / nhập liệu nghiệp vụ VN (DB vẫn lưu UTC). */
const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

const viDateOnlyOpts = { timeZone: VN_TIMEZONE };
const viDateTimeOpts = { timeZone: VN_TIMEZONE, dateStyle: 'short', timeStyle: 'short' };

function formatViDateTime(d) {
  const t = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(t.getTime())) return '';
  return t.toLocaleString('vi-VN', viDateTimeOpts);
}

function formatViDateOnly(d) {
  const t = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(t.getTime())) return '';
  return t.toLocaleDateString('vi-VN', viDateOnlyOpts);
}

/**
 * Chuỗi từ `<input type="datetime-local">` không kèm TZ — coi là giờ VN (+07).
 * Chuỗi có Z / offset thì dùng `Date` theo chuẩn.
 */
function parseAdminDateTimeInput(s) {
  const t = String(s || '').trim();
  if (!t) return null;
  const naiveLocalLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(t);
  if (naiveLocalLike) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(t);
    if (m) {
      const sec = m[6] != null ? m[6] : '00';
      const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${sec}+07:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = {
  VN_TIMEZONE,
  formatViDateTime,
  formatViDateOnly,
  parseAdminDateTimeInput,
};
