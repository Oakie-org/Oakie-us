import type { Me } from "@/lib/types";

/** The parts of a profile that are edited on their own, each in one small sheet. */
export const PROFILE_SECTIONS = [
  "photo",
  "intro",
  "looking",
  "skills",
  "about",
  "links",
  "cover",
  "featured",
] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

export function isProfileSection(
  value: string | null,
): value is ProfileSection {
  return PROFILE_SECTIONS.includes(value as ProfileSection);
}

export interface ProfileStep {
  key: string;
  label: string;
  /** Why it matters, in the member's interest. */
  why: string;
  done: boolean;
  /** Where it is edited. */
  section: ProfileSection;
}

/**
 * What makes a profile findable and trustworthy, most valuable first: what a
 * team filters on, then what makes them answer, then the proof.
 */
export function profileSteps(me: Me): ProfileStep[] {
  return [
    {
      key: "open_to",
      label: "Say what you're open to",
      why: "So the right invitations reach you.",
      done: me.open_to.length > 0,
      section: "looking",
    },
    {
      key: "skills",
      label: "List three skills",
      why: "Teams filter people by skill, and we match you to open roles.",
      done: me.skills.length >= 3,
      section: "skills",
    },
    {
      key: "headline",
      label: "Add a headline",
      why: "It appears next to your name everywhere.",
      done: Boolean(me.headline),
      section: "intro",
    },
    {
      key: "photo",
      label: "Add a photo",
      why: "People answer faces faster than initials.",
      done: Boolean(me.avatar_url),
      section: "photo",
    },
    {
      key: "place",
      label: "Add where you're based",
      why: "Most teams start local.",
      done: Boolean(me.city || me.uni),
      section: "intro",
    },
    {
      key: "bio",
      label: "Write a short bio",
      why: "Two sentences on what you've made.",
      done: me.bio.trim().length >= 40,
      section: "about",
    },
    {
      key: "links",
      label: "Link your work",
      why: "A portfolio or GitHub is the best proof.",
      done: me.links.length > 0 || Boolean(me.website),
      section: "links",
    },
  ];
}

export function profileStrength(me: Me): {
  percent: number;
  next: ProfileStep | undefined;
  steps: ProfileStep[];
} {
  const steps = profileSteps(me);
  const done = steps.filter((step) => step.done).length;
  return {
    percent: Math.round((done / steps.length) * 100),
    next: steps.find((step) => !step.done),
    steps,
  };
}

/** Nothing a team could go on yet: the guided start serves better than one field. */
export function isBlankProfile(me: Me): boolean {
  return !me.headline && me.skills.length === 0 && me.open_to.length === 0;
}

/** Where "continue your profile" should lead for this member. */
export function nextProfileLink(me: Me): string | null {
  if (isBlankProfile(me)) return "/welcome";
  const { next } = profileStrength(me);
  return next ? `/u/${me.id}?edit=${next.section}` : null;
}

export function safeUrl(raw: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!url.hostname.includes(".")) return null;
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

const KNOWN_HOSTS: [RegExp, string][] = [
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)gitlab\.com$/, "GitLab"],
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)behance\.net$/, "Behance"],
  [/(^|\.)dribbble\.com$/, "Dribbble"],
  [/(^|\.)figma\.com$/, "Figma"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)vimeo\.com$/, "Vimeo"],
  [/(^|\.)bilibili\.com$/, "Bilibili"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(x|twitter)\.com$/, "X"],
  [/(^|\.)medium\.com$/, "Medium"],
  [/(^|\.)substack\.com$/, "Substack"],
  [/(^|\.)kaggle\.com$/, "Kaggle"],
  [/(^|\.)huggingface\.co$/, "Hugging Face"],
  [/^scholar\.google\./, "Google Scholar"],
  [/(^|\.)notion\.(so|site)$/, "Notion"],
];

/** A name for a link from its address, so pasting the address is enough. */
export function linkLabel(raw: string): string {
  const href = safeUrl(raw.trim());
  if (!href) return "";
  const host = new URL(href).hostname.replace(/^www\./, "");
  const known = KNOWN_HOSTS.find(([pattern]) => pattern.test(host));
  return (known ? known[1] : host).slice(0, 40);
}
