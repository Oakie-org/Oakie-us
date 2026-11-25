import wordmark from "@/assets/oakie-wordmark.jpg";
import { cn } from "@/lib/utils";

/**
 * The official Oakie wordmark. The source artwork is dark-on-white, so blend
 * modes drop the white plate on light surfaces and invert it on dark ones.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={wordmark}
      alt="Oakie"
      width={800}
      height={250}
      className={cn(
        "h-9 w-auto mix-blend-multiply dark:mix-blend-screen dark:invert",
        className,
      )}
    />
  );
}
