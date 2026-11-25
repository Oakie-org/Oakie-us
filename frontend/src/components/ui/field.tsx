import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown, CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-field border-2 border-line bg-surface px-4 text-base text-ink placeholder:text-ink-soft/70 " +
  "transition-colors duration-150 hover:border-ink-soft focus:border-primary focus:outline-none " +
  "aria-invalid:border-danger disabled:opacity-60";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Receives the ids to wire onto the control. */
  children: (control: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: true;
  }) => ReactNode;
  className?: string;
}

/** Visible label, optional hint, and an inline error tied to the control. */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="font-display text-sm font-semibold text-ink"
      >
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-sm font-medium text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-sm text-ink-soft">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-12", className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        CONTROL,
        "min-h-28 resize-y py-3 leading-relaxed",
        className,
      )}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(CONTROL, "h-12 appearance-none pr-10", className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-soft"
        aria-hidden
      />
    </div>
  );
}
