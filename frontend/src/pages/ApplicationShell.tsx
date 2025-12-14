import type { ComponentType, CSSProperties } from "react";
import { Outlet } from "react-router-dom";

import {
  ActivityIcon,
  AlertTriangleIcon,
  BellIcon,
  ChartColumnBigIcon,
  ChartColumnStackedIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  LanguagesIcon,
  LinkIcon,
  SearchIcon,
  Share2Icon,
  SquareCheckBigIcon,
  TrendingUpIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react";
import { CompassIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import oakieLogo from "@/assets/oakie-logo.jpg";
import SearchDialog from "@/components/shadcn-studio/blocks/dialog-search";
import ShareDropdown from "@/components/shadcn-studio/blocks/dropdown-share";
import LanguageDropdown from "@/components/shadcn-studio/blocks/dropdown-language";
import ActivityDialog from "@/components/shadcn-studio/blocks/dialog-activity";
import NotificationDropdown from "@/components/shadcn-studio/blocks/dropdown-notification";
import ProfileDropdown from "@/components/shadcn-studio/blocks/dropdown-profile";

type MenuSubItem = {
  label: string;
  href: string;
  badge?: string;
};

type MenuItem = {
  icon: ComponentType;
  label: string;
} & (
  | {
      href: string;
      badge?: string;
      items?: never;
    }
  | { href?: never; badge?: never; items: MenuSubItem[] }
);

const menuItems: MenuItem[] = [
  {
    icon: ChartColumnBigIcon,
    label: "Dashboard",
    href: "#",
    badge: "5",
  },
];

const corePagesItems: MenuItem[] = [
  {
    icon: CompassIcon,
    label: "Explore",
    href: "/explore",
  },
  {
    icon: UsersIcon,
    label: "Audience",
    href: "#",
  },
  {
    icon: TrendingUpIcon,
    label: "Traffic Sources",
    href: "#",
    badge: "3",
  },
  {
    icon: ChartColumnStackedIcon,
    label: "Engagement Metrics",
    href: "#",
  },
  {
    icon: ClipboardListIcon,
    label: "Custom Reports",
    items: [
      { label: "User Retention", href: "#", badge: "4" },
      { label: "Session Duration", href: "#" },
      { label: "Bounce Rate", href: "#" },
    ],
  },
  {
    icon: AlertTriangleIcon,
    label: "Error Logs",
    href: "#",
  },
  {
    icon: SquareCheckBigIcon,
    label: "Survey Results",
    href: "#",
  },
];

const visualizationItems: MenuItem[] = [
  {
    icon: UploadIcon,
    label: "Data Export",
    href: "#",
  },
  {
    icon: LinkIcon,
    label: "Integrations",
    items: [
      { label: "Google Analytics", href: "#" },
      { label: "Custom API", href: "#", badge: "2" },
    ],
  },
];

const shareData = [
  {
    img: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png",
    name: "John Garrett",
    email: "john@example.com",
    role: "admin",
  },
  {
    img: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png",
    name: "Laura Perez",
    email: "laura@example.com",
    role: "can-view",
  },
  {
    img: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png",
    name: "Shane Adkins",
    email: "shane@example.com",
    role: "admin",
  },
  {
    img: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png",
    name: "Clara Brady",
    email: "clara@example.com",
    role: "can-edit",
  },
];

const morePeople = [
  {
    img: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-8.png",
    name: "Daisy Mitchell",
  },
  {
    img: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-9.png",
    name: "Stephen Adams",
  },
];

const SidebarGroupedMenuItems = ({
  data,
  groupLabel,
}: {
  data: MenuItem[];
  groupLabel?: string;
}) => {
  return (
    <SidebarGroup>
      {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {data.map((item) =>
            item.items ? (
              <Collapsible className="group/collapsible" key={item.label}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.label}>
                      <item.icon />
                      <span>{item.label}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.label}>
                          <SidebarMenuSubButton
                            className="justify-between"
                            asChild
                          >
                            <a href={subItem.href}>
                              {subItem.label}
                              {subItem.badge && (
                                <span className="bg-primary/10 flex h-5 min-w-5 items-center justify-center rounded-full text-xs">
                                  {subItem.badge}
                                </span>
                              )}
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton tooltip={item.label} asChild>
                  <a href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
                {item.badge && (
                  <SidebarMenuBadge className="bg-primary/10 rounded-full">
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const ApplicationShell = () => {
  return (
    <div className="flex min-h-dvh w-full">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "17.5rem",
            "--sidebar-width-icon": "3.5rem",
          } as CSSProperties
        }
      >
        <Sidebar
          variant="floating"
          collapsible="icon"
          className="p-6 pr-0 [&>[data-slot=sidebar-inner]]:group-data-[variant=floating]:rounded-xl"
        >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="gap-2.5 !bg-transparent [&>svg]:size-8"
                  asChild
                >
                  <a href="/">
                    <img
                      src={oakieLogo}
                      alt="Oakie"
                      className="h-34 w-auto rounded-lg object-contain"
                    />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroupedMenuItems data={menuItems} />
            <SidebarGroupedMenuItems
              data={corePagesItems}
              groupLabel="Core Pages"
            />
            <SidebarGroupedMenuItems
              data={visualizationItems}
              groupLabel="Visualization"
            />
          </SidebarContent>
          <SidebarFooter className="[[data-state=collapsed]_&]:hidden">
            <div className="flex flex-col items-start gap-4 overflow-hidden rounded-md p-2">
              <p className="truncate text-xl font-semibold">Go to Premium</p>
              <p className="line-clamp-2 text-sm">
                Explore 600+ courses with lifetime membership
              </p>
              <Button className="truncate">Upgrade</Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="before:bg-background/60 sticky top-0 z-50 before:absolute before:inset-0 before:mask-[linear-gradient(var(--card),var(--card)_18%,transparent_100%)] before:backdrop-blur-md">
            <div className="bg-card relative z-51 mx-auto mt-6 flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border px-6 py-2 shadow-sm sm:w-[calc(100%-3rem)]">
              <div className="flex items-center gap-1.5 sm:gap-4">
                <SidebarTrigger className="[&_svg]:!size-5" />
                <Separator
                  orientation="vertical"
                  className="hidden !h-4 sm:block md:max-lg:hidden"
                />
                <SearchDialog
                  trigger={
                    <>
                      <Button
                        variant="ghost"
                        className="hidden !bg-transparent px-1 py-0 font-normal sm:block md:max-lg:hidden"
                      >
                        <div className="text-muted-foreground hidden items-center gap-1.5 text-sm sm:flex md:max-lg:hidden">
                          <SearchIcon />
                          <span>Type to search...</span>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden md:max-lg:inline-flex"
                      >
                        <SearchIcon />
                        <span className="sr-only">Search</span>
                      </Button>
                    </>
                  }
                />
              </div>
              <div className="flex items-center gap-1.5">
                <ShareDropdown
                  data={shareData}
                  morePeople={morePeople}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Share2Icon />
                    </Button>
                  }
                />
                <LanguageDropdown
                  trigger={
                    <Button variant="ghost" size="icon">
                      <LanguagesIcon />
                    </Button>
                  }
                />
                <ActivityDialog
                  trigger={
                    <Button variant="ghost" size="icon">
                      <ActivityIcon />
                    </Button>
                  }
                />
                <NotificationDropdown
                  trigger={
                    <Button variant="ghost" size="icon" className="relative">
                      <BellIcon />
                      <span className="bg-destructive absolute top-2 right-2.5 size-2 rounded-full" />
                    </Button>
                  }
                />
                <ProfileDropdown
                  trigger={
                    <Button variant="ghost" size="icon" className="size-9.5">
                      <Avatar className="size-9.5 rounded-md">
                        <AvatarImage src="https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />
              </div>
            </div>
          </header>
          <main className="size-full flex-1 px-4 py-6 sm:px-6">
            <Card className="h-250">
              <CardContent className="h-full">
                <div className="h-full rounded-md border bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_1px,var(--card)_2px,var(--card)_15px)] overflow-y-auto">
                  <Outlet />
                </div>
              </CardContent>
            </Card>
          </main>
          <footer className="flex items-center justify-between gap-3 px-4 pb-6 max-lg:flex-col sm:px-6 lg:gap-6">
            <p className="text-muted-foreground text-sm text-balance max-lg:text-center">
              {`©${new Date().getFullYear()}`}{" "}
              <a href="#" className="text-primary">
                Shadcn/studio
              </a>
              , Made for better web design
            </p>
            <div className="text-muted-foreground *:hover:text-primary flex items-center gap-3 text-sm whitespace-nowrap max-[450px]:flex-col min-[450px]:gap-4">
              <a href="#">License</a>
              <a href="#">More Themes</a>
              <a href="#">Documentation</a>
              <a href="#">Support</a>
            </div>
          </footer>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default ApplicationShell;
