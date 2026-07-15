// db/database.js
// This file creates the database file (if it doesn't exist yet) and
// makes sure all the tables we need are in place.
//
// We use Node's BUILT-IN SQLite module (node:sqlite) instead of an
// external package. This means: no separate database server, and no
// native compilation step required when someone installs this project.
// Requires Node.js version 22.5.0 or newer.

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, 'stockflow.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

// ---------- TABLES ----------

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  price REAL NOT NULL,
  cost_price REAL NOT NULL DEFAULT 0,
  barcode TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const productColumns = db.prepare(`PRAGMA table_info(products)`).all();
const productColumnNames = productColumns.map((col) => col.name);
if (!productColumnNames.includes('cost_price')) {
  db.exec(`ALTER TABLE products ADD COLUMN cost_price REAL NOT NULL DEFAULT 0;`);
}
if (!productColumnNames.includes('barcode')) {
  db.exec(`ALTER TABLE products ADD COLUMN barcode TEXT;`);
}

db.exec(`
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  customer_id INTEGER,
  customer_name TEXT,
  discount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  voided INTEGER NOT NULL DEFAULT 0,
  voided_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
`);

// If the app is running on an older database created before we added
// these columns, add them now instead of breaking on start-up.
const salesColumns = db.prepare(`PRAGMA table_info(sales)`).all();
const salesColumnNames = salesColumns.map((col) => col.name);
if (!salesColumnNames.includes('customer_name')) {
  db.exec(`ALTER TABLE sales ADD COLUMN customer_name TEXT;`);
}
if (!salesColumnNames.includes('discount')) {
  db.exec(`ALTER TABLE sales ADD COLUMN discount REAL NOT NULL DEFAULT 0;`);
}
if (!salesColumnNames.includes('voided')) {
  db.exec(`ALTER TABLE sales ADD COLUMN voided INTEGER NOT NULL DEFAULT 0;`);
}
if (!salesColumnNames.includes('voided_at')) {
  db.exec(`ALTER TABLE sales ADD COLUMN voided_at TEXT;`);
}
if (!salesColumnNames.includes('customer_id')) {
  db.exec(`ALTER TABLE sales ADD COLUMN customer_id INTEGER;`);
}
if (!salesColumnNames.includes('tax_amount')) {
  db.exec(`ALTER TABLE sales ADD COLUMN tax_amount REAL NOT NULL DEFAULT 0;`);
}
if (!salesColumnNames.includes('payment_method')) {
  db.exec(`ALTER TABLE sales ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'Cash';`);
}

db.exec(`
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  cost_price REAL NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

const saleItemColumns = db.prepare(`PRAGMA table_info(sale_items)`).all();
const saleItemColumnNames = saleItemColumns.map((col) => col.name);
if (!saleItemColumnNames.includes('cost_price')) {
  db.exec(`ALTER TABLE sale_items ADD COLUMN cost_price REAL NOT NULL DEFAULT 0;`);
}

db.exec(`
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

// ---------- DEFAULT SETTINGS ----------

let detectedTimezone = 'UTC';
try {
  detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
} catch (err) {
  detectedTimezone = 'UTC';
}

const defaultSettings = {
  shop_name: process.env.DEFAULT_SHOP_NAME || 'Your Shop Name',
  currency: process.env.DEFAULT_CURRENCY || '$',
  timezone: detectedTimezone,
  accent_color: '#2f6f4f',
  tax_rate: '0',
};

const insertSetting = db.prepare(
  `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
);
for (const [key, value] of Object.entries(defaultSettings)) {
  insertSetting.run(key, value);
}

module.exports = db;
