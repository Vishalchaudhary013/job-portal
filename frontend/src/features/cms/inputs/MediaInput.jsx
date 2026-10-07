import React, { createContext, useContext, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, Upload, X } from "lucide-react";
import { resolveAssetUrl } from "../../../services/apiClient";

// How media fields get files depends on who is filling the form:
//   - admins (content editor): upload to the media library, or pick from it;
//   - students (response forms): upload a private attachment to the form.
// The surrounding screen provides the handler through this context.
//   { upload(file, field, onProgress) -> mediaRef, pick?(field) -> Promise<mediaRef|mediaRef[]|null> }
export const MediaHandlerContext = createContext(null);
export const useMediaHandler = () => useContext(MediaHandlerContext);

const MediaThumb = ({ item, isImage, onRemove, disabled }) => (
  <div className="group relative flex items-center gap-2 overflow-hidden rounded-sm border border-slate-200 bg-white p-1.5 pr-8">
    {isImage ? (
      <img src={resolveAssetUrl(item.url)} alt={item.alt || ""} className="h-14 w-14 rounded-sm object-cover" />
    ) : (
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-slate-100 text-slate-500">
        <FileText size={18} />
      </span>
    )}
    <span className="max-w-[160px] truncate text-xs text-slate-600">{item.name || item.alt || item.url.split("/").pop()}</span>
    {!disabled && (
      <button type="button" onClick={onRemove} aria-label="Remove" className="absolute right-1.5 top-1.5 rounded-sm p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
        <X size={14} />
      </button>
    )}
  </div>
);

const MediaInput = ({ field, value, onChange, disabled }) => {
  const handler = useMediaHandler();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const multiple = Boolean(field.settings?.multiple);
  const isImage = field.type === "image";
  const items = (multiple ? (Array.isArray(value) ? value : []) : value ? [value] : []).filter((item) => item?.url);

  const commit = (next) => onChange(multiple ? next : next[0] || null);

  const onFiles = async (fileList) => {
    if (!handler?.upload || !fileList?.length) return;
    setError("");
    setBusy(true);
    try {
      const uploaded = [];
      for (const file of [...fileList].slice(0, multiple ? 10 : 1)) {
        const maxMb = Number(field.validation?.maxFileSizeMB);
        if (maxMb && file.size > maxMb * 1024 * 1024) throw new Error(`${file.name} is larger than ${maxMb} MB.`);
        uploaded.push(await handler.upload(file, field, setProgress));
      }
      commit(multiple ? [...items, ...uploaded] : uploaded);
    } catch (uploadError) {
      setError(uploadError?.response?.data?.message || uploadError.message || "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onPick = async () => {
    const picked = await handler.pick(field);
    if (!picked) return;
    const list = Array.isArray(picked) ? picked : [picked];
    commit(multiple ? [...items, ...list] : list);
  };

  const canAddMore = multiple || items.length === 0;

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <MediaThumb key={`${item.url}-${index}`} item={item} isImage={isImage} disabled={disabled} onRemove={() => commit(items.filter((_, i) => i !== index))} />
          ))}
        </div>
      )}
      {canAddMore && !disabled && (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onFiles(event.dataTransfer.files);
          }}
          className="flex flex-wrap items-center gap-2 rounded-sm border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3"
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={field.validation?.accept || (isImage ? "image/*" : undefined)}
            multiple={multiple}
            onChange={(event) => onFiles(event.target.files)}
          />
          <button
            type="button"
            disabled={busy || !handler?.upload}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {busy ? `Uploading${progress ? ` ${progress}%` : "…"}` : `Upload ${isImage ? "image" : "file"}`}
          </button>
          {handler?.pick && (
            <button
              type="button"
              disabled={busy}
              onClick={onPick}
              className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium text-[#1F2853] hover:bg-white"
            >
              {isImage ? <ImageIcon size={15} /> : <Paperclip size={15} />} Choose from library
            </button>
          )}
          <span className="text-xs text-slate-400">
            or drop here{field.validation?.maxFileSizeMB ? ` · max ${field.validation.maxFileSizeMB} MB` : ""}
          </span>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default MediaInput;
