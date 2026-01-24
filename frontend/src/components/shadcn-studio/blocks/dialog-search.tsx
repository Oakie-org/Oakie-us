"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Props = {
  trigger: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

const SearchDialog = ({ defaultOpen = false, trigger, className }: Props) => {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const hasQuery = search.trim().length > 0;

  const projectResults: Array<{
    id: string;
    title: string;
    subtitle?: string;
  }> = [];
  const userResults: Array<{ id: string; name: string; subtitle?: string }> =
    [];

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSearch("");
    }
    setOpen(nextOpen);
  };

  return (
    <div className={className}>
      <div onClick={() => handleOpenChange(true)}>{trigger}</div>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Search here..."
          value={search}
          onValueChange={setSearch}
          className="text-base [svg:has(+&)]:size-5 [svg:has(+&)]:opacity-100"
        />

        <CommandList className="max-h-[65vh]">
          {hasQuery &&
            projectResults.length === 0 &&
            userResults.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

          {projectResults.length > 0 && (
            <CommandGroup
              heading="Projects"
              className="[&_[cmdk-group-heading]]:text-muted-foreground !px-4 !py-4 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:uppercase"
            >
              {projectResults.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => setOpen(false)}
                  className="flex flex-col items-start gap-1 !py-2 text-base"
                >
                  <span className="font-medium">{project.title}</span>
                  {project.subtitle && (
                    <span className="text-sm text-muted-foreground">
                      {project.subtitle}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {userResults.length > 0 && (
            <CommandGroup
              heading="Users"
              className="[&_[cmdk-group-heading]]:text-muted-foreground !px-4 !py-4 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:uppercase"
            >
              {userResults.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => setOpen(false)}
                  className="flex flex-col items-start gap-1 !py-2 text-base"
                >
                  <span className="font-medium">{user.name}</span>
                  {user.subtitle && (
                    <span className="text-sm text-muted-foreground">
                      {user.subtitle}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default SearchDialog;
