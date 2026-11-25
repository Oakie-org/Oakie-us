import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** Read and write a single URL search parameter (filters stay shareable). */
export function useSetParam() {
  const [, setParams] = useSearchParams();
  return useCallback(
    (key: string, value: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
}

/** Keeps a text input responsive while the URL (and the query) update lazily. */
export function useDebouncedParam(key: string, delay = 300) {
  const [params] = useSearchParams();
  const setParam = useSetParam();
  const committed = params.get(key) ?? "";
  const [draft, setDraft] = useState(committed);

  // When the URL changes from elsewhere (e.g. "Clear filters"), follow it.
  const [seen, setSeen] = useState(committed);
  if (seen !== committed) {
    setSeen(committed);
    setDraft(committed);
  }

  useEffect(() => {
    if (draft.trim() === committed) return;
    const timer = window.setTimeout(() => setParam(key, draft.trim()), delay);
    return () => window.clearTimeout(timer);
  }, [draft, committed, delay, key, setParam]);

  return [draft, setDraft] as const;
}
