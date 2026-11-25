import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { ACCENTS, toneNamed } from "@/lib/categories";
import { profileStrength, safeUrl } from "@/lib/profile";
import { useCatalog, useUpdateMe, useUserProjects } from "@/lib/queries";
import type { Me, ProfileLink, ProfileUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { FormError, PageSpinner } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { useToast } from "@/components/ui/toast";
import { PageHeader, useTitle } from "@/components/page";

type Draft = Required<ProfileUpdate>;

function ProfileForm({ me, welcome }: { me: Me; welcome: boolean }) {
  const { data: catalog } = useCatalog();
  const update = useUpdateMe();
  const toast = useToast();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>({
    name: me.name,
    headline: me.headline,
    bio: me.bio,
    city: me.city,
    uni: me.uni,
    skills: me.skills,
    open_to: me.open_to,
    website: me.website,
    avatar_url: me.avatar_url,
    banner_url: me.banner_url,
    links: me.links,
    accent: me.accent,
    pinned_project_ids: me.pinned_project_ids,
    availability: me.availability,
  });
  const mine = useUserProjects(me.id);
  const strength = profileStrength({ ...me, ...draft });
  const setLink = (index: number, patch: Partial<ProfileLink>) =>
    set(
      "links",
      draft.links.map((link, position) =>
        position === index ? { ...link, ...patch } : link,
      ),
    );
  const togglePin = (id: string) =>
    set(
      "pinned_project_ids",
      draft.pinned_project_ids.includes(id)
        ? draft.pinned_project_ids.filter((pid) => pid !== id)
        : [...draft.pinned_project_ids, id].slice(0, 3),
    );

  // Arriving from "Next: add a headline" lands on that field.
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (!target) return;
    const node = document.getElementById(`profile-${target}`);
    node?.scrollIntoView({ block: "center" });
    node
      ?.querySelector<HTMLElement>("input, textarea, button")
      ?.focus({ preventScroll: true });
  }, []);
  const [nameTouched, setNameTouched] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const nameError = draft.name.trim() ? undefined : "Your name can't be empty.";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setNameTouched(true);
    if (nameError) return;
    update.mutate(
      {
        ...draft,
        name: draft.name.trim(),
        // Half-filled link rows are dropped rather than rejected.
        links: draft.links
          .map((link) => ({
            label: link.label.trim(),
            url: safeUrl(link.url.trim()) ?? "",
          }))
          .filter((link) => link.label && link.url),
      },
      {
        onSuccess: () => {
          toast.success("Profile saved");
          navigate(welcome ? "/" : `/u/${me.id}`);
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <section
        className="rounded-card bg-surface p-6 sm:p-8"
        aria-label="Profile strength"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl">
            {strength.percent === 100
              ? "Your profile is complete"
              : "Profile strength"}
          </h2>
          <span className="font-display text-2xl font-semibold tabular-nums">
            {strength.percent}%
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-line"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out-soft"
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-[0.95rem] sm:grid-cols-2">
          {strength.steps.map((step) => (
            <li
              key={step.key}
              className={cn(
                "flex items-center gap-2",
                step.done ? "text-ink-soft" : "font-medium",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  step.done
                    ? "bg-primary text-on-primary"
                    : "border-2 border-dashed border-ink-soft",
                )}
              >
                {step.done && <Check className="size-3.5" aria-hidden />}
              </span>
              {step.label}
            </li>
          ))}
        </ul>
      </section>

      <section
        id="profile-photo"
        className="flex flex-col gap-6 rounded-card bg-surface p-6 sm:p-8"
      >
        <h2 className="text-xl">Photos</h2>
        <ImagePicker
          label="Profile photo"
          purpose="user_avatar"
          value={draft.avatar_url}
          onChange={(url) => set("avatar_url", url)}
          preview={
            <Avatar
              user={{
                id: me.id,
                name: draft.name || me.name,
                avatar_url: draft.avatar_url,
              }}
              size="lg"
            />
          }
        />
        <ImagePicker
          label="Banner (optional)"
          hint="A picture of your own. Without one, your profile shows a band in your accent colour, or nothing at all."
          purpose="user_banner"
          value={draft.banner_url}
          onChange={(url) => set("banner_url", url)}
          preview={
            draft.banner_url && (
              <img
                src={draft.banner_url}
                alt=""
                className="h-16 w-40 rounded-xl bg-sunken object-cover"
              />
            )
          }
        />
      </section>

      <section className="flex flex-col gap-5 rounded-card bg-surface p-6 sm:p-8">
        <h2 className="text-xl">About you</h2>
        <span id="profile-headline" className="-mb-5" />
        <Field
          label="Name"
          required
          error={nameTouched ? nameError : undefined}
        >
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
          className="scroll-mt-24"
          hint="One line that says what you do. Shown wherever your name appears."
        >
          {(control) => (
            <Input
              {...control}
              value={draft.headline}
              onChange={(event) => set("headline", event.target.value)}
              maxLength={140}
              placeholder="Illustrator, open to side projects"
            />
          )}
        </Field>
        <span id="profile-bio" className="-my-2.5" />
        <Field label="Bio" hint={`${draft.bio.length}/1200`}>
          {(control) => (
            <Textarea
              {...control}
              value={draft.bio}
              onChange={(event) => set("bio", event.target.value)}
              maxLength={1200}
              rows={5}
              placeholder="What have you built? What are you looking for?"
            />
          )}
        </Field>
        <div id="profile-place" className="grid gap-5 sm:grid-cols-2">
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
          <Field label="City">
            {(control) => (
              <Input
                {...control}
                value={draft.city}
                onChange={(event) => set("city", event.target.value)}
                maxLength={140}
                autoComplete="address-level2"
              />
            )}
          </Field>
        </div>
        <Field
          label="Availability"
          hint="How much time you can give a team right now."
        >
          {(control) => (
            <Input
              {...control}
              value={draft.availability}
              onChange={(event) => set("availability", event.target.value)}
              maxLength={140}
              placeholder="5-10 hrs / week"
              list="availability-ideas"
            />
          )}
        </Field>
        <datalist id="availability-ideas">
          {[
            "A few hours a week",
            "5-10 hrs / week",
            "10-20 hrs / week",
            "Full-time this summer",
            "Not available right now",
          ].map((idea) => (
            <option key={idea} value={idea} />
          ))}
        </datalist>
      </section>

      <section
        id="profile-links"
        className="flex flex-col gap-5 rounded-card bg-surface p-6 sm:p-8"
      >
        <div>
          <h2 className="text-xl">Make it yours</h2>
          <p className="mt-1 text-ink-soft">
            Your profile doubles as a card you can link from a résumé or embed
            on your own site.
          </p>
        </div>
        <fieldset>
          <legend className="font-display text-sm font-semibold">
            Accent colour
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {["", ...ACCENTS].map((name) => (
              <label
                key={name || "auto"}
                title={name || "Automatic"}
                className={cn(
                  "flex size-10 cursor-pointer items-center justify-center rounded-full border-2 transition-transform has-focus-visible:outline-3 has-focus-visible:outline-primary hover:scale-110",
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
                  aria-label={name || "Automatic"}
                />
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[0.625rem] font-semibold text-block-ink",
                    toneNamed(name)?.bg ?? "bg-sunken",
                  )}
                >
                  {name ? "" : "Auto"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <p className="font-display text-sm font-semibold">Links</p>
          <p className="text-sm text-ink-soft">
            Portfolio, GitHub, a reel, a paper: whatever shows your work. Up to
            6.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {draft.links.map((link, index) => (
              <div key={index} className="flex animate-pop gap-2">
                <Input
                  value={link.label}
                  onChange={(event) =>
                    setLink(index, { label: event.target.value })
                  }
                  maxLength={40}
                  placeholder="Label"
                  aria-label={`Link ${index + 1} label`}
                  className="w-32 shrink-0 sm:w-40"
                />
                <Input
                  value={link.url}
                  onChange={(event) =>
                    setLink(index, { url: event.target.value })
                  }
                  maxLength={200}
                  placeholder="https://"
                  type="url"
                  inputMode="url"
                  aria-label={`Link ${index + 1} address`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove link ${index + 1}`}
                  onClick={() =>
                    set(
                      "links",
                      draft.links.filter((_, position) => position !== index),
                    )
                  }
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            ))}
            {draft.links.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() =>
                  set("links", [...draft.links, { label: "", url: "" }])
                }
              >
                <Plus aria-hidden /> Add a link
              </Button>
            )}
          </div>
        </div>
        {Boolean(mine.data?.length) && (
          <fieldset>
            <legend className="font-display text-sm font-semibold">
              Featured projects
            </legend>
            <p className="text-sm text-ink-soft">
              Pin up to 3 to the top of your profile.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {mine.data!.map((project) => {
                const pinned = draft.pinned_project_ids.includes(project.id);
                const full = !pinned && draft.pinned_project_ids.length >= 3;
                return (
                  <label
                    key={project.id}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-2xl border-2 px-3.5 py-2 transition-colors",
                      pinned ? "border-primary bg-primary-soft" : "border-line",
                      full
                        ? "opacity-50"
                        : "cursor-pointer hover:border-ink-soft",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={pinned}
                      disabled={full}
                      onChange={() => togglePin(project.id)}
                      className="size-5 accent-(--primary)"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {project.title}
                    </span>
                    <span className="shrink-0 text-sm text-ink-soft">
                      {project.member_title || project.role}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </section>

      <section
        id="profile-skills"
        className="flex flex-col gap-5 rounded-card bg-surface p-6 sm:p-8"
      >
        <h2 className="text-xl">How teams find you</h2>
        <Field label="Skills" hint="Press Enter to add. Up to 20.">
          {(control) => (
            <ChipInput
              {...control}
              value={draft.skills}
              onChange={(skills) => set("skills", skills)}
              suggestions={catalog?.skills}
              max={20}
              placeholder="Add a skill"
            />
          )}
        </Field>
        <fieldset id="profile-open_to">
          <legend className="font-display text-sm font-semibold">
            Open to
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {catalog?.open_to.map((option) => {
              const active = draft.open_to.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    set(
                      "open_to",
                      active
                        ? draft.open_to.filter((value) => value !== option)
                        : [...draft.open_to, option],
                    )
                  }
                  className={cn(
                    "flex h-10 items-center gap-1.5 rounded-full border-2 px-4 font-display text-sm font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary text-on-primary"
                      : "border-line bg-surface hover:border-ink",
                  )}
                >
                  {active && <Check className="size-4" aria-hidden />}
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <FormError error={update.error} />
      <div className="flex flex-wrap justify-end gap-3">
        <ButtonLink to={welcome ? "/" : `/u/${me.id}`} variant="ghost">
          {welcome ? "Skip for now" : "Cancel"}
        </ButtonLink>
        <Button type="submit" size="lg" loading={update.isPending}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

export default function Settings() {
  const [params] = useSearchParams();
  const welcome = params.has("welcome");
  useTitle(welcome ? "Welcome" : "Edit profile");
  const { me } = useAuth();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={welcome ? "Welcome to Oakie" : "Edit profile"}
        lead={
          welcome
            ? "A few details help the right teams find you. You can change all of this later."
            : undefined
        }
      />
      {me ? <ProfileForm me={me} welcome={welcome} /> : <PageSpinner />}
    </div>
  );
}
