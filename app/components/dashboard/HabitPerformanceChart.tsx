
"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HabitPoint = {
  id: string;
  title: string;
  rate: number;
};

export default function HabitPerformanceChart() {
  const [data, setData] = useState<HabitPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHabits() {
      try {
        const response = await fetch("/api/dashboard/stats");

        if (!response.ok) {
          throw new Error("Failed to load habit performance.");
        }

        const result = await response.json();

        if (!cancelled) {
          setData(result.habitPerformance ?? []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHabits();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5">
      <h2 className="font-semibold text-white">Habit Performance</h2>
      <p className="mt-1 text-sm text-slate-400">
        Completion rate for each habit over the last 30 days
      </p>

      <div className="mt-5 h-64 w-full" dir="ltr">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-white/[0.03]" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="title"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                tickFormatter={(value: string) =>
                  value.length > 12 ? `${value.slice(0, 12)}…` : value
                }
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(value) => [`${value}%`, "Completion Rate"]}
              />
              <Bar
                dataKey="rate"
                name="Completion Rate"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No habit data available yet.
          </div>
        )}
      </div>
    </section>
  );
}
