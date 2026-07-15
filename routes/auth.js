// routes/auth.js
const express = require('express');
const router = express.Router();
const users = require('../models/users');
const settings = require('../models/settings');
const passwordResets = require('../models/passwordResets');
const { loginRateLimit } = require('../middleware/rateLimit');
const { isEmailConfigured, sendPasswordResetEmail } = require('../utils/mailer');

// GET /register -- only allowed if no owner account exists yet.
// This is how the FIRST person (the shop owner) sets up the system.
router.get('/register', (req, res) => {
  if (users.countUsers() > 0) {
    return res.redirect('/login');
  }
  res.render('register', { error: null, shopName: settings.getSetting('shop_name') });
});

router.post('/register', (req, res) => {
  if (users.countUsers() > 0) {
    return res.redirect('/login');
  }
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 6) {
    return res.render('register', {
      error: 'Please fill all fields. Password must be at least 6 characters.',
      shopName: settings.getSetting('shop_name'),
    });
  }

  try {
    // The very first account is always the owner
    const userId = users.createUser({ name, email, password, role: 'owner' });
    req.session.userId = userId;
    req.session.userRole = 'owner';
    req.session.userName = name;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('register', {
      error: 'That email is already registered.',
      shopName: settings.getSetting('shop_name'),
    });
  }
});

router.get('/login', (req, res) => {
  if (users.countUsers() === 0) {
    return res.redirect('/register');
  }
  res.render('login', { error: null, shopName: settings.getSetting('shop_name') });
});

router.post('/login', loginRateLimit, (req, res) => {
  const { email, password } = req.body;
  const user = users.findUserByEmail(email);

  if (!user || !users.verifyPassword(user, password)) {
    return res.render('login', {
      error: 'Incorrect email or password.',
      shopName: settings.getSetting('shop_name'),
    });
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.userName = user.name;
  res.redirect('/dashboard');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// ---------- Forgot / Reset Password ----------

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', {
    shopName: settings.getSetting('shop_name'),
    message: null,
    error: null,
  });
});

router.post('/forgot-password', loginRateLimit, async (req, res) => {
  const { email } = req.body;
  const user = users.findUserByEmail(email);
  const shopName = settings.getSetting('shop_name');

  // We always show the same message whether or not the email exists --
  // this prevents someone from using this form to check which emails
  // are registered in the shop.
  const genericMessage =
    "If that email is registered, we've sent password reset instructions to it.";

  if (!user) {
    return res.render('forgot-password', { shopName, message: genericMessage, error: null });
  }

  if (!isEmailConfigured()) {
    return res.render('forgot-password', {
      shopName,
      message: null,
      error:
        "This shop hasn't set up email sending yet. Please ask your shop owner to reset your password from the Staff Accounts page instead.",
    });
  }

  const token = passwordResets.createResetToken(user.id);
  const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink, shopName);
  } catch (err) {
    // Email sending failed (e.g. bad SMTP config) -- don't crash or leak
    // details to the user, just show the same generic message.
  }

  res.render('forgot-password', { shopName, message: genericMessage, error: null });
});

router.get('/reset-password/:token', (req, res) => {
  const reset = passwordResets.getValidReset(req.params.token);
  if (!reset) {
    return res.render('error', {
      message: 'This password reset link is invalid or has expired. Please request a new one.',
    });
  }
  res.render('reset-password', {
    token: req.params.token,
    shopName: settings.getSetting('shop_name'),
    error: null,
  });
});

router.post('/reset-password/:token', (req, res) => {
  const reset = passwordResets.getValidReset(req.params.token);
  if (!reset) {
    return res.render('error', {
      message: 'This password reset link is invalid or has expired. Please request a new one.',
    });
  }

  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.render('reset-password', {
      token: req.params.token,
      shopName: settings.getSetting('shop_name'),
      error: 'Password must be at least 6 characters.',
    });
  }

  users.updatePassword(reset.user_id, password);
  passwordResets.markTokenUsed(req.params.token);

  res.render('login', {
    error: null,
    message: 'Your password has been reset. Please log in with your new password.',
    shopName: settings.getSetting('shop_name'),
  });
});

module.exports = router;
