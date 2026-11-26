import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Minus,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { useDraft } from "@/lib/hooks";
import type { ProjectPart } from "@/lib/project";
import { useCatalog, useDeleteProject, useUpdateProject } from "@/lib/queries";
import type {
  OpenRole,
  ProjectDetail,
  ProjectInput,
  ProjectStatus,
  ProjectVisibility,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { FormError } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

const SHEETS: Record<ProjectPart, { title: string; description: string }> = {
  basics: {
    title: "Name and stage",
    description:
      "What people read first, on the card and at the top of the page.",
  },
  story: {
    title: "The story",
    description: "What it is, what exists today, and who you need.",
  },
  picture: {
    title: "Picture",
    description:
      "Something real from the project. No picture is fine too: the card then shows more of your words.",
  },
  roles: {
    title: "Who you need",
    description:
      "Teams that name the roles they need get far better applications.",
  },
  place: {
    title: "Where it happens",
    description: "All optional.",
  },
  visibility: {
    title: "Who can see it",
    description: "You can change this at any time.",
  },
};

const STAGES: { value: ProjectStatus; detail: string }[] = [
  { value: "Idea", detail: "Nothing built yet" },
  { value: "Recruiting", detail: "Forming the team" },
  { value: "In Progress", detail: "Already building" },
  { value: "Completed", detail: "Wrapped up. Applications close." },
];

const VISIBILITY: {
  value: ProjectVisibility;
  label: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  {
    value: "public",
    label: "Public",
    detail: "Listed in Explore. Anyone can read updates.",
    icon: Eye,
  },
  {
    value: "members_only",
    label: "Team-only updates",
    detail: "Listed in Explore, but updates stay with the team.",
    icon: EyeOff,
  },
  {
    value: "private",
    label: "Private",
    detail: "Hidden from everyone except the team.",
    icon: Lock,
  },
];

interface EditorProps {
  project: ProjectDetail;
  /** Save these fields, then close. */
  save: (fields: Partial<ProjectInput>) => void;
  /** Called once something has been changed, so a stray click can't lose it. */
  touch: () => void;
  footer: ReactNode;
  onClose: () => void;
}

function OptionCard({
  name,
  value,
  active,
  onSelect,
  children,
}: {
  name: string;
  value: string;
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-field border p-3.5 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-primary",
        active
          ? "border-primary bg-primary-soft"
          : "border-line bg-surface hover:border-ink-soft",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={active}
        onChange={onSelect}
        className="sr-only"
      />
      {children}
    </label>
  );
}

function BasicsEditor({ project, save, touch, footer }: EditorProps) {
  const { data: catalog } = useCatalog();
  const [draft, set] = useDraft(
    {
      title: project.title,
      subtitle: project.subtitle,
      category: project.category,
      status: project.status,
    },
    touch,
  );
  const [titleTouched, setTitleTouched] = useState(false);
  const titleError =
    draft.title.trim().length < 3
      ? "Give your project a name of at least 3 characters."
      : undefined;
  const categories = catalog?.categories ?? [];
  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setTitleTouched(true);
        if (titleError) return;
        save({
          ...draft,
          title: draft.title.trim(),
          subtitle: draft.subtitle.trim(),
        });
      }}
    >
      <Field
        label="Project name"
        required
        error={titleTouched ? titleError : undefined}
      >
        {(control) => (
          <Input
            {...control}
            value={draft.title}
            onChange={(event) => set("title", event.target.value)}
            onBlur={() => setTitleTouched(true)}
            maxLength={80}
          />
        )}
      </Field>
      <Field
        label="In one line"
        hint={`What it is and who it's for. ${draft.subtitle.length}/140`}
      >
        {(control) => (
          <Input
            {...control}
            value={draft.subtitle}
            onChange={(event) => set("subtitle", event.target.value)}
            maxLength={140}
          />
        )}
      </Field>
      <Field label="Discipline">
        {(control) => (
          <Select
            {...control}
            value={draft.category}
            onChange={(event) => set("category", event.target.value)}
          >
            {/* A discipline chosen earlier stays selectable if the list changed. */}
            {(categories.includes(draft.category)
              ? categories
              : [draft.category, ...categories]
            ).map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
        )}
      </Field>
      <fieldset>
        <legend className="text-sm font-medium">Where does it stand?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {STAGES.map(({ value, detail }) => (
            <OptionCard
              key={value}
              name="stage"
              value={value}
              active={draft.status === value}
              onSelect={() => set("status", value)}
            >
              <span>
                <span className="block font-medium leading-tight">{value}</span>
                <span className="block text-sm text-ink-soft">{detail}</span>
              </span>
            </OptionCard>
          ))}
        </div>
      </fieldset>
      {footer}
    </form>
  );
}

function StoryEditor({ project, save, touch, footer }: EditorProps) {
  const [draft, set] = useDraft(
    { description: project.description, tags: project.tags },
    touch,
  );
  const [attempted, setAttempted] = useState(false);
  const error = draft.description.trim()
    ? undefined
    : "Write at least a sentence about what you're building.";
  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (!error) save({ ...draft, description: draft.description.trim() });
      }}
    >
      <Field
        label="Description"
        required
        error={attempted ? error : undefined}
        hint={`${draft.description.length}/6000`}
      >
        {(control) => (
          <Textarea
            {...control}
            value={draft.description}
            onChange={(event) => set("description", event.target.value)}
            maxLength={6000}
            rows={10}
          />
        )}
      </Field>
      <Field
        label="Tags"
        hint="Press Enter to add. Tools, topics, anything people might search for."
      >
        {(control) => (
          <ChipInput
            {...control}
            value={draft.tags}
            onChange={(tags) => set("tags", tags)}
            max={8}
            placeholder="React, Backtesting, Zine…"
          />
        )}
      </Field>
      {footer}
    </form>
  );
}

function PictureEditor({ project, save, touch, footer }: EditorProps) {
  const [draft, set] = useDraft({ image_url: project.image_url }, touch);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        save(draft);
      }}
    >
      {draft.image_url && (
        <img
          src={draft.image_url}
          alt=""
          className="max-h-64 w-full rounded-field bg-sunken object-contain"
        />
      )}
      <ImagePicker
        label="A screenshot, a photo, a sketch"
        purpose="project_cover"
        value={draft.image_url}
        onChange={(url) => set("image_url", url)}
        preview={null}
      />
      {footer}
    </form>
  );
}

function RolesEditor({ project, save, touch, footer }: EditorProps) {
  const { data: catalog } = useCatalog();
  const [draft, set] = useDraft(
    { open_roles: project.open_roles, max_members: project.max_members },
    touch,
  );
  const roles = draft.open_roles;
  const change = (index: number, role: OpenRole) =>
    set(
      "open_roles",
      roles.map((existing, position) => (position === index ? role : existing)),
    );
  // A team can't shrink below the people already on it.
  const minSeats = Math.max(1, project.current_members);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        // Rows left without a name are dropped rather than rejected.
        save({
          max_members: draft.max_members,
          open_roles: roles
            .filter((role) => role.title.trim())
            .map((role) => ({ ...role, title: role.title.trim() })),
        });
      }}
    >
      {roles.map((role, index) => (
        <div
          key={index}
          className="flex animate-pop flex-col gap-3 rounded-field bg-sunken p-4"
        >
          <div className="flex items-end gap-2">
            <Field label={`Role ${index + 1}`} className="flex-1">
              {(control) => (
                <Input
                  {...control}
                  value={role.title}
                  onChange={(event) =>
                    change(index, { ...role, title: event.target.value })
                  }
                  maxLength={40}
                  placeholder="Backend engineer"
                  autoFocus={!role.title && index === roles.length - 1}
                />
              )}
            </Field>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove role ${index + 1}`}
              onClick={() =>
                set(
                  "open_roles",
                  roles.filter((_, position) => position !== index),
                )
              }
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
          <Field label="Skills wanted">
            {(control) => (
              <ChipInput
                {...control}
                value={role.skills}
                onChange={(skills) => change(index, { ...role, skills })}
                suggestions={catalog?.skills ?? []}
                max={6}
                quiet
                placeholder="Add a skill"
              />
            )}
          </Field>
        </div>
      ))}
      {roles.length < 8 && (
        <Button
          variant="outline"
          className="self-start"
          onClick={() =>
            set("open_roles", [...roles, { title: "", skills: [] }])
          }
        >
          <Plus aria-hidden /> Add {roles.length ? "another" : "a"} role
        </Button>
      )}
      <div>
        <p className="text-sm font-medium">
          Team size, including everyone on it
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="One fewer seat"
            disabled={draft.max_members <= minSeats}
            onClick={() => set("max_members", draft.max_members - 1)}
          >
            <Minus aria-hidden />
          </Button>
          <span
            className="w-10 text-center text-2xl font-medium tabular-nums"
            aria-live="polite"
          >
            {draft.max_members}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="One more seat"
            disabled={draft.max_members >= 50}
            onClick={() => set("max_members", draft.max_members + 1)}
          >
            <Plus aria-hidden />
          </Button>
          <span className="text-sm text-ink-soft">
            {project.current_members} on the team now. Applications close when
            every seat is filled.
          </span>
        </div>
      </div>
      {footer}
    </form>
  );
}

function PlaceEditor({ project, save, touch, footer }: EditorProps) {
  const [draft, set] = useDraft(
    { city: project.city, uni: project.uni, remote_ok: project.remote_ok },
    touch,
  );
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        save(draft);
      }}
    >
      <Field label="City">
        {(control) => (
          <Input
            {...control}
            value={draft.city}
            onChange={(event) => set("city", event.target.value)}
            maxLength={140}
            placeholder="New York, NY"
          />
        )}
      </Field>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={draft.remote_ok}
          onChange={(event) => set("remote_ok", event.target.checked)}
          className="size-5 accent-(--primary)"
        />
        <span className="font-medium">Remote teammates are welcome</span>
      </label>
      <Field
        label="Community"
        hint="Optional. A school, company, club or lab, if the project belongs to one."
      >
        {(control) => (
          <Input
            {...control}
            value={draft.uni}
            onChange={(event) => set("uni", event.target.value)}
            maxLength={140}
          />
        )}
      </Field>
      {footer}
    </form>
  );
}

function VisibilityEditor({
  project,
  save,
  touch,
  footer,
  onClose,
}: EditorProps) {
  const [draft, set] = useDraft({ visibility: project.visibility }, touch);
  const remove = useDeleteProject(project.id);
  const toast = useToast();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  // Deleting replaces the sheet's contents: one decision on screen at a time.
  if (confirming) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-field bg-danger-soft p-4">
          <p className="font-medium text-danger">Delete {project.title}?</p>
          <p className="mt-1">
            This removes the project, its updates, tasks and every member's
            contribution record. It can't be undone.
          </p>
        </div>
        <FormError error={remove.error} />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Keep project
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => {
                  toast.success("Project deleted");
                  onClose();
                  navigate("/");
                },
              })
            }
          >
            Delete forever
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        save(draft);
      }}
    >
      <div className="flex flex-col gap-2">
        {VISIBILITY.map(({ value, label, detail, icon: Icon }) => (
          <OptionCard
            key={value}
            name="visibility"
            value={value}
            active={draft.visibility === value}
            onSelect={() => set("visibility", value)}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span>
              <span className="block font-medium leading-tight">{label}</span>
              <span className="block text-sm text-ink-soft">{detail}</span>
            </span>
          </OptionCard>
        ))}
      </div>
      {footer}
      {project.viewer.role === "owner" && (
        <div className="-mb-1 border-t border-line pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-danger"
            onClick={() => setConfirming(true)}
          >
            <Trash2 aria-hidden /> Delete this project
          </Button>
        </div>
      )}
    </form>
  );
}

const EDITORS: Record<ProjectPart, (props: EditorProps) => ReactNode> = {
  basics: BasicsEditor,
  story: StoryEditor,
  picture: PictureEditor,
  roles: RolesEditor,
  place: PlaceEditor,
  visibility: VisibilityEditor,
};

function Sheet({
  project,
  part,
  onClose,
  touch,
}: {
  project: ProjectDetail;
  part: ProjectPart;
  onClose: () => void;
  touch: () => void;
}) {
  const update = useUpdateProject(project.id);
  const toast = useToast();
  const Editor = EDITORS[part];
  return (
    <Editor
      project={project}
      touch={touch}
      onClose={onClose}
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
 * A project is edited on its own page, one part at a time: each part opens as
 * a small sheet holding only its own fields and saves on its own.
 */
export function ProjectEditor({
  project,
  part,
  onClose,
}: {
  project: ProjectDetail;
  /** Which part is open; null when none is. */
  part: ProjectPart | null;
  onClose: () => void;
}) {
  // Whether the open sheet holds unsaved changes, tracked per opening.
  const [dirty, setDirty] = useState<ProjectPart | null>(null);
  const close = () => {
    setDirty(null);
    onClose();
  };
  return (
    <Dialog
      open={part !== null}
      onOpenChange={(open) => !open && close()}
      title={part ? SHEETS[part].title : ""}
      description={part ? SHEETS[part].description : undefined}
      locked={dirty === part}
    >
      {/* Mounted per opening, so each edit starts from what is saved. */}
      {part && (
        <Sheet
          key={part}
          project={project}
          part={part}
          onClose={close}
          touch={() => setDirty(part)}
        />
      )}
    </Dialog>
  );
}
