// public/js/helpbot-data.js
//
// This is the "brain" of the built-in Help Assistant. It's just a plain
// list of common questions and answers -- no AI, no API, no cost. It
// works by looking for keywords in whatever the person types, and
// replying with the best matching answer. It also tolerates small
// spelling mistakes (see helpbotFindAnswer below), so a typo doesn't
// reset the conversation back to the default fallback message.
//
// Buyers/developers: to add your own questions, just add more objects
// to this list, following the same { keywords, answer } pattern.

const HELPBOT_QA = [
  {
    keywords: ['dashboard', 'daily total', 'monthly total', 'sales report', 'sales today', 'today\'s sales'],
    answer: "The Dashboard (first page after login) shows your sales totals for today and this month, a 7-day sales chart, and any low-stock alerts. Owners also see profit figures based on cost vs. selling price.",
  },
  {
    keywords: ['settings', 'gear icon', 'shop name', 'shop settings'],
    answer: "Click the gear icon in the sidebar to open Settings. From there you can change your shop name, currency symbol, time zone, tax rate, theme color, generate demo data, and download a data backup (owner only).",
  },
  {
    keywords: ['sales history', 'past sale', 'past transaction', 'previous sale', 'view sales'],
    answer: "Go to Sales History in the sidebar to see every past sale, with filters for customer name and date range. Click into any sale to view, reprint, void, or (owner only) permanently delete it.",
  },
  {
    keywords: ['delete sale', 'remove sale', 'delete invoice', 'delete transaction'],
    answer: "In Sales History, click 'Delete' next to any sale row to permanently remove that transaction (owner only). This is different from 'Void', which cancels a sale but keeps a record of it.",
  },
  {
    keywords: ['delete all sales', 'clear sales history', 'purge sales', 'reset sales history', 'wipe sales'],
    answer: "At the top of Sales History, owners can click 'Delete All Sales History' to permanently purge every transaction. A confirmation window will double-check before anything is deleted -- this cannot be undone.",
  },
  {
    keywords: ['staff account', 'staff login', 'manage staff', 'where are staff'],
    answer: "Staff Accounts (owner only) is in the sidebar. It's split into two lists: Owners/Admins at the top and Staff Members below, each with Edit, Delete, and Download buttons per person.",
  },
  {
    keywords: ['add staff', 'new staff', 'add employee', 'create staff'],
    answer: "To add a staff member: go to Staff Accounts (in the sidebar, owner only), fill in their name, email, and a temporary password, choose a Role (Staff or Admin), then click 'Add Staff Member'.",
  },
  {
    keywords: ['edit staff', 'edit employee', 'edit account', 'change staff role', 'promote staff', 'admin role'],
    answer: "In Staff Accounts, click 'Edit' next to any account (owner or staff) to change their name, email, or role between Staff and Admin.",
  },
  {
    keywords: ['search staff', 'find staff', 'find employee'],
    answer: "The Staff Members table on the Staff Accounts page has a live search box above it -- start typing a name and the list filters instantly.",
  },
  {
    keywords: ['change currency', 'currency symbol', 'change money'],
    answer: "Go to Settings and look for 'Currency symbol'. Type whatever symbol you use (like $, €, £, or KES) and click Save Settings. It updates everywhere immediately.",
  },
  {
    keywords: ['time zone', 'timezone', 'wrong time', 'time is wrong'],
    answer: "If times look wrong, go to Settings and choose your correct time zone from the dropdown. Every receipt and report will then show the correct local time for your shop.",
  },
  {
    keywords: ['change color', 'theme', 'color', 'colour', 'branding'],
    answer: "You can change the whole app's color in Settings, under 'Theme Color'. Pick one of the preset colors or use the custom color picker -- it applies everywhere instantly, no coding needed.",
  },
  {
    keywords: ['generate demo data', 'demo data', 'sample data', 'test data'],
    answer: "In Settings, click 'Generate Demo Data' to add realistic sample products, customers, and sales for testing. It only adds data -- it never deletes or changes anything you already have.",
  },
  {
    keywords: ['low stock', 'restock', 'stock alert'],
    answer: "A product shows as 'Low' when its quantity drops to or below its 'low stock alert level' (which you set when adding/editing the product). You'll see these flagged on your Dashboard automatically.",
  },
  {
    keywords: ['add product', 'new product', 'create product'],
    answer: "Go to Products, then click '+ Add Product'. Fill in the name, price, and starting quantity, then Save. You can edit, delete, or download it anytime from the same page.",
  },
  {
    keywords: ['download product', 'export product', 'product catalog', 'product report', 'inventory card'],
    answer: "On the Products page, click 'Download' at the top to export your entire catalog as a spreadsheet, or click 'Download' next to any single product for that item's own inventory card PDF.",
  },
  {
    keywords: ['record sale', 'make sale', 'sell', 'new sale'],
    answer: "Go to New Sale, pick a product and quantity (click '+ Add another product' for multiple items), optionally enter a customer name or discount, then click Complete Sale. Stock updates automatically.",
  },
  {
    keywords: ['invoice', 'receipt', 'download pdf', 'print'],
    answer: "After completing a sale, click 'Download Invoice (PDF)' on the confirmation page. You can also reprint any past invoice anytime from Sales History by clicking 'PDF' next to that sale.",
  },
  {
    keywords: ['void', 'cancel sale', 'undo sale', 'mistake', 'wrong sale'],
    answer: "If a sale was a mistake, open it from Sales History and click 'Void This Sale' (owner only). This cancels it and automatically returns the stock, while keeping a record for your books.",
  },
  {
    keywords: ['search', 'find product', 'find sale', 'filter'],
    answer: "Products and Customers each have a live search box at the top that filters instantly as you type. Sales History lets you filter by customer name and date range.",
  },
  {
    keywords: ['export', 'excel', 'csv', 'download history', 'spreadsheet'],
    answer: "On Sales History, use 'Download Excel (CSV)' or 'Download PDF Report' at the top. If you've filtered by a customer name, it downloads just that customer's sales -- otherwise it downloads everyone's.",
  },
  {
    keywords: ['discount'],
    answer: "When recording a New Sale, there's a 'Discount amount' field near the total. Enter any flat amount to subtract from the sale total -- it updates live before you complete the sale.",
  },
  {
    keywords: ['tax', 'vat'],
    answer: "Go to Settings and set your 'Tax rate %'. It's then applied automatically to every sale after the discount, and shown as its own line on receipts and invoices.",
  },
  {
    keywords: ['barcode', 'scan'],
    answer: "On the New Sale page, there's a barcode field at the top -- scan a product's barcode (or type it) and press Enter to add it instantly. Make sure you've saved a barcode for that product first, in Products.",
  },
  {
    keywords: ['profit', 'margin'],
    answer: "Profit is calculated from each product's Cost Price (set this in Products) versus its Selling Price. Owners see 'Profit Today' and 'Profit This Month' on the Dashboard.",
  },
  {
    keywords: ['customer list', 'customer management', 'customer history', 'view customer'],
    answer: "Go to Customers in the sidebar to see everyone who's ever bought something, search them by name instantly, and click into any of them to see their full purchase history.",
  },
  {
    keywords: ['delete customer', 'remove customer'],
    answer: "On the Customers page, click 'Delete' next to any customer row to remove that one profile (owner only). Their past sales stay in Sales History, just no longer linked to a customer profile.",
  },
  {
    keywords: ['delete all customers', 'clear customers', 'wipe customers'],
    answer: "At the top of the Customers page, owners can click 'Delete All Customers' to clear the entire customer list in one action. A confirmation window will double-check first -- this cannot be undone.",
  },
  {
    keywords: ['download customer', 'export customer', 'customer report'],
    answer: "On the Customers page, click 'Download Report' to export either one customer's profile (from their row, or their detail page) or the full customer list as a spreadsheet or PDF.",
  },
  {
    keywords: ['backup', 'restore data', 'lost data'],
    answer: "Go to Settings and click 'Download Backup' regularly to save a copy of your shop's data. To restore it, stop the app, replace the db/stockflow.db file with your backup, then start the app again.",
  },
  {
    keywords: ['install', 'setup', 'set up', 'get started'],
    answer: "Full setup steps are in the Documentation folder included with this software: install Node.js, run 'npm install', copy .env.example to .env, then run 'npm start'. Open the app in your browser afterward.",
  },
  {
    keywords: ['show password', 'hide password', 'see password', 'password eye', 'password visible'],
    answer: "Every password field has a small eye icon on its right edge -- click it to show or hide what you've typed, so you can double check it before submitting.",
  },
  {
    keywords: ['change my password', 'update password', 'my account', 'own password'],
    answer: "Click 'My Account' in the sidebar (available to both staff and owners) to change your own password. Enter your current password plus a new one, twice, to confirm.",
  },
  {
    keywords: ['password', 'forgot password', 'reset password'],
    answer: "Click 'Forgot your password?' on the login page. If the shop owner has set up email sending (see Documentation), you'll get a reset link. If not, ask your owner to reset it from Staff Accounts.",
  },
  {
    keywords: ['hello', 'hi', 'hey'],
    answer: "Hi! I'm the built-in Help Assistant. Ask me things like 'how do I add a product' or 'how do I change the currency', and I'll point you in the right direction.",
  },
  {
    keywords: ['thank', 'thanks'],
    answer: "You're welcome! Let me know if anything else comes up.",
  },
];

const HELPBOT_FALLBACK =
  "I'm not sure about that one yet. Try asking about: adding products, recording a sale, staff accounts, currency, time zone, theme color, discounts, tax, barcode scanning, profit, customers, voiding or deleting a sale, search, exporting sales history, changing your password, or backups.";

// ---------- Typo-tolerant matching ----------
//
// Plain substring matching (the original approach) breaks the moment
// someone mistypes a word -- "feuture" no longer contains "feature", so
// it would fall through to the generic fallback message. To fix that
// without any external NLP library or network call, we add a small
// Levenshtein-distance check: if a word the person typed is "close
// enough" to a keyword's word (a couple of letters swapped, missing, or
// extra), we still count it as a match.

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const currRow = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1, // deletion
        currRow[j - 1] + 1, // insertion
        prevRow[j - 1] + cost // substitution
      );
    }
    prevRow = currRow;
  }
  return prevRow[n];
}

// Two words "match" if they're identical, or close enough in spelling
// that it's clearly a typo rather than a different word. Short words
// (3 letters or fewer) are excluded from fuzzy matching, since a
// 1-letter difference on a short word usually changes its meaning
// entirely (e.g. "add" vs "aid").
function wordsAreCloseEnough(a, b) {
  if (a === b) return true;
  if (a.length <= 3 || b.length <= 3) return false;
  const allowedTypos = a.length <= 6 || b.length <= 6 ? 1 : 2;
  return levenshteinDistance(a, b) <= allowedTypos;
}

function tokenize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function helpbotFindAnswer(userText) {
  const text = userText.toLowerCase();

  // Fast path: exact substring match, same as the original behavior --
  // cheap and catches the vast majority of correctly-typed questions.
  for (const entry of HELPBOT_QA) {
    if (entry.keywords.some((k) => text.includes(k))) {
      return entry.answer;
    }
  }

  // Typo-tolerant fallback: compare each word of the question against
  // each word of each keyword phrase, allowing small spelling mistakes
  // instead of dropping straight to the default fallback message.
  const inputWords = tokenize(userText);
  if (inputWords.length === 0) return HELPBOT_FALLBACK;

  let bestEntry = null;
  let bestScore = 0;

  for (const entry of HELPBOT_QA) {
    for (const keyword of entry.keywords) {
      const keywordWords = tokenize(keyword);
      if (keywordWords.length === 0) continue;

      const matchedCount = keywordWords.filter((kw) =>
        inputWords.some((iw) => wordsAreCloseEnough(kw, iw))
      ).length;
      const score = matchedCount / keywordWords.length;

      // A short (1-2 word) keyword needs every word to match closely;
      // a longer phrase just needs the majority, so a single unrelated
      // word in a long sentence doesn't block the match.
      const required = keywordWords.length <= 2 ? 1 : 0.6;
      if (score >= required && score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }
  }

  return bestEntry ? bestEntry.answer : HELPBOT_FALLBACK;
}
