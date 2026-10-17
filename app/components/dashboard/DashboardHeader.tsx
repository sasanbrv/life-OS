
import { CalendarDays } from "lucide-react";

export default function DashboardHeader() {
  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "Asia/Tehran",
  }).format(new Date());

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.2em] text-violet-400">
          LIFE OS / OVERVIEW
        </p>

        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          A clear view of your progress and productivity.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
        <CalendarDays size={17} className="text-violet-400" />
        {date}
      </div>
    </header>
  );
}
