"use client";

import { useCallback, useEffect, useState } from "react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  category?: { name: string; color: string } | null;
};

type ApiResponse = {
  tasks?: Task[];
  entries?: { task: Task }[];
  message?: string;
};

function getLocalDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-sky-500/10 text-sky-300",
  MEDIUM: "bg-amber-500/10 text-amber-300",
  HIGH: "bg-red-500/10 text-red-300",
};

export default function MyDayPage() {
  const [date, setDate] = useState(getLocalDateValue);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMyDay = useCallback(async (selectedDate: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/my-day?date=${encodeURIComponent(selectedDate)}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to load My Day.");
      }

      setTasks(data.tasks ?? data.entries?.map((entry) => entry.task) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load My Day.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailableTasks = useCallback(async () => {
    setLoadingAvailable(true);

    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to load available tasks.");
      }

      setAvailableTasks(data.tasks ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load available tasks.",
      );
    } finally {
      setLoadingAvailable(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await Promise.all([
        loadMyDay(date),
        loadAvailableTasks(),
      ]);
    }

    if (!cancelled) void load();

    return () => {
      cancelled = true;
    };
  }, [date, loadMyDay, loadAvailableTasks]);

  const availableForDate = availableTasks.filter(
    (task) => !tasks.some((myDayTask) => myDayTask.id === task.id),
  );

  async function addTask() {
    if (!selectedTaskId) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/my-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTaskId, date }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to add task.");
      }

      await loadMyDay(date);
      setSelectedTaskId("");
      setSuccess("Task added to My Day.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeTask(task: Task) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/my-day?taskId=${encodeURIComponent(task.id)}&date=${encodeURIComponent(date)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove task.");
      }

      setTasks((current) => current.filter((item) => item.id !== task.id));
      setSuccess("Task removed from My Day.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove task.");
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-sm font-medium tracking-widest text-violet-400">
          DAILY FOCUS
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          My Day
        </h1>
        <p className="mt-3 text-slate-400">
          Choose the tasks you want to focus on, regardless of their due dates.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <label htmlFor="my-day-date" className="mb-2 block text-sm font-medium text-slate-300">
          Selected Date
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="my-day-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"
          />

          <button
            type="button"
            onClick={() => setDate(getLocalDateValue())}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5"
          >
            Today
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="add-my-day-task" className="mb-2 block text-sm font-medium text-slate-300">
            Add an Existing Task
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              id="add-my-day-task"
              value={selectedTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
              disabled={loadingAvailable || availableForDate.length === 0}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500 disabled:opacity-50"
            >
              <option value="">
                {loadingAvailable
                  ? "Loading tasks..."
                  : availableForDate.length
                    ? "Select a task"
                    : "No available tasks"}
              </option>
              {availableForDate.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void addTask()}
              disabled={!selectedTaskId || submitting}
              className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add to My Day"}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Today&apos;s habits</h2>
          <span className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-400">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading My Day...</div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
            <p className="font-medium text-white">Your day is clear</p>
            <p className="mt-2 text-sm text-slate-400">
              Add tasks above to decide what you want to focus on.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className={`break-words font-semibold ${task.status === "DONE" ? "text-slate-500 line-through" : "text-white"}`}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-xs ${priorityStyles[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                        {task.status.replace("_", " ")}
                      </span>
                      {task.category && (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.category.color || "#8B5CF6" }} />
                          {task.category.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void removeTask(task)}
                    className="w-fit rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
