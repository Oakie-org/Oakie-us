import type { Project } from "@/types";

type ApiProject = {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  tags?: string[];
  status: Project["status"];
  category?: string;
  uni?: string;
  city?: string;
  current_members?: number;
  max_members?: number;
  likes?: number;
  follows?: number;
  image?: string;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ProjectsListResponse = {
  items: ApiProject[];
  total: number;
  page: number;
  page_size: number;
};

type CreateProjectPayload = {
  title: string;
  subtitle?: string;
  description: string;
  tags: string[];
  status?: Project["status"];
  category?: string;
  uni?: string;
  city?: string;
  maxMembers?: number;
  image?: string;
  imageUrl?: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?.replace(/\/+$/, "")
  .trim();

function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE_URL || "";
  return `${base}/api/v1${normalizedPath}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `API ${response.status} ${response.statusText}${
        errorText ? `: ${errorText}` : ""
      }`,
    );
  }

  return (await response.json()) as T;
}

function toProject(apiProject: ApiProject): Project {
  return {
    id: apiProject.id,
    title: apiProject.title,
    subtitle: apiProject.subtitle ?? undefined,
    description: apiProject.description,
    tags: apiProject.tags ?? [],
    status: apiProject.status,
    currentMembers: apiProject.current_members ?? 1,
    maxMembers: apiProject.max_members ?? 5,
    likes: apiProject.likes ?? 0,
    follows: apiProject.follows ?? 0,
    category: apiProject.category ?? "General",
    uni: apiProject.uni ?? "",
    city: apiProject.city ?? "",
    image:
      apiProject.image ??
      "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)",
    imageUrl: apiProject.image_url ?? undefined,
    membersAvatars: [],
    members: [],
    requiredSkills: [],
  };
}

export async function listProjects(): Promise<Project[]> {
  const data = await requestJson<ProjectsListResponse>("/projects");
  return data.items.map(toProject);
}

export async function getProject(projectId: string): Promise<Project> {
  const data = await requestJson<ApiProject>(`/projects/${projectId}`);
  return toProject(data);
}

export async function createProject(payload: CreateProjectPayload) {
  const apiPayload = {
    title: payload.title,
    subtitle: payload.subtitle,
    description: payload.description,
    tags: payload.tags,
    status: payload.status ?? "Recruiting",
    category: payload.category ?? "General",
    uni: payload.uni ?? "",
    city: payload.city ?? "",
    max_members: payload.maxMembers ?? 5,
    image:
      payload.image ??
      "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)",
    image_url: payload.imageUrl ?? null,
  };

  const data = await requestJson<ApiProject>("/projects", {
    method: "POST",
    body: JSON.stringify(apiPayload),
  });
  return toProject(data);
}
