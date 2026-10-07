import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cmsError } from "../../../services/cmsAdminAPI";

// Undo/redo for builder documents. `set` records a history step; rapid edits
// to the same thing (typing in one input) are coalesced into a single step
// when they share a `mergeKey` and happen within 800ms.
export const useHistoryState = (initial) => {
  const [state, setState] = useState({ past: [], present: initial, future: [] });
  const lastMerge = useRef({ key: null, at: 0 });

  const set = useCallback((updater, { mergeKey = null } = {}) => {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current.present) : updater;
      if (next === current.present) return current;
      const now = Date.now();
      const merge = mergeKey && lastMerge.current.key === mergeKey && now - lastMerge.current.at < 800;
      lastMerge.current = { key: mergeKey, at: now };
      return {
        past: merge ? current.past : [...current.past.slice(-99), current.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const reset = useCallback((value) => setState({ past: [], present: value, future: [] }), []);

  const undo = useCallback(
    () =>
      setState((current) =>
        current.past.length
          ? { past: current.past.slice(0, -1), present: current.past[current.past.length - 1], future: [current.present, ...current.future] }
          : current,
      ),
    [],
  );

  const redo = useCallback(
    () =>
      setState((current) =>
        current.future.length ? { past: [...current.past, current.present], present: current.future[0], future: current.future.slice(1) } : current,
      ),
    [],
  );

  return { value: state.present, set, reset, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
};

// Keyboard shortcuts: { "mod+z": fn, "mod+shift+z": fn, "mod+s": fn }.
export const useHotkeys = (map, enabled = true) => {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (event) => {
      const mod = event.metaKey || event.ctrlKey;
      const combo = [mod && "mod", event.shiftKey && "shift", event.key.toLowerCase()].filter(Boolean).join("+");
      const handler = ref.current[combo];
      if (!handler) return;
      // Leave native text undo alone inside inputs.
      const tag = event.target?.tagName;
      if (combo.endsWith("z") && (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable)) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
};

// Debounced autosave of a draft. `save(value)` must return a promise.
// Returns { state, dirty, saveNow, markSaved }.
export const useAutosave = ({ value, save, delay = 1500, enabled = true }) => {
  const [state, setState] = useState("idle"); // idle | saving | saved | error | conflict
  const [error, setError] = useState(null);
  // `savedValue` drives rendering (dirty); the refs give async saves the
  // latest values without reading refs during render.
  const [savedValue, setSavedValue] = useState(value);
  const savedRef = useRef(value);
  const inFlight = useRef(null);
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
  });
  const dirty = value !== savedValue;

  const run = useCallback(async () => {
    if (inFlight.current) await inFlight.current.catch(() => {});
    const snapshot = latest.current;
    if (snapshot === savedRef.current) return true;
    setState("saving");
    const promise = save(snapshot);
    inFlight.current = promise;
    try {
      await promise;
      savedRef.current = snapshot;
      setSavedValue(snapshot);
      setState("saved");
      setError(null);
      return true;
    } catch (saveError) {
      const parsed = cmsError(saveError, "Couldn't save.");
      setError(parsed);
      setState(parsed.status === 409 ? "conflict" : "error");
      return false;
    } finally {
      inFlight.current = null;
    }
  }, [save]);

  useEffect(() => {
    if (!enabled || !dirty || state === "conflict") return undefined;
    const timer = setTimeout(run, delay);
    return () => clearTimeout(timer);
  }, [value, enabled, dirty, delay, run, state]);

  const markSaved = useCallback((next) => {
    savedRef.current = next;
    latest.current = next;
    setSavedValue(next);
    setState("saved");
  }, []);

  return { state, error, dirty, saveNow: run, markSaved };
};

// Warn before closing the tab with unsaved work.
export const useBeforeUnload = (active) => {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
};

// Loads data with loading/error state and a reload function.
export const useLoader = (loader, deps = []) => {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const counter = useRef(0);
  const loaderRef = useRef(loader);
  useLayoutEffect(() => {
    loaderRef.current = loader;
  });
  const depsKey = JSON.stringify(deps);
  const load = useCallback(async () => {
    const id = ++counter.current;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      if (id === counter.current) setState({ loading: false, error: null, data });
    } catch (error) {
      if (id === counter.current) setState({ loading: false, error: cmsError(error), data: null });
    }
  }, []);
  useEffect(() => {
    load();
  }, [depsKey, load]);
  return { ...state, reload: load, setData: (data) => setState((current) => ({ ...current, data: typeof data === "function" ? data(current.data) : data })) };
};

export const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
