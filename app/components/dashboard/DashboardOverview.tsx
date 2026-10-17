
"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Flame,
  ListTodo,
} from "lucide-react";
import StatCard from "./StatCard";

type Overview = {
  total: number;
  completed: number;
  pending: number;
  missed: number;
  completionRate: number;
  habitCompletionRate: number;
};

const initialStats: Overview = {
  total: 0,
  completed: 0,
  pending: 0,
  missed: 0,
  completionRate: 0,
  habitCompletionRate: 0,
};

export default function DashboardOverview() {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/dashboard/stats");

        if (!response.ok) {
          throw new Error("Failed to load dashboard statistics.");
        }

        const data = await response.json();

        if (!cancelled) {
          setStats({ ...initialStats, ...data.overview });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      title: "Today's Items",
      value: stats.total,
      description: "Scheduled tasks and habits",
      icon: ListTodo,
      accent: "text-violet-400",
    },
    {
      title: "Completed",
      value: stats.completed,
      description: "Items completed today",
      icon: CheckCircle2,
      accent: "text-emerald-400",
    },
    {
      title: "Remaining",
      value: stats.pending,
      description: "Items left for today",
      icon: CircleDashed,
      accent: "text-sky-400",
    },
    {
      title: "Habit Completion",
      value: `${stats.habitCompletionRate}%`,
      description: "Today's habit completion rate",
      icon: Flame,
      accent: "text-orange-400",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          {...card}
          value={loading ? "—" : card.value}
        />
      ))}
    </section>
  );
}
