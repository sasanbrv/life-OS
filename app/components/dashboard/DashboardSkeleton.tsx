
export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 w-1/2 rounded-2xl bg-white/5" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-2xl border border-white/5 bg-slate-900/70"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-80 rounded-2xl border border-white/5 bg-slate-900/70"
          />
        ))}
      </div>
    </div>
  );
}
