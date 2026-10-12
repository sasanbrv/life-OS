import { getCurrentUser } from "@/lib/auth";

type DashboardStats = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
};

type DashboardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
};

type DashboardHabit = {
  id: string;
  title: string;
  isCompleted: boolean;
};

type DashboardGoal = {
  id: string;
  title: string;
  manualProgress: number;
  status: string;
};

type DashboardData = {
  stats: DashboardStats;
  myDay: DashboardTask[];
  habits: DashboardHabit[];
  goals: DashboardGoal[];
  upcomingTasks: DashboardTask[];
};

const emptyStats: DashboardStats = {
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  overdueTasks: 0,
};

const statStyles = [
  { label: "Completed Tasks", icon: "✓", color: "text-emerald-400" },
  { label: "Active Goals", icon: "◎", color: "text-violet-400" },
  { label: "Daily Habits", icon: "↻", color: "text-sky-400" },
  { label: "Overdue Tasks", icon: "◷", color: "text-amber-400" },
];

function formatDate(value: string | null) {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function priorityStyle(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-red-500/10 text-red-300";
    case "LOW":
      return "bg-emerald-500/10 text-emerald-300";
    default:
      return "bg-amber-500/10 text-amber-300";
  }
}

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await getCurrentUser();

    if (!user) return null;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      myDayEntries,
      habits,
      goals,
      upcomingTasks,
    ] = await Promise.all([
      prisma.task.count({
        where: { userId: user.id },
      }),
      prisma.task.count({
        where: { userId: user.id, status: "DONE" },
      }),
      prisma.task.count({
        where: { userId: user.id, status: { not: "DONE" } },
      }),
      prisma.task.count({
        where: {
          userId: user.id,
          status: { not: "DONE" },
          dueDate: { lt: now },
        },
      }),
      prisma.myDayEntry.findMany({
        where: {
          userId: user.id,
          date: startOfToday,
          task: { userId: user.id },
        },
        include: { task: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.habit.findMany({
        where: { userId: user.id, isActive: true },
        include: {
          entries: {
            where: { date: startOfToday },
            select: { isCompleted: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.goal.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { not: "DONE" },
          dueDate: { gte: startOfToday },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);

    return {
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
      },
      myDay: myDayEntries.map((entry) => ({
        id: entry.task.id,
        title: entry.task.title,
        status: entry.task.status,
        priority: entry.task.priority,
        dueDate: entry.task.dueDate?.toISOString() ?? null,
      })),
      habits: habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        isCompleted: habit.entries.some((entry) => entry.isCompleted),
      })),
      goals: goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        manualProgress: goal.manualProgress,
        status: goal.status,
      })),
      upcomingTasks: upcomingTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() ?? null,
      })),
    };
  } catch (error) {
    console.error("Dashboard data error:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const data = await getDashboardData();

  const stats = [
    {
      ...statStyles[0],
      value: data?.stats.completedTasks ?? 0,
      description: "Tasks finished",
    },
    {
      ...statStyles[1],
      value: data?.goals.length ?? 0,
      description: "Goals in progress",
    },
    {
      ...statStyles[2],
      value: data?.habits.length ?? 0,
      description: "Active habits",
    },
    {
      ...statStyles[3],
      value: data?.stats.overdueTasks ?? 0,
      description: "Tasks past their due date",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-medium tracking-widest text-violet-400">
          YOUR PERSONAL WORKSPACE
        </p>

        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Welcome back, {firstName}!
        </h1>

        <p className="mt-3 text-slate-400">
          A new day, a new opportunity to make progress.
        </p>
      </header>

      {!data && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          Dashboard data could not be loaded. Please refresh the page.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/30"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <span className={`text-2xl ${stat.color}`}>{stat.icon}</span>
            </div>

            <p className="mt-6 text-3xl font-bold text-white">
              {stat.value}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {stat.description}
            </p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Today&apos;s Tasks
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Keep track of what matters today.
              </p>
            </div>

            <a
              href="/tasks"
              className="shrink-0 rounded-xl bg-violet-500/10 px-3 py-2 text-sm text-violet-300 transition hover:bg-violet-500/20"
            >
              View Tasks
            </a>
          </div>

          <div className="mt-6 space-y-3">
            {!data?.myDay.length ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
                <div className="text-3xl text-slate-500">✓</div>
                <p className="mt-3 font-medium text-white">
                  Nothing here yet
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Add tasks to My Day to see them here.
                </p>
              </div>
            ) : (
              data.myDay.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      task.status === "DONE"
                        ? "bg-emerald-400"
                        : "bg-violet-400"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        task.status === "DONE"
                          ? "text-slate-500 line-through"
                          : "text-white"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${priorityStyle(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-xs text-slate-400">All Tasks</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {data?.stats.totalTasks ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-xs text-slate-400">Pending Tasks</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {data?.stats.pendingTasks ?? 0}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Daily Habits
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Small steps lead to big changes.
              </p>
            </div>

            <a
              href="/habits"
              className="text-sm text-violet-300 hover:text-violet-200"
            >
              View all
            </a>
          </div>

          <div className="mt-6 space-y-3">
            {!data?.habits.length ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
                <span className="text-3xl text-violet-400">↻</span>
                <p className="mt-3 font-medium text-white">
                  Start building habits
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Your active habits will appear here.
                </p>
              </div>
            ) : (
              data.habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 p-3"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      habit.isCompleted
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-violet-500/10 text-violet-300"
                    }`}
                  >
                    {habit.isCompleted ? "✓" : "↻"}
                  </span>
                  <p className="min-w-0 flex-1 text-sm text-white">
                    {habit.title}
                  </p>
                  <span className="text-xs text-slate-500">
                    {habit.isCompleted ? "Done" : "Today"}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Active Goals
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Keep your bigger picture in sight.
              </p>
            </div>
            <a
              href="/goals"
              className="text-sm text-violet-300 hover:text-violet-200"
            >
              View all
            </a>
          </div>

          <div className="mt-6 space-y-6">
            {!data?.goals.length ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                <p className="font-medium text-white">No active goals yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Create a goal to start tracking your progress.
                </p>
              </div>
            ) : (
              data.goals.map((goal) => {
                const progress = Math.min(
                  100,
                  Math.max(0, goal.manualProgress)
                );

                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-white">
                        {goal.title}
                      </p>
                      <span className="text-sm text-violet-300">
                        {progress}%
                      </span>
                    </div>
                    <div
                      className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${goal.title} progress`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Upcoming Tasks
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                What is coming next.
              </p>
            </div>
            <a
              href="/tasks"
              className="text-sm text-violet-300 hover:text-violet-200"
            >
              View all
            </a>
          </div>

          <div className="mt-6 space-y-3">
            {!data?.upcomingTasks.length ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                <p className="font-medium text-white">Nothing scheduled</p>
                <p className="mt-2 text-sm text-slate-400">
                  Tasks with upcoming due dates will appear here.
                </p>
              </div>
            ) : (
              data.upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${priorityStyle(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-indigo-600/5 p-6 sm:p-8">
        <p className="text-sm font-medium text-violet-300">
          YOUR JOURNEY STARTS HERE
        </p>

        <h2 className="mt-3 text-2xl font-bold text-white">
          Build your life, one day at a time.
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Organize your tasks, develop better habits, set meaningful goals,
          and protect your focus. Everything comes together in one place.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/tasks"
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            Manage Tasks
          </a>
          <a
            href="/goals"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            Explore Goals
          </a>
        </div>
      </section>
    </div>
  );
}