import { Suspense } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  Pencil,
  Plus,
  ShieldCheck,
  Sun,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { useTheme } from "@/app/theme";
import { useInboxSummary } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { CountBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/feedback";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/overlay";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Logo } from "@/components/Logo";

const ICON_BUTTON =
  "relative flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sunken";

function DesktopLink({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex h-10 items-center rounded-full px-4 font-display text-[0.95rem] font-semibold transition-colors",
          isActive ? "bg-ink text-paper" : "text-ink hover:bg-sunken",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function ThemeButton() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className={ICON_BUTTON}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
}

function AccountMenu() {
  const { me, signOut } = useAuth();
  const navigate = useNavigate();
  if (!me)
    return (
      <span
        className="size-11 animate-pulse rounded-full bg-sunken"
        aria-hidden
      />
    );
  return (
    <Menu>
      <MenuTrigger className="rounded-full" aria-label="Account menu">
        <Avatar user={me} />
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>
          <span className="block font-display font-semibold text-ink">
            {me.name}
          </span>
          {me.email}
        </MenuLabel>
        <MenuSeparator />
        <MenuItem onSelect={() => navigate(`/u/${me.id}`)}>
          <User aria-hidden /> Your profile
        </MenuItem>
        <MenuItem onSelect={() => navigate(`/u/${me.id}?edit=intro`)}>
          <Pencil aria-hidden /> Edit profile
        </MenuItem>
        <MenuItem onSelect={() => navigate("/verify")}>
          <ShieldCheck aria-hidden /> Verify a record
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onSelect={() => {
            void signOut().then(() => navigate("/"));
          }}
        >
          <LogOut aria-hidden /> Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function TabLink({
  to,
  icon: Icon,
  label,
  badge = 0,
  primary,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  primary?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold transition-colors",
          isActive ? "text-primary" : "text-ink-soft",
        )
      }
    >
      <span
        className={cn(
          "relative flex size-8 items-center justify-center rounded-full",
          primary && "bg-primary text-on-primary",
        )}
      >
        <Icon className="size-5" aria-hidden />
        <CountBadge count={badge} label="unread" />
      </span>
      {label}
    </NavLink>
  );
}

export default function AppShell() {
  const { status } = useAuth();
  const signedIn = status === "signedIn";
  const { data: inbox } = useInboxSummary(signedIn);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link
            to="/"
            className="mr-2 flex shrink-0 items-center rounded-lg"
            aria-label="Oakie home"
          >
            <Logo />
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {signedIn && <DesktopLink to="/">Home</DesktopLink>}
            <DesktopLink to="/explore">Explore</DesktopLink>
            <DesktopLink to="/talent">People</DesktopLink>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <GlobalSearch />
            <ThemeButton />
            {status === "signedIn" && (
              <>
                <Link
                  to="/messages"
                  className={cn(ICON_BUTTON, "hidden md:flex")}
                  aria-label="Messages"
                >
                  <MessageCircle className="size-5" aria-hidden />
                  <CountBadge
                    count={inbox?.unread_messages ?? 0}
                    label="unread messages"
                  />
                </Link>
                <Link
                  to="/notifications"
                  className={ICON_BUTTON}
                  aria-label="Notifications"
                >
                  <Bell className="size-5" aria-hidden />
                  <CountBadge
                    count={inbox?.unread_notifications ?? 0}
                    label="unread notifications"
                  />
                </Link>
                <ButtonLink
                  to="/projects/new"
                  size="sm"
                  className="mx-1 hidden md:inline-flex"
                >
                  <Plus aria-hidden /> New project
                </ButtonLink>
                <AccountMenu />
              </>
            )}
            {status === "guest" && (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink
                  to="/register"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Join Oakie
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 md:pb-16"
      >
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="hidden border-t border-line md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 text-sm text-ink-soft">
          <p>
            Oakie is not an island. It is one built by people who make things
            together.
          </p>
          <Link
            to="/verify"
            className="flex items-center gap-1.5 font-medium text-ink hover:underline"
          >
            <ShieldCheck className="size-4" aria-hidden /> Verify a contribution
            record
          </Link>
        </div>
      </footer>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <TabLink to="/" icon={Home} label="Home" />
        <TabLink to="/explore" icon={Compass} label="Explore" />
        {signedIn && (
          <TabLink to="/projects/new" icon={Plus} label="Create" primary />
        )}
        <TabLink to="/talent" icon={Users} label="People" />
        {signedIn ? (
          <TabLink
            to="/messages"
            icon={MessageCircle}
            label="Messages"
            badge={inbox?.unread_messages}
          />
        ) : (
          <TabLink to="/login" icon={User} label="Sign in" />
        )}
      </nav>
    </div>
  );
}
