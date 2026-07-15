// models/sales.js
const db = require('../db/database');
const products = require('./products');
const customers = require('./customers');

// The set of payment methods offered when recording a sale.
const PAYMENT_METHODS = ['Cash', 'Card', 'Mobile Money', 'Other'];

// items = [{ product_id, quantity }, ...]
// discount = flat currency amount off the subtotal
// taxRate = percentage (e.g. 15 means 15%), applied AFTER discount
// paymentMethod = one of PAYMENT_METHODS; falls back to 'Cash' if invalid/missing
function recordSale(userId, items, customerName, discount, taxRate, customerPhone, paymentMethod) {
  db.exec('BEGIN');
  try {
    let subtotalAll = 0;
    const preparedItems = [];

    for (const item of items) {
      const product = products.getProductById(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.quantity < item.quantity) {
        throw new Error(`Not enough stock for "${product.name}"`);
      }
      const subtotal = product.price * item.quantity;
      subtotalAll += subtotal;
      preparedItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        cost_price: product.cost_price || 0,
        quantity: item.quantity,
        subtotal,
      });
    }

    const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, subtotalAll));
    const afterDiscount = subtotalAll - safeDiscount;
    const safeTaxRate = Math.max(0, Number(taxRate) || 0);
    const taxAmount = afterDiscount * (safeTaxRate / 100);
    const total = afterDiscount + taxAmount;

    const customerId = customers.findOrCreateCustomer(customerName, customerPhone);
    const safePaymentMethod = PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'Cash';

    const saleStmt = db.prepare(
      `INSERT INTO sales (user_id, customer_id, customer_name, discount, tax_amount, total, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const saleInfo = saleStmt.run(
      userId,
      customerId,
      customerName || null,
      safeDiscount,
      taxAmount,
      total,
      safePaymentMethod
    );
    const saleId = Number(saleInfo.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, cost_price, quantity, subtotal)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    for (const item of preparedItems) {
      insertItem.run(
        saleId,
        item.product_id,
        item.product_name,
        item.unit_price,
        item.cost_price,
        item.quantity,
        item.subtotal
      );
      products.decreaseStock(item.product_id, item.quantity);
    }

    db.exec('COMMIT');
    return saleId;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function voidSale(id) {
  db.exec('BEGIN');
  try {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    if (!sale) throw new Error('Sale not found');
    if (sale.voided) throw new Error('This sale is already voided');

    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
    for (const item of items) {
      products.increaseStock(item.product_id, item.quantity);
    }

    db.prepare(
      `UPDATE sales SET voided = 1, voided_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(id);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Permanently removes one sale and its line items. If the sale was still
// active (not already voided), its stock is restored first -- same as a
// void would do -- so inventory counts stay accurate. If it was already
// voided, stock was already restored back then, so we don't touch it again.
function deleteSale(id) {
  db.exec('BEGIN');
  try {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    if (!sale) throw new Error('Sale not found');

    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
    if (!sale.voided) {
      for (const item of items) {
        products.increaseStock(item.product_id, item.quantity);
      }
    }

    db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(id);
    db.prepare('DELETE FROM sales WHERE id = ?').run(id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Purges the entire sales history (used by "Delete All Sales History" in
// Settings/Sales History). Restores stock for any sale that hadn't
// already been voided, for the same reason as deleteSale above.
function deleteAllSales() {
  db.exec('BEGIN');
  try {
    const activeItems = db
      .prepare(
        `SELECT sale_items.product_id, sale_items.quantity
         FROM sale_items JOIN sales ON sales.id = sale_items.sale_id
         WHERE sales.voided = 0`
      )
      .all();
    for (const item of activeItems) {
      products.increaseStock(item.product_id, item.quantity);
    }
    db.exec('DELETE FROM sale_items');
    db.exec('DELETE FROM sales');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function getSaleById(id) {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
  if (!sale) return null;
  sale.items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
  return sale;
}

function getFilteredSales(filters = {}) {
  let query = `
    SELECT sales.*, users.name as user_name
    FROM sales JOIN users ON sales.user_id = users.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.customerName) {
    query += ` AND sales.customer_name LIKE ?`;
    params.push(`%${filters.customerName}%`);
  }
  if (filters.customerId) {
    query += ` AND sales.customer_id = ?`;
    params.push(filters.customerId);
  }
  if (filters.startDate) {
    query += ` AND date(sales.created_at) >= date(?)`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ` AND date(sales.created_at) <= date(?)`;
    params.push(filters.endDate);
  }
  if (filters.paymentMethod) {
    query += ` AND sales.payment_method = ?`;
    params.push(filters.paymentMethod);
  }

  query += ` ORDER BY sales.created_at DESC`;

  return db.prepare(query).all(...params);
}

function getRecentSales(limit = 100) {
  return db
    .prepare(
      `SELECT sales.*, users.name as user_name
       FROM sales JOIN users ON sales.user_id = users.id
       ORDER BY sales.created_at DESC LIMIT ?`
    )
    .all(limit);
}

function getTotalsForToday() {
  return db
    .prepare(
      `SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count
       FROM sales WHERE date(created_at) = date('now') AND voided = 0`
    )
    .get();
}

function getTotalsForMonth() {
  return db
    .prepare(
      `SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count
       FROM sales WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND voided = 0`
    )
    .get();
}

// Profit = (selling price - cost price) x quantity, summed across items,
// for non-voided sales in the given period. "today" or "month".
function getProfitFor(period) {
  const dateCondition =
    period === 'month'
      ? `strftime('%Y-%m', sales.created_at) = strftime('%Y-%m', 'now')`
      : `date(sales.created_at) = date('now')`;

  const row = db
    .prepare(
      `SELECT COALESCE(SUM((sale_items.unit_price - sale_items.cost_price) * sale_items.quantity), 0) as profit,
              COALESCE(SUM(sale_items.unit_price * sale_items.quantity), 0) as revenue
       FROM sale_items
       JOIN sales ON sales.id = sale_items.sale_id
       WHERE sales.voided = 0 AND ${dateCondition}`
    )
    .get();
  return row;
}

// Daily totals for the last N days -- used for the dashboard chart.
function getDailyTotals(days = 7) {
  const rows = db
    .prepare(
      `SELECT date(created_at) as day, COALESCE(SUM(total), 0) as total
       FROM sales
       WHERE voided = 0 AND date(created_at) >= date('now', ?)
       GROUP BY date(created_at)
       ORDER BY day ASC`
    )
    .all(`-${days - 1} days`);

  // Fill in any missing days with 0, so the chart always shows a full week.
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = rows.find((r) => r.day === key);
    result.push({ day: key, total: found ? found.total : 0 });
  }
  return result;
}

// Adds a batch of realistic sample products, customers, and sales to
// whatever data already exists -- used by the "Generate Demo Data"
// button in Settings, for an owner testing out the system on their own
// real installation. Unlike resetDemoData/wipeTransactionalData above,
// this NEVER deletes anything or touches user accounts -- it only adds.
function injectDemoData(recordedByUserId) {
  const sampleProducts = [
    { name: 'Bottled Water 500ml', category: 'Drinks', price: 1.5, cost_price: 0.8, quantity: 120, low_stock_threshold: 20 },
    { name: 'White Bread Loaf', category: 'Bakery', price: 2.25, cost_price: 1.2, quantity: 40, low_stock_threshold: 10 },
    { name: 'Rice 5kg Bag', category: 'Groceries', price: 8.99, cost_price: 6.5, quantity: 25, low_stock_threshold: 5 },
    { name: 'Cooking Oil 1L', category: 'Groceries', price: 4.5, cost_price: 3.1, quantity: 8, low_stock_threshold: 10 },
    { name: 'Notebook A5', category: 'Stationery', price: 1.75, cost_price: 0.9, quantity: 60, low_stock_threshold: 15 },
  ];

  const newProductIds = sampleProducts.map((p) => products.createProduct(p));

  const sampleCustomers = [
    { name: 'Amina Yusuf', phone: '555-0101' },
    { name: 'Carlos Rivera', phone: '555-0102' },
    { name: 'Priya Nair', phone: '555-0103' },
  ];

  sampleCustomers.forEach((c, idx) => {
    const productPick = newProductIds[idx % newProductIds.length];
    const product = products.getProductById(productPick);
    if (!product || product.quantity < 1) return;
    try {
      recordSale(
        recordedByUserId,
        [{ product_id: product.id, quantity: 1 }],
        c.name,
        0,
        0,
        c.phone,
        'Cash'
      );
    } catch (err) {
      // Skip silently if stock ran out from an earlier sample sale --
      // this is just demo data, not worth failing the whole batch over.
    }
  });
}

module.exports = {
  recordSale,
  voidSale,
  deleteSale,
  deleteAllSales,
  injectDemoData,
  getSaleById,
  getFilteredSales,
  getRecentSales,
  getTotalsForToday,
  getTotalsForMonth,
  getProfitFor,
  getDailyTotals,
  PAYMENT_METHODS,
};
