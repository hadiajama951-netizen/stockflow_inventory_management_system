// routes/staff.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const users = require('../models/users');
const { requireLogin, requireOwner } = require('../middleware/auth');

router.use(requireLogin, requireOwner);

// The Add/Edit Staff form offers "Staff" or "Admin" -- "Admin" maps to
// this system's existing 'owner' role (the role that already unlocks
// Staff Accounts, Settings, and full reports), and "Staff" maps to the
// existing 'staff' role. Any other value falls back to 'staff' so a
// tampered form can't silently grant admin rights.
function roleFromForm(value) {
  return value === 'Admin' || value === 'owner' ? 'owner' : 'staff';
}

router.get('/', (req, res) => {
  const all = users.getAllUsers();
  res.render('staff', {
    owners: all.filter((u) => u.role === 'owner'),
    staffList: all.filter((u) => u.role !== 'owner'),
    currentUserId: req.session.userId,
    error: null,
  });
});

router.post('/new', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || password.length < 6) {
    const all = users.getAllUsers();
    return res.render('staff', {
      owners: all.filter((u) => u.role === 'owner'),
      staffList: all.filter((u) => u.role !== 'owner'),
      currentUserId: req.session.userId,
      error: 'Please fill all fields. Password must be at least 6 characters.',
    });
  }

  try {
    users.createUser({ name, email, password, role: roleFromForm(role) });
    res.redirect('/staff');
  } catch (err) {
    const all = users.getAllUsers();
    res.render('staff', {
      owners: all.filter((u) => u.role === 'owner'),
      staffList: all.filter((u) => u.role !== 'owner'),
      currentUserId: req.session.userId,
      error: 'That email is already registered.',
    });
  }
});

// Downloads the full staff list (owners + staff) as a CSV file.
router.get('/export/all/csv', (req, res) => {
  const all = users.getAllUsers();
  const rows = [['Name', 'Email', 'Role', 'Added On']];
  all.forEach((u) => {
    rows.push([u.name, u.email, u.role, new Date(u.created_at).toLocaleDateString()]);
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
  res.setHeader('Content-Disposition', 'attachment; filename=staff-list.csv');
  res.send(csv);
});

// Downloads one employee's account summary as a PDF.
router.get('/:id/export/pdf', (req, res) => {
  const user = users.findUserById(req.params.id);
  if (!user) return res.status(404).render('error', { message: 'Account not found.' });

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=staff-${user.id}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text('Employee Summary', { align: 'left' });
  doc.moveDown(1);
  doc.fontSize(14).text(user.name);
  doc.fontSize(11).fillColor('#555').text(user.email);
  doc.fillColor('#000');
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Role: ${user.role === 'owner' ? 'Admin / Owner' : 'Staff'}`);
  doc.text(`Account Added: ${new Date(user.created_at).toLocaleDateString()}`);

  doc.end();
});

router.get('/:id/edit', (req, res) => {
  const user = users.findUserById(req.params.id);
  if (!user) return res.status(404).render('error', { message: 'Account not found.' });
  res.render('staff-edit', { staffUser: user, error: null });
});

router.post('/:id/edit', (req, res) => {
  const { name, email, role } = req.body;
  const targetId = Number(req.params.id);

  if (!name || !email) {
    const user = users.findUserById(req.params.id);
    return res.render('staff-edit', { staffUser: { ...user, name, email, role }, error: 'Name and email are required.' });
  }

  // Safety check: an owner can't demote their own account, which would
  // lock them out of Staff Accounts / Settings with no admin left to
  // undo it (unless another admin exists).
  if (targetId === req.session.userId && roleFromForm(role) !== 'owner') {
    const otherOwners = users.getAllUsers().filter((u) => u.role === 'owner' && u.id !== targetId);
    if (otherOwners.length === 0) {
      const user = users.findUserById(req.params.id);
      return res.render('staff-edit', {
        staffUser: { ...user, name, email, role },
        error: 'You cannot remove your own admin access -- add another admin account first.',
      });
    }
  }

  try {
    users.updateUser(req.params.id, { name, email, role: roleFromForm(role) });
    res.redirect('/staff');
  } catch (err) {
    const user = users.findUserById(req.params.id);
    res.render('staff-edit', { staffUser: { ...user, name, email, role }, error: 'That email is already registered to another account.' });
  }
});

router.post('/:id/delete', (req, res) => {
  // Safety check: an owner can never delete their own account this way,
  // which would lock everyone out of the shop.
  if (Number(req.params.id) === req.session.userId) {
    const all = users.getAllUsers();
    return res.render('staff', {
      owners: all.filter((u) => u.role === 'owner'),
      staffList: all.filter((u) => u.role !== 'owner'),
      currentUserId: req.session.userId,
      error: 'You cannot remove your own owner account.',
    });
  }
  users.deleteUser(req.params.id);
  res.redirect('/staff');
});

module.exports = router;
