/** The parts of a project that are edited on their own, each in one small sheet. */
export const PROJECT_PARTS = [
  "basics",
  "story",
  "picture",
  "roles",
  "place",
  "visibility",
] as const;
export type ProjectPart = (typeof PROJECT_PARTS)[number];

export function isProjectPart(value: string | null): value is ProjectPart {
  return PROJECT_PARTS.includes(value as ProjectPart);
}
