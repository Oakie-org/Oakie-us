import { useState } from "react";

import { useApply } from "@/lib/queries";
import type { ProjectDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

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
  const toast = useToast();
  const [roleTitle, setRoleTitle] = useState(role);
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);
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
        apply.mutate(
          { message: message.trim(), role_title: roleTitle },
          {
            onSuccess: () => {
              toast.success("Application sent. The team will be notified.");
              onClose();
            },
          },
        );
      }}
    >
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
      <FormError error={apply.error} />
      <Button type="submit" size="lg" loading={apply.isPending}>
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
