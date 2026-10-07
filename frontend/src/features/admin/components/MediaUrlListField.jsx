import { useRef, useState } from "react";
import { uploadOfficeMedia } from "../../../services/internshipAPI";
import { getErrorMessage, resolveAssetUrl } from "../../../services/apiClient";

// URL-list field with a local-file uploader, used for the Office Photos /
// Office Videos fields on an opportunity.
//
// Both admin forms (OpportunityForm and JobForm) keep these fields as a single
// newline-separated string, which is what the backend's parseTextList already
// consumes. Uploading therefore just appends the returned paths as more lines —
// a pasted link and an uploaded file are the same thing downstream, so nothing
// else in the save path had to change.

const toLines = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

const MediaUrlListField = ({
  value,
  onChange,
  accept = "image/*",
  placeholder,
  textareaClassName = "",
  kind = "file",
}) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const lines = toLines(value);
  const text = Array.isArray(value) ? lines.join("\n") : value || "";

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    // Reset immediately so re-picking the same file still fires onChange.
    event.target.value = "";
    if (!files.length) return;

    setBusy(true);
    setError("");
    try {
      const { urls = [] } = await uploadOfficeMedia(files);
      if (urls.length) onChange([...lines, ...urls].join("\n"));
      if (urls.length < files.length) {
        setError(`${files.length - urls.length} file(s) were not accepted.`);
      }
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Upload failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index) => {
    onChange(lines.filter((_, i) => i !== index).join("\n"));
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={textareaClassName}
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-[#1F2853] px-3 py-1.5 text-xs font-semibold text-[#1F2853] transition-colors hover:bg-[#1F2853]/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Uploading…" : `Upload ${kind} from system`}
        </button>
        <span className="text-xs font-normal text-slate-500">
          or paste links above — {lines.length} added
        </span>
      </div>

      {error && <span className="text-xs font-normal text-red-600">{error}</span>}

      {lines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lines.map((line, index) => {
            const src = resolveAssetUrl(line);
            const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(line);
            return (
              <div
                key={`${line}-${index}`}
                className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#EEF2FF] bg-slate-50"
              >
                {isVideo ? (
                  <video src={src} muted preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={src}
                    alt={`Item ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove item ${index + 1}`}
                  title={line}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] leading-none text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MediaUrlListField;
