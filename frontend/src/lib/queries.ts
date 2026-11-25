/**
 * Server state. Every screen reads and writes the API through these hooks, so
 * cache keys and invalidation rules live in one file.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  keepPreviousData,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  Application,
  Catalog,
  ContributionRecord,
  Conversation,
  ConversationThread,
  CursorPage,
  InboxSummary,
  Invitation,
  Me,
  Member,
  Message,
  NotificationList,
  ProfileUpdate,
  Project,
  ProjectDetail,
  ProjectFacets,
  ProjectInput,
  ProjectMembership,
  ProjectRole,
  SearchSuggestions,
  StatsOverview,
  Task,
  TaskInput,
  TimelineKind,
  TimelinePost,
  UserProfile,
  UserSummary,
} from "@/lib/types";

export const keys = {
  me: ["me"] as const,
  catalog: ["catalog"] as const,
  stats: ["stats"] as const,
  projects: (filters: object) => ["projects", "list", filters] as const,
  project: (id: string) => ["projects", id] as const,
  members: (id: string) => ["projects", id, "members"] as const,
  timeline: (id: string) => ["projects", id, "timeline"] as const,
  tasks: (id: string) => ["projects", id, "tasks"] as const,
  applications: (id: string) => ["projects", id, "applications"] as const,
  facets: (filters: object) => ["projects", "facets", filters] as const,
  suggest: (q: string) => ["search", "suggest", q] as const,
  invitations: (id: string) => ["projects", id, "invitations"] as const,
  myInvitations: ["me", "invitations"] as const,
  followers: (id: string, kind: string) => ["users", id, kind] as const,
  followed: ["projects", "followed"] as const,
  myApplications: ["me", "applications"] as const,
  talent: (filters: object) => ["talent", filters] as const,
  user: (id: string) => ["users", id] as const,
  userProjects: (id: string) => ["users", id, "projects"] as const,
  contributions: (id: string) => ["users", id, "contributions"] as const,
  proof: (code: string) => ["proof", code] as const,
  inbox: ["inbox", "summary"] as const,
  notifications: ["inbox", "notifications"] as const,
  conversations: ["inbox", "conversations"] as const,
  thread: (id: string) => ["inbox", "conversations", id] as const,
};

// ------------------------------------------------------------------ platform

export function useCatalog() {
  return useQuery({
    queryKey: keys.catalog,
    queryFn: () => api.get<Catalog>("/meta"),
    staleTime: Infinity,
  });
}

export function useStats() {
  return useQuery({
    queryKey: keys.stats,
    queryFn: () => api.get<StatsOverview>("/stats/overview"),
  });
}

// ------------------------------------------------------------------ projects

export interface ProjectFilters {
  q?: string;
  category?: string;
  status?: string;
  city?: string;
  uni?: string;
  tag?: string;
  skill?: string;
  remote?: boolean;
  open_only?: boolean;
  within_days?: number;
}

/** Filter options with live counts for the same filters the listing takes. */
export function useProjectFacets(filters: ProjectFilters) {
  return useQuery({
    queryKey: keys.facets(filters),
    queryFn: () => api.get<ProjectFacets>("/projects/facets", { ...filters }),
    placeholderData: keepPreviousData,
  });
}

/** Typeahead. Stale requests are cancelled by the query's abort signal. */
export function useSuggestions(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: keys.suggest(term.toLowerCase()),
    queryFn: () =>
      api.get<SearchSuggestions>("/search/suggest", { q: term, limit: 4 }),
    enabled: term.length >= 2,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useProjects(filters: ProjectFilters, pageSize = 12) {
  return useInfiniteQuery({
    queryKey: keys.projects({ ...filters, pageSize }),
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<Project>>("/projects", {
        ...filters,
        limit: pageSize,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: keys.project(id),
    queryFn: () => api.get<ProjectDetail>(`/projects/${id}`),
    enabled: Boolean(id),
  });
}

function invalidateProject(client: QueryClient, id: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: keys.project(id) }),
    client.invalidateQueries({ queryKey: ["projects", "list"] }),
  ]);
}

export function useSaveProject(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) =>
      id
        ? api.patch<Project>(`/projects/${id}`, input)
        : api.post<Project>("/projects", input),
    onSuccess: (project) => {
      client.invalidateQueries({ queryKey: ["users"] });
      client.invalidateQueries({ queryKey: keys.stats });
      return invalidateProject(client, project.id);
    },
  });
}

export function useDeleteProject(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>(`/projects/${id}`),
    onSuccess: () => {
      client.removeQueries({ queryKey: keys.project(id) });
      client.invalidateQueries({ queryKey: ["users"] });
      return client.invalidateQueries({ queryKey: ["projects", "list"] });
    },
  });
}

/** Like or follow, applied optimistically so the button responds at once. */
export function useProjectReaction(id: string, kind: "like" | "follow") {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) =>
      active
        ? api.put<void>(`/projects/${id}/${kind}`)
        : api.delete<void>(`/projects/${id}/${kind}`),
    onMutate: async (active) => {
      await client.cancelQueries({ queryKey: keys.project(id) });
      const previous = client.getQueryData<ProjectDetail>(keys.project(id));
      if (previous) {
        const flag = kind === "like" ? "has_liked" : "is_following";
        const counter = kind === "like" ? "likes" : "follows";
        if (previous.viewer[flag] !== active) {
          client.setQueryData<ProjectDetail>(keys.project(id), {
            ...previous,
            [counter]: Math.max(0, previous[counter] + (active ? 1 : -1)),
            viewer: { ...previous.viewer, [flag]: active },
          });
        }
      }
      return { previous };
    },
    onError: (_error, _active, context) => {
      if (context?.previous)
        client.setQueryData(keys.project(id), context.previous);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: keys.followed });
      return client.invalidateQueries({ queryKey: keys.project(id) });
    },
  });
}

export function useFollowedProjects(enabled: boolean) {
  return useQuery({
    queryKey: keys.followed,
    queryFn: () => api.get<Project[]>("/projects/following"),
    enabled,
  });
}

// ---------------------------------------------------------------------- team

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: keys.members(projectId),
    queryFn: () => api.get<Member[]>(`/projects/${projectId}/members`),
  });
}

function invalidateTeam(client: QueryClient, projectId: string) {
  client.invalidateQueries({ queryKey: keys.members(projectId) });
  client.invalidateQueries({ queryKey: ["users"] });
  return client.invalidateQueries({ queryKey: keys.project(projectId) });
}

export function useUpdateMember(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      ...fields
    }: {
      userId: string;
      role?: ProjectRole;
      title?: string;
    }) => api.patch<void>(`/projects/${projectId}/members/${userId}`, fields),
    onSuccess: () => invalidateTeam(client, projectId),
  });
}

export function useRemoveMember(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<void>(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => invalidateTeam(client, projectId),
  });
}

// -------------------------------------------------------------- applications

export function useApplications(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.applications(projectId),
    queryFn: () =>
      api.get<Application[]>(`/projects/${projectId}/applications`),
    enabled,
  });
}

export function useMyApplications(enabled: boolean) {
  return useQuery({
    queryKey: keys.myApplications,
    queryFn: () => api.get<Application[]>("/users/me/applications"),
    enabled,
  });
}

export function useApply(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { message: string; role_title: string }) =>
      api.post<Application>(`/projects/${projectId}/applications`, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.myApplications });
      return client.invalidateQueries({ queryKey: keys.project(projectId) });
    },
  });
}

export function useWithdrawApplication(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete<void>(`/projects/${projectId}/applications/me`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.myApplications });
      return client.invalidateQueries({ queryKey: keys.project(projectId) });
    },
  });
}

export function useDecideApplication(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicantId,
      approve,
    }: {
      applicantId: string;
      approve: boolean;
    }) =>
      api.post<Application>(
        `/projects/${projectId}/applications/${applicantId}/decision`,
        { approve },
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.applications(projectId) });
      return invalidateTeam(client, projectId);
    },
  });
}

// ------------------------------------------------------------------ timeline

export interface PostInput {
  title: string;
  content: string;
  kind: TimelineKind;
  media_urls: string[];
}

export function useTimeline(projectId: string) {
  return useInfiniteQuery({
    queryKey: keys.timeline(projectId),
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<TimelinePost>>(`/projects/${projectId}/timeline`, {
        cursor: pageParam,
        limit: 10,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor,
  });
}

export function useSavePost(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: PostInput & { id?: string }) =>
      id
        ? api.patch<TimelinePost>(
            `/projects/${projectId}/timeline/${id}`,
            input,
          )
        : api.post<TimelinePost>(`/projects/${projectId}/timeline`, input),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.timeline(projectId) }),
  });
}

export function useDeletePost(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      api.delete<void>(`/projects/${projectId}/timeline/${postId}`),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.timeline(projectId) }),
  });
}

// --------------------------------------------------------------------- tasks

export function useTasks(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.tasks(projectId),
    queryFn: () => api.get<Task[]>(`/projects/${projectId}/tasks`),
    enabled,
  });
}

export function useCreateTask(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) =>
      api.post<Task>(`/projects/${projectId}/tasks`, input),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.tasks(projectId) }),
  });
}

/** Moves and edits apply optimistically so dragging a card feels instant. */
export function useUpdateTask(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...fields }: Partial<TaskInput> & { id: string }) =>
      api.patch<Task>(`/projects/${projectId}/tasks/${id}`, fields),
    onMutate: async ({ id, ...fields }) => {
      await client.cancelQueries({ queryKey: keys.tasks(projectId) });
      const previous = client.getQueryData<Task[]>(keys.tasks(projectId));
      client.setQueryData<Task[]>(
        keys.tasks(projectId),
        (tasks) =>
          tasks?.map((task) =>
            task.id === id ? { ...task, ...fields } : task,
          ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous)
        client.setQueryData(keys.tasks(projectId), context.previous);
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: keys.tasks(projectId) }),
  });
}

export function useDeleteTask(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      api.delete<void>(`/projects/${projectId}/tasks/${taskId}`),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.tasks(projectId) }),
  });
}

// -------------------------------------------------------------------- people

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api.get<Me>("/users/me"),
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateMe() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (fields: ProfileUpdate) => api.patch<Me>("/users/me", fields),
    onSuccess: (me) => {
      client.setQueryData(keys.me, me);
      client.invalidateQueries({ queryKey: ["talent"] });
      return client.invalidateQueries({ queryKey: keys.user(me.id) });
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: keys.user(id),
    queryFn: () => api.get<UserProfile>(`/users/${id}`),
  });
}

export function useUserProjects(id: string | undefined) {
  return useQuery({
    queryKey: keys.userProjects(id ?? ""),
    queryFn: () => api.get<ProjectMembership[]>(`/users/${id}/projects`),
    enabled: Boolean(id),
  });
}

export function useContributions(id: string) {
  return useQuery({
    queryKey: keys.contributions(id),
    queryFn: () => api.get<ContributionRecord[]>(`/users/${id}/contributions`),
  });
}

export function useProof(code: string) {
  return useQuery({
    queryKey: keys.proof(code),
    queryFn: () =>
      api.get<ContributionRecord>(`/contributions/${encodeURIComponent(code)}`),
    enabled: code.length > 0,
    retry: false,
  });
}

export function useFollowUser(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) =>
      active
        ? api.put<void>(`/users/${id}/follow`)
        : api.delete<void>(`/users/${id}/follow`),
    onMutate: async (active) => {
      await client.cancelQueries({ queryKey: keys.user(id) });
      const previous = client.getQueryData<UserProfile>(keys.user(id));
      if (previous && previous.is_following !== active) {
        client.setQueryData<UserProfile>(keys.user(id), {
          ...previous,
          is_following: active,
          num_followers: Math.max(
            0,
            previous.num_followers + (active ? 1 : -1),
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _active, context) => {
      if (context?.previous)
        client.setQueryData(keys.user(id), context.previous);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: keys.me });
      return client.invalidateQueries({ queryKey: keys.user(id) });
    },
  });
}

export function useFollowList(
  id: string,
  kind: "followers" | "following",
  enabled: boolean,
) {
  return useQuery({
    queryKey: keys.followers(id, kind),
    queryFn: () => api.get<UserSummary[]>(`/users/${id}/${kind}`),
    enabled: enabled && Boolean(id),
  });
}

// --------------------------------------------------------------- invitations

export function useInvitations(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.invitations(projectId),
    queryFn: () => api.get<Invitation[]>(`/projects/${projectId}/invitations`),
    enabled,
  });
}

export function useMyInvitations(enabled: boolean) {
  return useQuery({
    queryKey: keys.myInvitations,
    queryFn: () => api.get<Invitation[]>("/users/me/invitations"),
    enabled,
  });
}

export function useInvite(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      user_id: string;
      role_title: string;
      message: string;
    }) => api.post<Invitation>(`/projects/${projectId}/invitations`, input),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.invitations(projectId) }),
  });
}

export function useRevokeInvitation(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (inviteeId: string) =>
      api.delete<void>(`/projects/${projectId}/invitations/${inviteeId}`),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.invitations(projectId) }),
  });
}

export function useAnswerInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      accept,
    }: {
      projectId: string;
      accept: boolean;
    }) =>
      api.post<Invitation>(`/projects/${projectId}/invitations/me/decision`, {
        accept,
      }),
    onSuccess: (_data, { projectId }) => {
      client.invalidateQueries({ queryKey: keys.myInvitations });
      client.invalidateQueries({ queryKey: keys.me });
      client.invalidateQueries({ queryKey: ["users"] });
      return client.invalidateQueries({ queryKey: keys.project(projectId) });
    },
  });
}

export interface TalentFilters {
  q?: string;
  skill?: string;
  city?: string;
  uni?: string;
  open_to?: string;
}

export function useTalent(filters: TalentFilters) {
  return useInfiniteQuery({
    queryKey: keys.talent(filters),
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<UserSummary>>("/talent", {
        ...filters,
        limit: 18,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor,
  });
}

// --------------------------------------------------------------------- inbox

export function useInboxSummary(enabled: boolean) {
  return useQuery({
    queryKey: keys.inbox,
    queryFn: () => api.get<InboxSummary>("/inbox/summary"),
    enabled,
    refetchInterval: 20_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications,
    queryFn: () => api.get<NotificationList>("/notifications"),
  });
}

export function useMarkNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) =>
      api.post<void>("/notifications/read", ids ? { ids } : {}),
    onSuccess: () => client.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

export function useConversations() {
  return useQuery({
    queryKey: keys.conversations,
    queryFn: () => api.get<Conversation[]>("/conversations"),
    refetchInterval: 15_000,
  });
}

export function useThread(id: string | undefined) {
  return useQuery({
    queryKey: keys.thread(id ?? ""),
    queryFn: () => api.get<ConversationThread>(`/conversations/${id}`),
    enabled: Boolean(id),
    refetchInterval: 5_000,
  });
}

export function useSendMessage(conversationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<Message>(`/conversations/${conversationId}/messages`, { body }),
    onSuccess: (message) => {
      client.setQueryData<ConversationThread>(
        keys.thread(conversationId),
        (thread) =>
          thread && !thread.messages.some((m) => m.id === message.id)
            ? { ...thread, messages: [...thread.messages, message] }
            : thread,
      );
      return client.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

export function useStartConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { recipient_id: string; body: string }) =>
      api.post<Conversation>("/conversations", input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["inbox"] }),
  });
}
