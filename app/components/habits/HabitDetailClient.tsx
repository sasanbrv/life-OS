
"use client";

import { useEffect, useState } from "react";
import HabitForm from "@/app/components/habits/HabitForm";
import Link from "next/link";

type Habit = {
  id: string;
  title: string;
  isActive: boolean;
  recurrence: {
    days: number[];
  };
};

export default function HabitDetailClient({
  habitId,
}: {
  habitId: string;
}) {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHabit() {
      try {
        const response = await fetch(`/api/habits/${habitId}`);

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Habit not found."
              : "Failed to load habit."
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setHabit(data.habit ?? data);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load habit. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHabit();

    return () => {
      cancelled = true;
    };
  }, [habitId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading habit...</p>;
  }

  if (error || !habit) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-500">
          {error || "Habit not found."}
        </p>
        <Link href="/habits" className="text-sm hover:underline">
          Back to Habits
        </Link>
      </div>
    );
  }

  return <HabitForm habit={habit} />;
}
