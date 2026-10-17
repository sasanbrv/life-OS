
"use client";

export type TaskView = "day" | "upcoming" | "missed" | "completed";

type TaskFiltersProps = {
  view: TaskView;
  onChange: (view: TaskView) => void;
};

const views: { id: TaskView; label: string }[] = [
  { id: "day", label: "Selected day" },
  { id: "upcoming", label: "Upcoming" },
  { id: "missed", label: "Missed" },
  { id: "completed", label: "Completed" },
];

export default function TaskFilters({
  view,
  onChange,
}: TaskFiltersProps) {
  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Task filters"
    >
      {views.map((item) => {
        const active = view === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={active}
            className={[
              "rounded-xl border px-4 py-2.5 text-sm font-medium",
              "backdrop-blur-xl transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
              active
                ? "border-violet-400/30 bg-violet-500/20 text-violet-100 shadow-lg shadow-violet-950/20"
                : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:border-violet-400/25 hover:bg-violet-400/[0.07] hover:text-slate-100",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
