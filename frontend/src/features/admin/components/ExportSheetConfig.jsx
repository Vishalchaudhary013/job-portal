import React, { useEffect, useState } from "react";
import { FiExternalLink, FiCheckCircle } from "react-icons/fi";
import * as authAPI from "../../../services/authAPI";

// Lets an admin / super-admin link the Google Sheet their dashboard exports are
// mirrored into. Self-contained: talks to /api/auth/export-sheet directly.
const ExportSheetConfig = () => {
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState({ spreadsheetId: "", spreadsheetUrl: "", serviceAccountEmail: "" });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    authAPI
      .getExportSheet()
      .then((data) => {
        if (alive) setCurrent(data);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await authAPI.setExportSheet(input.trim());
      setCurrent((prev) => ({ ...prev, ...data }));
      setInput("");
      setMessage(data.spreadsheetId ? "Google Sheet linked." : "Google Sheet unlinked.");
      setOpen(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not link that sheet. Paste the full Google Sheets URL.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFF] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-700">Google Sheet:</span>
        {current.spreadsheetId ? (
          <a
            href={current.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline"
          >
            <FiCheckCircle size={13} /> Linked <FiExternalLink size={12} />
          </a>
        ) : (
          <span className="text-amber-700">Not linked — exports won't reach a sheet</span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto px-2 py-1 rounded bg-slate-900 text-white font-semibold"
        >
          {open ? "Close" : current.spreadsheetId ? "Change" : "Link a sheet"}
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          <p className="text-slate-500">
            Create a Google Sheet, click <b>Share</b> and add{" "}
            <span className="font-mono break-all">{current.serviceAccountEmail || "the service account"}</span>{" "}
            as <b>Editor</b>, then paste the sheet link here.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="min-w-[240px] flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-800"
            />
            <button
              type="button"
              onClick={save}
              disabled={busy || !input.trim()}
              className="px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold disabled:opacity-60"
            >
              {busy ? "Checking…" : "Save"}
            </button>
            {current.spreadsheetId && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  authAPI.setExportSheet("").then((data) => {
                    setCurrent((prev) => ({ ...prev, ...data }));
                    setMessage("Google Sheet unlinked.");
                    setOpen(false);
                  });
                }}
                disabled={busy}
                className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 font-semibold"
              >
                Unlink
              </button>
            )}
          </div>
          {error && <p className="text-red-600">{error}</p>}
        </div>
      )}

      {message && !open && <p className="mt-1 text-emerald-700">{message}</p>}
    </div>
  );
};

export default ExportSheetConfig;
