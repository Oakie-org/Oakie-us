import { useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Plus, Trash2, type LucideIcon } from "lucide-react";

import {
  useCatalog,
  useDeleteProject,
  useProject,
  useSaveProject,
} from "@/lib/queries";
import type {
  OpenRole,
  ProjectDetail,
  ProjectInput,
  ProjectVisibility,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { ErrorState, FormError, PageSpinner } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { PageHeader, useTitle } from "@/components/page";
import NotFound from "@/pages/NotFound";

const BLANK: ProjectInput = {
  title: "",
  subtitle: "",
  description: "",
  category: "Software",
  tags: [],
  status: "Recruiting",
  uni: "",
  city: "",
  remote_ok: true,
  max_members: 5,
  open_roles: [],
  image_url: null,
  visibility: "public",
};

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

type Errors = Partial<Record<"title" | "description" | "max_members", string>>;

function validate(draft: ProjectInput, currentMembers: number): Errors {
  const errors: Errors = {};
  if (draft.title.trim().length < 3)
    errors.title = "Give your project a title of at least 3 characters.";
  if (!draft.description.trim())
    errors.description = "Describe what you're building and where it stands.";
  if (
    !Number.isInteger(draft.max_members) ||
    draft.max_members < Math.max(1, currentMembers) ||
    draft.max_members > 50
  ) {
    errors.max_members =
      currentMembers > 1
        ? `Team size must be between ${currentMembers} (your current team) and 50.`
        : "Team size must be between 1 and 50.";
  }
  return errors;
}

function RolesEditor({
  roles,
  onChange,
  skills,
}: {
  roles: OpenRole[];
  onChange: (roles: OpenRole[]) => void;
  skills: string[];
}) {
  const update = (index: number, role: OpenRole) =>
    onChange(
      roles.map((existing, position) => (position === index ? role : existing)),
    );
  return (
    <div className="flex flex-col gap-4">
      {roles.map((role, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-2xl bg-sunken p-4"
        >
          <div className="flex items-end gap-2">
            <Field label={`Role ${index + 1}`} className="flex-1">
              {(control) => (
                <Input
                  {...control}
                  value={role.title}
                  onChange={(event) =>
                    update(index, { ...role, title: event.target.value })
                  }
                  maxLength={40}
                  placeholder="Backend engineer"
                />
              )}
            </Field>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove role ${index + 1}`}
              onClick={() =>
                onChange(roles.filter((_, position) => position !== index))
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
                onChange={(next) => update(index, { ...role, skills: next })}
                suggestions={skills}
                max={6}
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
          onClick={() => onChange([...roles, { title: "", skills: [] }])}
        >
          <Plus aria-hidden /> Add an open role
        </Button>
      )}
    </div>
  );
}

function EditorForm({ project }: { project?: ProjectDetail }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: catalog } = useCatalog();
  const save = useSaveProject(project?.id);
  const remove = useDeleteProject(project?.id ?? "");
  const summary = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<ProjectInput>(() => {
    if (!project) return BLANK;
    const {
      title,
      subtitle,
      description,
      category,
      tags,
      status,
      uni,
      city,
      remote_ok,
      max_members,
      open_roles,
      image_url,
      visibility,
    } = project;
    return {
      title,
      subtitle,
      description,
      category,
      tags,
      status,
      uni,
      city,
      remote_ok,
      max_members,
      open_roles,
      image_url,
      visibility,
    };
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const touch = (key: string) =>
    setTouched((current) => ({ ...current, [key]: true }));
  const errors = validate(draft, project?.current_members ?? 1);
  const shown = (key: keyof Errors) =>
    submitted || touched[key] ? errors[key] : undefined;
  const errorList = Object.entries(errors);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errorList.length) {
      // Move focus to the summary so keyboard and screen-reader users land on it.
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    const input: ProjectInput = {
      ...draft,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      description: draft.description.trim(),
      open_roles: draft.open_roles
        .filter((role) => role.title.trim())
        .map((role) => ({ ...role, title: role.title.trim() })),
    };
    save.mutate(input, {
      onSuccess: (saved) => {
        toast.success(project ? "Changes saved" : "Your project is live");
        navigate(`/projects/${saved.id}`);
      },
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      {submitted && errorList.length > 0 && (
        <div
          ref={summary}
          tabIndex={-1}
          role="alert"
          className="rounded-card bg-danger-soft p-5 outline-none"
        >
          <h2 className="text-lg text-danger">
            Fix {errorList.length === 1 ? "this" : "these"} before publishing
          </h2>
          <ul className="mt-2 list-disc pl-5">
            {errorList.map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="flex flex-col gap-5 rounded-card bg-surface p-6 sm:p-8">
        <h2 className="text-xl">The pitch</h2>
        <Field label="Title" required error={shown("title")}>
          {(control) => (
            <Input
              {...control}
              value={draft.title}
              onChange={(event) => set("title", event.target.value)}
              onBlur={() => touch("title")}
              maxLength={80}
              placeholder="DormSwap"
            />
          )}
        </Field>
        <Field label="One-line summary" hint="Shown on cards in Explore.">
          {(control) => (
            <Input
              {...control}
              value={draft.subtitle}
              onChange={(event) => set("subtitle", event.target.value)}
              maxLength={140}
              placeholder="A trusted micro-marketplace for move-out season"
            />
          )}
        </Field>
        <Field
          label="Description"
          required
          error={shown("description")}
          hint="What is it, what exists today, and who do you need?"
        >
          {(control) => (
            <Textarea
              {...control}
              value={draft.description}
              onChange={(event) => set("description", event.target.value)}
              onBlur={() => touch("description")}
              maxLength={6000}
              rows={8}
            />
          )}
        </Field>
        <ImagePicker
          label="Picture (optional)"
          hint="A screenshot, a photo, a sketch: something real from the project. No picture is fine too, the card then shows more of your words."
          purpose="project_cover"
          value={draft.image_url}
          onChange={(url) => set("image_url", url)}
          preview={
            draft.image_url && (
              <img
                src={draft.image_url}
                alt=""
                className="h-20 w-32 rounded-xl bg-sunken object-cover"
              />
            )
          }
        />
      </section>

      <section className="flex flex-col gap-5 rounded-card bg-surface p-6 sm:p-8">
        <h2 className="text-xl">Where it fits</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Discipline" required>
            {(control) => (
              <Select
                {...control}
                value={draft.category}
                onChange={(event) => set("category", event.target.value)}
              >
                {(catalog?.categories ?? [draft.category]).map((category) => (
                  <option key={category}>{category}</option>
                ))}
                {catalog && !catalog.categories.includes(draft.category) && (
                  <option>{draft.category}</option>
                )}
              </Select>
            )}
          </Field>
          <Field label="Stage" required>
            {(control) => (
              <Select
                {...control}
                value={draft.status}
                onChange={(event) =>
                  set("status", event.target.value as ProjectInput["status"])
                }
              >
                {(catalog?.statuses ?? [draft.status]).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            )}
          </Field>
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
          <Field label="City">
            {(control) => (
              <Input
                {...control}
                value={draft.city}
                onChange={(event) => set("city", event.target.value)}
                maxLength={140}
              />
            )}
          </Field>
        </div>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={draft.remote_ok}
            onChange={(event) => set("remote_ok", event.target.checked)}
            className="size-5 accent-(--primary)"
          />
          <span className="font-medium">Remote teammates are welcome</span>
        </label>
        <Field label="Tags" hint="Press Enter to add. Up to 8.">
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
      </section>

      <section className="flex flex-col gap-5 rounded-card bg-surface p-6 sm:p-8">
        <h2 className="text-xl">The team</h2>
        <Field
          label="Team size"
          required
          error={shown("max_members")}
          hint="Including you. Applications close when every seat is filled."
          className="max-w-56"
        >
          {(control) => (
            <Input
              {...control}
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={Number.isNaN(draft.max_members) ? "" : draft.max_members}
              onChange={(event) =>
                set("max_members", event.target.valueAsNumber)
              }
              onBlur={() => touch("max_members")}
            />
          )}
        </Field>
        <RolesEditor
          roles={draft.open_roles}
          onChange={(roles) => set("open_roles", roles)}
          skills={catalog?.skills ?? []}
        />
      </section>

      <section className="rounded-card bg-surface p-6 sm:p-8">
        <fieldset>
          <legend className="font-display text-xl font-semibold">
            Who can see it
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {VISIBILITY.map(({ value, label, detail, icon: Icon }) => {
              const active = draft.visibility === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-primary",
                    active
                      ? "border-primary bg-primary-soft"
                      : "border-line hover:border-ink",
                  )}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={value}
                    checked={active}
                    onChange={() => set("visibility", value)}
                    className="sr-only"
                  />
                  <Icon className="size-5" aria-hidden />
                  <span className="font-display font-semibold">{label}</span>
                  <span className="text-sm text-ink-soft">{detail}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      <FormError error={save.error} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {project?.viewer.role === "owner" ? (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden /> Delete project
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            to={project ? `/projects/${project.id}` : "/"}
            variant="ghost"
          >
            Cancel
          </ButtonLink>
          <Button type="submit" size="lg" loading={save.isPending}>
            {project ? "Save changes" : "Publish project"}
          </Button>
        </div>
      </div>

      {project && (
        <Dialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${project.title}?`}
          description="This removes the project, its updates, tasks and every member's contribution record. It can't be undone."
        >
          <FormError error={remove.error} />
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep project
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("Project deleted");
                    navigate("/");
                  },
                })
              }
            >
              Delete forever
            </Button>
          </div>
        </Dialog>
      )}
    </form>
  );
}

function EditExisting({ id }: { id: string }) {
  const project = useProject(id);
  useTitle(project.data ? `Edit ${project.data.title}` : "Edit project");
  if (project.isPending) return <PageSpinner />;
  if (project.isError)
    return (
      <ErrorState
        error={project.error}
        onRetry={() => void project.refetch()}
      />
    );
  if (!project.data.viewer.role || project.data.viewer.role === "member") {
    return (
      <NotFound title="You can't edit this project">
        Only the owner and project admins can change a project's details.
      </NotFound>
    );
  }
  return (
    <>
      <PageHeader title="Edit project" lead={project.data.title} />
      <EditorForm project={project.data} />
    </>
  );
}

function CreateNew() {
  useTitle("New project");
  return (
    <>
      <PageHeader
        title="Start a project"
        lead="Say what you're building and who you need. You can refine everything after publishing."
      />
      <EditorForm />
    </>
  );
}

export default function ProjectEditor() {
  const { id } = useParams();
  return (
    <div className="mx-auto max-w-2xl">
      {id ? <EditExisting id={id} /> : <CreateNew />}
    </div>
  );
}
