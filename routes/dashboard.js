// routes/dashboard.js
const express = require('express');
const router = express.Router();
const products = require('../models/products');
const salesModel = require('../models/sales');
const settings = require('../models/settings');
const { requireLogin } = require('../middleware/auth');

router.use(requireLogin);

router.get('/', (req, res) => {
  res.render('dashboard', {
    today: salesModel.getTotalsForToday(),
    month: salesModel.getTotalsForMonth(),
    profitToday: salesModel.getProfitFor('today'),
    profitMonth: salesModel.getProfitFor('month'),
    dailyTotals: salesModel.getDailyTotals(7),
    lowStock: products.getLowStockProducts(),
    currency: settings.getSetting('currency'),
    shopName: settings.getSetting('shop_name'),
    userName: req.session.userName,
    userRole: req.session.userRole,
  });
});

module.exports = router;
