// routes/products.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const products = require('../models/products');
const settings = require('../models/settings');
const { requireLogin } = require('../middleware/auth');

router.use(requireLogin);

router.get('/', (req, res) => {
  const search = req.query.search || '';
  res.render('products/list', {
    products: products.searchProducts(search),
    search,
    currency: settings.getSetting('currency'),
  });
});

// Downloads the entire product catalog as a CSV file. Defined before
// /:id routes so "export" is never mistaken for a product id.
router.get('/export/all/csv', (req, res) => {
  const all = products.getAllProducts();
  const rows = [['Name', 'Category', 'Price', 'Cost Price', 'Quantity', 'Low Stock Threshold', 'Barcode']];
  all.forEach((p) => {
    rows.push([p.name, p.category || '', p.price.toFixed(2), (p.cost_price || 0).toFixed(2), p.quantity, p.low_stock_threshold, p.barcode || '']);
  });
  const escapeCsv = (val) => {
    const str = String(val === null || val === undefined ? '' : val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=product-catalog.csv');
  res.send(csv);
});

router.get('/new', (req, res) => {
  res.render('products/form', { product: null, error: null });
});

router.post('/new', (req, res) => {
  const { name, category, price, cost_price, barcode, quantity, low_stock_threshold } = req.body;

  if (!name || !price) {
    return res.render('products/form', {
      product: req.body,
      error: 'Product name and price are required.',
    });
  }

  products.createProduct({
    name,
    category,
    price: parseFloat(price),
    cost_price: parseFloat(cost_price) || 0,
    barcode,
    quantity: parseInt(quantity, 10) || 0,
    low_stock_threshold: parseInt(low_stock_threshold, 10) || 5,
  });

  res.redirect('/products');
});

// Downloads one product's details as a simple inventory card PDF.
router.get('/:id/export/pdf', (req, res) => {
  const product = products.getProductById(req.params.id);
  if (!product) return res.status(404).render('error', { message: 'Product not found.' });

  const currency = settings.getSetting('currency');
  const shopName = settings.getSetting('shop_name');

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=product-${product.id}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text(shopName, { align: 'left' });
  doc.fontSize(10).fillColor('#555').text('Inventory Card', { align: 'left' });
  doc.moveDown(1);
  doc.fillColor('#000');
  doc.fontSize(16).text(product.name);
  if (product.category) doc.fontSize(10).fillColor('#555').text(`Category: ${product.category}`);
  doc.fillColor('#000');
  doc.moveDown(0.5);

  doc.fontSize(11);
  doc.text(`Selling Price: ${currency}${product.price.toFixed(2)}`);
  doc.text(`Cost Price: ${currency}${(product.cost_price || 0).toFixed(2)}`);
  doc.text(`Quantity in Stock: ${product.quantity}`);
  doc.text(`Low Stock Alert Level: ${product.low_stock_threshold}`);
  if (product.barcode) doc.text(`Barcode: ${product.barcode}`);
  doc.text(`Status: ${product.quantity <= product.low_stock_threshold ? 'Low Stock' : 'OK'}`);

  doc.end();
});

router.get('/:id/edit', (req, res) => {
  const product = products.getProductById(req.params.id);
  if (!product) return res.status(404).render('error', { message: 'Product not found.' });
  res.render('products/form', { product, error: null });
});

router.post('/:id/edit', (req, res) => {
  const { name, category, price, cost_price, barcode, quantity, low_stock_threshold } = req.body;

  if (!name || !price) {
    return res.render('products/form', {
      product: { ...req.body, id: req.params.id },
      error: 'Product name and price are required.',
    });
  }

  products.updateProduct(req.params.id, {
    name,
    category,
    price: parseFloat(price),
    cost_price: parseFloat(cost_price) || 0,
    barcode,
    quantity: parseInt(quantity, 10) || 0,
    low_stock_threshold: parseInt(low_stock_threshold, 10) || 5,
  });

  res.redirect('/products');
});

router.post('/:id/delete', (req, res) => {
  products.deleteProduct(req.params.id);
  res.redirect('/products');
});

// Used by the New Sale page to instantly find a product when a barcode
// scanner "types" a code followed by Enter.
router.get('/api/barcode/:code', (req, res) => {
  const product = products.getProductByBarcode(req.params.code);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

module.exports = router;
