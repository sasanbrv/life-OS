
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  accent?: string;
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "text-violet-400",
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 transition hover:border-violet-500/30">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={20} className={accent} />
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </article>
  );
}

