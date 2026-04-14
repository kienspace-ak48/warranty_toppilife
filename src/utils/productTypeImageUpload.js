const path = require('path');
const fs = require('fs').promises;
const { publicPath } = require('../configs/myPath');

const DEST_DIR = path.join(publicPath, 'warranty-assets', 'product-types');

/**
 * Lưu file đã upload vào memory (multer) xuống đĩa, trả về đường dẫn public.
 * @param {import('multer').File} file
 * @returns {Promise<string>}
 */
async function saveProductTypeImageBuffer(file) {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error('FILE_BUFFER_MISSING');
  }
  await fs.mkdir(DEST_DIR, { recursive: true });
  const ext = path.extname(file.originalname || '').toLowerCase();
  const safe = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safe}`;
  const fullPath = path.join(DEST_DIR, filename);
  await fs.writeFile(fullPath, file.buffer);
  return `/warranty-assets/product-types/${filename}`;
}

module.exports = {
  saveProductTypeImageBuffer,
};
