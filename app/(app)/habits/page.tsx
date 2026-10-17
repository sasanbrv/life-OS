
import Link from "next/link";
import HabitList from "@/app/components/habits/HabitList";

export default function HabitsPage() {
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
          <p className="mt-2 text-sm text-gray-500">
            Build routines and track your daily progress.
          </p>
        </div>

        <Link
          href="/habits/new"
          className="rounded-lg border px-4 py-2"
        >
          Create Habit
        </Link>
      </div>

      <HabitList />
    </main>
  );
}
