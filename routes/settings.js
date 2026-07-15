// routes/settings.js
const express = require('express');
const router = express.Router();
const path = require('path');
const settings = require('../models/settings');
const timezones = require('../utils/timezones');
const salesModel = require('../models/sales');
const { requireLogin, requireOwner } = require('../middleware/auth');

router.use(requireLogin, requireOwner);

router.get('/', (req, res) => {
  res.render('settings', {
    settings: settings.getAllSettings(),
    timezones,
    saved: false,
    demoGenerated: false,
    passwordSaved: req.query.password_saved === '1',
    passwordError: req.query.password_error || null,
  });
});

router.post('/', (req, res) => {
  const { shop_name, currency, timezone, accent_color, tax_rate } = req.body;
  settings.setSetting('shop_name', shop_name);
  settings.setSetting('currency', currency);
  settings.setSetting('timezone', timezone);
  if (accent_color) settings.setSetting('accent_color', accent_color);
  if (tax_rate !== undefined) settings.setSetting('tax_rate', tax_rate);
  res.render('settings', { settings: settings.getAllSettings(), timezones, saved: true, demoGenerated: false });
});

// Adds a batch of realistic sample products, customers, and sales for
// testing -- purely additive, never touches existing real data or
// accounts. Handy for trying out the system before going live.
router.post('/generate-demo-data', (req, res) => {
  salesModel.injectDemoData(req.session.userId);
  res.render('settings', { settings: settings.getAllSettings(), timezones, saved: false, demoGenerated: true });
});

// Downloads the raw database file as a backup. To restore: stop the app,
// replace db/stockflow.db with this downloaded file, then start the app
// again. We deliberately don't offer a "live restore while running"
// button -- swapping the database file while it's actively in use risks
// corrupting it, so the safe manual process is the honest choice here.
router.get('/backup', (req, res) => {
  const dbPath = path.join(__dirname, '..', 'db', 'stockflow.db');
  res.download(dbPath, `stockflow-backup-${new Date().toISOString().slice(0, 10)}.db`);
});

module.exports = router;
