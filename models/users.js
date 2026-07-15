// models/users.js
const bcrypt = require('bcryptjs');
const db = require('../db/database');

function createUser({ name, email, password, role }) {
  const password_hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(name, email, password_hash, role || 'staff');
  return Number(info.lastInsertRowid);
}

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function countUsers() {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return row.count;
}

function getAllUsers() {
  return db
    .prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC')
    .all();
}

function deleteUser(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

function updateUser(id, { name, email, role }) {
  db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?').run(name, email, role, id);
}

function updatePassword(userId, newPassword) {
  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, userId);
}

function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.password_hash);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  countUsers,
  getAllUsers,
  deleteUser,
  updateUser,
  updatePassword,
  verifyPassword,
};
