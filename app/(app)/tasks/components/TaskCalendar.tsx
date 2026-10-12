"use client";

import { useMemo, useState } from "react";

export type CalendarTask = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
};

type TaskCalendarProps = {
  tasks: CalendarTask[];
  timeZone?: string;
  onTaskClick?: (task: CalendarTask) => void;
};

type CalendarView = "DAY" | "WEEK" | "MONTH";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function monthLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

function dayLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(date);
}

export default function TaskCalendar({
  tasks,
  timeZone = "UTC",
  onTaskClick,
}: TaskCalendarProps) {
  const [view, setView] = useState<CalendarView>("MONTH");
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const todayKey = dateKey(new Date(), timeZone);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1,
    );
    const monday = startOfWeek(firstDay);

    return Array.from({ length: 42 }, (_, index) =>
      addDays(monday, index),
    );
  }, [selectedDate]);

  const visibleDays = useMemo(() => {
    if (view === "DAY") return [selectedDate];

    if (view === "WEEK") {
      return Array.from({ length: 7 }, (_, index) =>
        addDays(startOfWeek(selectedDate), index),
      );
    }

    return calendarDays;
  }, [view, selectedDate, calendarDays]);

  const tasksForDay = (date: Date) => {
    const key = dateKey(date, timeZone);

    return tasks.filter(
      (task) =>
        task.dueDate &&
        !Number.isNaN(new Date(task.dueDate).getTime()) &&
        dateKey(new Date(task.dueDate), timeZone) === key,
    );
  };

  const moveDate = (amount: number) => {
    if (view === "MONTH") {
      setSelectedDate(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() + amount,
            1,
          ),
      );
      return;
    }

    setSelectedDate((current) =>
      addDays(current, amount * (view === "WEEK" ? 7 : 1)),
    );
  };

  const priorityStyles = {
    LOW: "text-slate-300",
    MEDIUM: "text-amber-300",
    HIGH: "text-rose-300",
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-white sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Task Calendar</h2>
          <p className="mt-1 text-sm text-slate-400">
            Tasks organized by due date
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["DAY", "WEEK", "MONTH"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`rounded-lg px-3 py-2 text-sm ${
                view === item
                  ? "bg-violet-600 text-white"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {item.charAt(0) + item.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => moveDate(-1)}
          className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
          aria-label="Previous period"
        >
          ←
        </button>

        <h3 className="text-center font-medium">
          {view === "DAY"
            ? dayLabel(selectedDate, timeZone)
            : view === "WEEK"
              ? `${dayLabel(visibleDays[0], timeZone)} – ${dayLabel(visibleDays[6], timeZone)}`
              : monthLabel(selectedDate, timeZone)}
        </h3>

        <button
          type="button"
          onClick={() => moveDate(1)}
          className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
          aria-label="Next period"
        >
          →
        </button>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setSelectedDate(new Date())}
          className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-300 hover:bg-violet-500/20"
        >
          Today
        </button>
      </div>

      {view === "MONTH" && (
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="py-2 text-center text-xs text-slate-400 sm:text-sm"
            >
              {weekday}
            </div>
          ))}

          {visibleDays.map((date) => {
            const key = dateKey(date, timeZone);
            const dayTasks = tasksForDay(date);
            const isCurrentMonth =
              date.getMonth() === selectedDate.getMonth();

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setView("DAY");
                }}
                className={`min-h-20 rounded-xl border p-1 text-left transition sm:min-h-28 sm:p-2 ${
                  key === dateKey(selectedDate, timeZone)
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-white/5 hover:border-white/20"
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    key === todayKey ? "bg-violet-600 text-white" : ""
                  }`}
                >
                  {date.getDate()}
                </span>

                <div className="mt-1 space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="truncate rounded bg-white/5 px-1 py-1 text-[10px] sm:text-xs"
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}

                  {dayTasks.length > 2 && (
                    <p className="text-[10px] text-slate-400">
                      +{dayTasks.length - 2} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {view !== "MONTH" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDays.map((date) => {
            const key = dateKey(date, timeZone);
            const dayTasks = tasksForDay(date);

            return (
              <div
                key={key}
                className={`min-h-36 rounded-xl border p-3 ${
                  key === todayKey
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "border-white/10"
                }`}
              >
                <h4 className="mb-3 text-sm font-medium">
                  {dayLabel(date, timeZone)}
                </h4>

                {dayTasks.length === 0 ? (
                  <p className="text-sm text-slate-500">No tasks</p>
                ) : (
                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onTaskClick?.(task)}
                        className="block w-full rounded-lg bg-white/5 p-3 text-left hover:bg-white/10"
                      >
                        <span className="block text-sm">
                          {task.title}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {task.status.replace("_", " ")}
                          {" · "}
                          <span className={priorityStyles[task.priority]}>
                            {task.priority}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
