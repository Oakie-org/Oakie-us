import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Theme is stored on <html data-theme>; index.html sets it before first paint. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current);
  const toggle = useCallback(() => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("oakie-theme", next);
    } catch {
      // Storage unavailable: the choice simply lasts for this visit.
    }
    listeners.forEach((listener) => listener());
  }, []);
  return { theme, toggle };
}
