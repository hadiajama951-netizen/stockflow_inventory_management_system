// server.js
// This is the file you run to start the whole application: `npm start`

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const staffRoutes = require('./routes/staff');
const customersRoutes = require('./routes/customers');
const accountRoutes = require('./routes/account');
const { requireLogin } = require('./middleware/auth');
const { toLocal } = require('./utils/formatDate');
const { darken } = require('./utils/color');
const { getSessionSecret } = require('./utils/getSessionSecret');
const settingsModel = require('./models/settings');
const { isDemoMode, resetDemoData, ensureDemoDataOnBoot } = require('./utils/demoData');

const app = express();
const PORT = process.env.PORT || 3000;

// Demo mode only runs on the public marketplace/reviewer demo deployment
// (DEMO_MODE=true in .env). It seeds the two demo accounts + sample
// products on first boot, and wipes/reseeds them every 24 hours so the
// public demo never accumulates junk data from strangers.
ensureDemoDataOnBoot();
if (isDemoMode()) {
  setInterval(resetDemoData, 1000 * 60 * 60 * 24);
}

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sessions are kept in memory. This is simple and needs no extra setup,
// which is why we use it. The only downside: if the server restarts,
// everyone gets logged out (they just log back in -- no data is lost,
// since actual shop data lives safely in the SQLite database).
app.use(
  session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
  })
);

// Make basic session info available in every view automatically
app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session.userId;
  res.locals.userName = req.session.userName || null;
  res.locals.userRole = req.session.userRole || null;
  const shopTimezone = settingsModel.getSetting('timezone') || 'UTC';
  res.locals.formatDate = (dbTimestamp) => toLocal(dbTimestamp, shopTimezone);
  const accentColor = settingsModel.getSetting('accent_color') || '#2f6f4f';
  res.locals.accentColor = accentColor;
  res.locals.accentColorDark = darken(accentColor);
  res.locals.demoMode = isDemoMode();
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/sales', saleRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/settings', settingsRoutes);
app.use('/staff', staffRoutes);
app.use('/customers', customersRoutes);
app.use('/account', accountRoutes);

app.get('/', requireLogin, (req, res) => res.redirect('/dashboard'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found.' });
});

// Global error handler -- catches any error thrown (or passed via next(err))
// from route handlers so the app never crashes the whole server on bad
// input or an unexpected failure. Must be defined last, with 4 arguments.
app.use((err, req, res, next) => {
  res.status(500).render('error', {
    message: 'Something went wrong on our end. Please try again.',
  });
});

app.listen(PORT, () => {
  // Intentionally silent in production builds. If you need a startup
  // confirmation while developing locally, you can temporarily add
  // your own console.log here.
});
