
"use client";

import { useState } from "react";

export type Task = {
  id: string;
  title: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt?: string;
};

type TaskItemProps = {
  task: Task;
  onComplete: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
};

export default function TaskItem({
  task,
  onComplete,
  onDelete,
}: TaskItemProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatTime(value: string | null) {
    if (!value) return "";

    // Supports both "HH:mm" and ISO date-time strings.
    const match = value.match(/T?(\d{2}):(\d{2})/);

    return match ? `${match[1]}:${match[2]}` : "";
  }

  async function runAction(action: "complete" | "delete") {
    if (loading || (action === "complete" && task.isCompleted)) {
      return;
    }

    if (
      action === "delete" &&
      !window.confirm("Are you sure you want to delete this task?")
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (action === "complete") {
        await onComplete(task.id);
      } else {
        await onDelete(task.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The action could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  }

  const start = formatTime(task.startTime);
  const end = formatTime(task.endTime);

  return (
    <li
      className={[
        "group relative overflow-hidden rounded-2xl border p-4",
        "backdrop-blur-xl transition-all duration-300",
        task.isCompleted
          ? "border-white/[0.06] bg-white/[0.025]"
          : "border-white/[0.09] bg-white/[0.045] shadow-lg shadow-black/10 hover:border-violet-400/25 hover:bg-white/[0.065] hover:shadow-violet-950/10",
      ].join(" ")}
    >
      {!task.isCompleted && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-4 left-0 w-0.5 rounded-r-full bg-violet-400/0 transition-colors duration-300 group-hover:bg-violet-400/70"
        />
      )}

      <div className="relative flex items-start gap-3">
        <button
          type="button"
          disabled={loading || task.isCompleted}
          onClick={() => void runAction("complete")}
          aria-label={`Complete task: ${task.title}`}
          title="Complete task"
          className={[
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1B]",
            task.isCompleted
              ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300"
              : "border-slate-500/70 bg-white/[0.03] hover:border-violet-300 hover:bg-violet-400/15",
            loading ? "cursor-wait opacity-50" : "",
            task.isCompleted ? "cursor-default" : "",
          ].join(" ")}
        >
          {task.isCompleted && (
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              className="h-3 w-3"
            >
              <path
                d="m3.5 8 3 3 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={[
              "break-words text-sm font-medium leading-6 transition-colors",
              task.isCompleted
                ? "text-slate-500 line-through"
                : "text-slate-100",
            ].join(" ")}
          >
            {task.title}
          </p>

          {start && end && (
            <div
              className={[
                "mt-2.5 inline-flex items-center gap-2 rounded-xl border px-2.5 py-2",
                "transition-colors duration-200",
                task.isCompleted
                  ? "border-white/[0.05] bg-white/[0.02] text-slate-500"
                  : "border-violet-400/[0.14] bg-gradient-to-r from-violet-400/[0.08] to-indigo-400/[0.04] text-slate-300",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  task.isCompleted
                    ? "bg-white/[0.035] text-slate-500"
                    : "bg-violet-400/[0.10] text-violet-300",
                ].join(" ")}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 7.5v4.8l3 1.8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              
              <span className="flex items-center gap-2 text-xs tabular-nums">
                <span className="font-semibold tracking-wide">
                  {start}
                </span>
              
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={[
                    "h-3.5 w-3.5 shrink-0",
                    task.isCompleted ? "text-slate-600" : "text-violet-400/70",
                  ].join(" ")}
                >
                  <path
                    d="M3 8h10m-4-4 4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                
                <span className="font-semibold tracking-wide">
                  {end}
                </span>
              </span>
            </div>
          )}

          {task.isCompleted && task.completedAt && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-emerald-300/80">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              />
              Completed
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-red-400/15 bg-red-400/[0.07] px-3 py-2 text-xs leading-5 text-red-300"
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void runAction("delete")}
          className="shrink-0 rounded-xl border border-transparent px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-all duration-200 hover:border-red-400/15 hover:bg-red-400/[0.08] hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Delete task: ${task.title}`}
          title="Delete task"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
