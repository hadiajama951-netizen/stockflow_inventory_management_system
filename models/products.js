// models/products.js
const db = require('../db/database');

function getAllProducts() {
  return db.prepare('SELECT * FROM products ORDER BY name ASC').all();
}

function getProductById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function getProductByBarcode(barcode) {
  return db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode);
}

function createProduct({ name, category, price, cost_price, barcode, quantity, low_stock_threshold }) {
  const stmt = db.prepare(
    `INSERT INTO products (name, category, price, cost_price, barcode, quantity, low_stock_threshold)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    name,
    category || null,
    price,
    cost_price || 0,
    barcode || null,
    quantity || 0,
    low_stock_threshold || 5
  );
  return Number(info.lastInsertRowid);
}

function updateProduct(id, { name, category, price, cost_price, barcode, quantity, low_stock_threshold }) {
  db.prepare(
    `UPDATE products
     SET name = ?, category = ?, price = ?, cost_price = ?, barcode = ?, quantity = ?, low_stock_threshold = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(name, category || null, price, cost_price || 0, barcode || null, quantity, low_stock_threshold, id);
}

function deleteProduct(id) {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

function decreaseStock(id, amount) {
  db.prepare(
    `UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(amount, id);
}

function increaseStock(id, amount) {
  db.prepare(
    `UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(amount, id);
}

function getLowStockProducts() {
  return db
    .prepare('SELECT * FROM products WHERE quantity <= low_stock_threshold ORDER BY quantity ASC')
    .all();
}

function searchProducts(term) {
  if (!term) return getAllProducts();
  return db
    .prepare(
      `SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR barcode LIKE ? ORDER BY name ASC`
    )
    .all(`%${term}%`, `%${term}%`, `%${term}%`);
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  decreaseStock,
  increaseStock,
  getLowStockProducts,
  searchProducts,
};
