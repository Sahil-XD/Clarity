export interface User {
  id: number;
  username: string;
  email: string;
  diaryPinHash: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  dueAt?: string;
  remindAt?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  // Sync fields
  clientId?: string;
  serverId?: number;
  deletedAt?: string;
  syncStatus?: "synced" | "pending" | "conflict";
}

export interface DiaryEntry {
  id: number;
  date: string; // ISO LocalDate
  body: string;
  mood?: "HAPPY" | "NEUTRAL" | "SAD" | "ANXIOUS" | "EXCITED";
  createdAt: string;
  updatedAt: string;
  // Sync fields
  clientId?: string;
  serverId?: number;
  deletedAt?: string;
  syncStatus?: "synced" | "pending" | "conflict";
}

export interface CalendarEvent {
  completed?: boolean;
  id: number;
  title: string;
  description?: string;
  eventDate: string; // ISO LocalDate
  startAt?: string; // ISO Instant
  endAt?: string;
  type: "TASK" | "NOTE";
  remindAt?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt?: string;
  // Sync fields
  clientId?: string;
  serverId?: number;
  deletedAt?: string;
  syncStatus?: "synced" | "pending" | "conflict";
}

export interface AuthResponse {
  userId: number;
  username: string;
  token?: string;
  email?: string;
  avatarUrl?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export type ExpenseType = "EXPENSE" | "INCOME";

export interface Expense {
  id: number;
  amount: number;
  category: string;
  description?: string;
  date: string;
  expenseType: ExpenseType;
  createdAt: string;
  updatedAt?: string;
  // Sync fields
  clientId?: string;
  serverId?: number;
  deletedAt?: string;
  syncStatus?: "synced" | "pending" | "conflict";
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  // Sync fields
  clientId?: string;
  serverId?: number;
  deletedAt?: string;
  syncStatus?: "synced" | "pending" | "conflict";
}

export type ProjectTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface ProjectTask {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  createdAt: string;
  updatedAt?: string;
  // Sync fields
  clientId?: string;
  serverId?: number;
  deletedAt?: string;
  syncStatus?: "synced" | "pending" | "conflict";
}

// ─── Sync Types ──────────────────────────────────────────────────────────────

export interface SyncItem {
  type: "TASK" | "DIARY" | "CALENDAR" | "EXPENSE" | "PROJECT";
  clientId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  updatedAt: string;
  data: Record<string, unknown>;
}

export interface SyncPushRequest {
  items: SyncItem[];
}

export interface SyncPullResponse {
  serverTime: string;
  tasks: Task[];
  diary: DiaryEntry[];
  calendar: CalendarEvent[];
  expenses: Expense[];
  projects: Project[];
}
