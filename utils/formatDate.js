// utils/formatDate.js
//
// The database stores every date/time in UTC (a universal time standard),
// which is normal and correct for databases. But when we SHOW that time
// to a shop owner, we need to convert it to THEIR shop's chosen time zone
// -- not just whatever computer happens to be running the server. This
// matters a lot once this product is sold to shops in different countries,
// or hosted online on a server based somewhere else entirely.
//
// SQLite gives us timestamps like "2026-07-11 19:25:23" with no timezone
// marker. We tell JavaScript "this is UTC" by reformatting it properly,
// then format it into the shop's configured time zone.

function toLocal(dbTimestamp, timezone) {
  if (!dbTimestamp) return '';
  const isoUtc = dbTimestamp.replace(' ', 'T') + 'Z';
  const date = new Date(isoUtc);

  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone || 'UTC',
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch (err) {
    // If an invalid timezone was ever saved, fall back safely instead of crashing.
    return date.toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'medium' });
  }
}

module.exports = { toLocal };
