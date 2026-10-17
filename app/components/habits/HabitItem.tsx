
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type HabitItemProps = {
  habit: {
    id: string;
    title: string;
    isActive: boolean;
    recurrence: unknown;
  };
  onDelete?: (habitId: string) => void;
};

const DAY_NAMES = [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
];

export default function HabitItem({
  habit,
  onDelete,
}: HabitItemProps) {
  const router = useRouter();

  const [isActive, setIsActive] = useState(habit.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);

  const recurrence =
    habit.recurrence &&
    typeof habit.recurrence === "object" &&
    "days" in habit.recurrence &&
    Array.isArray(habit.recurrence.days)
      ? habit.recurrence.days
          .filter(
            (day): day is number =>
              Number.isInteger(day) && day >= 0 && day <= 6
          )
          .sort((a, b) => a - b)
      : [];

  async function updateHabit(data: Record<string, unknown>) {
    if (loading) return;

    const previous = isActive;
    const next =
      typeof data.isActive === "boolean" ? data.isActive : isActive;

    setIsActive(next);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/habits/${habit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to update habit.");
      }

      router.refresh();
    } catch (err) {
      setIsActive(previous);
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteHabit() {
    if (loading) return;

    const confirmed = window.confirm(
      `Delete "${habit.title}"?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/habits/${habit.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to delete habit.");
      }

      // Remove immediately from the parent list.
      setIsDeleted(true);
      onDelete?.(habit.id);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  if (isDeleted) return null;

  return (
    <article className="group rounded-2xl border border-slate-200/10 bg-slate-900/50 p-5 transition-all duration-200 hover:border-violet-400/30 hover:bg-slate-900/80">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              isActive
                ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
                : "border-slate-700 bg-slate-800 text-slate-500"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="12"
                r="4"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-slate-100">
                {habit.title}
              </h3>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${
                  isActive
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-emerald-400" : "bg-slate-500"
                  }`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-slate-500">
                Schedule
              </span>

              {recurrence.length === 7 ? (
                <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                  Every day
                </span>
              ) : recurrence.length > 0 ? (
                recurrence.map((day) => (
                  <span
                    key={day}
                    className="rounded-md border border-slate-700/80 bg-slate-800/70 px-2 py-1 text-xs text-slate-300"
                  >
                    {DAY_NAMES[day]}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">
                  No schedule
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-slate-800 pt-3 sm:border-0 sm:pt-0">
          <Link
            href={`/habits/${habit.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
          >
            Edit
          </Link>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void updateHabit({ isActive: !isActive })
            }
            className={`inline-flex min-w-24 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-wait disabled:opacity-50 ${
              isActive
                ? "border border-amber-400/20 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                : "bg-violet-500 text-white hover:bg-violet-400"
            }`}
          >
            {loading
              ? "Saving..."
              : isActive
                ? "Deactivate"
                : "Activate"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => void deleteHabit()}
            aria-label={`Delete ${habit.title}`}
            title="Delete habit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-400/15 text-red-400/80 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}
    </article>
  );
}
