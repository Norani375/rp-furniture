# 🗄️ How to Set Up Your Neon Database (Automatic)

## ✅ Recommended Method: One Command

```bash
npm run db:setup
```

This will:
- Connect to your Neon database
- Create all 17+ tables
- Load your 65 furniture items
- Insert sample customers, suppliers, installment plans, etc.
- Show you the final status

---

## If that fails (rare), try the manual method

### Manual (in browser - always works)

1. Go to: https://neon.tech
2. Log in and open your project **erp-furniture**
3. In the left menu, click **SQL Editor**
4. Click **New Query** (or "Untitled")
5. Open the file `database/neon_clean_setup.sql` in VS Code / Notepad
6. Select all (Ctrl+A) → Copy (Ctrl+C)
7. Paste into the Neon SQL Editor (Ctrl+V)
8. Click the **Run** button (or press Ctrl + Enter)

You should see at the bottom:
```
✅ Database setup complete!
```

---

## After Setup is Successful

### 1. Start the Backend (in one terminal)

```bash
node server/index.js
```

You should see:
```
✅ Connected to Neon PostgreSQL
🚀 ERP Backend running on http://localhost:3001
```

### 2. Start the Frontend (in another terminal)

```bash
npm run dev
```

Open: **http://localhost:5173**

### 3. Login

```
Email:    admin@erp.com
Password: admin123
```

---

## Troubleshooting

### Error: "require is not defined"

→ You were running the old version. The new `scripts/setup_db.js` is fixed for ESM.

Run this instead:
```bash
npm run db:setup
```

### Error connecting to database

- Make sure your internet is working
- The connection string in `scripts/setup_db.js` is the original one you provided.
- If you changed the password in Neon, update the `DATABASE_URL` at the top of `scripts/setup_db.js`.

### Tables already exist

That's normal and safe. The script uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`.

---

## What Gets Created

- 17 tables (users, inventory, customers, installments, accounting, etc.)
- Your 65 real furniture items with correct prices
- 3 sample customers
- 2 suppliers
- 2 employees
- 3 installment plans (with sample installments)
- Currencies (AFN, USD, EUR...)
- Chart of Accounts
- Activity log

Everything is ready for a real furniture business ERP.

---

Run this command and tell me the output:

```bash
npm run db:setup
```
