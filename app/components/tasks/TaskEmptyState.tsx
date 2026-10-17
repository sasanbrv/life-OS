
"use client";

import type { TaskView } from "./TaskFilters";

type TaskEmptyStateProps = {
  view: TaskView;
};

const messages: Record<
  TaskView,
  { title: string; description: string }
> = {
  day: {
    title: "No tasks for this day",
    description: "Add a task above to get started.",
  },
  upcoming: {
    title: "No upcoming tasks",
    description: "Your upcoming tasks will appear here.",
  },
  missed: {
    title: "No missed tasks",
    description: "You're all caught up.",
  },
  completed: {
    title: "No completed tasks",
    description: "Tasks you complete will appear here.",
  },
};

export default function TaskEmptyState({
  view,
}: TaskEmptyStateProps) {
  const message = messages[view];

  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-10 text-center backdrop-blur-xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-300">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6"
        >
          <path
            d="M8 5h11M8 12h11M8 19h11M4 5h.01M4 12h.01M4 19h.01"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3 className="text-sm font-semibold text-slate-200">
        {message.title}
      </h3>

      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
        {message.description}
      </p>
    </div>
  );
}
