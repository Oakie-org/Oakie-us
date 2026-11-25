import { AVATAR_TONES } from "@/lib/categories";
import { cn, hash, initials } from "@/lib/utils";

const SIZES = {
  xs: "size-7 text-[0.65rem]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-xl",
  xl: "size-28 text-4xl",
} as const;

interface AvatarProps {
  user: { id: string; name: string; avatar_url?: string | null };
  size?: keyof typeof SIZES;
  className?: string;
}

/** Photo when there is one; otherwise initials on the member's own block colour. */
export function Avatar({ user, size = "md", className }: AvatarProps) {
  const shape = cn("shrink-0 rounded-full", SIZES[size], className);
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt=""
        loading="lazy"
        className={cn(shape, "bg-sunken object-cover")}
      />
    );
  }
  const tone = AVATAR_TONES[hash(user.id) % AVATAR_TONES.length];
  return (
    <span
      aria-hidden
      className={cn(
        shape,
        tone.bg,
        "flex items-center justify-center font-display font-semibold text-block-ink",
      )}
    >
      {initials(user.name)}
    </span>
  );
}

export function AvatarStack({
  users,
  max = 4,
}: {
  users: AvatarProps["user"][];
  max?: number;
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((user) => (
        <Avatar
          key={user.id}
          user={user}
          size="sm"
          className="ring-2 ring-surface"
        />
      ))}
      {extra > 0 && (
        <span className="flex size-9 items-center justify-center rounded-full bg-sunken text-xs font-semibold ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </div>
  );
}
