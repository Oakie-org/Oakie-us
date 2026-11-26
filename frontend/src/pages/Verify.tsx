import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { ApiError } from "@/lib/api";
import { useProof } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { PageHeader, useTitle } from "@/components/page";
import { RecordCard } from "@/components/RecordCard";

export default function Verify() {
  useTitle("Verify a contribution record");
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(code);
  const proof = useProof(code);
  const notFound =
    proof.error instanceof ApiError && proof.error.status === 404;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const cleaned = draft.trim().toUpperCase();
    if (cleaned) navigate(`/verify/${encodeURIComponent(cleaned)}`);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Verify a record"
        lead="Every Oakie member gets a contribution record for each project they join. Enter its code to confirm it's real and current."
      />
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <Field
          label="Record code"
          hint="Looks like OAK-7KQ2-M9XD"
          className="flex-1"
        >
          {(control) => (
            <Input
              {...control}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="font-mono uppercase"
              maxLength={20}
            />
          )}
        </Field>
        <Button
          type="submit"
          size="lg"
          className="sm:mb-[1.75rem]"
          disabled={!draft.trim()}
        >
          <ShieldCheck aria-hidden /> Verify
        </Button>
      </form>

      <div className="mt-10" aria-live="polite">
        {!code ? null : proof.isPending ? (
          <Skeleton className="h-72 rounded-card" />
        ) : notFound ? (
          <div className="rounded-card border border-line bg-surface px-5 py-6 sm:px-6">
            <h2 className="font-sans text-base">
              No record matches <span className="font-mono">{code}</span>
            </h2>
            <p className="mt-1 max-w-prose text-ink-soft">
              Check the code for typos. Records are also withdrawn when a member
              leaves a project.
            </p>
          </div>
        ) : proof.isError ? (
          <ErrorState
            error={proof.error}
            onRetry={() => void proof.refetch()}
          />
        ) : (
          <RecordCard record={proof.data} verified />
        )}
      </div>
    </div>
  );
}
