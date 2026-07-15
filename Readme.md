# StockFlow

A complete, self-hosted inventory, point-of-sale, and invoicing system
for small shops — built to work for shops in any country.

## Features

- Owner + staff logins with role-based access
- Products: add, edit, delete, search, barcode scanning, cost price
- Record sales with automatic stock deduction, discounts, and tax
- Void/cancel a sale (auto-restores stock, keeps a record)
- Automatic low-stock alerts
- Professional PDF invoices for every sale
- Customer list with automatic purchase history
- Sales history with search/filter, plus CSV and PDF exports
- Dashboard with daily/monthly totals, a 7-day chart, and profit reports
- One-click data backup
- Configurable shop name, currency, time zone, and theme color
- Built-in Help Assistant (no AI, no API key, no ongoing cost)
- Runs on SQLite — no separate database server required

## Tech Stack

- **Backend:** Node.js, Express
- **Views:** EJS templates
- **Database:** SQLite (via Node's built-in `node:sqlite`)
- **Auth:** express-session + bcrypt password hashing
- **PDF generation:** PDFKit
- **Email (optional):** Nodemailer

## Getting Started

See the `Documentation` folder:
- `1-Local-Setup.md` — run it on your own computer
- `2-Deploying-Online.md` — get a free live demo link on Render

## Requirements

Node.js version 22.5 or higher.
