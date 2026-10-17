
"use client";

import { useState, type FormEvent } from "react";

type TaskFormProps = {
  selectedDate: string;
  onAdd: (
    title: string,
    date: string,
    startTime?: string,
    endTime?: string,
  ) => Promise<void>;
};

const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

export default function TaskForm({
  selectedDate,
  onAdd,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openTimePicker, setOpenTimePicker] = useState<
    "start" | "end" | null
  >(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle || !selectedDate || loading) return;

    if (Boolean(startTime) !== Boolean(endTime)) {
      setError(
        "Please provide both start and end times, or leave both empty.",
      );
      return;
    }

    if (startTime && endTime && startTime >= endTime) {
      setError("End time must be later than start time.");
      return;
    }

    setLoading(true);
    setError("");
    setOpenTimePicker(null);

    try {
      await onAdd(
        cleanTitle,
        selectedDate,
        startTime || undefined,
        endTime || undefined,
      );

      setTitle("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create task.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "min-h-[3.25rem] w-full rounded-2xl border border-white/[0.09] bg-[#080D1B]/55 px-4 py-3 text-sm text-white shadow-inner shadow-black/[0.08] outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-white/[0.15] focus:border-violet-400/50 focus:bg-[#080D1B]/80 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.07)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form
      onSubmit={handleSubmit}
      className="group relative isolate overflow-hidden rounded-[1.6rem] border border-white/[0.09] bg-gradient-to-br from-white/[0.075] via-[#11172B]/90 to-violet-950/[0.22] p-4 shadow-[0_24px_80px_-35px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-[border-color,box-shadow,transform] duration-300 hover:border-violet-300/20 hover:shadow-[0_24px_90px_-35px_rgba(109,40,217,0.22)] motion-safe:hover:-translate-y-0.5 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 -z-10 h-52 w-52 rounded-full bg-violet-500/[0.13] blur-[70px] transition-opacity duration-500 group-hover:bg-violet-400/[0.18]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-44 w-44 rounded-full bg-indigo-500/[0.09] blur-[65px]"
      />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <label
            htmlFor="task-title"
            className="flex min-w-0 items-center gap-3 text-sm font-semibold tracking-wide text-slate-100"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-400/20 to-indigo-500/[0.08] text-violet-200 shadow-inner shadow-white/[0.04] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 motion-reduce:transform-none">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px]"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <span>
              <span className="block text-[15px]">New task</span>
              <span className="mt-1 block text-xs font-normal tracking-normal text-slate-500">
                Make room for what matters
              </span>
            </span>
          </label>

          <span className="hidden rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 text-[10px] font-medium tracking-[0.14em] text-slate-400 sm:inline-flex">
            QUICK ADD
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              id="task-title"
              name="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What would you like to accomplish?"
              maxLength={200}
              required
              disabled={loading}
              autoComplete="off"
              className={inputClassName}
            />

            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 left-4 right-4 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent transition-transform duration-300 ${
                title ? "scale-x-100" : "focus-within:scale-x-100"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !selectedDate}
            className="group/button relative inline-flex min-h-[3.25rem] shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-violet-300/25 bg-gradient-to-br from-violet-500 to-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.65)] transition-[transform,box-shadow,filter] duration-200 hover:shadow-[0_12px_32px_-8px_rgba(139,92,246,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none motion-safe:hover:-translate-y-0.5 sm:min-w-36"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.13] to-transparent transition-transform duration-700 group-hover/button:translate-x-full"
            />

            {loading ? (
              <>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 transition-transform duration-200 group-hover/button:rotate-90"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Add task</span>
              </>
            )}
          </button>
        </div>

        {/* Custom time picker */}
        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#080D1B]/45 p-3.5 sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-300">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-[18px] w-[18px]"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M12 7v5l3.2 2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <div>
                <p className="text-sm font-medium text-slate-200">
                  Schedule
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Choose your time slot
                </p>
              </div>
            </div>

            <span className="text-[10px] text-slate-500">
              {startTime && endTime ? "Scheduled" : "Optional"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["start", "end"] as const).map((kind) => {
              const value = kind === "start" ? startTime : endTime;
              const setValue =
                kind === "start" ? setStartTime : setEndTime;
              const isOpen = openTimePicker === kind;

              return (
                <div key={kind} className="relative min-w-0">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                    {kind === "start" ? "Start time" : "End time"}
                  </p>

                  <button
                    type="button"
                    disabled={loading}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    onClick={() =>
                      setOpenTimePicker(isOpen ? null : kind)
                    }
                    className={[
                      "flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50",
                      isOpen
                        ? "border-violet-400/40 bg-violet-400/[0.07]"
                        : "border-white/[0.08] bg-white/[0.025] hover:border-violet-400/25 hover:bg-white/[0.04]",
                      loading ? "cursor-not-allowed opacity-50" : "",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/[0.08] text-violet-300">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-4 w-4"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="8.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M12 7v5l3 2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>

                      <span
                        className={
                          value
                            ? "text-sm font-semibold tabular-nums text-slate-100"
                            : "text-sm text-slate-500"
                        }
                      >
                        {value || "Select time"}
                      </span>
                    </span>

                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`h-4 w-4 text-slate-500 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        d="m7 10 5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-violet-400/20 bg-[#101426] shadow-[0_18px_45px_-15px_rgba(0,0,0,0.8)]">
                      <div className="flex items-center justify-between border-b border-white/[0.07] px-3.5 py-3">
                        <span className="text-xs font-medium text-slate-300">
                          Choose{" "}
                          {kind === "start" ? "start" : "end"} time
                        </span>

                        <button
                          type="button"
                          onClick={() => setOpenTimePicker(null)}
                          className="text-[11px] text-slate-500 transition-colors hover:text-slate-200"
                        >
                          Close
                        </button>
                      </div>

                      <div
                        role="listbox"
                        aria-label={
                          kind === "start" ? "Start time" : "End time"
                        }
                        className="grid max-h-52 grid-cols-3 gap-1 overflow-y-auto p-2 [scrollbar-color:rgba(139,92,246,0.35)_transparent] [scrollbar-width:thin]"
                      >
                        {timeOptions.map((time) => {
                          const disabled =
                            (kind === "start" &&
                              Boolean(endTime) &&
                              time >= endTime) ||
                            (kind === "end" &&
                              Boolean(startTime) &&
                              time <= startTime);

                          return (
                            <button
                              key={time}
                              type="button"
                              role="option"
                              aria-selected={value === time}
                              disabled={disabled}
                              onClick={() => {
                                setValue(time);
                                setError("");
                                setOpenTimePicker(null);
                              }}
                              className={[
                                "rounded-lg px-2 py-2.5 text-sm tabular-nums transition-colors",
                                value === time
                                  ? "bg-violet-500 font-semibold text-white shadow-md shadow-violet-950/40"
                                  : "text-slate-300 hover:bg-violet-400/[0.12] hover:text-violet-200",
                                disabled
                                  ? "cursor-not-allowed opacity-25 hover:bg-transparent hover:text-slate-300"
                                  : "",
                              ].join(" ")}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>

                      <div className="border-t border-white/[0.07] p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setValue("");
                            setError("");
                            setOpenTimePicker(null);
                          }}
                          className="w-full rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
                        >
                          Clear time
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-3.5 w-3.5 shrink-0"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 11v5m0-8h.01"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            Choose times in 15-minute intervals, or leave both empty
            for a regular task.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <p className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-violet-300/90">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5"
              >
                <rect
                  x="3.5"
                  y="5"
                  width="17"
                  height="15.5"
                  rx="2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <span>
              <span className="block text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Scheduled for
              </span>
              <span className="mt-0.5 block font-medium text-slate-300">
                {selectedDate || "Loading date..."}
              </span>
            </span>
          </p>

          <span
            aria-live="polite"
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] tabular-nums transition-colors duration-200 ${
              title.length >= 180
                ? "border-amber-400/15 bg-amber-400/[0.06] text-amber-300"
                : "border-white/[0.06] bg-white/[0.025] text-slate-500"
            }`}
          >
            {title.length}/200
          </span>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm leading-5 text-red-300 animate-in fade-in duration-200"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="mt-0.5 h-4 w-4 shrink-0"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
