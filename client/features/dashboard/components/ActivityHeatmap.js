const WEEKS = 14;
const DAYS = 7;

function levelFor(count) {
  if (!count) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
if (count <= 6) return 3;
  return 4;
}

const LEVEL_CLASSES = [
  "bg-mist-gray",
  "bg-mint-chip/30",
  "bg-mint-chip/60",
  "bg-mint-chip",
  "bg-carbon-black",
];

function buildCells(data) {
  const countByDate = new Map((data || []).map((d) => [d.date, d.count]));
  const totalDays = WEEKS * DAYS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    cells.push({ key, count: countByDate.get(key) || 0 });
  }
  return cells;
}

export default function ActivityHeatmap({ data = [] }) {
  const cells = buildCells(data);

  return (
    <div className="rounded-card bg-paper-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-sans text-body font-medium uppercase text-carbon-black">
          Activity
        </h3>
        <span className="font-mono text-caption uppercase text-smoke">
          last {WEEKS} weeks
        </span>
      </div>

      <div
        className="grid w-fit grid-flow-col gap-1"
        style={{ gridTemplateRows: `repeat(${DAYS}, minmax(0, 1fr))` }}
      >
        {cells.map((cell) => (
          <div
            key={cell.key}
            title={`${cell.key} · ${cell.count} sessions`}
            className={`h-3 w-3 rounded-sm ${LEVEL_CLASSES[levelFor(cell.count)]}`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 font-mono text-caption text-smoke">
        <span>less</span>
        {LEVEL_CLASSES.map((cls) => (
          <span key={cls} className={`h-3 w-3 rounded-sm ${cls}`} />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}
