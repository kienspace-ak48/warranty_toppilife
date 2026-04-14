(function () {
  'use strict';

  var TOAST_DURATION = 4500;

  function getToastRoot() {
    return document.getElementById('warranty-toast-root');
  }

  function warrantyToast(message, variant) {
    var root = getToastRoot();
    if (!root || !message) return;
    variant = variant || 'info';
    var base = 'pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg transition motion-reduce:transition-none';
    var styles = {
      error: 'border-red-200 bg-red-50 text-red-900',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
      info: 'border-slate-200 bg-white text-slate-800 ring-1 ring-slate-900/5',
    };
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.className = base + ' ' + (styles[variant] || styles.info);
    el.textContent = message;
    root.appendChild(el);
    window.setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(0.5rem)';
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 200);
    }, TOAST_DURATION);
  }

  function clearFieldGroup(group) {
    if (!group) return;
    var input = group.querySelector('input, select, textarea');
    var err = group.querySelector('[data-field-error]');
    if (input) {
      input.removeAttribute('aria-invalid');
      input.classList.remove('border-red-400', 'ring-2', 'ring-red-400/40');
      input.classList.add('border-slate-200');
    }
    if (err) {
      err.textContent = '';
      err.classList.add('hidden');
    }
  }

  function setFieldGroupError(group, message) {
    if (!group) return;
    var input = group.querySelector('input, select, textarea');
    var err = group.querySelector('[data-field-error]');
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.classList.remove('border-slate-200');
      input.classList.add('border-red-400', 'ring-2', 'ring-red-400/40');
    }
    if (err) {
      err.textContent = message || '';
      err.classList.remove('hidden');
    }
  }

  function findFieldGroup(form, name) {
    return form.querySelector('[data-warranty-field="' + name + '"]');
  }

  function clearFormErrors(form) {
    form.querySelectorAll('[data-warranty-field]').forEach(function (g) {
      clearFieldGroup(g);
    });
  }

  function normalizeDigitsPhone(v) {
    return String(v || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/^\+84/, '0');
  }

  function isLikelyVnPhone(v) {
    var d = normalizeDigitsPhone(v);
    if (!d) return false;
    return /^0\d{9,10}$/.test(d);
  }

  function initLookupForms() {
    document.querySelectorAll('form[data-warranty-form="lookup"]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        var qEl = form.querySelector('[name="q"]');
        var q = qEl ? qEl.value.trim() : '';
        clearFormErrors(form);
        if (!q) {
          e.preventDefault();
          var msgEmpty = 'Nhập số điện thoại hoặc serial / mã tem.';
          setFieldGroupError(findFieldGroup(form, 'q'), msgEmpty);
          if (qEl) qEl.focus();
          warrantyToast('Chưa nhập nội dung tra cứu.', 'error');
          return;
        }
        if (q.length < 2) {
          e.preventDefault();
          setFieldGroupError(findFieldGroup(form, 'q'), 'Nhập ít nhất 2 ký tự.');
          if (qEl) qEl.focus();
          warrantyToast('Từ khóa tra cứu quá ngắn.', 'error');
          return;
        }
      });
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        el.addEventListener('input', function () {
          var name = el.getAttribute('name');
          if (name === 'q') {
            clearFieldGroup(findFieldGroup(form, 'q'));
          }
        });
      });
    });
  }

  function initActivationForm() {
    var form = document.querySelector('form[data-warranty-form="activation"]');
    if (!form) return;

    function validate() {
      clearFormErrors(form);
      var ok = true;
      var firstFocus = null;

      var pt = form.querySelector('[name="productTypeId"]');
      if (!pt || !String(pt.value || '').trim()) {
        ok = false;
        setFieldGroupError(findFieldGroup(form, 'productTypeId'), 'Chọn loại sản phẩm.');
        if (!firstFocus && pt) firstFocus = pt;
      }

      var orderCode = form.querySelector('[name="orderCode"]');
      if (!orderCode || !String(orderCode.value || '').trim()) {
        ok = false;
        setFieldGroupError(findFieldGroup(form, 'orderCode'), 'Nhập mã đơn hàng.');
        if (!firstFocus && orderCode) firstFocus = orderCode;
      }

      var serial = form.querySelector('[name="serialNumber"]');
      if (!serial || !String(serial.value || '').trim()) {
        ok = false;
        setFieldGroupError(findFieldGroup(form, 'serialNumber'), 'Nhập số serial / mã tem.');
        if (!firstFocus && serial) firstFocus = serial;
      }

      var nameEl = form.querySelector('[name="customerName"]');
      if (!nameEl || !String(nameEl.value || '').trim()) {
        ok = false;
        setFieldGroupError(findFieldGroup(form, 'customerName'), 'Nhập họ tên.');
        if (!firstFocus && nameEl) firstFocus = nameEl;
      }

      var phoneEl = form.querySelector('[name="customerPhone"]');
      var rawPhone = phoneEl ? phoneEl.value : '';
      if (!String(rawPhone || '').trim()) {
        ok = false;
        setFieldGroupError(findFieldGroup(form, 'customerPhone'), 'Nhập số điện thoại.');
        if (!firstFocus && phoneEl) firstFocus = phoneEl;
      } else if (!isLikelyVnPhone(rawPhone)) {
        ok = false;
        setFieldGroupError(
          findFieldGroup(form, 'customerPhone'),
          'Số điện thoại không hợp lệ (ví dụ 09… hoặc 08…, 10 số).',
        );
        if (!firstFocus && phoneEl) firstFocus = phoneEl;
      }

      if (!ok && firstFocus) firstFocus.focus();
      return ok;
    }

    form.addEventListener('submit', function (e) {
      if (!validate()) {
        e.preventDefault();
        warrantyToast('Vui lòng kiểm tra các ô được đánh dấu.', 'error');
      }
    });

    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      var name = el.getAttribute('name');
      if (!name) return;
      el.addEventListener('input', function () {
        clearFieldGroup(findFieldGroup(form, name));
      });
      el.addEventListener('change', function () {
        clearFieldGroup(findFieldGroup(form, name));
      });
    });
  }

  function readPageData() {
    var el = document.getElementById('warranty-page-data');
    if (!el || !el.textContent) return;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!getToastRoot()) return;

    window.warrantyToast = warrantyToast;

    initLookupForms();
    initActivationForm();

    var data = readPageData();
    if (data) {
      if (data.serverFormError) warrantyToast(data.serverFormError, 'error');
      if (data.rateLimited) warrantyToast(data.rateLimitedMessage || 'Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau.', 'error');
      if (data.notifyNoResults) {
        warrantyToast(data.notifyNoResultsMessage || 'Không tìm thấy thiết bị với thông tin đã nhập.', 'info');
      }
    }
  });
})();
