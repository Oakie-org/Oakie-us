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
    <div className="max-w-xl pt-6 sm:pt-12">
      <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-ink-soft">
        {children ?? "The link may be old, or the page may be private."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink to="/explore">Explore projects</ButtonLink>
        <ButtonLink to="/" variant="outline">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
