import { useEffect, useMemo, useRef, useState } from "react";
import { searchOpportunities } from "../../../services/internshipAPI";

// One cell of the hero search bar: a free-text box that opens a suggestion
// list once the student starts typing. Both the "What" and "Location" cells
// use it — `field` picks which value is suggested, which also decides the
// query parameter, since /api/internships matches titles through `keyword`
// and places through `location`.
//
// Suggestions come from the same search the listing page runs, narrowed to
// the category currently picked in "Type", so what's offered here always
// matches what pressing "Find Job" will actually show.

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;
const MAX_SUGGESTIONS = 8;

// Postings repeat heavily — six companies hiring a "Frontend Developer", or
// forty roles in Bengaluru — so collapse to one row per distinct value and
// keep a count instead of listing the same string eight times.
const dedupe = (opportunities, field) => {
  const byValue = new Map();
  opportunities.forEach((o) => {
    const label = String(o?.[field] || "").trim();
    if (!label) return;
    const key = label.toLowerCase();
    const existing = byValue.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }
    byValue.set(key, { label, company: String(o?.company || "").trim(), count: 1 });
  });
  return [...byValue.values()].slice(0, MAX_SUGGESTIONS);
};

const OpportunitySuggestField = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  opportunityType,
  field,
  className = "",
  trailingIcon = null,
  // Placeholder-only cells (the full-bleed hero) keep the label for screen
  // readers but drop it visually.
  hideLabel = false,
}) => {
  // Results are stored with the query they answer rather than being cleared
  // on every keystroke: comparing that key to what's typed now is what marks
  // the list stale, so no effect has to reset state synchronously and a slow
  // earlier response can never be mistaken for the current one.
  const [result, setResult] = useState({ key: "", items: [] });
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const cellRef = useRef(null);

  const term = value.trim();
  const shouldSuggest = term.length >= MIN_CHARS;
  const queryKey = `${opportunityType}|${field}|${term}`;

  // Debounced so a burst of keystrokes costs one request, and aborted on the
  // next keystroke so an in-flight request isn't left running.
  useEffect(() => {
    if (!shouldSuggest) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = { type: opportunityType, limit: 60 };
      if (field === "location") params.location = term;
      else params.keyword = term;

      searchOpportunities(params, { signal: controller.signal })
        .then((response) => setResult({ key: queryKey, items: dedupe(response?.data || [], field) }))
        .catch((error) => {
          if (controller.signal.aborted || error?.name === "CanceledError") return;
          setResult({ key: queryKey, items: [] });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, shouldSuggest, opportunityType, field, queryKey]);

  const isFresh = result.key === queryKey;
  const loading = !isFresh;
  const suggestions = useMemo(() => (isFresh ? result.items : []), [isFresh, result.items]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cellRef.current && !cellRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const listOpen = open && shouldSuggest;
  const activeId = highlight >= 0 && suggestions[highlight] ? `${id}-option-${highlight}` : undefined;

  const select = (suggestion) => {
    onChange(suggestion.label);
    setOpen(false);
    setHighlight(-1);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      // Only swallow Enter when a row is actually highlighted; otherwise the
      // form's own submit (straight to the listing page) has to keep working.
      if (listOpen && highlight >= 0 && suggestions[highlight]) {
        event.preventDefault();
        select(suggestions[highlight]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  };

  return (
    <label
      ref={cellRef}
      className={`relative flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3 text-left ${className}`}
    >
      <span className={hideLabel ? "sr-only" : "text-[14.5px] font-semibold text-slate-700"}>
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        <input
          type="text"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold leading-[1.4] text-primary outline-none placeholder:text-[13px] placeholder:font-normal placeholder:text-slate-400"
        />
        {trailingIcon}
      </span>

      {listOpen && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[280px] overflow-y-auto rounded-sm border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.length ? (
            suggestions.map((suggestion, index) => {
              // For a title, naming the one company hiring it is the useful
              // hint; for a place, the company is meaningless — the number of
              // openings there is what the student is weighing.
              const subtitle =
                suggestion.count > 1
                  ? `${suggestion.count} openings`
                  : field === "title"
                    ? suggestion.company
                    : "";
              return (
                <button
                  key={suggestion.label}
                  id={`${id}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  // The input keeps focus, so the click isn't lost to a blur
                  // that closes the list before onClick ever fires.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => select(suggestion)}
                  className={`block w-full px-4 py-2 text-left ${index === highlight ? "bg-slate-50" : ""}`}
                >
                  <span className="block truncate text-[13.5px] font-semibold text-primary">
                    {suggestion.label}
                  </span>
                  {subtitle && (
                    <span className="block truncate text-[12px] font-normal text-slate-400">
                      {subtitle}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-2.5 text-[13px] text-slate-400">
              {loading ? "Searching..." : `No matches for “${term}”`}
            </div>
          )}
        </div>
      )}
    </label>
  );
};

export default OpportunitySuggestField;
