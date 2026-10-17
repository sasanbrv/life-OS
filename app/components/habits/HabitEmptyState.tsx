
import Link from "next/link";

type HabitEmptyStateProps = {
  title?: string;
  description?: string;
};

export default function HabitEmptyState({
  title = "No habits yet",
  description = "Create your first habit and start building your routine.",
}: HabitEmptyStateProps) {
  return (
    <div className="rounded-xl border p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>

      <Link
        href="/habits/new"
        className="mt-5 inline-block rounded-lg border px-4 py-2"
      >
        Create your first habit
      </Link>
    </div>
  );
}
