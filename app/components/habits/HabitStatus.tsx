
"use client";

import { useEffect, useState } from "react";

type HabitStatusProps = {
  habitId: string;
  date: string;
  onChange?: () => void;
};

type HabitEntryResponse = {
  date: string;
  isCompleted: boolean;
  completedAt: string | null;
};

export default function HabitStatus({
  habitId,
  date,
  onChange,
}: HabitStatusProps) {
  const [entry, setEntry] = useState<HabitEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/habits/${habitId}/logs?date=${encodeURIComponent(date)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load habit status.");
        }

        if (!cancelled) {
          setEntry(data as HabitEntryResponse);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [habitId, date]);

  async function toggleCompletion() {
    if (!entry || saving) return;

    setSaving(true);
    setError("");

    const nextCompleted = !entry.isCompleted;

    try {
      const response = await fetch(`/api/habits/${habitId}/logs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          isCompleted: nextCompleted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update habit status.");
      }

      setEntry(data as HabitEntryResponse);
      onChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <span className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded-full bg-white/10" />
    );
  }

  if (!entry) {
    return (
      <p role="alert" className="text-xs text-red-400">
        {error || "Unable to load habit status."}
      </p>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        disabled={saving}
        onClick={() => void toggleCompletion()}
        aria-label={
          entry.isCompleted
            ? `Mark habit incomplete`
            : `Complete habit`
        }
        title={entry.isCompleted ? "Completed" : "Complete habit"}
        className={[
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1B]",
          entry.isCompleted
            ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300"
            : "border-slate-500/70 bg-white/[0.03] hover:border-violet-300 hover:bg-violet-400/15",
          saving ? "cursor-wait opacity-50" : "",
        ].join(" ")}
      >
        {saving ? (
          <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
        ) : entry.isCompleted ? (
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
        ) : null}
      </button>

      {entry.completedAt && entry.isCompleted && (
        <span className="text-[10px] text-slate-500">
          {new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(entry.completedAt))}
        </span>
      )}

      {error && (
        <p role="alert" className="max-w-40 text-right text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
