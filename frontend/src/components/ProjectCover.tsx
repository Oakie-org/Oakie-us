import { useMemo } from "react";

import { AVATAR_TONES, toneFor, type BlockTone } from "@/lib/categories";
import { cn, hash } from "@/lib/utils";

const INK = "var(--color-block-ink)";
const PAPER = "#f6f5ef";
const CELL = 80;

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shapes are drawn in an 80x80 cell and rotated in quarter turns.
const SHAPES = [
  "M0 0H80A80 80 0 0 1 0 80Z", // quarter disc
  "M0 80A80 80 0 0 1 80 0A80 80 0 0 1 0 80Z", // leaf
  "M0 40A40 40 0 0 1 80 40Z", // half disc
  "M40 12A28 28 0 1 1 39.9 12Z", // disc
  "M0 0H80V80H0Z", // block
  "M0 0H80L0 80Z", // wedge
];

interface Tile {
  key: string;
  d: string;
  fill: string;
  transform: string;
}

function compose(
  seed: string,
  background: string,
  columns: number,
  rows: number,
): Tile[] {
  const random = mulberry32(hash(seed));
  const others = AVATAR_TONES.map((tone) => tone.fill).filter(
    (fill) => fill !== background,
  );
  const second = others[Math.floor(random() * others.length)];
  const palette = [INK, PAPER, second, INK, PAPER];
  const tiles: Tile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const roll = random();
      if (roll < 0.22) continue; // leave breathing room
      const shape = SHAPES[Math.floor(random() * SHAPES.length)];
      const turn = Math.floor(random() * 4) * 90;
      tiles.push({
        key: `${row}-${column}`,
        d: shape,
        fill: palette[Math.floor(random() * palette.length)],
        transform: `translate(${column * CELL} ${
          row * CELL
        }) rotate(${turn} 40 40)`,
      });
    }
  }
  return tiles;
}

interface ProjectCoverProps {
  project: { id: string; category: string; image_url: string | null };
  /** Grid of 80px tiles; defaults suit a wide banner. */
  columns?: number;
  rows?: number;
  /** Overrides the discipline colour (profile banners use the member's accent). */
  tone?: BlockTone;
  className?: string;
}

/**
 * A project's cover: its uploaded image, or a geometric composition generated
 * from its id in its discipline's colour. Every project gets a recognisable
 * face without anyone having to design one.
 */
export function ProjectCover({
  project,
  columns = 6,
  rows = 2,
  tone: chosen,
  className,
}: ProjectCoverProps) {
  const tone = chosen ?? toneFor(project.category);
  const tiles = useMemo(
    () => compose(project.id, tone.fill, columns, rows),
    [project.id, tone.fill, columns, rows],
  );

  if (project.image_url) {
    return (
      <img
        src={project.image_url}
        alt=""
        loading="lazy"
        className={cn("size-full object-cover", tone.bg, className)}
      />
    );
  }
  return (
    <svg
      viewBox={`0 0 ${columns * CELL} ${rows * CELL}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={cn("size-full", tone.bg, className)}
    >
      {tiles.map((tile) => (
        <path
          key={tile.key}
          d={tile.d}
          fill={tile.fill}
          transform={tile.transform}
        />
      ))}
    </svg>
  );
}
