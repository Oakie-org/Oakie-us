import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";

import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  message: string;
  kind: "success" | "error";
}

interface ToastApi {
  success(message: string): void;
  /** Accepts an Error (shows its message) or plain text. */
  error(problem: unknown): void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, kind: Toast["kind"]) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, kind }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      kind === "error" ? 6000 : 3500,
    );
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push(message, "success"),
      error: (problem) =>
        push(
          typeof problem === "string" ? problem : errorMessage(problem),
          "error",
        ),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex max-w-md animate-pop items-start gap-2.5 rounded-2xl px-4 py-3 font-medium",
              toast.kind === "error"
                ? "bg-danger-soft text-danger ring-2 ring-danger/30"
                : "bg-ink text-paper",
            )}
          >
            {toast.kind === "error" ? (
              <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            ) : (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside <ToastProvider>");
  return value;
}
