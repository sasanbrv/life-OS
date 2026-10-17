
"use client";

import { useCallback, useEffect, useState } from "react";
import HabitItem from "./HabitItem";

type Habit = {
  id: string;
  title: string;
  isActive: boolean;
  recurrence: unknown;
  createdAt: string;
  updatedAt: string;
};

export default function HabitList() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/habits", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load habits.");
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid habits response.");
      }

      setHabits(data as Habit[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  let cancelled = false;

  async function loadHabits() {
    setError("");

    try {
      const response = await fetch("/api/habits", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load habits.");
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid habits response.");
      }

      if (!cancelled) {
        setHabits(data as Habit[]);
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

  void loadHabits();

  return () => {
    cancelled = true;
  };
}, []);

  if (loading) {
    return <p>Loading habits...</p>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void fetchHabits()}
          className="rounded-lg border px-4 py-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <h3 className="font-semibold">No habits yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Create your first habit to get started.
        </p>
      </div>
    );
  }

  const activeHabits = habits.filter((habit) => habit.isActive);
  const inactiveHabits = habits.filter((habit) => !habit.isActive);

  return (
    <div className="space-y-6">
      {activeHabits.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">
            Active Habits ({activeHabits.length})
          </h2>

          {activeHabits.map((habit) => (
            <HabitItem key={habit.id} habit={habit} />
          ))}
        </section>
      )}

      {inactiveHabits.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">
            Inactive Habits ({inactiveHabits.length})
          </h2>

          {inactiveHabits.map((habit) => (
            <HabitItem key={habit.id} habit={habit} />
          ))}
        </section>
      )}
    </div>
  );
}
