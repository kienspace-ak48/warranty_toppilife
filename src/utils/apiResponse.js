/**
 * JSON API helpers — map legacy successData / errorData / PaginationInfo shapes
 * to a single consistent envelope for this app.
 */

function success(data, meta) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return body;
}

function error(message, options = {}) {
  const { code = 'ERROR', statusCode = 400, details } = options;
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    statusCode,
  };
}

/**
 * @param {object} params
 * @param {number} params.page - 1-based
 * @param {number} params.limit
 * @param {number} params.total
 */
function paginationInfo({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  return { page, limit, total, totalPages };
}

function paginated(items, { page, limit, total }) {
  return {
    success: true,
    data: items,
    pagination: paginationInfo({ page, limit, total }),
  };
}

/**
 * Send JSON error with HTTP status from envelope or override.
 */
function sendError(res, errEnvelope, overrideStatus) {
  const status = overrideStatus ?? errEnvelope.statusCode ?? 500;
  const { statusCode: _s, ...body } = errEnvelope;
  res.status(status).json(body);
}

function sendSuccess(res, data, meta, status = 200) {
  res.status(status).json(success(data, meta));
}

module.exports = {
  success,
  error,
  paginationInfo,
  paginated,
  sendError,
  sendSuccess,
};
