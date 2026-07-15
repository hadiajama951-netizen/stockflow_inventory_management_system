// utils/demoData.js
//
// This file is ONLY active when DEMO_MODE=true in .env (used for the
// public marketplace/reviewer demo). It seeds two demo accounts and a
// small set of sample products so reviewers/buyers can log in and try
// every feature immediately, without going through first-time setup.
//
// It also exposes a reset function that wipes and reseeds the demo data,
// so a live public demo doesn't accumulate junk data from strangers.
// This is NEVER run unless DEMO_MODE=true -- normal buyers running their
// own real shop should leave DEMO_MODE unset (or false) and go through
// the normal owner setup screen instead.

const db = require('../db/database');
const users = require('../models/users');
const products = require('../models/products');
const settings = require('../models/settings');

const DEMO_OWNER = { name: 'Demo Owner', email: 'owner@demo.com', password: 'password123', role: 'owner' };
const DEMO_STAFF = { name: 'Demo Staff', email: 'staff@demo.com', password: 'password123', role: 'staff' };

const DEMO_PRODUCTS = [
  { name: 'Bottled Water 500ml', category: 'Drinks', price: 1.5, cost_price: 0.8, quantity: 120, low_stock_threshold: 20 },
  { name: 'White Bread Loaf', category: 'Bakery', price: 2.25, cost_price: 1.2, quantity: 40, low_stock_threshold: 10 },
  { name: 'Rice 5kg Bag', category: 'Groceries', price: 8.99, cost_price: 6.5, quantity: 25, low_stock_threshold: 5 },
  { name: 'Cooking Oil 1L', category: 'Groceries', price: 4.5, cost_price: 3.1, quantity: 8, low_stock_threshold: 10 },
  { name: 'Notebook A5', category: 'Stationery', price: 1.75, cost_price: 0.9, quantity: 60, low_stock_threshold: 15 },
];

function isDemoMode() {
  return String(process.env.DEMO_MODE).toLowerCase() === 'true';
}

function wipeTransactionalData() {
  db.exec('DELETE FROM sale_items');
  db.exec('DELETE FROM sales');
  db.exec('DELETE FROM customers');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM password_resets');
}

function seedDemoData() {
  users.createUser(DEMO_OWNER);
  users.createUser(DEMO_STAFF);

  settings.setSetting('shop_name', 'StockFlow Demo Shop');
  settings.setSetting('currency', '$');
  settings.setSetting('tax_rate', '0');
  settings.setSetting('accent_color', '#2f6f4f');

  DEMO_PRODUCTS.forEach((product) => products.createProduct(product));
}

// Wipes all demo/mock data and reseeds a clean demo state. Safe to call
// on a timer (e.g. every 24 hours) on a public demo deployment.
function resetDemoData() {
  if (!isDemoMode()) return;
  wipeTransactionalData();
  seedDemoData();
}

// Called once on server start. Seeds demo data only the first time
// (when the database is empty) so restarts don't wipe real demo usage
// between the scheduled 24-hour resets.
function ensureDemoDataOnBoot() {
  if (!isDemoMode()) return;
  if (users.countUsers() === 0) {
    seedDemoData();
  }
}

module.exports = { isDemoMode, resetDemoData, ensureDemoDataOnBoot };
