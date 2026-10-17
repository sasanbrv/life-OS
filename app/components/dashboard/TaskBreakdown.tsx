
"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#34d399", "#a78bfa", "#64748b"];

type BreakdownItem = {
  name: string;
  value: number;
};

export default function TaskBreakdown() {
  const [data, setData] = useState<BreakdownItem[]>([
    { name: "Completed", value: 0 },
    { name: "Remaining", value: 0 },
    { name: "Overdue", value: 0 },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBreakdown() {
      try {
        const response = await fetch("/api/dashboard/stats");

        if (!response.ok) {
          throw new Error("Failed to load task breakdown.");
        }

        const result = await response.json();
        const overview = result.overview;

        if (!cancelled) {
          setData([
            { name: "Completed", value: overview.completed ?? 0 },
            { name: "Remaining", value: overview.pending ?? 0 },
            { name: "Overdue", value: overview.missed ?? 0 },
          ]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBreakdown();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5">
      <h2 className="font-semibold text-white">Task Breakdown</h2>
      <p className="mt-1 text-sm text-slate-400">
        Overview of your task status
      </p>

      {loading ? (
        <div className="mt-5 h-52 animate-pulse rounded-xl bg-white/[0.03]" />
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="h-52 w-full sm:w-1/2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={4}
                  stroke="none"
                >
                  {data.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full space-y-4 sm:w-1/2">
            {data.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  {item.name}
                </div>
                <span className="font-semibold text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
