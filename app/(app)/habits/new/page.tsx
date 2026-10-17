
import Link from "next/link";
import HabitForm from "@/app/components/habits/HabitForm";

export default function NewHabitPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/habits"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to Habits
        </Link>

        <h1 className="mt-4 text-2xl font-bold">Create Habit</h1>

        <p className="mt-2 text-sm text-gray-500">
          Choose a name and select the days you want to repeat this habit.
        </p>
      </div>

      <HabitForm />
    </main>
  );
}
