"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Habit = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  recurrence: {
    frequency: "DAILY" | "WEEKLY";
    daysOfWeek?: number[];
  };
  entries?: { date: string; isCompleted: boolean }[];
};

type HabitEntry = {
  id?: string;
  date: string;
  isCompleted: boolean;
};

type HabitResponse = {
  habits?: Habit[];
  message?: string;
};

const weekdays = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Record<string, HabitEntry>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [date, setDate] = useState(localDateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadHabits = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/habits", { cache: "no-store" });
      const data = (await response.json()) as HabitResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to load habits.");
      }

      const loadedHabits = data.habits ?? [];
      setHabits(loadedHabits);

      const results = await Promise.all(
        loadedHabits.map(async (habit) => {
          const entryResponse = await fetch(
            `/api/habits/${habit.id}/entries?date=${encodeURIComponent(date)}`,
            { cache: "no-store" },
          );

          if (!entryResponse.ok) return [habit.id, null] as const;

          const entryData = (await entryResponse.json()) as {
            entries?: HabitEntry[];
            entry?: HabitEntry;
          };

          const entry =
            entryData.entries?.find((item) => item.date.slice(0, 10) === date) ??
            entryData.entry ??
            null;

          return [habit.id, entry] as const;
        }),
      );

      const nextEntries: Record<string, HabitEntry> = {};

      for (const [habitId, entry] of results) {
        if (entry) nextEntries[habitId] = entry;
      }

      setEntries(nextEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load habits.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      await loadHabits();
    } finally {
      if (cancelled) return;
    }
  }

  void load();

  return () => {
    cancelled = true;
  };
}, [loadHabits]);
  async function createHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) return;
    if (frequency === "WEEKLY" && daysOfWeek.length === 0) {
      setError("Choose at least one day for a weekly habit.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          recurrence:
            frequency === "DAILY"
              ? { frequency: "DAILY" }
              : { frequency: "WEEKLY", daysOfWeek },
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to create habit.");
      }

      setTitle("");
      setDescription("");
      setFrequency("DAILY");
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setShowForm(false);
      await loadHabits();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create habit.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleEntry(habit: Habit) {
    const current = entries[habit.id];
    const nextCompleted = !current?.isCompleted;

    setError("");
    setEntries((previous) => ({
      ...previous,
      [habit.id]: {
        ...current,
        date,
        isCompleted: nextCompleted,
      },
    }));

    try {
      const response = await fetch(`/api/habits/${habit.id}/entries`, {
        method: nextCompleted ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, isCompleted: nextCompleted }),
      });

      const data = (await response.json()) as {
        entry?: HabitEntry;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Failed to update habit entry.");
      }

      if (data.entry) {
        setEntries((previous) => ({
          ...previous,
          [habit.id]: data.entry!,
        }));
      }
    } catch (err) {
      setEntries((previous) => ({
        ...previous,
        [habit.id]: current ?? { date, isCompleted: false },
      }));
      setError(err instanceof Error ? err.message : "Failed to update habit.");
    }
  }

  async function toggleActive(habit: Habit) {
    setError("");

    try {
      const response = await fetch(`/api/habits/${habit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !habit.isActive }),
      });

      const data = (await response.json()) as { habit?: Habit; message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to update habit.");
      }

      setHabits((current) =>
        current.map((item) =>
          item.id === habit.id
            ? data.habit ?? { ...item, isActive: !item.isActive }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update habit.");
    }
  }

  const activeHabits = habits.filter((habit) => habit.isActive);
  const completedToday = activeHabits.filter(
    (habit) => entries[habit.id]?.isCompleted,
  ).length;

  const scheduledHabits = activeHabits.filter((habit) => {
    if (habit.recurrence.frequency === "DAILY") return true;
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return habit.recurrence.daysOfWeek?.includes(weekday) ?? false;
  });

  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium tracking-widest text-violet-400">CONSISTENCY</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Habits</h1>
          <p className="mt-3 text-slate-400">Build routines through small daily actions.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-500"
        >
          {showForm ? "Cancel" : "+ New Habit"}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={createHabit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div>
            <label htmlFor="habit-title" className="mb-2 block text-sm text-slate-300">Habit Title</label>
            <input
              id="habit-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
              placeholder="e.g. Read for 20 minutes"
              className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="habit-description" className="mb-2 block text-sm text-slate-300">Description</label>
            <textarea
              id="habit-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Add details about this habit"
              className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="habit-frequency" className="mb-2 block text-sm text-slate-300">Schedule</label>
            <select
              id="habit-frequency"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as "DAILY" | "WEEKLY")}
              className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"
            >
              <option value="DAILY">Every day</option>
              <option value="WEEKLY">Selected weekdays</option>
            </select>
          </div>

          {frequency === "WEEKLY" && (
            <fieldset>
              <legend className="mb-2 text-sm text-slate-300">Repeat on</legend>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => {
                  const selected = daysOfWeek.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setDaysOfWeek((current) =>
                          selected
                            ? current.filter((value) => value !== day.value)
                            : [...current, day.value].sort(),
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-sm ${selected ? "bg-violet-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Habit"}
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-400">Active Habits</p>
          <p className="mt-2 text-3xl font-bold text-white">{activeHabits.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-400">Scheduled Today</p>
          <p className="mt-2 text-3xl font-bold text-white">{scheduledHabits.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-400">Completed Selected Day</p>
          <p className="mt-2 text-3xl font-bold text-white">{completedToday}</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-semibold text-white">Daily Check-in</h2>
          <input
            type="date"
            aria-label="Habit date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0D1325] px-4 py-2.5 text-white outline-none focus:border-violet-500"
          />
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-400">Loading habits...</p>
        ) : habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
            <h3 className="font-semibold text-white">No habits yet</h3>
            <p className="mt-2 text-sm text-slate-400">Create your first habit to start building consistency.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const scheduled =
                habit.recurrence.frequency === "DAILY" ||
                (habit.recurrence.daysOfWeek?.includes(new Date(`${date}T12:00:00`).getDay()) ?? false);

              const isCompleted = entries[habit.id]?.isCompleted ?? false;

              return (
                <article key={habit.id} className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 ${!habit.isActive ? "opacity-60" : ""}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        disabled={!habit.isActive || !scheduled}
                        onChange={() => void toggleEntry(habit)}
                        className="mt-1 h-5 w-5 accent-violet-500"
                      />
                      <div className="min-w-0">
                        <h3 className={`break-words font-semibold ${isCompleted ? "text-slate-500 line-through" : "text-white"}`}>
                          {habit.title}
                        </h3>
                        {habit.description && (
                          <p className="mt-1 text-sm text-slate-400">{habit.description}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          {habit.recurrence.frequency === "DAILY"
                            ? "Every day"
                            : `Weekly · ${habit.recurrence.daysOfWeek?.map((day) => weekdays.find((item) => item.value === day)?.label).filter(Boolean).join(", ")}`}
                          {!scheduled ? " · Not scheduled for this day" : ""}
                          {!habit.isActive ? " · Paused" : ""}
                        </p>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => void toggleActive(habit)}
                      className="w-fit rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                    >
                      {habit.isActive ? "Pause Habit" : "Activate Habit"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}