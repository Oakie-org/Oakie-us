import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Error = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center text-center max-w-lg">
        <h2 className="mb-6 text-5xl font-semibold">500</h2>
        <h3 className="mb-1.5 text-3xl font-semibold">Internal Server Error</h3>
        <p className="text-muted-foreground mb-6">
          Something went wrong on our end. We're working on it. Please try again
          later.
        </p>
        <Button asChild size="lg" className="rounded-lg text-base">
          <Link to="/">Back to home page</Link>
        </Button>
      </div>
    </div>
  );
};

export default Error;
