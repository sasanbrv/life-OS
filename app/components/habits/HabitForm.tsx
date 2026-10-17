
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Habit = {
  id: string;
  title: string;
  isActive: boolean;
  recurrence: unknown;
};

type HabitFormProps = {
  habit?: Habit;
};

const DAYS = [
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
];

function getInitialDays(recurrence: unknown): number[] {
  if (
    recurrence &&
    typeof recurrence === "object" &&
    "days" in recurrence &&
    Array.isArray(recurrence.days)
  ) {
    return recurrence.days.filter(
      (day): day is number =>
        Number.isInteger(day) && day >= 0 && day <= 6
    );
  }

  return [0, 1, 2, 3, 4, 5, 6];
}

export default function HabitForm({ habit }: HabitFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(habit?.title ?? "");
  const [days, setDays] = useState<number[]>(
    getInitialDays(habit?.recurrence)
  );
  const [isActive, setIsActive] = useState(habit?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please enter a habit name.");
      return;
    }

    if (days.length === 0) {
      setError("Select at least one day.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        habit ? `/api/habits/${habit.id}` : "/api/habits",
        {
          method: habit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedTitle,
            recurrence: {
              days: [...days].sort((a, b) => a - b),
            },
            ...(habit ? { isActive } : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save habit.");
      }

      router.push("/habits");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="habit-title" className="mb-2 block">
          Habit name
        </label>

        <input
          id="habit-title"
          type="text"
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Read for 20 minutes"
          required
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

    <fieldset>
      <legend className="mb-3 text-sm font-medium text-slate-300">
        Repeat on
      </legend>
    
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => {
          const active = days.includes(day.value);
        
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggleDay(day.value)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium backdrop-blur-md transition-all duration-200 ${
                active
                  ? "border-violet-400/40 bg-violet-500/20 text-violet-200 shadow-sm shadow-violet-500/10"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-slate-200"
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </fieldset>


      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}


    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-200 shadow-sm shadow-violet-500/10 backdrop-blur-md transition-all duration-200 hover:border-violet-400/50 hover:bg-violet-500/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? "Saving..."
        : habit
          ? "Save changes"
          : "Create habit"}
    </button>

    </form>
  );
}
