
type HabitScheduleProps = {
  recurrence: {
    days: number[];
  };
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function HabitSchedule({
  recurrence,
}: HabitScheduleProps) {
  const selectedDays = Array.isArray(recurrence?.days)
    ? recurrence.days
    : [];

  return (
    <div className="flex flex-wrap gap-2">
      {DAY_NAMES.map((day, index) => {
        const isSelected = selectedDays.includes(index);

        return (
          <span
            key={day}
            className={`rounded-xl border px-3 py-2 text-sm backdrop-blur-md transition-colors ${
              isSelected
                ? "border-violet-400/30 bg-violet-400/15 text-violet-200 shadow-sm shadow-violet-500/5"
                : "border-white/10 bg-white/[0.03] text-slate-500"
            }`}
          >
            {day}
          </span>
        );
      })}
    </div>
  );
}
