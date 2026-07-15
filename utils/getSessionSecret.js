// utils/getSessionSecret.js
//
// Every app that handles logins needs a "session secret" -- a random
// string used to keep login sessions secure. Asking every single buyer
// to remember to manually invent a random string in .env is asking for
// trouble (most will forget, leaving a weak, shared default in place).
//
// Instead: if SESSION_SECRET isn't set in .env, we generate a strong
// random one automatically the first time the app runs, and save it to
// a local file so it stays the same across restarts (otherwise everyone
// would get logged out every time the server restarts).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const secretFilePath = path.join(__dirname, '..', 'db', '.session_secret');

function getSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET !== 'change_this_to_a_random_secret_string') {
    return process.env.SESSION_SECRET;
  }

  if (fs.existsSync(secretFilePath)) {
    return fs.readFileSync(secretFilePath, 'utf8').trim();
  }

  const generated = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(secretFilePath, generated, 'utf8');
  } catch (err) {
    // If we somehow can't write the file, the app still works -- it will
    // just generate a new secret (and log everyone out) on next restart.
    console.warn('Could not save a persistent session secret. Sessions will reset on restart.');
  }
  return generated;
}

module.exports = { getSessionSecret };
