
"use client";

import Link from "next/link";
import { useState } from "react";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // Save the form before awaiting the server response.
    const form = event.currentTarget;

    setErrors({});
    setSuccess("");
    setServerError("");

    const formData = new FormData(form);

    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string)
      .trim()
      .toLowerCase();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const newErrors: FormErrors = {};

    if (name.length < 2) {
      newErrors.name = "Name must contain at least 2 characters.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Add at least one uppercase letter (A-Z).";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Add at least one lowercase letter (a-z).";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Add at least one number (0-9).";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password =
        "Add at least one special character, e.g. @ or !.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || "Registration failed.");
        return;
      }

      setSuccess("Account created successfully!");
      form.reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error("Registration request failed:", error);
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
            Create your account
          </h1>

          <p className="mt-3 text-center text-sm text-slate-400">
            Start building a more organized life.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm text-slate-300"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                required
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={inputClass}
              />
              {errors.name && (
                <p id="name-error" role="alert" className="mt-2 text-sm text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

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
                aria-describedby={errors.email ? "email-error" : undefined}
                className={inputClass}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-2 text-sm text-red-400">
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
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="px-4 text-sm text-violet-300 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p id="password-error" role="alert" className="mt-2 text-sm text-red-400">
                  {errors.password}
                </p>
              )}

              <p className="mt-2 text-xs leading-5 text-slate-500">
                At least 8 characters, with uppercase, lowercase, a number,
                and a special character.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm text-slate-300"
              >
                Confirm password
              </label>

              <div className="flex rounded-xl border border-white/10 bg-[#0B1223] focus-within:border-violet-500">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  required
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirm-password-error" : undefined
                  }
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="px-4 text-sm text-violet-300 hover:text-white"
                  aria-label={
                    showConfirmPassword ? "Hide confirmation" : "Show confirmation"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <p
                  id="confirm-password-error"
                  role="alert"
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {success && (
              <p
                role="status"
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
              >
                {success}
              </p>
            )}

            {serverError && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-400 hover:text-violet-300"
            >
              Sign in
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
