/**
 * Member colours: the flat band a member may choose for the top of their own
 * profile. The choice is theirs, so it is the only place these colours appear;
 * the interface itself stays neutral.
 */
const TONES = {
  sky: "bg-block-sky",
  lilac: "bg-block-lilac",
  mint: "bg-block-mint",
  coral: "bg-block-coral",
  pink: "bg-block-pink",
  sun: "bg-block-sun",
  aqua: "bg-block-aqua",
  orange: "bg-block-orange",
  leaf: "bg-block-leaf",
  sand: "bg-block-sand",
} as const;

export const ACCENTS = Object.keys(TONES) as (keyof typeof TONES)[];

/** The background class for a member's chosen colour, if they picked one. */
export function toneNamed(name: string | undefined): string | undefined {
  return name && name in TONES ? TONES[name as keyof typeof TONES] : undefined;
}
