import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { Logo } from "@/components/Logo";
import { useTitle } from "@/components/page";

// Seeded by the backend's local dev server (serverless_backend/app/local/seed.py).
const LOCAL_DEMO = { email: "maya@oakie.dev", password: "oakie-demo-2026" };

type Step = "form" | "confirm";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  useTitle(isRegister ? "Join Oakie" : "Sign in");

  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from ?? "/";

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // Set before the session exists: the moment it does, this screen redirects,
  // and a new member goes to the guided start rather than straight back.
  const [joining, setJoining] = useState(false);

  if (auth.status === "signedIn")
    return joining ? (
      <Navigate to="/welcome" replace state={{ from: returnTo }} />
    ) : (
      <Navigate to={returnTo} replace />
    );

  const errors = {
    name: isRegister && !name.trim() ? "Tell us what to call you." : "",
    email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      ? ""
      : "Enter a valid email address.",
    password:
      password.length < 8
        ? "Use at least 8 characters."
        : isRegister &&
            !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) &&
            auth.mode === "cognito"
          ? "Include an uppercase letter, a lowercase letter and a number."
          : "",
  };
  const shown = (field: keyof typeof errors) =>
    touched[field] ? errors[field] || undefined : undefined;
  const touch = (field: string) =>
    setTouched((current) => ({ ...current, [field]: true }));

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (problem) {
      setJoining(false);
      setError(problem);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (errors.name || errors.email || errors.password) return;
    void run(async () => {
      if (!isRegister) {
        await auth.signIn(email, password);
        navigate(returnTo, { replace: true });
        return;
      }
      setJoining(true);
      const { needsConfirmation } = await auth.signUp(
        email,
        password,
        name.trim(),
      );
      if (needsConfirmation) setStep("confirm");
    });
  }

  function onConfirm(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await auth.confirmSignUp(email, code.trim());
      setJoining(true);
      await auth.signIn(email, password);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-4 sm:px-6">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Oakie home" className="rounded-lg">
            <Logo />
          </Link>
          <Link
            to="/"
            className="flex h-10 items-center gap-1.5 rounded-field px-3 text-sm text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to Oakie
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-[12vh] pt-10">
          {step === "confirm" ? (
            <form
              onSubmit={onConfirm}
              noValidate
              className="flex flex-col gap-5"
            >
              <div>
                <h1 className="text-3xl leading-tight">Check your inbox</h1>
                <p className="mt-2 text-ink-soft">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-ink">{email}</span>.
                </p>
              </div>
              <Field label="Confirmation code" required>
                {(control) => (
                  <Input
                    {...control}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                )}
              </Field>
              <FormError error={error} />
              <Button
                type="submit"
                size="lg"
                loading={busy}
                disabled={code.trim().length < 4}
              >
                Confirm and continue
              </Button>
            </form>
          ) : (
            <form
              onSubmit={onSubmit}
              noValidate
              className="flex flex-col gap-5"
            >
              <div>
                <h1 className="text-3xl leading-tight">
                  {isRegister ? "Create your account" : "Sign in to Oakie"}
                </h1>
                <p className="mt-2 text-ink-soft">
                  {isRegister
                    ? "A name, an email and a password. The rest can wait."
                    : "Your projects, applications and messages are where you left them."}
                </p>
              </div>

              {isRegister && (
                <Field label="Name" required error={shown("name")}>
                  {(control) => (
                    <Input
                      {...control}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      onBlur={() => touch("name")}
                      autoComplete="name"
                      maxLength={60}
                    />
                  )}
                </Field>
              )}
              <Field label="Email" required error={shown("email")}>
                {(control) => (
                  <Input
                    {...control}
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => touch("email")}
                    autoComplete="email"
                  />
                )}
              </Field>
              <Field
                label="Password"
                required
                error={shown("password")}
                hint={isRegister ? "At least 8 characters." : undefined}
              >
                {(control) => (
                  <div className="relative">
                    <Input
                      {...control}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() => touch("password")}
                      autoComplete={
                        isRegister ? "new-password" : "current-password"
                      }
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-field text-ink-soft hover:text-ink"
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" aria-hidden />
                      ) : (
                        <Eye className="size-5" aria-hidden />
                      )}
                    </button>
                  </div>
                )}
              </Field>

              <FormError error={error} />
              <Button type="submit" size="lg" loading={busy}>
                {isRegister ? "Create account" : "Sign in"}
              </Button>

              {auth.mode === "local" && !isRegister && (
                <div className="rounded-field border border-line bg-sunken px-4 py-3 text-sm">
                  <p className="font-medium">Local demo mode</p>
                  <p className="mt-0.5 text-ink-soft">
                    Accounts live in the in-memory dev backend and reset when it
                    restarts.
                  </p>
                  <button
                    type="button"
                    className="mt-2 font-medium underline underline-offset-2"
                    onClick={() => {
                      setEmail(LOCAL_DEMO.email);
                      setPassword(LOCAL_DEMO.password);
                    }}
                  >
                    Fill in the demo account
                  </button>
                </div>
              )}

              <p className="text-ink-soft">
                {isRegister ? "Already have an account? " : "New to Oakie? "}
                <Link
                  to={isRegister ? "/login" : "/register"}
                  state={location.state}
                  className="font-medium text-ink underline underline-offset-4"
                >
                  {isRegister ? "Sign in" : "Create one"}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
