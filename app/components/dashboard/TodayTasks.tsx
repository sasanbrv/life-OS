
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, CheckCircle2, Circle } from "lucide-react";

type Task = {
  id: string;
  title: string;
  isCompleted: boolean;
};

export default function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks");

        if (!response.ok) {
          throw new Error("Failed to load today's tasks.");
        }

        const result = await response.json();
        const items: Task[] = Array.isArray(result)
          ? result
          : result.tasks ?? [];

        if (!cancelled) {
          setTasks(items.slice(0, 5));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Today&aposs Tasks</h2>
          <p className="mt-1 text-sm text-slate-400">
            A quick look at your schedule
          </p>
        </div>

        <Link
          href="/tasks"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          aria-label="View all tasks"
        >
          <ArrowUpLeft size={18} />
        </Link>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-white/[0.03]"
            />
          ))
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3"
            >
              {task.isCompleted ? (
                <CheckCircle2
                  size={18}
                  className="shrink-0 text-emerald-400"
                />
              ) : (
                <Circle size={18} className="shrink-0 text-slate-500" />
              )}

              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  task.isCompleted
                    ? "text-slate-500 line-through"
                    : "text-slate-200"
                }`}
              >
                {task.title}
              </span>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            No tasks scheduled for today.
          </p>
        )}
      </div>

      <Link
        href="/tasks"
        className="mt-4 block text-center text-sm text-violet-400 transition hover:text-violet-300"
      >
        View All Tasks
      </Link>
    </section>
  );
}
