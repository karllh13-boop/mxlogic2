# MxLogic 2

Modern aviation maintenance management system built with Next.js 14.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Prisma ORM (SQLite for dev, PostgreSQL for production)
- **Auth**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Features

- 🏢 Multi-tenant (shops/organizations)
- 👥 Role-based access (owner, admin, mechanic, viewer)
- ✈️ Aircraft management with timer tracking
- 👤 Customer management
- ⚠️ Squawk tracking
- 📋 Work orders with line items
- 📦 Parts inventory
- 🛡️ AD compliance tracking
- ⏱️ Timesheet management
- 📊 Reports

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database (creates SQLite file)
npm run db:push

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

- **Email**: demo@mxlogic.app
- **Password**: demo123

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth configuration
│   └── db.ts             # Prisma client
└── types/                 # TypeScript types
```

## Database

### Development (SQLite)

The default configuration uses SQLite for local development. The database file is created at `prisma/dev.db`.

### Production (PostgreSQL)

To switch to PostgreSQL for production:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/mxlogic?schema=public"
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed demo data

## License

MIT
