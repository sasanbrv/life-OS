"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  manualProgress: number;
  startDate: string | null;
  dueDate: string | null;
  _count?: { tasks: number };
};

type GoalsResponse = {
  goals?: Goal[];
  message?: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/goals", { cache: "no-store" });
      const data = (await response.json()) as GoalsResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to load goals.");
      }

      setGoals(data.goals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await loadGoals();
    }

    if (!cancelled) void load();

    return () => {
      cancelled = true;
    };
  }, [loadGoals]);

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          startDate: null,
          dueDate: dueDate || null,
        }),
      });

      const data = (await response.json()) as GoalsResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to create goal.");
      }

      setTitle("");
      setDescription("");
      setDueDate("");
      setShowForm(false);
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateGoal(
    goal: Goal,
    changes: Partial<Pick<Goal, "status" | "manualProgress">>,
  ) {
    setError("");

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const data = (await response.json()) as { goal?: Goal; message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to update goal.");
      }

      if (data.goal) {
        setGoals((current) =>
          current.map((item) => item.id === goal.id ? data.goal! : item),
        );
      } else {
        await loadGoals();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update goal.");
    }
  }

  async function deleteGoal(goal: Goal) {
    if (!window.confirm(`Delete "${goal.title}"?`)) return;

    setError("");

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete goal.");
      }

      setGoals((current) => current.filter((item) => item.id !== goal.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete goal.");
    }
  }

  const activeGoals = goals.filter((goal) => goal.status === "ACTIVE");
  const completedGoals = goals.filter((goal) => goal.status === "COMPLETED");

  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium tracking-widest text-violet-400">LONG-TERM VISION</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Goals</h1>
          <p className="mt-3 text-slate-400">Track your progress and keep your priorities in sight.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-500"
        >
          {showForm ? "Cancel" : "+ New Goal"}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={createGoal} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div>
            <label htmlFor="goal-title" className="mb-2 block text-sm text-slate-300">Goal Title</label>
            <input
              id="goal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
              placeholder="e.g. Learn a new language"
              className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="mb-2 block text-sm text-slate-300">Description</label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What do you want to achieve?"
              className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="goal-due-date" className="mb-2 block text-sm text-slate-300">Target Date</label>
            <input
              id="goal-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Goal"}
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Goals", value: goals.length },
          { label: "Active Goals", value: activeGoals.length },
          { label: "Completed Goals", value: completedGoals.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-400">Loading goals...</p>
      ) : goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
          <h2 className="font-semibold text-white">No goals yet</h2>
          <p className="mt-2 text-sm text-slate-400">Create your first goal to start tracking progress.</p>
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => (
            <article key={goal.id} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-semibold text-white">{goal.title}</h2>
                  {goal.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{goal.description}</p>
                  )}
                </div>
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs ${goal.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-300" : goal.status === "ACTIVE" ? "bg-violet-500/10 text-violet-300" : "bg-white/5 text-slate-400"}`}>
                  {goal.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <label htmlFor={`progress-${goal.id}`} className="text-slate-400">Manual Progress</label>
                  <span className="font-medium text-white">{goal.manualProgress}%</span>
                </div>
                <input
                  id={`progress-${goal.id}`}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={goal.manualProgress}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setGoals((current) => current.map((item) =>
                      item.id === goal.id ? { ...item, manualProgress: value } : item,
                    ));
                  }}
                  onMouseUp={(event) => {
                    void updateGoal(goal, { manualProgress: Number(event.currentTarget.value) });
                  }}
                  onTouchEnd={(event) => {
                    void updateGoal(goal, { manualProgress: Number(event.currentTarget.value) });
                  }}
                  className="w-full accent-violet-500"
                />
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${goal.manualProgress}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                <span>{goal._count?.tasks ?? 0} linked tasks</span>
                <span>
                  {goal.dueDate
                    ? `Target: ${new Date(goal.dueDate).toLocaleDateString("en-US")}`
                    : "No target date"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => void updateGoal(goal, { status: goal.status === "COMPLETED" ? "ACTIVE" : "COMPLETED" })}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                >
                  {goal.status === "COMPLETED" ? "Reopen Goal" : "Mark Completed"}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteGoal(goal)}
                  className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}