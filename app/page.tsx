
import Link from "next/link";
import HomeHero from "../public/image/4888da69-fab7-4759-abba-5cf9d895fefe.png"
import Image from "next/image";

const features = [
  {
    title: "Task Management",
    description: "Keep your daily tasks organized.",
  },
  {
    title: "Goal Tracking",
    description: "Turn your dreams into clear plans.",
  },
  {
    title: "Habit Building",
    description: "Build routines that last.",
  },
  {
    title: "Personal Planning",
    description: "Make time for what matters.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080D1B] text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-2xl font-bold">
          Life <span className="text-violet-400">OS</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/5"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-violet-600 px-4 py-2 font-medium hover:bg-violet-500"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16 lg:gap-20">

          {/* Text content */}
          <div className="w-full max-w-xl flex-1">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
              Your personal life management system
            </p>

            <h1 className="text-5xl font-bold leading-tight sm:text-7xl">
              Your Life,
              <br />
              <span className="text-violet-400">Organized.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
              Manage your tasks, goals, habits, and everything
              that matters — all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-violet-600 px-6 py-3 font-semibold transition hover:bg-violet-500"
              >
                Get Started
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-white/15 px-6 py-3 font-semibold transition hover:bg-white/5"
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative w-full flex-1">
            <div className="pointer-events-none absolute inset-10 rounded-full bg-violet-600/20 blur-3xl" />

            <Image
              src={HomeHero}
              alt="Life OS productivity dashboard"
              width={700}
              height={700}
              priority
              className="relative z-10 h-auto w-full object-contain"
            />
          </div>

        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-violet-400/50"
            >
              <h2 className="text-lg font-semibold">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
        
    </main>
  );
}
