// routes/account.js
const express = require('express');
const router = express.Router();
const users = require('../models/users');
const { requireLogin } = require('../middleware/auth');

router.use(requireLogin);

// A minimal "My Account" page so BOTH staff and owners can change their
// own password -- Settings itself stays owner-only (shop-wide settings),
// but everyone needs a safe way to update their own login.
router.get('/', (req, res) => {
  res.render('account', {
    error: req.query.password_error || null,
    saved: req.query.password_saved === '1',
  });
});

router.post('/change-password', (req, res) => {
  const { current_password, new_password, confirm_password, return_to } = req.body;
  const user = users.findUserById(req.session.userId);
  // Only ever redirect back to a known safe in-app page, never an
  // arbitrary URL from the form.
  const backTo = return_to === '/settings' ? '/settings' : '/account';

  if (!users.verifyPassword(user, current_password || '')) {
    return res.redirect(`${backTo}?password_error=${encodeURIComponent('Your current password is incorrect.')}`);
  }
  if (!new_password || new_password.length < 6) {
    return res.redirect(`${backTo}?password_error=${encodeURIComponent('New password must be at least 6 characters.')}`);
  }
  if (new_password !== confirm_password) {
    return res.redirect(`${backTo}?password_error=${encodeURIComponent('New password and confirmation do not match.')}`);
  }

  users.updatePassword(user.id, new_password);
  res.redirect(`${backTo}?password_saved=1`);
});

module.exports = router;
