# Database Setup Instructions

You do **not** have direct database access from this application. Follow these steps locally to configure PostgreSQL.

---

## 4.1 Create PostgreSQL Database

Connect to PostgreSQL (via `psql`, pgAdmin, or your preferred client) and run:

```sql
CREATE DATABASE inventory_db;
CREATE USER inventory_user WITH PASSWORD 'strongpassword';
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;

-- Optional: Grant schema privileges for Prisma migrations
\c inventory_db
GRANT ALL ON SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;
```

Replace `strongpassword` with a secure password of your choice.

---

## 4.2 Configure .env

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and set your `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://inventory_user:strongpassword@localhost:5432/inventory_db"
   ```

   Replace `strongpassword` with the same password you used in step 4.1.

3. **Important:** `.env` must be listed in `.gitignore` — never commit credentials.

---

## Run Migrations

After creating the database and configuring `.env`:

```bash
cd backend
npx prisma migrate dev --name init
```

This creates the `stock_items`, `stock_ins`, and `stock_outs` tables.

---

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Seed Test Data (after migrations)

```bash
node prisma/seed.js
```

---

## Data Model Summary

| Table       | Purpose                          |
|------------|-----------------------------------|
| stock_items | Item master (no quantity stored) |
| stock_ins   | Incoming stock entries           |
| stock_outs  | Stock-out requests               |

**Stock balance** = `SUM(stock_in.quantity) - SUM(stock_out.quantity)` — computed at runtime, not stored.
