import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";

import { ACCENTS, toneNamed } from "@/lib/categories";
import { useDraft } from "@/lib/hooks";
import { linkLabel, safeUrl, type ProfileSection } from "@/lib/profile";
import { useUpdateMe, useUserProjects } from "@/lib/queries";
import type { Me, ProfileLink, ProfileUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormError, Skeleton } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import {
  AvailabilityPicker,
  OpenToPicker,
  SkillPicker,
} from "@/components/profile/fields";
import { PhotoDialog } from "@/components/profile/PhotoDialog";

type Section = Exclude<ProfileSection, "photo">;

const SHEETS: Record<Section, { title: string; description: string }> = {
  intro: {
    title: "Intro",
    description: "The first things anyone reads about you.",
  },
  looking: {
    title: "What you're open to",
    description: "Teams read this before they invite you.",
  },
  skills: {
    title: "Skills",
    description:
      "Teams search people by skill, and we show you projects that need yours.",
  },
  about: {
    title: "About you",
    description: "A few sentences are plenty.",
  },
  links: {
    title: "Links to your work",
    description:
      "A portfolio, GitHub, a reel, a paper: whatever shows what you've made.",
  },
  cover: {
    title: "Cover",
    description: "A picture of your own, a colour, or nothing at all.",
  },
  featured: {
    title: "Featured projects",
    description: "Pin up to 3 to the top of your profile.",
  },
};

interface EditorProps {
  me: Me;
  /** Save these fields, then close. */
  save: (fields: ProfileUpdate) => void;
  /** Called once something has been changed, so a stray click can't lose it. */
  touch: () => void;
  footer: ReactNode;
}

function IntroEditor({ me, save, touch, footer }: EditorProps) {
  const [draft, set] = useDraft(
    { name: me.name, headline: me.headline, city: me.city, uni: me.uni },
    touch,
  );
  const [nameTouched, setNameTouched] = useState(false);
  const nameError = draft.name.trim() ? undefined : "Your name can't be empty.";
  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setNameTouched(true);
        if (!nameError) save({ ...draft, name: draft.name.trim() });
      }}
    >
      <Field label="Name" required error={nameTouched ? nameError : undefined}>
        {(control) => (
          <Input
            {...control}
            value={draft.name}
            onChange={(event) => set("name", event.target.value)}
            onBlur={() => setNameTouched(true)}
            maxLength={60}
            autoComplete="name"
          />
        )}
      </Field>
      <Field
        label="Headline"
        hint={`One line on what you do. Shown wherever your name appears. ${draft.headline.length}/140`}
      >
        {(control) => (
          <Input
            {...control}
            value={draft.headline}
            onChange={(event) => set("headline", event.target.value)}
            maxLength={140}
            placeholder="Illustrator who also codes"
          />
        )}
      </Field>
      <Field label="City">
        {(control) => (
          <Input
            {...control}
            value={draft.city}
            onChange={(event) => set("city", event.target.value)}
            maxLength={140}
            autoComplete="address-level2"
            placeholder="New York, NY"
          />
        )}
      </Field>
      <Field
        label="Community"
        hint="Optional. A school, company, club or studio you're part of."
      >
        {(control) => (
          <Input
            {...control}
            value={draft.uni}
            onChange={(event) => set("uni", event.target.value)}
            maxLength={140}
            autoComplete="organization"
          />
        )}
      </Field>
      {footer}
    </form>
  );
}

function LookingEditor({ me, save, touch, footer }: EditorProps) {
  const [draft, set] = useDraft(
    { open_to: me.open_to, availability: me.availability },
    touch,
  );
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        save(draft);
      }}
    >
      <OpenToPicker
        value={draft.open_to}
        onChange={(value) => set("open_to", value)}
        legend="Pick as many as fit"
      />
      <AvailabilityPicker
        value={draft.availability}
        onChange={(value) => set("availability", value)}
      />
      {footer}
    </form>
  );
}

function SkillsEditor({ me, save, touch, footer }: EditorProps) {
  const [draft, set] = useDraft({ skills: me.skills }, touch);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        save(draft);
      }}
    >
      <Field label="What you can do" hint="Three is a good start. Up to 20.">
        {(control) => (
          <SkillPicker
            {...control}
            value={draft.skills}
            onChange={(skills) => set("skills", skills)}
          />
        )}
      </Field>
      {footer}
    </form>
  );
}

const BIO_PROMPTS = [
  "What I've made",
  "What I'm good at",
  "What I'm looking for",
];

function AboutEditor({ me, save, touch, footer }: EditorProps) {
  const [draft, set] = useDraft({ bio: me.bio }, touch);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save({ bio: draft.bio.trim() });
      }}
    >
      <Field label="Bio" hint={`${draft.bio.length}/1200`}>
        {(control) => (
          <Textarea
            {...control}
            autoFocus
            value={draft.bio}
            onChange={(event) => set("bio", event.target.value)}
            maxLength={1200}
            rows={8}
            placeholder={
              "What have you made?\nWhat are you good at?\nWhat are you looking for?"
            }
          />
        )}
      </Field>
      {!draft.bio.trim() && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            set("bio", BIO_PROMPTS.map((prompt) => `${prompt}\n`).join("\n"))
          }
        >
          Start from three prompts
        </Button>
      )}
      {footer}
    </form>
  );
}

interface LinkRow extends ProfileLink {
  /** The label follows the address until the member types their own. */
  named: boolean;
}

function LinksEditor({ me, save, touch, footer }: EditorProps) {
  const [rows, setRows] = useState<LinkRow[]>(() =>
    me.links.length
      ? me.links.map((link) => ({ ...link, named: true }))
      : [{ label: "", url: "", named: false }],
  );
  const change = (index: number, patch: Partial<LinkRow>) => {
    touch();
    setRows((current) =>
      current.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    );
  };
  const invalid = rows.some(
    (row) => row.url.trim() && !safeUrl(row.url.trim()),
  );
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (invalid) return;
        // Empty rows are dropped rather than rejected.
        save({
          links: rows.flatMap((row) => {
            const url = safeUrl(row.url.trim());
            if (!url) return [];
            return [{ url, label: row.label.trim() || linkLabel(url) }];
          }),
        });
      }}
    >
      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const bad = Boolean(row.url.trim()) && !safeUrl(row.url.trim());
          return (
            <li key={index} className="flex animate-pop items-start gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                <Input
                  value={row.url}
                  onChange={(event) =>
                    change(index, {
                      url: event.target.value,
                      ...(row.named
                        ? {}
                        : { label: linkLabel(event.target.value) }),
                    })
                  }
                  maxLength={200}
                  placeholder="Paste an address"
                  type="url"
                  inputMode="url"
                  autoFocus={index === rows.length - 1 && !row.url}
                  aria-label={`Link ${index + 1} address`}
                  aria-invalid={bad || undefined}
                  className="sm:flex-1"
                />
                <Input
                  value={row.label}
                  onChange={(event) =>
                    change(index, {
                      label: event.target.value,
                      named: Boolean(event.target.value),
                    })
                  }
                  maxLength={40}
                  placeholder="Name"
                  aria-label={`Link ${index + 1} name`}
                  className="sm:w-40 sm:shrink-0"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove link ${index + 1}`}
                onClick={() => {
                  touch();
                  setRows((current) =>
                    current.filter((_, position) => position !== index),
                  );
                }}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      {invalid && (
        <p role="alert" className="text-sm font-medium text-danger">
          One of these doesn't look like a web address.
        </p>
      )}
      {rows.length < 6 && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            setRows((current) => [
              ...current,
              { label: "", url: "", named: false },
            ])
          }
        >
          <Plus aria-hidden /> Add {rows.length ? "another" : "a link"}
        </Button>
      )}
      {footer}
    </form>
  );
}

function CoverEditor({ me, save, touch, footer }: EditorProps) {
  const [draft, set] = useDraft(
    { banner_url: me.banner_url, accent: me.accent },
    touch,
  );
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        save(draft);
      }}
    >
      <ImagePicker
        label="Picture"
        hint="Something of your own: your work, your desk, your city."
        purpose="user_banner"
        value={draft.banner_url}
        onChange={(url) => set("banner_url", url)}
        preview={
          draft.banner_url && (
            <img
              src={draft.banner_url}
              alt=""
              className="h-16 w-40 rounded-lg bg-sunken object-cover"
            />
          )
        }
      />
      <fieldset>
        <legend className="text-sm font-medium">Or a colour</legend>
        <p className="text-sm text-ink-soft">
          Shown as a band when there is no picture, and on your embedded card.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["", ...ACCENTS].map((name) => (
            <label
              key={name || "none"}
              title={name || "None"}
              className={cn(
                "flex size-11 cursor-pointer items-center justify-center rounded-full border transition-transform has-focus-visible:outline-3 has-focus-visible:outline-primary hover:scale-110",
                draft.accent === name ? "border-ink" : "border-transparent",
              )}
            >
              <input
                type="radio"
                name="accent"
                value={name}
                checked={draft.accent === name}
                onChange={() => set("accent", name)}
                className="sr-only"
                aria-label={name || "No colour"}
              />
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-[0.6875rem] font-medium",
                  toneNamed(name) ?? "border border-line bg-surface",
                )}
              >
                {name ? "" : "None"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {footer}
    </form>
  );
}

function FeaturedEditor({ me, save, touch, footer }: EditorProps) {
  const mine = useUserProjects(me.id);
  const [pinned, setPinned] = useState(me.pinned_project_ids);
  const toggle = (id: string) => {
    touch();
    setPinned((current) =>
      current.includes(id)
        ? current.filter((pid) => pid !== id)
        : [...current, id].slice(0, 3),
    );
  };
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save({ pinned_project_ids: pinned });
      }}
    >
      {mine.isPending ? (
        <Skeleton className="h-12 rounded-field" />
      ) : !mine.data?.length ? (
        <p className="text-ink-soft">
          Projects you start or join can be pinned here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {mine.data.map((project) => {
            const active = pinned.includes(project.id);
            const full = !active && pinned.length >= 3;
            return (
              <li key={project.id}>
                <label
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-field border px-3.5 py-2 transition-colors",
                    active ? "border-primary bg-primary-soft" : "border-line",
                    full
                      ? "opacity-50"
                      : "cursor-pointer hover:border-ink-soft",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    disabled={full}
                    onChange={() => toggle(project.id)}
                    className="size-5 accent-(--primary)"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {project.title}
                  </span>
                  <span className="shrink-0 text-sm text-ink-soft">
                    {project.member_title || project.role}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {footer}
    </form>
  );
}

const EDITORS: Record<Section, (props: EditorProps) => ReactNode> = {
  intro: IntroEditor,
  looking: LookingEditor,
  skills: SkillsEditor,
  about: AboutEditor,
  links: LinksEditor,
  cover: CoverEditor,
  featured: FeaturedEditor,
};

function Sheet({
  me,
  section,
  onClose,
  touch,
}: {
  me: Me;
  section: Section;
  onClose: () => void;
  touch: () => void;
}) {
  const update = useUpdateMe();
  const toast = useToast();
  const Editor = EDITORS[section];
  return (
    <Editor
      me={me}
      touch={touch}
      save={(fields) =>
        update.mutate(fields, {
          onSuccess: () => {
            toast.success("Saved");
            onClose();
          },
        })
      }
      footer={
        <>
          <FormError error={update.error} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Save
            </Button>
          </div>
        </>
      }
    />
  );
}

/**
 * The member's own profile is edited one part at a time: each part opens as a
 * small sheet holding only its own fields and saves on its own.
 */
export function ProfileEditor({
  me,
  section,
  onClose,
}: {
  me: Me;
  /** Which part is open; null when none is. */
  section: ProfileSection | null;
  onClose: () => void;
}) {
  // Whether the open sheet holds unsaved changes, tracked per opening.
  const [dirty, setDirty] = useState<ProfileSection | null>(null);
  const sheet = section && section !== "photo" ? section : null;
  const close = () => {
    setDirty(null);
    onClose();
  };
  return (
    <>
      <PhotoDialog
        me={me}
        open={section === "photo"}
        onOpenChange={(open) => !open && close()}
      />
      <Dialog
        open={sheet !== null}
        onOpenChange={(open) => !open && close()}
        title={sheet ? SHEETS[sheet].title : ""}
        description={sheet ? SHEETS[sheet].description : undefined}
        locked={dirty === sheet}
      >
        {/* Mounted per opening, so each edit starts from what is saved. */}
        {sheet && (
          <Sheet
            key={sheet}
            me={me}
            section={sheet}
            onClose={close}
            touch={() => setDirty(sheet)}
          />
        )}
      </Dialog>
    </>
  );
}
