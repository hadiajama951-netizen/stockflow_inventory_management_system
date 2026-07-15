// models/customers.js
const db = require('../db/database');

// Finds an existing customer by name (case-insensitive), or creates a
// new one. This is called automatically whenever a sale has a customer
// name, so shop owners build a customer list without any extra effort.
function findOrCreateCustomer(name, phone) {
  if (!name || !name.trim()) return null;

  const existing = db
    .prepare('SELECT * FROM customers WHERE LOWER(name) = LOWER(?)')
    .get(name.trim());

  if (existing) {
    // If we now have a phone number and didn't before, save it.
    if (phone && !existing.phone) {
      db.prepare('UPDATE customers SET phone = ? WHERE id = ?').run(phone, existing.id);
    }
    return existing.id;
  }

  const info = db
    .prepare('INSERT INTO customers (name, phone) VALUES (?, ?)')
    .run(name.trim(), phone || null);
  return Number(info.lastInsertRowid);
}

function getAllCustomersWithTotals() {
  return db
    .prepare(
      `SELECT customers.*,
              COUNT(sales.id) as sale_count,
              COALESCE(SUM(CASE WHEN sales.voided = 0 THEN sales.total ELSE 0 END), 0) as total_spent
       FROM customers
       LEFT JOIN sales ON sales.customer_id = customers.id
       GROUP BY customers.id
       ORDER BY customers.name ASC`
    )
    .all();
}

function getCustomerById(id) {
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
}

function searchCustomerNames(term) {
  if (!term) return [];
  return db
    .prepare('SELECT name FROM customers WHERE name LIKE ? ORDER BY name ASC LIMIT 10')
    .all(`%${term}%`);
}

// Removes one customer. Their past sales are kept (for honest bookkeeping
// and reporting) -- we just detach the link to this customer record,
// since each sale already stores its own customer_name text separately.
function deleteCustomer(id) {
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE sales SET customer_id = NULL WHERE customer_id = ?').run(id);
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Wipes the entire customer list. Past sales are kept, same as above.
function deleteAllCustomers() {
  db.exec('BEGIN');
  try {
    db.exec('UPDATE sales SET customer_id = NULL');
    db.exec('DELETE FROM customers');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = {
  findOrCreateCustomer,
  getAllCustomersWithTotals,
  getCustomerById,
  searchCustomerNames,
  deleteCustomer,
  deleteAllCustomers,
};
