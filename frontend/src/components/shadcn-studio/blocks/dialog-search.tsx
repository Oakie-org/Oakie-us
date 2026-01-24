"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { listProjects, listUsers, type UserSearchResult } from "@/lib/api";
import type { Project } from "@/types";
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
  const [projectResults, setProjectResults] = useState<Project[]>([]);
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const navigate = useNavigate();

  const hasQuery = search.trim().length > 0;

  const cancelPendingSearch = () => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    requestIdRef.current += 1;
  };

  const clearResults = () => {
    setProjectResults([]);
    setUserResults([]);
    setLoading(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    cancelPendingSearch();
    if (nextOpen) {
      setSearch("");
      clearResults();
    }
    setOpen(nextOpen);
  };

  const runSearch = async (query: string) => {
    const requestId = (requestIdRef.current += 1);

    try {
      const [projects, users] = await Promise.all([
        listProjects({ q: query, page: 1, page_size: 5 }),
        listUsers(query),
      ]);

      if (requestId !== requestIdRef.current) return;
      setProjectResults(projects);
      setUserResults(users.slice(0, 5));
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.warn("Search failed:", error);
      setProjectResults([]);
      setUserResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    cancelPendingSearch();

    const trimmed = value.trim();
    if (!trimmed) {
      clearResults();
      return;
    }

    setLoading(true);
    setProjectResults([]);
    setUserResults([]);

    debounceRef.current = window.setTimeout(() => {
      void runSearch(trimmed);
    }, 250);
  };

  return (
    <div className={className}>
      <div onClick={() => handleOpenChange(true)}>{trigger}</div>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Search here..."
          value={search}
          onValueChange={handleSearchChange}
          className="text-base [svg:has(+&)]:size-5 [svg:has(+&)]:opacity-100"
        />

        <CommandList className="max-h-[65vh]">
          {hasQuery && loading && (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {hasQuery &&
            !loading &&
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
                  value={project.title}
                  onSelect={() => {
                    handleOpenChange(false);
                    navigate(`/projects/${project.id}`);
                  }}
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
                  value={user.name}
                  onSelect={() => {
                    handleOpenChange(false);
                    navigate(`/users/${user.id}`);
                  }}
                  className="flex flex-col items-start gap-1 !py-2 text-base"
                >
                  <span className="font-medium">{user.name}</span>
                  {(user.bio ||
                    user.location ||
                    (user.skills && user.skills.length > 0)) && (
                    <span className="text-sm text-muted-foreground">
                      {user.bio ||
                        user.location ||
                        user.skills?.slice(0, 2).join(" · ")}
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
