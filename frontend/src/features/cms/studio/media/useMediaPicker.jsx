import React, { useCallback, useMemo, useRef, useState } from "react";
import { cmsAdmin } from "../../../../services/cmsAdminAPI";
import { Button, Modal } from "../ui";
import MediaLibrary, { toMediaRef } from "./MediaLibrary";

// Media handler for the admin content editor: uploads go into the media
// library; "Choose from library" opens a picker and resolves with refs.
const useMediaPicker = () => {
  const [request, setRequest] = useState(null); // { field, resolve }
  const [selected, setSelected] = useState([]);
  const resolver = useRef(null);

  const pick = useCallback(
    (field) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setSelected([]);
        setRequest({ field });
      }),
    [],
  );

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setRequest(null);
  };

  const multiple = Boolean(request?.field?.settings?.multiple);
  const kind = request?.field?.type === "image" ? "image" : undefined;

  const handler = useMemo(
    () => ({
      upload: async (file, field, onProgress) => {
        const result = await cmsAdmin.uploadMedia([file], onProgress);
        if (!result.items?.length) throw new Error(result.rejected?.[0]?.reason || "Upload failed.");
        return toMediaRef(result.items[0]);
      },
      pick,
    }),
    [pick],
  );

  const picker = (
    <Modal
      open={Boolean(request)}
      onClose={() => close(null)}
      title={multiple ? "Choose files" : "Choose a file"}
      size="xl"
      footer={
        <>
          <span className="mr-auto text-sm text-slate-500">{selected.length ? `${selected.length} selected` : ""}</span>
          <Button onClick={() => close(null)}>Cancel</Button>
          <Button variant="primary" disabled={!selected.length} onClick={() => close(multiple ? selected : selected[0])}>Use {multiple ? "selected" : "file"}</Button>
        </>
      }
    >
      {request && (
        <MediaLibrary
          mode="pick"
          kind={kind}
          selected={selected}
          onToggle={(item) => {
            const ref = toMediaRef(item);
            setSelected((current) => {
              if (current.some((existing) => existing.id === ref.id)) return current.filter((existing) => existing.id !== ref.id);
              return multiple ? [...current, ref] : [ref];
            });
          }}
        />
      )}
    </Modal>
  );

  return { handler, picker };
};

export default useMediaPicker;
