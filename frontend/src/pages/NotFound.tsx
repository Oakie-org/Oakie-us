import { Compass } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { useTitle } from "@/components/page";

export default function NotFound({
  title = "This page drifted off the map",
  children,
}: {
  title?: string;
  children?: string;
}) {
  useTitle("Not found");
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <span className="flex size-20 items-center justify-center rounded-3xl bg-block-sun text-block-ink">
        <Compass className="size-9" aria-hidden />
      </span>
      <h1 className="mt-6 text-4xl">{title}</h1>
      <p className="mt-2 max-w-md text-lg text-ink-soft">
        {children ??
          "The link may be old, or the page may be private. Let's get you back to solid ground."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/explore">Explore projects</ButtonLink>
        <ButtonLink to="/" variant="outline">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
