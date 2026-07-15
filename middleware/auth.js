// middleware/auth.js

// Blocks access to a page unless the user is logged in
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// Blocks access to a page unless the user is the shop owner
// (used for things staff shouldn't see, like full reports or settings)
function requireOwner(req, res, next) {
  if (req.session.userRole !== 'owner') {
    return res.status(403).render('error', {
      message: "You don't have permission to view this page.",
    });
  }
  next();
}

module.exports = { requireLogin, requireOwner };
