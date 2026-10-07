import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet, X } from "lucide-react";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { Button, IconButton, Select, Spinner, cx } from "../ui";

// Preview of the saved DRAFT card/page, rendered by Edeco's own renderers in
// an iframe of the real portal page (/cms-preview). Nothing is published; the
// iframe URL carries a short-lived signed token, so only people who can open
// the Form Builder can create one.

const DEVICES = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: 1280 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 820 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 390 },
];

const PreviewModal = ({ open, onClose, contentTypeId, target, initialContentId = null, beforePreview }) => {
  const [device, setDevice] = useState(target === "card" ? "desktop" : "desktop");
  const [contentId, setContentId] = useState(initialContentId || "");
  const [entries, setEntries] = useState([]);
  const [link, setLink] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const stage = useRef(null);
  const width = DEVICES.find((item) => item.id === device).width;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Make sure the preview reflects the latest edits.
      if (beforePreview) await beforePreview();
      const result = await cmsAdmin.previewLink(contentTypeId, { target, contentId: contentId || null });
      setLink(result);
    } catch (previewError) {
      setError(cmsError(previewError, "Couldn't create the preview.").message);
    } finally {
      setLoading(false);
    }
  }, [beforePreview, contentTypeId, target, contentId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    cmsAdmin
      .listContents({ contentType: contentTypeId, limit: 50, status: "all" })
      .then((result) => setEntries(result.items || []))
      .catch(() => setEntries([]));
  }, [open, contentTypeId]);

  // Scale wide devices down to fit the stage.
  useLayoutEffect(() => {
    if (!open || !stage.current) return undefined;
    const measure = () => setScale(Math.min(1, (stage.current.clientWidth - 32) / width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, [open, width]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const src = link?.path ? `${window.location.origin}${link.path}` : null;

  return (
    <div className="fixed inset-0 z-[220] flex flex-col bg-slate-900/95" role="dialog" aria-modal="true" aria-label={`${target === "card" ? "Card" : "Detail page"} preview`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-slate-900 px-4 py-2.5 text-white">
        <div className="mr-auto min-w-0">
          <p className="text-sm font-semibold">{target === "card" ? "Card preview" : "Detail page preview"}</p>
          <p className="text-xs text-slate-400">Draft configuration · not published{link?.expiresAt ? ` · link expires ${new Date(link.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}</p>
        </div>
        <Select aria-label="Preview data" value={contentId} onChange={(event) => setContentId(event.target.value)} className="!w-56 !border-white/20 !bg-slate-800 !py-1.5 !text-white">
          <option value="">Sample data</option>
          {entries.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title} ({entry.status})
            </option>
          ))}
        </Select>
        <div className="flex rounded-sm bg-slate-800 p-0.5" role="group" aria-label="Device">
          {DEVICES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDevice(item.id)}
              aria-pressed={device === item.id}
              title={`${item.label} (${item.width}px)`}
              className={cx("flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium", device === item.id ? "bg-white text-slate-900" : "text-slate-300 hover:text-white")}
            >
              <item.icon size={14} /> <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" icon={RefreshCw} className="!text-slate-200 hover:!bg-white/10" loading={loading} onClick={load}>
          Refresh
        </Button>
        {src && (
          <a href={src} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" icon={ExternalLink} className="!text-slate-200 hover:!bg-white/10">New tab</Button>
          </a>
        )}
        <IconButton icon={X} label="Close preview" onClick={onClose} className="!text-slate-300 hover:!bg-white/10 hover:!text-white" />
      </div>

      <div ref={stage} className="flex flex-1 justify-center overflow-auto p-4">
        {error ? (
          <div className="self-center rounded-sm bg-white px-6 py-5 text-sm text-red-700">{error}</div>
        ) : !src ? (
          <div className="self-center"><Spinner className="text-white" size={28} /></div>
        ) : (
          <div style={{ width: width * scale, height: "100%" }} className="shrink-0">
            <iframe
              key={src}
              title="Edeco preview"
              src={src}
              style={{ width, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: "top left" }}
              className="rounded-sm bg-white "
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
