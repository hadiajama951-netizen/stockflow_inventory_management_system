// middleware/rateLimit.js
// A simple, dependency-free protection against someone trying to guess
// passwords by submitting the login form over and over very quickly.
// It tracks attempts per IP address in memory.

const attempts = new Map(); // ip -> { count, firstAttempt }

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10;

function loginRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (record.count >= MAX_ATTEMPTS) {
    return res.status(429).render('error', {
      message: 'Too many login attempts. Please wait a few minutes and try again.',
    });
  }

  record.count += 1;
  next();
}

module.exports = { loginRateLimit };
