import { useEffect, useMemo, useState } from "react";
import { getCustomCategories } from "../../services/customCategoryAPI";

// A filter in filterConfig.js can declare `categoryType` to source its options
// from the admin-managed custom-categories collection instead of a hardcoded
// list. A category an admin creates then shows up in the sidebar, the mobile
// drawer and the active-filter chips without a code change.
//
// The config's own `options` stay in place as the fallback until the request
// lands (and if it fails), so the section is never empty. Values that exist in
// the data but not in the list are still appended by mergeFacetOptions.

export const useDynamicFilterOptions = (filters) => {
  // Joined into a string so the effect below keys off the types themselves
  // rather than a fresh array identity on every render.
  const typesKey = useMemo(
    () => [...new Set(filters.map((filter) => filter.categoryType).filter(Boolean))].join("|"),
    [filters],
  );

  const [optionsByType, setOptionsByType] = useState({});

  useEffect(() => {
    if (!typesKey) return undefined;
    let cancelled = false;

    Promise.all(
      typesKey.split("|").map((type) =>
        getCustomCategories(type)
          .then((response) => [
            type,
            (response.data?.categories || []).map((category) => category.title).filter(Boolean),
          ])
          .catch(() => [type, null]),
      ),
    ).then((entries) => {
      if (cancelled) return;
      const loaded = Object.fromEntries(entries.filter(([, titles]) => titles?.length));
      if (Object.keys(loaded).length) setOptionsByType(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, [typesKey]);

  // Returns the original array untouched until something loads, so the listing
  // page's filter-derived memos aren't invalidated on every render.
  return useMemo(() => {
    if (!Object.keys(optionsByType).length) return filters;
    return filters.map((filter) => {
      const titles = filter.categoryType ? optionsByType[filter.categoryType] : null;
      if (!titles) return filter;
      return { ...filter, options: titles.map((title) => ({ value: title, label: title })) };
    });
  }, [filters, optionsByType]);
};
