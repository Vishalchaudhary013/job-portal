import React, { useCallback, useRef, useState } from "react";
import { Check, FileText, Film, Image as ImageIcon, Upload } from "lucide-react";
import { resolveAssetUrl } from "../../../../services/apiClient";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { useDebouncedValue, useLoader } from "../hooks";
import { Button, EmptyState, ErrorState, Pagination, SearchInput, Select, Skeleton, cx, useFeedback } from "../ui";

export const toMediaRef = (media) => ({ id: media.id, url: media.url, alt: media.alt || "", name: media.originalName, mime: media.mime, size: media.size });

export const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// Grid of library media with upload. In "pick" mode clicking selects items;
// otherwise `onOpen` is called to edit/delete an item.
const MediaLibrary = ({ mode = "manage", kind: fixedKind, selected = [], onToggle, onOpen, reloadKey = 0 }) => {
  const { toast } = useFeedback();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState(fixedKind || "");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const input = useRef(null);
  const q = useDebouncedValue(search);
  const { data, loading, error, reload } = useLoader(() => cmsAdmin.listMedia({ q, kind: kind || undefined, page, limit: 30 }), [q, kind, page, reloadKey]);

  const upload = useCallback(
    async (files) => {
      if (!files?.length) return;
      setUploading(1);
      try {
        const result = await cmsAdmin.uploadMedia(files, (pct) => setUploading(Math.max(1, pct)));
        if (result.rejected?.length) toast(`${result.rejected.length} file(s) rejected: ${result.rejected[0].reason}`, "error");
        if (result.items?.length) {
          toast(`${result.items.length} file(s) uploaded.`);
          if (mode === "pick") result.items.forEach((item) => onToggle?.(item));
        }
        setPage(1);
        reload();
      } catch (uploadError) {
        toast(cmsError(uploadError, "Upload failed.").message, "error");
      } finally {
        setUploading(0);
        if (input.current) input.current.value = "";
      }
    },
    [mode, onToggle, reload, toast],
  );

  const accept = fixedKind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : undefined;

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        upload(event.dataTransfer.files);
      }}
      className={cx("relative", dragging && "outline-2 outline-dashed outline-offset-4 outline-[#1F2853] rounded-sm")}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search files" className="flex-1" />
        {!fixedKind && (
          <Select className="sm:!w-36" value={kind} onChange={(event) => { setKind(event.target.value); setPage(1); }} aria-label="Type">
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="file">Documents</option>
          </Select>
        )}
        <input ref={input} type="file" multiple className="hidden" accept={accept} onChange={(event) => upload(event.target.files)} />
        <Button variant="primary" icon={Upload} loading={Boolean(uploading)} onClick={() => input.current?.click()}>
          {uploading ? `Uploading ${uploading}%` : "Upload"}
        </Button>
      </div>

      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">{Array.from({ length: 10 }, (_, n) => <Skeleton key={n} className="aspect-square" />)}</div>
      ) : !data?.items?.length ? (
        <EmptyState icon={ImageIcon} title={q ? "No files match" : "No files yet"} description="Upload images, videos or documents — or drop them here. JPG, PNG, WEBP, GIF, MP4, WEBM, PDF, Office files." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {data.items.map((item) => {
            const isSelected = selected.some((ref) => ref.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (mode === "pick" ? onToggle?.(item) : onOpen?.(item))}
                aria-pressed={mode === "pick" ? isSelected : undefined}
                className={cx("group relative overflow-hidden rounded-sm border bg-white text-left transition", isSelected ? "border-[#1F2853]" : "border-slate-200 hover:border-slate-300")}
              >
                <div className="flex aspect-square items-center justify-center bg-slate-100">
                  {item.kind === "image" ? (
                    <img src={resolveAssetUrl(item.url)} alt={item.alt || ""} className="h-full w-full object-cover" loading="lazy" />
                  ) : item.kind === "video" ? (
                    <Film className="text-slate-400" />
                  ) : (
                    <FileText className="text-slate-400" />
                  )}
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-slate-700">{item.originalName}</p>
                  <p className="text-[11px] text-slate-400">{formatBytes(item.size)}</p>
                </div>
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm bg-[#1F2853] text-white">
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
};

export default MediaLibrary;
