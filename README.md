# Inventory Stock Management

A production-ready inventory management system that digitizes an Excel-based stock workflow.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **API:** REST

## Quick Start

### 1. Database Setup (PostgreSQL)

Create the database and user in PostgreSQL:

```sql
CREATE DATABASE inventory_db;
CREATE USER inventory_user WITH PASSWORD 'strongpassword';
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;
\c inventory_db
GRANT ALL ON SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;
```

Replace `strongpassword` with a secure password.

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and set DATABASE_URL="postgresql://inventory_user:strongpassword@localhost:5432/inventory_db"

npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

The backend runs on `http://localhost:3001`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

### 4. Run Both

From project root:

```bash
cd backend && npm run dev
# In another terminal:
cd frontend && npm run dev
```

## Project Structure

```
backend/
  prisma/
    schema.prisma
    seed.js
  src/
    routes/
    lib/
    server.js
frontend/
  src/
    pages/
    App.jsx
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/items | List items |
| POST | /api/items | Create item |
| GET | /api/items/:id | Get item |
| PUT | /api/items/:id | Update item |
| DELETE | /api/items/:id | Delete item |
| GET | /api/stock-in | List stock in entries |
| POST | /api/stock-in | Record stock in |
| GET | /api/stock-out | List stock out entries |
| POST | /api/stock-out | Request stock out (balance check) |
| GET | /api/balance | Get balances for all items |
| GET | /api/balance?itemId=xxx | Get balance for item |

## Business Rules

- **Stock balance** = `SUM(stock_in.quantity) - SUM(stock_out.quantity)` — computed at runtime
- Stock out requests are rejected if quantity exceeds available balance
- Stock out inserts use database transactions for consistency

## Database Access

You do **not** have direct database access from this application. All database operations are performed locally via Prisma. Configure `.env` with your PostgreSQL credentials and run migrations/seeds yourself. See `backend/DATABASE_SETUP.md` for details.
