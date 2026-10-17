# Life OS 🧠

**Your personal life management dashboard.**
**view Demo :** 
## https://life-os-mi1l.vercel.app/dashboard

Life OS is a personal productivity application built to help you organize your daily life, manage tasks, track habits, and keep your daily notes in one place.

## ✨ Features

- ✅ **Task Management** — Organize and manage your tasks.
- 🔁 **Habit Tracking** — Build consistent routines and track your habits.
- 📝 **Daily Notes** — Keep your daily thoughts and notes organized.
- 🔐 **Authentication** — User accounts and session-based authentication.
- 📊 **Personal Dashboard** — Access your productivity tools from one place.

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Database Hosting:** Neon
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- PostgreSQL database or a Neon PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/sasanbrv/life-OS.git
cd life-OS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add your database connection string:

```env
DATABASE_URL="your_postgresql_connection_string"
```

Replace the placeholder with your own PostgreSQL connection string. Never commit your `.env` file or expose database credentials publicly.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run database migrations

If you are setting up a new database, apply the project's migrations:

```bash
npx prisma migrate deploy
```

Make sure your database connection is configured correctly before running migrations.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

Life OS can be deployed on [Vercel](https://vercel.com/).

1. Import the GitHub repository into Vercel.
2. Configure the required environment variables in the project settings.
3. Ensure the build command generates the Prisma Client before building the application.
4. Deploy the project.

## 📁 Project Structure

```text
life-OS/
├── app/                  # Next.js application and routes
├── lib/                  # Shared utilities and authentication
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── prisma7.config.ts     # Prisma configuration
├── package.json
└── README.md
```

## 🔒 Security

- Keep database credentials and secrets in environment variables.
- Never commit `.env` files.
- Use environment-specific credentials for development and production.
- Keep dependencies up to date.

## 📄 License

No license has been specified yet.

---

Built with ❤️ using Next.js, TypeScript, Prisma, and PostgreSQL.
