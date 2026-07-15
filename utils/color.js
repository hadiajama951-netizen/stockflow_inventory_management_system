// utils/color.js
//
// When a shop owner picks a theme color, we also need a slightly darker
// version of it automatically -- used for button hover effects. Rather
// than asking them to pick two colors, we calculate the darker one.

function darken(hex, amount = 0.18) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  if (Number.isNaN(num) || clean.length !== 6) return hex;

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));

  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

module.exports = { darken };
