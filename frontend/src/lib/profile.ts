import type { Me } from "@/lib/types";

export interface ProfileStep {
  key: string;
  label: string;
  /** Why it matters, in the member's interest. */
  why: string;
  done: boolean;
}

/** What makes a profile findable and trustworthy, most valuable first. */
export function profileSteps(me: Me): ProfileStep[] {
  return [
    {
      key: "headline",
      label: "Add a headline",
      why: "It appears next to your name everywhere.",
      done: Boolean(me.headline),
    },
    {
      key: "skills",
      label: "List three skills",
      why: "Teams filter people by skill.",
      done: me.skills.length >= 3,
    },
    {
      key: "open_to",
      label: "Say what you're open to",
      why: "So the right invitations reach you.",
      done: me.open_to.length > 0,
    },
    {
      key: "place",
      label: "Add where you're based",
      why: "Most teams start local.",
      done: Boolean(me.uni || me.city),
    },
    {
      key: "photo",
      label: "Add a photo",
      why: "People answer faces faster than initials.",
      done: Boolean(me.avatar_url),
    },
    {
      key: "bio",
      label: "Write a short bio",
      why: "Two sentences on what you've made.",
      done: me.bio.trim().length >= 40,
    },
    {
      key: "links",
      label: "Link your work",
      why: "A portfolio or GitHub is the best proof.",
      done: me.links.length > 0 || Boolean(me.website),
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

export function safeUrl(raw: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
