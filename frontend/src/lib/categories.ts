/**
 * Each discipline owns one block colour. It is how a card, a cover or a chip
 * says "this is a finance project" before you read a word.
 */
export interface BlockTone {
  bg: string;
  /** CSS colour value, for SVG fills. */
  fill: string;
}

const TONES = {
  sky: { bg: "bg-block-sky", fill: "var(--color-block-sky)" },
  lilac: { bg: "bg-block-lilac", fill: "var(--color-block-lilac)" },
  mint: { bg: "bg-block-mint", fill: "var(--color-block-mint)" },
  coral: { bg: "bg-block-coral", fill: "var(--color-block-coral)" },
  pink: { bg: "bg-block-pink", fill: "var(--color-block-pink)" },
  sun: { bg: "bg-block-sun", fill: "var(--color-block-sun)" },
  aqua: { bg: "bg-block-aqua", fill: "var(--color-block-aqua)" },
  orange: { bg: "bg-block-orange", fill: "var(--color-block-orange)" },
  leaf: { bg: "bg-block-leaf", fill: "var(--color-block-leaf)" },
  sand: { bg: "bg-block-sand", fill: "var(--color-block-sand)" },
} satisfies Record<string, BlockTone>;

const BY_CATEGORY: Record<string, BlockTone> = {
  Software: TONES.sky,
  "AI & Data": TONES.lilac,
  "Finance & Quant": TONES.mint,
  "Media & Content": TONES.coral,
  "Design & Art": TONES.pink,
  "Events & Community": TONES.sun,
  Research: TONES.aqua,
  Startup: TONES.orange,
  "Social Impact": TONES.leaf,
};

export function toneFor(category: string): BlockTone {
  return BY_CATEGORY[category] ?? TONES.sand;
}

export const ACCENTS = Object.keys(TONES) as (keyof typeof TONES)[];

/** A member's chosen accent, or undefined when they have not picked one. */
export function toneNamed(name: string | undefined): BlockTone | undefined {
  return name && name in TONES ? TONES[name as keyof typeof TONES] : undefined;
}

export const AVATAR_TONES: BlockTone[] = [
  TONES.sky,
  TONES.lilac,
  TONES.mint,
  TONES.coral,
  TONES.pink,
  TONES.sun,
  TONES.aqua,
  TONES.orange,
  TONES.leaf,
];
