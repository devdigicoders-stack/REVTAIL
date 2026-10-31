# Revtail Platform

Revtail is a full-stack product testing, consumer feedback, and campaign management platform built with Next.js (App Router), Prisma ORM, and MySQL/MariaDB.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI / Styling**: React 19, Bootstrap 5, Bootstrap Icons, Tailwind CSS
- **Database & ORM**: MySQL / MariaDB, Prisma ORM
- **Authentication**: JWT (jose), bcryptjs
- **Cloud Storage**: Cloudflare R2 / AWS S3 SDK
- **Email**: Nodemailer (SMTP)
- **Bot Protection**: Cloudflare Turnstile

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js `20.x` or higher recommended
- npm or yarn / pnpm
- MySQL or MariaDB database running locally or remotely

### 2. Install Dependencies
```bash
npm install
```
*(Note: `prisma generate` will run automatically after install via the postinstall script).*

### 3. Environment Setup
Create a `.env` file in the root directory (you can copy from `.env.example` or `env.example`):
```bash
cp .env.example .env
```
Ensure your database connection string and required keys are configured:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
JWT_SECRET="your-jwt-secret-key"
```

### 4. Database Schema Setup
To sync your database schema with Prisma:
```bash
npx prisma db push
```

*(Optional) To seed default test users / initial data:*
```bash
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Application Portals

- **Tester Portal**: `http://localhost:3000/tester`
- **Brand Portal**: `http://localhost:3000/brand`
- **Admin Portal**: `http://localhost:3000/admin`
- **Authentication**: `http://localhost:3000/login`

---

## 📦 Available Scripts

- `npm run dev` - Start development server (`next dev --webpack`)
- `npm run build` - Build the project for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm run seed` - Run database seed script
