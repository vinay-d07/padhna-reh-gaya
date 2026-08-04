function formatDuration(minutes = 0) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export default function StudyInsights({ insights }) {
  const currentStreak = insights?.currentStreak ?? 0;
  const longestStreak = insights?.longestStreak ?? 0;
  const totalStudyMinutes = insights?.totalStudyMinutes ?? 0;

  const tiles = [
    { label: "Current streak", value: `${currentStreak}`, unit: "days", tone: "dark" },
    { label: "Longest streak", value: `${longestStreak}`, unit: "days", tone: "light" },
    { label: "Total study time", value: formatDuration(totalStudyMinutes), unit: "", tone: "light" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`rounded-card p-6 ${
            tile.tone === "dark" ? "bg-carbon-black text-paper-white" : "bg-paper-white text-carbon-black"
          }`}
        >
          <p
            className={`font-mono text-caption uppercase ${
              tile.tone === "dark" ? "text-mint-chip" : "text-smoke"
            }`}
          >
            {tile.label}
          </p>
          <p className="mt-2 font-display text-heading-lg">
            {tile.value}
            {tile.unit && (
              <span className="ml-2 font-sans text-body font-normal normal-case text-smoke">
                {tile.unit}
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
