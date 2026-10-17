
"use client";

import { useState } from "react";

type TaskCalendarProps = {
  selectedDate: string;
  today: string;
  onSelectDate: (date: string) => void;
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function TaskCalendar({
  selectedDate,
  today,
  onSelectDate,
}: TaskCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [showFullMonth, setShowFullMonth] = useState(false);

  const referenceDate = selectedDate || today;

  if (!referenceDate) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-sm text-slate-400">Loading calendar...</p>
      </div>
    );
  }

  const selected = parseDate(referenceDate);

  // In week mode, show the week containing the selected date.
  const weekStart = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate(),
    12,
  );
  weekStart.setDate(
    weekStart.getDate() - ((weekStart.getDay() + 6) % 7),
  );

  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  // In month mode, show the month relative to the selected date.
  const monthDate = new Date(
    selected.getFullYear(),
    selected.getMonth() + monthOffset,
    1,
    12,
  );

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (monthDate.getDay() + 6) % 7;

  const monthTitle = new Intl.DateTimeFormat("en", {
    calendar: "gregory",
    month: "long",
    year: "numeric",
  }).format(monthDate);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function selectDate(date: Date) {
    onSelectDate(formatDate(date));
  }

  return (
    <section className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition-colors hover:border-violet-400/20">
      {/* Calendar header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        {showFullMonth ? (
          <button
            type="button"
            onClick={() => setMonthOffset((value) => value - 1)}
            aria-label="Previous month"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 transition hover:bg-violet-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
            >
              <path
                d="m15 18-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <span className="w-8" />
        )}

        <div className="min-w-0 text-center">
          <h3 className="truncate text-sm font-semibold text-slate-100">
            {showFullMonth
              ? monthTitle
              : new Intl.DateTimeFormat("en", {
                  month: "short",
                  year: "numeric",
                }).format(selected)}
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {showFullMonth ? "Full month" : "Weekly view"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {showFullMonth && (
            <button
              type="button"
              onClick={() => setMonthOffset((value) => value + 1)}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 transition hover:bg-violet-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
              >
                <path
                  d="m9 18 6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!showFullMonth) {
                setMonthOffset(0);
              }
              setShowFullMonth((value) => !value);
            }}
            aria-label={
              showFullMonth ? "Show weekly calendar" : "Show full month"
            }
            aria-expanded={showFullMonth}
            title={showFullMonth ? "Weekly view" : "Full month"}
            className={[
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
              showFullMonth
                ? "border-violet-400/30 bg-violet-400/15 text-violet-200"
                : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-violet-200",
            ].join(" ")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
            >
              <rect
                x="3.5"
                y="5"
                width="17"
                height="15.5"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              {showFullMonth ? (
                <path
                  d="M8 13h8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday labels and dates */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day) => (
          <div
            key={day}
            className="py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[10px]"
          >
            {day}
          </div>
        ))}

        {/* Weekly mode */}
        {!showFullMonth &&
          weekDates.map((date) => {
            const value = formatDate(date);
            const isSelected = value === selectedDate;
            const isToday = value === today;

            return (
              <button
                key={value}
                type="button"
                onClick={() => selectDate(date)}
                aria-pressed={isSelected}
                aria-label={`${value}${isToday ? ", today" : ""}${isSelected ? ", selected" : ""}`}
                className={[
                  "relative flex aspect-square min-w-0 items-center justify-center rounded-lg border text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:text-sm",
                  isSelected
                    ? "border-violet-300/30 bg-violet-500/80 font-semibold text-white shadow-md shadow-violet-950/20"
                    : "border-transparent text-slate-300 hover:bg-white/[0.07] hover:text-white",
                  isToday && !isSelected
                    ? "border-violet-400/40 bg-violet-400/[0.08] font-semibold text-violet-200"
                    : "",
                ].join(" ")}
              >
                {date.getDate()}
                {isToday && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${
                      isSelected ? "bg-white" : "bg-violet-400"
                    }`}
                  />
                )}
              </button>
            );
          })}

        {/* Full month mode */}
        {showFullMonth && (
          <>
            {Array.from({ length: startOffset }, (_, index) => (
              <div key={`empty-${index}`} aria-hidden="true" />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => {
              const date = new Date(year, month, index + 1, 12);
              const value = formatDate(date);
              const isSelected = value === selectedDate;
              const isToday = value === today;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectDate(date)}
                  aria-pressed={isSelected}
                  aria-label={`${value}${isToday ? ", today" : ""}${isSelected ? ", selected" : ""}`}
                  className={[
                    "relative flex aspect-square min-w-0 items-center justify-center rounded-lg border text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                    isSelected
                      ? "border-violet-300/30 bg-violet-500/80 font-semibold text-white"
                      : "border-transparent text-slate-300 hover:bg-white/[0.07] hover:text-white",
                    isToday && !isSelected
                      ? "border-violet-400/40 bg-violet-400/[0.08] font-semibold text-violet-200"
                      : "",
                  ].join(" ")}
                >
                  {index + 1}
                  {isToday && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        isSelected ? "bg-white" : "bg-violet-400"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Return to today */}
      <button
        type="button"
        disabled={!today}
        onClick={() => {
          setMonthOffset(0);
          setShowFullMonth(false);
          if (today) onSelectDate(today);
        }}
        className="mt-3 w-full rounded-lg border border-violet-400/15 bg-violet-400/[0.06] px-3 py-2 text-xs font-medium text-violet-200 transition hover:border-violet-400/30 hover:bg-violet-400/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Go to today
      </button>
    </section>
  );
}
