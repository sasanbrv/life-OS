# Life OS

**A personal productivity and life management application.**

Life OS brings task management, daily planning, goal tracking, and habit tracking together in one application.

## Features

### Task Management
- Create, edit, and delete tasks.
- Set task status and priority.
- Organize tasks using categories.
- Add descriptions and due dates.
- Search, filter, and sort tasks.
- View tasks in list, Kanban, and calendar layouts.

### Checklists
- Break tasks into smaller subtasks.
- Add, complete, and delete checklist items.
- Track checklist completion progress.

### My Day
- Add existing tasks to a daily plan.
- Organize daily selections by date.

### Goals
- Create, edit, and delete goals.
- Add descriptions and date information.
- Track progress manually.
- Associate tasks with goals.

### Habits
- Create and manage habits.
- Configure daily or weekly recurrence.
- Track completion by date.
- Activate or deactivate habits.

### Dashboard
- Access a centralized overview of productivity information.

### Authentication
- Session-based authentication.
- Protected application pages.
- User-specific data access.

## Tech Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript
- **UI:** React
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Runtime:** Node.js
- **Package Manager:** npm

## Requirements

Before running the project, make sure you have installed:

- Node.js
- npm
- PostgreSQL

## Installation

### 1. Install dependencies

Clone the repository or open the existing project directory, then run:

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root and configure the database connection expected by the application.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"
```

Replace the example values with your actual PostgreSQL connection details.

Make sure the environment variable matches the configuration in `prisma.config.ts`.

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Set up the database

If the project already contains Prisma migrations, apply them using:

```bash
npx prisma migrate dev
```

Use the appropriate database setup process for your environment. Do not reset an existing database unless you intentionally want to discard its data.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```text
life-os/
├── app/
│   ├── (app)/
│   │   ├── tasks/
│   │   ├── my-day/
│   │   ├── goals/
│   │   └── habits/
│   ├── api/
│   ├── generated/
│   │   └── prisma/
│   ├── login/
│   └── layout.tsx
├── lib/
│   ├── auth.ts
│   └── prisma.ts
├── prisma/
│   └── schema.prisma
├── prisma7.config.ts
├── package.json
└── README.md
```

This structure highlights the main application areas. Additional files and API routes are omitted for readability.

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application |
| `npm run start` | Start the production server |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Apply development migrations |

The available npm scripts are defined in `package.json`.

## Security

- Keep database credentials and secrets out of version control.
- Never commit sensitive `.env` files.
- Authenticate requests before accessing protected resources.
- Restrict database operations to records owned by the authenticated user.
- Review database migrations before applying them to production.

## Project Status

Life OS is under active development. Features and implementation details may change as the project evolves.

## License

No license has been specified yet. All rights are reserved unless a license is added to the repository.
