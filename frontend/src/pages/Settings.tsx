import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { useCatalog, useUpdateMe } from "@/lib/queries";
import type { Me, ProfileUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { FormError, PageSpinner } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { useToast } from "@/components/ui/toast";
import { PageHeader, useTitle } from "@/components/page";
import { ProjectCover } from "@/components/ProjectCover";

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
  });
  const [nameTouched, setNameTouched] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const nameError = draft.name.trim() ? undefined : "Your name can't be empty.";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setNameTouched(true);
    if (nameError) return;
    update.mutate(
      { ...draft, name: draft.name.trim() },
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
      <section className="flex flex-col gap-6 rounded-card bg-surface p-6 sm:p-8">
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
          label="Banner"
          purpose="user_banner"
          value={draft.banner_url}
          onChange={(url) => set("banner_url", url)}
          preview={
            <div className="h-16 w-40 overflow-hidden rounded-xl">
              <ProjectCover
                project={{
                  id: me.id,
                  category: "",
                  image_url: draft.banner_url,
                }}
              />
            </div>
          }
        />
      </section>

      <section className="flex flex-col gap-5 rounded-card bg-surface p-6 sm:p-8">
        <h2 className="text-xl">About you</h2>
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
          hint="One line that says what you do. Shown wherever your name appears."
        >
          {(control) => (
            <Input
              {...control}
              value={draft.headline}
              onChange={(event) => set("headline", event.target.value)}
              maxLength={140}
              placeholder="Quant research @ student fund"
            />
          )}
        </Field>
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
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="School">
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
        <Field label="Website or portfolio">
          {(control) => (
            <Input
              {...control}
              type="url"
              inputMode="url"
              value={draft.website}
              onChange={(event) => set("website", event.target.value)}
              maxLength={200}
              placeholder="https://"
              autoComplete="url"
            />
          )}
        </Field>
      </section>

      <section className="flex flex-col gap-5 rounded-card bg-surface p-6 sm:p-8">
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
        <fieldset>
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
