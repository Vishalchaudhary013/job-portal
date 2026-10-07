import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchOpportunities } from "../../services/internshipAPI";
import { filterParamKeys } from "./filterConfig";

// The URL is the single source of truth for filter state: refresh, deep link
// and browser back/forward all work without extra bookkeeping. Selections are
// stored as comma-separated values (?workMode=remote,hybrid).

const KEYWORD_DEBOUNCE_MS = 400;

const splitValues = (value) =>
  String(value || "").split(",").map((entry) => entry.trim()).filter(Boolean);

export const useOpportunityQuery = ({ opportunityType, filters, defaultSort = "relevance" }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState({ data: [], pagination: null, facets: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Typing in the keyword box shouldn't fire a request per keystroke, so the
  // input is held locally and pushed into the URL once typing settles.
  const urlKeyword = searchParams.get("keyword") || "";
  const [keywordDraft, setKeywordDraft] = useState(urlKeyword);
  const keywordDraftRef = useRef(keywordDraft);
  keywordDraftRef.current = keywordDraft;

  useEffect(() => {
    setKeywordDraft(urlKeyword);
  }, [urlKeyword]);

  const ownedKeys = useMemo(() => filterParamKeys(filters), [filters]);

  const selections = useMemo(() => {
    const entries = filters.map((filter) => {
      if (filter.kind === "range") {
        return [
          filter.param,
          {
            min: searchParams.get(filter.minParam) || "",
            max: searchParams.get(filter.maxParam) || "",
          },
        ];
      }
      if (filter.kind === "text") {
        return [filter.param, searchParams.get(filter.param) || ""];
      }
      if (filter.kind === "single") {
        return [filter.param, splitValues(searchParams.get(filter.param)).slice(0, 1)];
      }
      return [filter.param, splitValues(searchParams.get(filter.param))];
    });
    return Object.fromEntries(entries);
  }, [filters, searchParams]);

  const sort = searchParams.get("sort") || defaultSort;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const activeCount = useMemo(
    () =>
      filters.reduce((total, filter) => {
        const value = selections[filter.param];
        if (filter.kind === "range") return total + (value.min || value.max ? 1 : 0);
        if (filter.kind === "text") return total + (value ? 1 : 0);
        return total + value.length;
      }, 0),
    [filters, selections],
  );

  // Every mutation funnels through here so page always resets on a filter
  // change but is preserved when only the page itself moves.
  const updateParams = useCallback(
    (changes, { resetPage = true } = {}) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(changes).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
              next.delete(key);
            } else {
              next.set(key, Array.isArray(value) ? value.join(",") : String(value));
            }
          });
          if (resetPage) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleValue = useCallback(
    (filter, value) => {
      if (filter.kind === "single") {
        const current = selections[filter.param]?.[0];
        updateParams({ [filter.param]: current === value ? null : value });
        return;
      }
      const current = selections[filter.param] || [];
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      updateParams({ [filter.param]: next });
    },
    [selections, updateParams],
  );

  const setRange = useCallback(
    (filter, { min, max }) => updateParams({ [filter.minParam]: min, [filter.maxParam]: max }),
    [updateParams],
  );

  const setText = useCallback(
    (filter, value) => updateParams({ [filter.param]: value }),
    [updateParams],
  );

  // Writes a whole selection map in one navigation. The mobile drawer needs
  // this: issuing one setSearchParams call per filter would have each call
  // computed from the same starting params, so only the last would survive.
  const applySelections = useCallback(
    (draft) => {
      const changes = {};
      filters.forEach((filter) => {
        const value = draft[filter.param];
        if (filter.kind === "range") {
          changes[filter.minParam] = value?.min || null;
          changes[filter.maxParam] = value?.max || null;
        } else if (filter.kind === "text") {
          changes[filter.param] = value || null;
        } else {
          changes[filter.param] = value?.length ? value : null;
        }
      });
      updateParams(changes);
    },
    [filters, updateParams],
  );

  const clearAll = useCallback(() => {
    setKeywordDraft("");
    updateParams(
      Object.fromEntries([...ownedKeys, "keyword"].map((key) => [key, null])),
    );
  }, [ownedKeys, updateParams]);

  const setSort = useCallback((value) => updateParams({ sort: value }), [updateParams]);
  const setPage = useCallback(
    (value) => updateParams({ page: value > 1 ? value : null }, { resetPage: false }),
    [updateParams],
  );

  // Debounced keyword -> URL. Skipped when the draft already matches the URL
  // (e.g. after a back-navigation) so history isn't polluted.
  useEffect(() => {
    if (keywordDraft === urlKeyword) return undefined;
    const timer = setTimeout(() => {
      if (keywordDraftRef.current !== urlKeyword) updateParams({ keyword: keywordDraftRef.current });
    }, KEYWORD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keywordDraft, urlKeyword, updateParams]);

  const queryString = searchParams.toString();

  useEffect(() => {
    const controller = new AbortController();
    const params = { type: opportunityType, limit: 12 };
    new URLSearchParams(queryString).forEach((value, key) => {
      if (value) params[key] = value;
    });

    setIsLoading(true);
    setError(null);

    searchOpportunities(params, { signal: controller.signal })
      .then((response) => {
        setResult({
          data: response?.data || [],
          pagination: response?.pagination || null,
          facets: response?.facets || {},
        });
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError?.code === "ERR_CANCELED") return;
        setError(requestError?.response?.data?.message || "Something went wrong loading results.");
        setResult({ data: [], pagination: null, facets: {} });
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [opportunityType, queryString]);

  return {
    items: result.data,
    pagination: result.pagination,
    facets: result.facets,
    isLoading,
    error,
    selections,
    activeCount,
    sort,
    page,
    keywordDraft,
    setKeywordDraft,
    toggleValue,
    setRange,
    setText,
    applySelections,
    clearAll,
    setSort,
    setPage,
  };
};
