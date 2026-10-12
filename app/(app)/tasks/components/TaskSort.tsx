"use client";

export type TaskSortField =
  | "createdAt"
  | "dueDate"
  | "priority"
  | "status"
  | "title";

export type TaskSortOrder = "asc" | "desc";

type TaskSortProps = {
  field: TaskSortField;
  order: TaskSortOrder;
  onFieldChange: (field: TaskSortField) => void;
  onOrderChange: (order: TaskSortOrder) => void;
};

const sortOptions: { value: TaskSortField; label: string }[] = [
  { value: "createdAt", label: "Date Created" },
  { value: "dueDate", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
  { value: "title", label: "Title" },
];

export default function TaskSort({
  field,
  order,
  onFieldChange,
  onOrderChange,
}: TaskSortProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        htmlFor="task-sort-field"
        className="text-sm text-slate-400"
      >
        Sort by
      </label>

      <select
        id="task-sort-field"
        value={field}
        onChange={(event) =>
          onFieldChange(event.target.value as TaskSortField)
        }
        className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onOrderChange(order === "asc" ? "desc" : "asc")}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
        aria-label={`Sort ${order === "asc" ? "descending" : "ascending"}`}
      >
        {order === "asc" ? "Ascending ↑" : "Descending ↓"}
      </button>
    </div>
  );
}
