import { useCallback, useEffect, useState } from "react";

// Bookmarks for Form Builder entries, kept per browser like the saved jobs on
// the Jobs pages. Stored separately so ids never collide with opportunities.
const KEY = "cms_saved_entries_v1";
const EVENT = "cms-saved-entries-change";

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const useSavedEntries = () => {
  const [saved, setSaved] = useState(read);

  useEffect(() => {
    const sync = () => setSaved(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id) => {
    const current = read();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode) — keep it in memory for this page
    }
    setSaved(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { isSaved: (id) => saved.includes(id), toggle };
};

// Same behaviour as the Jobs cards' share button.
export const shareLink = async (title, url) => {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      window.alert("Link copied to clipboard");
      return;
    }
    window.prompt("Copy this link:", url);
  } catch {
    // dismissed share sheet — nothing to do
  }
};
