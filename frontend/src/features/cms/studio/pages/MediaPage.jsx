import React, { useState } from "react";
import { Copy, Download, Trash2 } from "lucide-react";
import { resolveAssetUrl } from "../../../../services/apiClient";
import { cmsAdmin, cmsError } from "../../../../services/cmsAdminAPI";
import { useStudio } from "../StudioContext";
import MediaLibrary, { formatBytes } from "../media/MediaLibrary";
import { Button, Drawer, FormRow, PageHeader, TextInput, formatDateTime, useFeedback } from "../ui";

const MediaPage = () => {
  const { can } = useStudio();
  const { toast, confirm } = useFeedback();
  const [open, setOpen] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const save = async () => {
    try {
      await cmsAdmin.updateMedia(open.id, { alt: open.alt, title: open.title });
      toast("Saved.");
      setReloadKey((n) => n + 1);
    } catch (error) {
      toast(cmsError(error).message, "error");
    }
  };

  const remove = async (force = false) => {
    try {
      await cmsAdmin.deleteMedia(open.id, force);
      toast("File deleted.");
      setOpen(null);
      setReloadKey((n) => n + 1);
    } catch (error) {
      const parsed = cmsError(error);
      if (parsed.status === 409 && !force) {
        const ok = await confirm({ title: "This file is in use", message: `${parsed.message} Entries will show an empty spot where it was.`, confirmLabel: "Delete anyway", tone: "danger" });
        if (ok) remove(true);
      } else toast(parsed.message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Media" description="Images, videos and documents used in content. Files are checked on upload; scripts and SVGs are rejected." />
      <MediaLibrary onOpen={(item) => setOpen({ ...item })} reloadKey={reloadKey} />

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.originalName}
        description={open ? `${open.mime} · ${formatBytes(open.size)} · uploaded ${formatDateTime(open.createdAt)}` : ""}
        footer={
          open && (
            <>
              {can("media.manage") && <Button variant="danger-ghost" icon={Trash2} className="mr-auto" onClick={() => remove(false)}>Delete</Button>}
              <Button variant="primary" onClick={save}>Save</Button>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-4">
            {open.kind === "image" ? (
              <img src={resolveAssetUrl(open.url)} alt={open.alt || ""} className="max-h-72 w-full rounded-sm bg-slate-100 object-contain" />
            ) : open.kind === "video" ? (
              <video src={resolveAssetUrl(open.url)} controls className="w-full rounded-sm bg-black" />
            ) : null}
            <FormRow label="Alt text" hint="Describes the image for screen readers and search engines.">
              <TextInput value={open.alt || ""} onChange={(event) => setOpen({ ...open, alt: event.target.value })} />
            </FormRow>
            <FormRow label="Title">
              <TextInput value={open.title || ""} onChange={(event) => setOpen({ ...open, title: event.target.value })} />
            </FormRow>
            <FormRow label="URL">
              <div className="flex gap-2">
                <TextInput readOnly value={resolveAssetUrl(open.url)} onFocus={(event) => event.target.select()} />
                <Button icon={Copy} onClick={() => navigator.clipboard?.writeText(resolveAssetUrl(open.url)).then(() => toast("Copied."))}>Copy</Button>
              </div>
            </FormRow>
            <a href={resolveAssetUrl(open.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F2853] hover:underline">
              <Download size={15} /> Open original
            </a>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default MediaPage;
