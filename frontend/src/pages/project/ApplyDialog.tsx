import { useState } from "react";

import { useAuth } from "@/auth/AuthProvider";
import { useApply, useUpdateMe } from "@/lib/queries";
import type { ProjectDetail } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { SkillPicker } from "@/components/profile/fields";

interface ApplyDialogProps {
  project: ProjectDetail;
  /** null = closed; "" = open with no role preselected. */
  role: string | null;
  onClose: () => void;
}

function ApplyForm({
  project,
  role,
  onClose,
}: {
  project: ProjectDetail;
  role: string;
  onClose: () => void;
}) {
  const apply = useApply(project.id);
  const update = useUpdateMe();
  const toast = useToast();
  const { me } = useAuth();
  // Arriving without a role in mind, start on the one their skills fit.
  const [roleTitle, setRoleTitle] = useState(
    () =>
      role ||
      (project.open_roles.find((open) =>
        open.skills.some(
          (skill) =>
            me?.skills.some(
              (mine) => mine.toLowerCase() === skill.toLowerCase(),
            ),
        ),
      )?.title ??
        ""),
  );
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);
  // The team reads the profile next to the message. If it says nothing about
  // what the applicant can do, this is the moment that question earns its answer.
  const [askSkills] = useState(() => me?.skills.length === 0);
  const [skills, setSkills] = useState<string[]>([]);
  const messageError = message.trim()
    ? undefined
    : "Tell the team a little about what you'd bring.";

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (messageError) return;
        const send = () =>
          apply.mutate(
            { message: message.trim(), role_title: roleTitle },
            {
              onSuccess: () => {
                toast.success("Application sent. The team will be notified.");
                onClose();
              },
            },
          );
        if (askSkills && skills.length > 0 && me?.skills.length === 0)
          update.mutate({ skills }, { onSuccess: send });
        else send();
      }}
    >
      {me && (
        <div className="rounded-2xl bg-sunken p-3.5">
          <p className="text-[0.8125rem] text-ink-soft">
            The team sees this next to your message
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar user={me} />
            <div className="min-w-0">
              <p className="truncate font-display font-semibold">{me.name}</p>
              <p className="truncate text-sm text-ink-soft">
                {[me.headline, me.skills.slice(0, 4).join(" \u00b7 ")]
                  .filter(Boolean)
                  .join(" \u2014 ") || "No headline or skills yet"}
              </p>
            </div>
          </div>
        </div>
      )}
      {askSkills && (
        <Field
          label="Your skills"
          hint="Optional. Saved to your profile, so you only do this once."
        >
          {(control) => (
            <SkillPicker {...control} value={skills} onChange={setSkills} />
          )}
        </Field>
      )}
      {project.open_roles.length > 0 && (
        <Field label="Role">
          {(control) => (
            <Select
              {...control}
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
            >
              <option value="">Wherever I'm useful</option>
              {project.open_roles.map((openRole) => (
                <option key={openRole.title}>{openRole.title}</option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <Field
        label="Why you"
        required
        error={touched ? messageError : undefined}
        hint="What you'd take on, and something you've made before."
      >
        {(control) => (
          <Textarea
            {...control}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={1200}
            rows={5}
            autoFocus
          />
        )}
      </Field>
      <FormError error={update.error ?? apply.error} />
      <Button
        type="submit"
        size="lg"
        loading={update.isPending || apply.isPending}
      >
        Send application
      </Button>
    </form>
  );
}

export function ApplyDialog({ project, role, onClose }: ApplyDialogProps) {
  return (
    <Dialog
      open={role !== null}
      onOpenChange={(next) => !next && onClose()}
      title={`Apply to ${project.title}`}
      description="The project owner sees this message and your profile."
    >
      {/* Mounted per opening, so each application starts from a clean form. */}
      {role !== null && (
        <ApplyForm project={project} role={role} onClose={onClose} />
      )}
    </Dialog>
  );
}
