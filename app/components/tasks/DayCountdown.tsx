
"use client";

import { useEffect, useState } from "react";

type DayCountdownProps = {
  timeZone: string;
};

function getDateInTimeZone(timeZone: string, timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getNextDayStart(timeZone: string, now: number) {
  const today = getDateInTimeZone(timeZone, now);
  let low = now;
  let high = now + 36 * 60 * 60 * 1000;

  while (high - low > 1000) {
    const middle = Math.floor((low + high) / 2);

    if (getDateInTimeZone(timeZone, middle) === today) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return high;
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function DayCountdown({
  timeZone,
}: DayCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let previousDate = getDateInTimeZone(timeZone, Date.now());

    const update = () => {
      const now = Date.now();
      const currentDate = getDateInTimeZone(timeZone, now);

      if (currentDate !== previousDate) {
        previousDate = currentDate;
        window.dispatchEvent(new CustomEvent("tasks:day-changed"));
      }

      setRemaining(
        Math.max(0, getNextDayStart(timeZone, now) - now),
      );
    };

    update();

    const intervalId = window.setInterval(update, 1000);

    return () => window.clearInterval(intervalId);
  }, [timeZone]);

  return (
    <section className="group relative min-w-0 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition-colors duration-300 hover:border-violet-400/20">
      {/* Soft ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/[0.09] blur-3xl transition-colors group-hover:bg-violet-500/[0.15]"
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.07] text-violet-300">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-[18px] w-[18px]"
            >
              <circle cx="12" cy="12" r="8.5" />
              <path
                d="M12 7v5l3 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-100">
              Day countdown
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Time left today
            </p>
          </div>

          <span
            className="relative flex h-2 w-2 shrink-0"
            aria-label="Countdown active"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
          </span>
        </div>

        {/* Countdown display */}
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-[#080D1B]/60 px-2 py-4 sm:px-3">
          <p
            className="whitespace-nowrap text-center font-mono text-[clamp(1.65rem,5vw,2.15rem)] font-semibold leading-none tracking-[0.06em] text-violet-200 tabular-nums"
            role="timer"
            aria-live="off"
          >
            {remaining === null ? "--:--:--" : formatTime(remaining)}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-5 bg-violet-400/25" />
            <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-slate-500">
              HRS <span className="text-violet-400/60">:</span> MIN{" "}
              <span className="text-violet-400/60">:</span> SEC
            </span>
            <span className="h-px w-5 bg-violet-400/25" />
          </div>
        </div>

        {/* End-of-day note */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/[0.045] bg-white/[0.02] px-2.5 py-2.5">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="mt-0.5 h-4 w-4 shrink-0 text-violet-300/80"
          >
            <circle cx="12" cy="12" r="9" />
            <path
              d="M12 11v5m0-8h.01"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <p className="text-[11px] leading-[1.65] text-slate-400">
            Uncompleted tasks move to{" "}
            <span className="font-medium text-violet-300">Missed</span>{" "}
            when the day ends.
          </p>
        </div>
      </div>
    </section>
  );
}
