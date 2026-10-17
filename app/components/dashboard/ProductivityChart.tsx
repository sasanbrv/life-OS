
"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  date: string;
  rate: number;
};

export default function ProductivityChart() {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      try {
        const response = await fetch("/api/dashboard/stats");

        if (!response.ok) {
          throw new Error("Failed to load productivity chart.");
        }

        const result = await response.json();

        if (!cancelled) {
          setData(result.weeklyProductivity ?? []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadChart();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5">
      <div className="mb-6">
        <h2 className="font-semibold text-white">Productivity Trend</h2>
        <p className="mt-1 text-sm text-slate-400">
          Completion rate over the last 7 days
        </p>
      </div>

      <div className="h-64 w-full" dir="ltr">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-white/[0.03]" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: string) =>
                  new Date(`${value}T12:00:00Z`).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", timeZone: "UTC" }
                  )
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
                formatter={(value) => [`${value}%`, "Completion"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                name="Completion"
                stroke="#a78bfa"
                strokeWidth={3}
                dot={{ fill: "#a78bfa", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
