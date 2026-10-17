
"use client";

import TaskItem, { type Task } from "./TaskItem";
import TaskEmptyState from "./TaskEmptyState";

type TaskListProps = {
  tasks: Task[];
  loading: boolean;
  selectedView: "day" | "upcoming" | "missed" | "completed";
  onComplete: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
};

export default function TaskList({
  tasks,
  loading,
  selectedView,
  onComplete,
  onDelete,
}: TaskListProps) {
  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400 shadow-xl shadow-black/10 backdrop-blur-xl"
      >
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400"
        />
        <span>Loading tasks...</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <TaskEmptyState view={selectedView} />;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
