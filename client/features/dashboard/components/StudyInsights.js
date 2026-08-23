export default function StudyInsights({ insights, workspaces = [] }) {
  const currentStreak = insights?.currentStreak ?? 0;
  const longestStreak = insights?.longestStreak ?? 0;
  const dueFlashcards = insights?.dueFlashcards ?? 0;
  const totalDocuments = workspaces.reduce((sum, w) => sum + (w._count?.documents ?? 0), 0);

  const tiles = [
    { label: "Current streak", value: `${currentStreak}`, unit: "days", tone: "dark" },
    { label: "Due for review", value: `${dueFlashcards}`, unit: "cards", tone: dueFlashcards > 0 ? "accent" : "light" },
    { label: "Longest streak", value: `${longestStreak}`, unit: "days", tone: "light" },
    { label: "Workspaces", value: `${workspaces.length}`, tone: "light" },
    { label: "Documents", value: `${totalDocuments}`, tone: "light" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`rounded-card p-6 ${
            tile.tone === "dark"
              ? "bg-carbon-black text-paper-white"
              : tile.tone === "accent"
                ? "bg-mint-chip/40 text-carbon-black"
                : "bg-paper-white text-carbon-black"
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
