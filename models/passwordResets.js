// models/passwordResets.js
const crypto = require('crypto');
const db = require('../db/database');

const TOKEN_VALID_MINUTES = 30;

function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_VALID_MINUTES * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`
  ).run(userId, token, expiresAt);

  return token;
}

function getValidReset(token) {
  const reset = db
    .prepare(`SELECT * FROM password_resets WHERE token = ? AND used = 0`)
    .get(token);

  if (!reset) return null;
  if (new Date(reset.expires_at).getTime() < Date.now()) return null;
  return reset;
}

function markTokenUsed(token) {
  db.prepare(`UPDATE password_resets SET used = 1 WHERE token = ?`).run(token);
}

module.exports = { createResetToken, getValidReset, markTokenUsed };
