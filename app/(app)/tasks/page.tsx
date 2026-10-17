
"use client";

import { useCallback, useEffect, useState } from "react";
import HabitStatus from "@/app/components/habits/HabitStatus";
import DayCountdown from "@/app/components/tasks/DayCountdown";
import TaskCalendar from "@/app/components/tasks/TaskCalendar";
import TaskForm from "@/app/components/tasks/TaskForm";
import TaskFilters, {
  type TaskView,
} from "@/app/components/tasks/TaskFilters";
import TaskList from "@/app/components/tasks/TaskList";
import type { Task } from "@/app/components/tasks/TaskItem";
import DailyNote from "@/app/components/tasks/DailyNote";

type TaskStats = {
  date: string;
  today: string;
  timeZone: string;
  total: number;
  completed: number;
  missed: number;
  pending: number;
  completionRate: number;
};

type Habit = {
  id: string;
  title: string;
  isActive: boolean;
  recurrence: {
    days: number[];
  };
};

async function readJson(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || "The request failed.",
    );
  }

  return data;
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 transition-colors hover:border-violet-400/20 hover:bg-white/[0.05]">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1.5 text-xl font-semibold tracking-tight tabular-nums ${
          accent ? "text-violet-200" : "text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TasksPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [today, setToday] = useState("");
  const [timeZone, setTimeZone] = useState("UTC");
  const [view, setView] = useState<TaskView>("day");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function initialize() {
      try {
        const response = await fetch("/api/tasks?view=day", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await readJson(response);

        if (typeof data.today !== "string") {
          throw new Error("The server did not return today's date.");
        }

        setToday(data.today);
        setSelectedDate((current) => current || data.today);

        if (typeof data.timeZone === "string") {
          setTimeZone(data.timeZone);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize the tasks page.",
        );
        setLoading(false);
      }
    }

    void initialize();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ view });

        if (view === "day" || view === "completed") {
          params.set("date", selectedDate);
        }

        const statsUrl =
          `/api/tasks/stats?date=${encodeURIComponent(selectedDate)}`;

        const [tasksResponse, statsResponse] = await Promise.all([
          fetch(`/api/tasks?${params.toString()}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(statsUrl, {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const [tasksData, statsData] = await Promise.all([
          readJson(tasksResponse),
          readJson(statsResponse),
        ]);

        if (!Array.isArray(tasksData.tasks)) {
          throw new Error("The tasks API returned an invalid response.");
        }

        setTasks(tasksData.tasks);
        setStats(statsData);
        const habitsResponse = await fetch("/api/habits", {
          cache: "no-store",
          signal: controller.signal,
        });

        const habitsData = await readJson(habitsResponse);

        setHabits(
          (Array.isArray(habitsData)
            ? habitsData
            : habitsData.habits ?? []
          ).filter((habit: Habit) => habit.isActive),
        );

        if (typeof tasksData.today === "string") {
          setToday(tasksData.today);
        }

        if (typeof tasksData.timeZone === "string") {
          setTimeZone(tasksData.timeZone);
        } else if (typeof statsData.timeZone === "string") {
          setTimeZone(statsData.timeZone);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Failed to load tasks.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => controller.abort();
  }, [selectedDate, view, refreshKey]);

  useEffect(() => {
    async function handleDayChange() {
      try {
        const response = await fetch("/api/tasks?view=day", {
          cache: "no-store",
        });

        const data = await readJson(response);

        if (typeof data.today !== "string") return;

        setToday(data.today);
        setSelectedDate(data.today);
        setView("day");
        setRefreshKey((value) => value + 1);

        if (typeof data.timeZone === "string") {
          setTimeZone(data.timeZone);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to refresh the current day.",
        );
      }
    }

    window.addEventListener("tasks:day-changed", handleDayChange);

    return () => {
      window.removeEventListener("tasks:day-changed", handleDayChange);
    };
  }, []);

  
  const addTask = useCallback(
    async (
      title: string,
      date: string,
      startTime?: string,
      endTime?: string,
    ) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          scheduledDate: date,
          startTime: startTime || null,
          endTime: endTime || null,
        }),
      });

      await readJson(response);

      setError("");
      setSelectedDate(date);
      setView("day");
      setRefreshKey((value) => value + 1);
    },
    [],
  );

  const handleAddTask = useCallback(
    async (
      title: string,
      date: string,
      startTime?: string,
      endTime?: string,
    ) => {
      await addTask(title, date, startTime, endTime);
      setIsAddTaskOpen(false);
    },
    [addTask],
  );


  useEffect(() => {
    if (!isAddTaskOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAddTaskOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddTaskOpen]);

  const headingByView: Record<TaskView, string> = {
    day: "Today's tasks",
    upcoming: "Upcoming tasks",
    missed: "Missed tasks",
    completed: "Completed tasks",
  };

  const completionRate = Math.min(
    100,
    Math.max(0, stats?.completionRate ?? 0),
  );
  

  const performTaskAction = useCallback(
    async (taskId: string, action: "complete" | "delete") => {
      setError("");

      try {
        const response = await fetch("/api/tasks/actions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ taskId, action }),
        });

        await readJson(response);

        setRefreshKey((value) => value + 1);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to perform task action.",
        );
      }
    },
    [],
  );



  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080D1B] px-3 py-5 text-slate-200 sm:px-6 sm:py-7 lg:px-8">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-violet-600/[0.09] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-indigo-500/[0.07] blur-[140px]"
      />

      <div className="relative mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/[0.09] text-violet-300">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M8 5H6.5A2.5 2.5 0 0 0 4 7.5v11A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 17.5 5H16M8 3h8v4H8V3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m8 13 2.2 2.2L16 9.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                My Tasks
              </h1>
              <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                Plan your day. Focus on what matters.
              </p>
            </div>
          </div>

          {selectedDate && (
            <p className="hidden text-sm text-slate-400 md:block">
              {formatDate(selectedDate)}
            </p>
          )}
        </header>

        {/* Main layout */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* Tasks column */}
          <div className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
            <section className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-3 shadow-xl shadow-black/10 backdrop-blur-2xl sm:rounded-3xl sm:p-5 lg:p-6">
              {/* List header */}
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {headingByView[view]}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {selectedDate
                      ? formatDate(selectedDate)
                      : "Loading date..."}
                  </p>
                </div>

                <span className="shrink-0 rounded-xl border border-violet-400/15 bg-violet-400/[0.07] px-3 py-2 text-xs font-medium text-violet-200">
                  {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              {/* Add task button */}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setIsAddTaskOpen(true);
                }}
                className="group relative mb-4 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-r from-violet-600/90 via-violet-500 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/50 hover:shadow-[0_12px_32px_-8px_rgba(139,92,246,0.65)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1B] motion-reduce:transform-none"
              >
                
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="relative h-5 w-5 transition-transform duration-300 group-hover:rotate-90"                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                Add a new task
              </button>
              

              {/* Filters */}
              <div className="mb-4 overflow-x-auto pb-1">
                <TaskFilters view={view} onChange={setView} />
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="mb-4 flex flex-col gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((value) => value + 1)}
                    className="w-fit rounded-lg border border-red-300/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Task list */}
              <TaskList
                tasks={tasks}
                loading={loading}
                selectedView={view}
                onComplete={(taskId) =>
                  performTaskAction(taskId, "complete")
                }
                onDelete={(taskId) =>
                  performTaskAction(taskId, "delete")
                }
              />

                {view === "day" && (
                  <section className="mt-6 border-t border-white/[0.07] pt-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-white">
                        Daily Habits
                      </h3>
                
                      <span className="text-xs text-slate-500">
                        {
                          habits.filter((habit) =>
                            habit.recurrence.days.includes(
                              new Date(`${selectedDate}T12:00:00Z`).getUTCDay(),
                            ),
                          ).length
                        } habits
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {habits
                        .filter((habit) =>
                          habit.recurrence.days.includes(
                            new Date(`${selectedDate}T12:00:00Z`).getUTCDay(),
                          ),
                        )
                        .map((habit) => (
                          <div
                            key={habit.id}
                            className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
                          >
                            <p className="text-sm text-slate-200">
                              {habit.title}
                            </p>
                        
                            <HabitStatus
                              habitId={habit.id}
                              date={selectedDate}
                              onChange={() =>
                                setRefreshKey((value) => value + 1)
                              }
                            />
                          </div>
                        ))}

                      {habits.filter((habit) =>
                        habit.recurrence.days.includes(
                          new Date(`${selectedDate}T12:00:00Z`).getUTCDay(),
                        ),
                      ).length === 0 && (
                        <p className="text-sm text-slate-500">
                          No habits scheduled for this day.
                        </p>
                      )}
                    </div>
                  </section>
                )}
            </section>

            {/* Completion and statistics */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Completion progress
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Your progress for the selected day
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums text-violet-200">
                  {completionRate}%
                </p>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-white/[0.07]"
                role="progressbar"
                aria-label="Task completion rate"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionRate}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total tasks" value={stats?.total ?? 0} />
                <Stat
                  label="Completed"
                  value={stats?.completed ?? 0}
                  accent
                />
                <Stat label="Pending" value={stats?.pending ?? 0} />
                <Stat label="Missed" value={stats?.missed ?? 0} />
              </div>
            </section>
            <DailyNote selectedDate={selectedDate} />

          </div>


          {/* Calendar and countdown */}
          <aside className="order-first grid grid-cols-1 gap-4 sm:grid-cols-2 lg:order-none lg:grid-cols-1">
            <section className="min-w-0 rounded-2xl border border-white/[0.09] bg-white/[0.04] p-3 shadow-lg shadow-black/10 backdrop-blur-2xl sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-300">
                  <CalendarIcon />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Calendar
                  </h2>
                  <p className="text-xs text-slate-500">Choose a day</p>
                </div>
              </div>

              <TaskCalendar
                selectedDate={selectedDate}
                today={today}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setView("day");
                }}
              />
            </section>

            <DayCountdown timeZone={timeZone} />
          </aside>
        </div>

        <footer className="pt-6 text-center text-xs text-slate-600">
          One step at a time.
        </footer>
      </div>

      {/* Add task modal */}
      {isAddTaskOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030611]/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsAddTaskOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-title"
            className="relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-violet-400/20 bg-[#0C1224] p-6 shadow-2xl shadow-black/40 sm:p-8"          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl"
            />

            <div className="relative">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2
                    id="add-task-title"
                    className="text-lg font-bold text-white"
                  >
                    Add a new task
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    What would you like to get done?
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      d="m6 6 12 12M18 6 6 18"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <TaskForm
                selectedDate={selectedDate}
                onAdd={handleAddTask}
              />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
