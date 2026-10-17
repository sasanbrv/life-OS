
"use client";

import { useEffect, useState } from "react";

type DailyNoteProps = {
  selectedDate: string;
};

export default function DailyNote({ selectedDate }: DailyNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedDate || !isOpen) return;

    const controller = new AbortController();

    async function loadNote() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `/api/daily-notes?date=${encodeURIComponent(selectedDate)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load note.");
        }

        setContent(data.note?.content ?? "");
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Failed to load note.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadNote();

    return () => controller.abort();
  }, [selectedDate, isOpen]);

  async function saveNote() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/daily-notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: selectedDate, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save note.");
      }

      setContent(data.note?.content ?? "");
      setMessage("Saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save note.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => {
          setIsOpen((value) => !value);
          setError("");
          setMessage("");
        }}
        className="flex w-full items-center justify-between gap-3 text-sm font-semibold text-slate-100 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-violet-300"
          >
            <path
              d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Daily note
        </span>

        <span aria-hidden="true" className="text-lg">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setMessage("");
            }}
            disabled={loading || saving}
            maxLength={20000}
            aria-label="Daily note"
            className="min-h-36 w-full resize-y rounded-xl border border-white/10 bg-[#080D1B] p-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 disabled:opacity-60"
          />

          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-emerald-300">
              {message}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              {loading
                ? "Loading..."
                : `${content.length}/20000`}
            </span>

            <button
              type="button"
              onClick={saveNote}
              disabled={loading || saving || !selectedDate}
              className="rounded-xl border border-violet-400/20 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
