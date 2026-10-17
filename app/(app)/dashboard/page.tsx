
import DashboardHeader from "@/app/components/dashboard/DashboardHeader";
import DashboardOverview from "@/app/components/dashboard/DashboardOverview";
import ProductivityChart from "@/app/components/dashboard/ProductivityChart";
import HabitPerformanceChart from "@/app/components/dashboard/HabitPerformanceChart";
import TaskBreakdown from "@/app/components/dashboard/TaskBreakdown";
import TodayTasks from "@/app/components/dashboard/TodayTasks";

export default function DashboardPage() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <DashboardHeader />

      <DashboardOverview />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ProductivityChart />
        <TaskBreakdown />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <HabitPerformanceChart />
        <TodayTasks />
      </section>
    </main>
  );
}
