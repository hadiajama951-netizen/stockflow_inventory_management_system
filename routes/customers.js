// routes/customers.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const customers = require('../models/customers');
const salesModel = require('../models/sales');
const settings = require('../models/settings');
const { requireLogin, requireOwner } = require('../middleware/auth');

router.use(requireLogin);

function escapeCsv(val) {
  const str = String(val === null || val === undefined ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

router.get('/', (req, res) => {
  res.render('customers/list', {
    customers: customers.getAllCustomersWithTotals(),
    currency: settings.getSetting('currency'),
  });
});

// Downloads every customer as a CSV file (must be defined before the
// /:id route below, or Express would treat "export" as a customer id).
router.get('/export/all/csv', (req, res) => {
  const all = customers.getAllCustomersWithTotals();
  const rows = [['Name', 'Phone', 'Purchases', 'Total Spent']];
  all.forEach((c) => {
    rows.push([c.name, c.phone || '', c.sale_count, c.total_spent.toFixed(2)]);
  });
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=all-customers.csv');
  res.send(csv);
});

// Downloads every customer as a simple PDF list.
router.get('/export/all/pdf', (req, res) => {
  const all = customers.getAllCustomersWithTotals();
  const currency = settings.getSetting('currency');
  const shopName = settings.getSetting('shop_name');

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=all-customers.pdf');
  doc.pipe(res);

  doc.fontSize(18).text(shopName, { align: 'left' });
  doc.fontSize(10).fillColor('#555').text('All Customers', { align: 'left' });
  doc.moveDown(1.5);
  doc.fillColor('#000');

  const tableTop = doc.y;
  doc.fontSize(10);
  doc.text('Name', 50, tableTop);
  doc.text('Phone', 250, tableTop);
  doc.text('Purchases', 380, tableTop);
  doc.text('Total Spent', 470, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let y = tableTop + 22;
  all.forEach((c) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(9);
    doc.text(c.name, 50, y, { width: 190 });
    doc.text(c.phone || '-', 250, y);
    doc.text(String(c.sale_count), 380, y);
    doc.text(`${currency}${c.total_spent.toFixed(2)}`, 470, y);
    y += 18;
  });

  doc.end();
});

// Wipes the entire customer list. Owner-only, and only ever reachable
// through the confirmation modal on the Customers page.
router.post('/delete-all', requireOwner, (req, res) => {
  customers.deleteAllCustomers();
  res.redirect('/customers');
});

router.get('/:id', (req, res) => {
  const customer = customers.getCustomerById(req.params.id);
  if (!customer) return res.status(404).render('error', { message: 'Customer not found.' });

  const sales = salesModel.getFilteredSales({ customerId: customer.id });
  res.render('customers/detail', {
    customer,
    sales,
    currency: settings.getSetting('currency'),
  });
});

// Downloads one customer's profile + purchase history as a PDF.
router.get('/:id/export/pdf', (req, res) => {
  const customer = customers.getCustomerById(req.params.id);
  if (!customer) return res.status(404).render('error', { message: 'Customer not found.' });

  const sales = salesModel.getFilteredSales({ customerId: customer.id });
  const currency = settings.getSetting('currency');
  const shopName = settings.getSetting('shop_name');
  const totalSpent = sales.filter((s) => !s.voided).reduce((sum, s) => sum + s.total, 0);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=customer-${customer.id}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text(shopName, { align: 'left' });
  doc.fontSize(10).fillColor('#555').text('Customer Profile', { align: 'left' });
  doc.moveDown(1);
  doc.fillColor('#000');
  doc.fontSize(14).text(customer.name);
  if (customer.phone) doc.fontSize(10).fillColor('#555').text(`Phone: ${customer.phone}`);
  doc.fillColor('#000');
  doc.fontSize(11).text(`Total Spent: ${currency}${totalSpent.toFixed(2)}`);
  doc.text(`Total Purchases: ${sales.length}`);
  doc.moveDown(1.5);

  const tableTop = doc.y;
  doc.fontSize(10);
  doc.text('Invoice #', 50, tableTop);
  doc.text('Date', 150, tableTop);
  doc.text('Total', 300, tableTop);
  doc.text('Status', 400, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let y = tableTop + 22;
  sales.forEach((s) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(9);
    doc.text(`#${s.id}`, 50, y);
    doc.text(new Date(s.created_at).toLocaleDateString(), 150, y);
    doc.text(`${currency}${s.total.toFixed(2)}`, 300, y);
    doc.text(s.voided ? 'Voided' : 'Completed', 400, y);
    y += 18;
  });

  doc.end();
});

// Removes one customer. Owner-only, since this permanently detaches them
// from their sales history.
router.post('/:id/delete', requireOwner, (req, res) => {
  customers.deleteCustomer(req.params.id);
  res.redirect('/customers');
});

// Used by the New Sale page for name autocomplete suggestions as you type
router.get('/api/search', (req, res) => {
  const term = req.query.q || '';
  res.json(customers.searchCustomerNames(term));
});

module.exports = router;
