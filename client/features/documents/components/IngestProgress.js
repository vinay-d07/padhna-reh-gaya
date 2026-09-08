const STEPS = ["Uploading", "Parsing", "Embedding", "Ready"];

// Maps the coarse 0-100 `ingestProgress` the worker reports
// (see backend/src/jobs/ingestionWorker.js) to a step index + the percent
// filled within the overall bar, so a processing document reads as visible
// progress instead of an indefinite spinner.
function stepFor(progress) {
  if (progress >= 100) return 3;
  if (progress >= 30) return 2;
  if (progress >= 10) return 1;
  return 0;
}

export default function IngestProgress({ status, progress = 0, uploadPercent }) {
  const isUploading = status === "UPLOADING";
  const overallPercent = isUploading ? Math.min(uploadPercent ?? 0, 100) * 0.1 : 10 + progress * 0.9;
  const activeStep = isUploading ? 0 : stepFor(progress);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ash/50">
        <div
          className="h-full rounded-full bg-carbon-black transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(overallPercent, 4)}%` }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-caption uppercase text-smoke">
        <span>
          {isUploading
            ? `Uploading${uploadPercent != null ? ` ${uploadPercent}%` : "…"}`
            : `${STEPS[activeStep]}…`}
        </span>
        <span>Step {activeStep + 1}/4</span>
      </div>
    </div>
  );
}
