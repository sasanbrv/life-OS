
"use client";

import Link from "next/link";
import { useState } from "react";

type FormErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrors({});
    setSuccess("");
    setServerError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const newErrors: FormErrors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Please enter your password.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(
          data.message || "Login failed. Please try again."
        );
        return;
      }

      setSuccess("Login successful! Redirecting...");

      // موقتاً بعد از موفقیت به صفحه اصلی می‌رویم.
      // بعد از پیاده‌سازی نشست امن، مسیر نهایی را تنظیم می‌کنیم.
      window.location.href = "/";
    } catch {
      setServerError(
        "Could not connect to the server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0B1223] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080D1B] px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-3xl font-bold">
          Life <span className="text-violet-400">OS</span>
        </Link>

        <section className="rounded-2xl border border-white/10 bg-white/3 p-8 shadow-2xl shadow-violet-950/20">
          <h1 className="text-center text-3xl font-bold">
            Welcome back
          </h1>

          <p className="mt-3 text-center text-sm text-slate-400">
            Sign in to continue your journey.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-slate-300"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                aria-invalid={!!errors.email}
                className={inputClass}
              />

              {errors.email && (
                <p role="alert" className="mt-2 text-sm text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-slate-300"
              >
                Password
              </label>

              <div className="flex rounded-xl border border-white/10 bg-[#0B1223] focus-within:border-violet-500">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  aria-invalid={!!errors.password}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none placeholder:text-slate-600"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-4 text-sm text-violet-300 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p role="alert" className="mt-2 text-sm text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {serverError && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {serverError}
              </p>
            )}

            {success && (
              <p
                role="status"
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-violet-400 hover:text-violet-300"
            >
              Create one
            </Link>
          </p>

          <Link
            href="/"
            className="mt-5 block text-center text-sm text-slate-500 hover:text-white"
          >
            ← Back to Home
          </Link>
        </section>
      </div>
    </main>
  );
}
