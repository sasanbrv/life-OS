
"use client";

import { useEffect, useState } from "react";

type Subtask = {
  id: string;
  title: string;
  isDone: boolean;
  position: number;
};

type SubtaskListProps = {
  taskId: string;
};

type ApiResponse = {
  subtasks?: Subtask[];
  subtask?: Subtask;
  message?: string;
};

export default function SubtaskList({ taskId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchSubtasks() {
      try {
        const response = await fetch(
          `/api/tasks/${taskId}/subtasks`,
          { cache: "no-store" }
        );

        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(data.message || "Failed to load subtasks.");
        }

        if (!cancelled) {
          setSubtasks(data.subtasks ?? []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load subtasks."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchSubtasks();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const completedCount = subtasks.filter(
    (item) => item.isDone
  ).length;

  async function addSubtask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/subtasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle }),
        }
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to create subtask.");
      }

      if (data.subtask) {
        setSubtasks((current) => {
          if (current.some((item) => item.id === data.subtask!.id)) {
            return current;
          }

          return [...current, data.subtask!].sort(
            (a, b) => a.position - b.position
          );
        });
      } else {
        const refreshResponse = await fetch(
          `/api/tasks/${taskId}/subtasks`,
          { cache: "no-store" }
        );

        const refreshData =
          (await refreshResponse.json()) as ApiResponse;

        if (!refreshResponse.ok) {
          throw new Error(
            refreshData.message || "Subtask created, but refresh failed."
          );
        }

        setSubtasks(refreshData.subtasks ?? []);
      }

      setTitle("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSubtask(subtask: Subtask) {
    const nextIsDone = !subtask.isDone;

    setError("");

    setSubtasks((current) =>
      current.map((item) =>
        item.id === subtask.id
          ? { ...item, isDone: nextIsDone }
          : item
      )
    );

    try {
      const response = await fetch(
          `/api/tasks/${taskId}/subtasks/${subtask.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDone: nextIsDone }),
          }
        );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to update subtask.");
      }

      if (data.subtask) {
        setSubtasks((current) =>
          current.map((item) =>
            item.id === subtask.id ? data.subtask! : item
          )
        );
      }
    } catch (err) {
      setSubtasks((current) =>
        current.map((item) =>
          item.id === subtask.id
            ? { ...item, isDone: subtask.isDone }
            : item
        )
      );

      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  async function deleteSubtask(subtask: Subtask) {
    if (!window.confirm(`Delete "${subtask.title}"?`)) return;

    setError("");

    try {
      const response = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete subtask.");
      }

      setSubtasks((current) =>
        current.filter((item) => item.id !== subtask.id)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  return (
    <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">Checklist</h4>

        <span className="text-xs text-slate-400">
          {completedCount}/{subtasks.length} completed
        </span>
      </div>

      {subtasks.length > 0 && (
        <div
          className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Checklist progress"
          aria-valuemin={0}
          aria-valuemax={subtasks.length}
          aria-valuenow={completedCount}
        >
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{
              width: `${(completedCount / subtasks.length) * 100}%`,
            }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mb-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-3 text-sm text-slate-500">
          Loading checklist...
        </p>
      ) : subtasks.length === 0 ? (
        <p className="py-2 text-sm text-slate-500">
          No subtasks yet.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <input
                type="checkbox"
                checked={subtask.isDone}
                onChange={() => void toggleSubtask(subtask)}
                aria-label={`Mark ${subtask.title} as ${
                  subtask.isDone ? "incomplete" : "complete"
                }`}
                className="h-4 w-4 accent-violet-500"
              />

              <span
                className={`min-w-0 flex-1 break-words text-sm ${
                  subtask.isDone
                    ? "text-slate-500 line-through"
                    : "text-slate-300"
                }`}
              >
                {subtask.title}
              </span>

              <button
                type="button"
                onClick={() => void deleteSubtask(subtask)}
                className="text-xs text-rose-300 hover:text-rose-200"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addSubtask} className="flex gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="Add a checklist item..."
          aria-label="New subtask title"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0D1325] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
        />

        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </form>
    </section>
  );
}
