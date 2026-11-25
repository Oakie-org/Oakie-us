/** API contract. Field names mirror the backend's snake_case JSON one-to-one. */

export type ProjectStatus = "Idea" | "Recruiting" | "In Progress" | "Completed";
export type ProjectVisibility = "public" | "members_only" | "private";
export type ProjectRole = "owner" | "admin" | "member";
export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn";
export type TaskStatus = "backlog" | "in_progress" | "in_review" | "done";
export type TimelineKind = "update" | "milestone" | "release";

export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
}

export interface UserSummary {
  id: string;
  name: string;
  headline: string;
  avatar_url: string | null;
  city: string;
  uni: string;
  skills: string[];
  open_to: string[];
  availability: string;
  accent: string;
  verified_school: boolean;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface UserProfile {
  id: string;
  name: string;
  headline: string;
  bio: string;
  city: string;
  uni: string;
  skills: string[];
  open_to: string[];
  website: string;
  avatar_url: string | null;
  banner_url: string | null;
  links: ProfileLink[];
  accent: string;
  pinned_project_ids: string[];
  availability: string;
  verified_school: boolean;
  num_projects: number;
  num_followers: number;
  num_following: number;
  created_at: string;
  is_following: boolean | null;
}

export interface Me extends UserProfile {
  email: string | null;
  roles: string[];
}

export type ProfileUpdate = Partial<
  Pick<
    UserProfile,
    | "name"
    | "headline"
    | "bio"
    | "city"
    | "uni"
    | "skills"
    | "open_to"
    | "website"
    | "avatar_url"
    | "banner_url"
    | "links"
    | "accent"
    | "pinned_project_ids"
    | "availability"
  >
>;

export interface OpenRole {
  title: string;
  skills: string[];
}

export interface ProjectInput {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  status: ProjectStatus;
  uni: string;
  city: string;
  remote_ok: boolean;
  max_members: number;
  open_roles: OpenRole[];
  image_url: string | null;
  visibility: ProjectVisibility;
}

export interface Project extends ProjectInput {
  id: string;
  owner_id: string;
  current_members: number;
  likes: number;
  follows: number;
  priority: number;
  created_at: string;
  updated_at: string;
  /** Who posted it. Present wherever projects are listed. */
  owner?: UserSummary | null;
}

export interface ProjectViewer {
  role: ProjectRole | null;
  has_liked: boolean;
  is_following: boolean;
  application_status: ApplicationStatus | null;
  invitation: Invitation | null;
}

export type InvitationStatus = "pending" | "accepted" | "declined";

export interface Invitation {
  project_id: string;
  invitee_id: string;
  inviter_id: string;
  status: InvitationStatus;
  role_title: string;
  message: string;
  created_at: string;
  decided_at: string | null;
  invitee: UserSummary | null;
  inviter: UserSummary | null;
  project_title: string | null;
  project_subtitle: string | null;
  project_category: string | null;
}

export interface FacetOption {
  value: string;
  count: number;
}

export interface ProjectFacets {
  total: number;
  category: FacetOption[];
  status: FacetOption[];
  skill: FacetOption[];
  uni: FacetOption[];
  city: FacetOption[];
}

export interface ProjectHit {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  status: string;
}

export interface SearchSuggestions {
  projects: ProjectHit[];
  people: UserSummary[];
  skills: string[];
}

export interface ProjectDetail extends Project {
  owner: UserSummary | null;
  viewer: ProjectViewer;
}

export interface ProjectMembership extends Project {
  role: ProjectRole;
  member_title: string;
}

export interface Member {
  user: UserSummary;
  role: ProjectRole;
  title: string;
  joined_at: string;
}

export interface Application {
  project_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  message: string;
  role_title: string;
  created_at: string;
  decided_at: string | null;
  applicant: UserSummary | null;
  project_title: string | null;
}

export interface TimelinePost {
  id: string;
  project_id: string;
  title: string;
  content: string;
  kind: TimelineKind;
  media_urls: string[];
  author: UserSummary | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee_id: string | null;
  assignee: UserSummary | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type TaskInput = Pick<
  Task,
  "title" | "description" | "status" | "assignee_id" | "due_date"
>;

export interface ContributionRecord {
  code: string;
  member: UserSummary;
  project_id: string;
  project_title: string;
  project_category: string;
  project_status: ProjectStatus;
  role: ProjectRole;
  title: string;
  joined_at: string;
  tasks_completed: number;
  tasks_assigned: number;
}

export interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  actor: UserSummary | null;
  read: boolean;
  created_at: string;
}

export interface NotificationList {
  items: Notification[];
  unread_count: number;
  next_cursor: string | null;
}

export interface Conversation {
  id: string;
  peer: UserSummary;
  last_message: string;
  last_sender_id: string | null;
  last_at: string;
  unread: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ConversationThread {
  conversation: Conversation;
  messages: Message[];
  next_cursor: string | null;
}

export interface InboxSummary {
  unread_notifications: number;
  unread_messages: number;
}

export interface Catalog {
  categories: string[];
  skills: string[];
  statuses: ProjectStatus[];
  open_to: string[];
}

export interface StatsOverview {
  projects: number;
  members: number;
  teammates_matched: number;
  applications: number;
}

export interface SignedUpload {
  url: string;
  fields: Record<string, string>;
  public_url: string;
  max_bytes: number;
}

export type UploadPurpose =
  | "user_avatar"
  | "user_banner"
  | "project_cover"
  | "timeline_media";
