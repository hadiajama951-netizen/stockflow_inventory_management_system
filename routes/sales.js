// routes/sales.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const products = require('../models/products');
const salesModel = require('../models/sales');
const settings = require('../models/settings');
const { requireLogin, requireOwner } = require('../middleware/auth');
const { toLocal } = require('../utils/formatDate');

router.use(requireLogin);

// Page where staff pick products and quantities to make a sale
router.get('/new', (req, res) => {
  res.render('sales/new', {
    products: products.getAllProducts(),
    currency: settings.getSetting('currency'),
    taxRate: parseFloat(settings.getSetting('tax_rate')) || 0,
    paymentMethods: salesModel.PAYMENT_METHODS,
    error: null,
  });
});

router.post('/new', (req, res) => {
  // Expecting product_id[] and quantity[] arrays from the form
  let { product_id, quantity, customer_name, customer_phone, discount, payment_method } = req.body;
  if (!Array.isArray(product_id)) product_id = [product_id];
  if (!Array.isArray(quantity)) quantity = [quantity];

  const items = [];
  for (let i = 0; i < product_id.length; i++) {
    const qty = parseInt(quantity[i], 10);
    if (product_id[i] && qty > 0) {
      items.push({ product_id: parseInt(product_id[i], 10), quantity: qty });
    }
  }

  const taxRate = parseFloat(settings.getSetting('tax_rate')) || 0;

  if (items.length === 0) {
    return res.render('sales/new', {
      products: products.getAllProducts(),
      currency: settings.getSetting('currency'),
      taxRate,
      paymentMethods: salesModel.PAYMENT_METHODS,
      error: 'Please select at least one product and quantity.',
    });
  }

  try {
    const saleId = salesModel.recordSale(
      req.session.userId,
      items,
      customer_name,
      parseFloat(discount) || 0,
      taxRate,
      customer_phone,
      payment_method
    );
    res.redirect(`/sales/${saleId}`);
  } catch (err) {
    res.render('sales/new', {
      products: products.getAllProducts(),
      currency: settings.getSetting('currency'),
      taxRate,
      paymentMethods: salesModel.PAYMENT_METHODS,
      error: err.message,
    });
  }
});

// Recent sales history, with optional search/filter by customer and date range
router.get('/', (req, res) => {
  const { customer, start, end, payment_method } = req.query;
  const sales = salesModel.getFilteredSales({
    customerName: customer,
    startDate: start,
    endDate: end,
    paymentMethod: payment_method,
  });
  res.render('sales/history', {
    sales,
    currency: settings.getSetting('currency'),
    paymentMethods: salesModel.PAYMENT_METHODS,
    filters: {
      customer: customer || '',
      start: start || '',
      end: end || '',
      payment_method: payment_method || '',
    },
  });
});

// Download the currently filtered sales history as a CSV file (opens in Excel)
router.get('/export/csv', (req, res) => {
  const { customer, start, end, payment_method } = req.query;
  const sales = salesModel.getFilteredSales({
    customerName: customer,
    startDate: start,
    endDate: end,
    paymentMethod: payment_method,
  });
  const shopTimezone = settings.getSetting('timezone') || 'UTC';

  const escapeCsv = (val) => {
    const str = String(val === null || val === undefined ? '' : val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [
    ['Invoice #', 'Customer', 'Date', 'Recorded By', 'Payment Method', 'Discount', 'Tax', 'Total', 'Status'],
  ];
  sales.forEach((s) => {
    rows.push([
      s.id,
      s.customer_name || '',
      toLocal(s.created_at, shopTimezone),
      s.user_name,
      s.payment_method || 'Cash',
      s.discount ? s.discount.toFixed(2) : '0.00',
      s.tax_amount ? s.tax_amount.toFixed(2) : '0.00',
      s.total.toFixed(2),
      s.voided ? 'Voided' : 'Completed',
    ]);
  });

  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sales-history.csv');
  res.send(csv);
});

// Download the currently filtered sales history as a PDF report
router.get('/export/pdf', (req, res) => {
  const { customer, start, end, payment_method } = req.query;
  const sales = salesModel.getFilteredSales({
    customerName: customer,
    startDate: start,
    endDate: end,
    paymentMethod: payment_method,
  });
  const currency = settings.getSetting('currency');
  const shopName = settings.getSetting('shop_name');
  const shopTimezone = settings.getSetting('timezone') || 'UTC';

  const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=sales-history.pdf');
  doc.pipe(res);

  doc.fontSize(18).text(shopName, { align: 'left' });
  doc.fontSize(10).fillColor('#555').text('Sales History Report', { align: 'left' });
  if (customer) doc.text(`Filtered by customer: ${customer}`, { align: 'left' });
  doc.moveDown(1.5);
  doc.fillColor('#000');

  const tableTop = doc.y;
  const cols = { id: 50, customer: 110, date: 280, staff: 400, payment: 500, total: 610, status: 690 };
  doc.fontSize(10);
  doc.text('Invoice #', cols.id, tableTop);
  doc.text('Customer', cols.customer, tableTop);
  doc.text('Date', cols.date, tableTop);
  doc.text('Staff', cols.staff, tableTop);
  doc.text('Payment', cols.payment, tableTop);
  doc.text('Total', cols.total, tableTop);
  doc.text('Status', cols.status, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(750, tableTop + 15).stroke();

  let y = tableTop + 22;
  let grandTotal = 0;

  sales.forEach((s) => {
    if (y > 500) {
      doc.addPage({ size: 'A4', layout: 'landscape' });
      y = 50;
    }
    doc.fontSize(9);
    doc.text(`#${s.id}`, cols.id, y);
    doc.text(s.customer_name || '-', cols.customer, y, { width: 110 });
    doc.text(toLocal(s.created_at, shopTimezone), cols.date, y);
    doc.text(s.user_name, cols.staff, y, { width: 90 });
    doc.text(s.payment_method || 'Cash', cols.payment, y);
    doc.text(`${currency}${s.total.toFixed(2)}`, cols.total, y);
    doc.text(s.voided ? 'Voided' : 'Completed', cols.status, y);
    if (!s.voided) grandTotal += s.total;
    y += 18;
  });

  doc.moveTo(50, y + 5).lineTo(750, y + 5).stroke();
  doc.fontSize(12).text(`Grand Total (excluding voided): ${currency}${grandTotal.toFixed(2)}`, cols.id, y + 15);

  doc.end();
});

// Sale confirmation page, with a link to download the invoice
router.get('/:id', (req, res) => {
  const sale = salesModel.getSaleById(req.params.id);
  if (!sale) return res.status(404).render('error', { message: 'Sale not found.' });
  res.render('sales/receipt', {
    sale,
    currency: settings.getSetting('currency'),
    shopName: settings.getSetting('shop_name'),
  });
});

// Void a sale: restores stock, keeps the record for honest bookkeeping.
// Owner-only, to avoid staff quietly erasing sales.
router.post('/:id/void', requireOwner, (req, res) => {
  try {
    salesModel.voidSale(req.params.id);
  } catch (err) {
    // Fall through either way to show the sale page again with its current state.
  }
  res.redirect(`/sales/${req.params.id}`);
});

// Permanently deletes one sale (and its line items). Different from
// voiding: void keeps a "cancelled" record for bookkeeping, delete
// removes it entirely. Owner-only since it's irreversible.
router.post('/:id/delete', requireOwner, (req, res) => {
  salesModel.deleteSale(req.params.id);
  res.redirect('/sales');
});

// Purges the entire sales history. Owner-only, and only ever reachable
// through the confirmation modal on the Sales History page.
router.post('/delete-all', requireOwner, (req, res) => {
  salesModel.deleteAllSales();
  res.redirect('/sales');
});

// Generates and downloads a PDF invoice for a given sale
router.get('/:id/invoice', (req, res) => {
  const sale = salesModel.getSaleById(req.params.id);
  if (!sale) return res.status(404).render('error', { message: 'Sale not found.' });

  const currency = settings.getSetting('currency');
  const shopName = settings.getSetting('shop_name');
  const shopTimezone = settings.getSetting('timezone') || 'UTC';

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=invoice-${sale.id}.pdf`
  );
  doc.pipe(res);

  // Header
  doc.fontSize(20).text(shopName, { align: 'left' });
  doc.fontSize(10).fillColor('#555').text(`Invoice #${sale.id}`, { align: 'left' });
  doc.text(`Date: ${toLocal(sale.created_at, shopTimezone)}`, { align: 'left' });
  if (sale.customer_name) {
    doc.text(`Customer: ${sale.customer_name}`, { align: 'left' });
  }
  doc.text(`Payment Method: ${sale.payment_method || 'Cash'}`, { align: 'left' });
  if (sale.voided) {
    doc.fillColor('#b3311f').text('*** THIS SALE WAS VOIDED / CANCELLED ***', { align: 'left' });
  }
  doc.moveDown(2);
  doc.fillColor('#000');

  // Table header
  const tableTop = doc.y;
  doc.fontSize(11).text('Item', 50, tableTop);
  doc.text('Qty', 300, tableTop);
  doc.text('Unit Price', 360, tableTop);
  doc.text('Subtotal', 460, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let y = tableTop + 25;
  sale.items.forEach((item) => {
    doc.fontSize(10).text(item.product_name, 50, y);
    doc.text(String(item.quantity), 300, y);
    doc.text(`${currency}${item.unit_price.toFixed(2)}`, 360, y);
    doc.text(`${currency}${item.subtotal.toFixed(2)}`, 460, y);
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();

  if (sale.discount > 0) {
    doc.fontSize(10).text(`Discount: -${currency}${sale.discount.toFixed(2)}`, 360, y + 15);
    y += 15;
  }

  if (sale.tax_amount > 0) {
    doc.fontSize(10).text(`Tax: +${currency}${sale.tax_amount.toFixed(2)}`, 360, y + 15);
    y += 15;
  }

  doc.fontSize(13).text(`Total: ${currency}${sale.total.toFixed(2)}`, 360, y + 20);

  doc.moveDown(4);
  doc.fontSize(9).fillColor('#888').text('Thank you for your business.', 50, y + 60);

  doc.end();
});

module.exports = router;
