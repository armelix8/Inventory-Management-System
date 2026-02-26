# Inventory Stock Management

A production-ready inventory management system that digitizes an Excel-based stock workflow.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API routes (same app)
- **Auth:** NextAuth.js (JWT, Credentials provider)
- **Database:** PostgreSQL
- **ORM:** Prisma

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

### 2. App Setup

From the project root:

```bash
cp .env.example .env
# Edit .env:
#   DATABASE_URL="postgresql://inventory_user:strongpassword@localhost:5432/inventory_db"
#   NEXTAUTH_SECRET="your-secret-key-change-in-production"
#   NEXTAUTH_URL="http://localhost:5173"

npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

The app runs on **http://localhost:5173**. No separate backend server is needed; API routes are served by the same Next.js app.

**Default login:** username `admin`, password `admin123`

### 3. Scripts

| Script        | Description              |
|---------------|--------------------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Production build       |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations       |
| `npm run db:seed` | Seed database        |
| `npm run db:studio` | Open Prisma Studio  |

## Project Structure

```
app/
  api/              # API route handlers (items, stock-in, stock-out, auth, etc.)
  login/            # login page
  register/         # register page
  dashboard/        # dashboard, items, stock-in, stock-out, suppliers, users
prisma/
  schema.prisma
  seed.js
src/
  lib/              # prisma, auth, quarters, notifications
  contexts/         # useAuth (NextAuth wrapper)
  components/
  pages/            # page components
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| GET/POST | /api/auth/[...nextauth] | NextAuth (login, session) |
| GET | /api/items | List items |
| POST | /api/items | Create item |
| GET | /api/items/:id | Get item |
| PUT | /api/items/:id | Update item |
| DELETE | /api/items/:id | Delete item |
| POST | /api/items/bulk | Bulk import items |
| GET | /api/stock-in | List stock in entries |
| POST | /api/stock-in | Record stock in (JSON or multipart with PDF) |
| POST | /api/stock-in/bulk | Bulk stock in |
| GET | /api/stock-out | List stock out entries |
| POST | /api/stock-out | Request stock out (balance check) |
| POST | /api/stock-out/:id/approve | Approve (Admin/Manager) |
| POST | /api/stock-out/:id/reject | Reject (Admin/Manager) |
| GET | /api/balance | Get balances |
| GET | /api/dashboard/stats | Dashboard stats |
| GET | /api/notifications | List notifications |
| GET | /api/users | List users (Admin/Manager) |
| ... | ... | (see app/api/) |

## Business Rules

- **Stock balance** = `SUM(stock_in.quantity) - SUM(approved stock_out.quantity)` — computed at runtime
- Stock out requests are rejected if quantity exceeds available balance
- Stock out approval/rejection is restricted to Admin and Manager roles

## Environment

- `DATABASE_URL` – PostgreSQL connection string
- `NEXTAUTH_SECRET` – Secret for JWT signing (use a long random string in production)
- `NEXTAUTH_URL` – Full URL of the app (e.g. `http://localhost:5173`)
