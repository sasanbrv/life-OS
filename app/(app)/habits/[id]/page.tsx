
import Link from "next/link";
import { notFound } from "next/navigation";
import HabitForm from "@/app/components/habits/HabitForm";
import HabitSchedule from "@/app/components/habits/HabitSchedule";
import HabitFrequency from "@/app/components/habits/HabitFrequency";
import HabitStatus from "@/app/components/habits/HabitStatus";
import HabitDetailClient from "@/app/components/habits/HabitDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Habit = {
  id: string;
  title: string;
  isActive: boolean;
  recurrence: {
    days: number[];
  };
};

async function getHabit(id: string): Promise<Habit | null> {
  // This page uses the existing habit API through the browser-side
  // components. The API request below is handled by the client instead.
  return null;
}

export default async function HabitDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/habits"
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to Habits
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Edit Habit</h1>
        <p className="mt-2 text-sm text-gray-500">
          Update your habit and review its schedule.
        </p>
      </div>

      <HabitDetailContent habitId={id} />
    </main>
  );
}

function HabitDetailContent({ habitId }: { habitId: string }) {
  return (
    <div className="space-y-6">
      <HabitDetailClient habitId={habitId} />
    </div>
  );
}
