// Shared shape for "download a file" API calls. The backend mirrors every
// dashboard export into the caller's own Google Sheet and reports the outcome in
// response headers (exposed via CORS in backend/server.js).
export const toExportResult = (response) => ({
  blob: response.data,
  sheetStatus: response.headers?.["x-google-sheet-status"] || "",
  sheetUrl: response.headers?.["x-google-sheet-url"] || "",
  sheetError: response.headers?.["x-google-sheet-error"] || "",
  count: Number(response.headers?.["x-stakeholder-count"] || 0),
});

// Same call with `?target=sheet` — the backend skips the file and returns the
// sync result as JSON: { status, url?, error?, count? }.
export const toSheetSyncResult = (data = {}) => ({
  sheetStatus: data.status || "",
  sheetUrl: data.url || "",
  sheetError: data.error || "",
  count: Number(data.count || 0),
});
