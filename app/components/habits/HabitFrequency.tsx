
type HabitFrequencyProps = {
  recurrence: unknown;
};

export default function HabitFrequency({
  recurrence,
}: HabitFrequencyProps) {
  const days =
    recurrence &&
    typeof recurrence === "object" &&
    "days" in recurrence &&
    Array.isArray(recurrence.days)
      ? recurrence.days.filter(
          (day): day is number =>
            Number.isInteger(day) && day >= 0 && day <= 6
        )
      : [];

  const uniqueDays = new Set(days);
  const count = uniqueDays.size;

  let label = `${count} days per week`;

  if (count === 7) {
    label = "Every day";
  } else if (count === 1) {
    label = "Once a week";
  } else if (count === 0) {
    label = "No schedule";
  }

  return (
    <div>
      <p className="text-sm text-gray-500">Frequency</p>
      <p className="font-medium">{label}</p>
    </div>
  );
}
