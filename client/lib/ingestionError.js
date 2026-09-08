// Ingestion failures surface as raw error strings from storage/parsing code
// (see backend/src/jobs/ingestionWorker.js) — this maps the common ones to
// plain language so a FAILED document tells a user what to do next instead
// of showing them a stack-trace fragment.
export function friendlyIngestionError(rawMessage) {
  const message = (rawMessage || "").toLowerCase();

  if (message.includes("download") || message.includes("storage")) {
    return "We couldn't retrieve the uploaded file — try uploading it again.";
  }
  if (message.includes("password") || message.includes("encrypted")) {
    return "This file looks password-protected — remove the password and re-upload.";
  }
  if (message.includes("corrupt") || message.includes("invalid pdf") || message.includes("parse")) {
    return "We couldn't read this file — it may be corrupted or in an unsupported format. Try re-exporting it and uploading again.";
  }
  if (message.includes("empty") || message.includes("no text")) {
    return "This file doesn't seem to contain any readable text — if it's a scanned document, try a clearer scan.";
  }
  if (message.includes("embed") || message.includes("timeout") || message.includes("timed out")) {
    return "Something went wrong while processing this document. This is usually temporary — try again.";
  }

  return "Something went wrong while processing this document. Try again, or upload a different copy.";
}
