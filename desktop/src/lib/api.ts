import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "./store";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Task,
  DiaryEntry,
  CalendarEvent,
  Expense,
  Project,
  ProjectTask,
  ProjectTaskStatus,
  SyncItem,
  SyncPullResponse,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  private isTauri(): boolean {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  }

  private getUserId(): number {
    const state = useAuth.getState();
    if (!state.userId) {
      if (!this.isTauri()) return 1;
      throw new Error("Not authenticated");
    }
    return state.userId;
  }

  // Backend HTTP helper for server API calls
  private async httpRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = useAuth.getState().token;
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ─── Browser Mock Storage Helpers ──────────────────────────────────────────

  private getMock<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  private setMock<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (!this.isTauri()) {
      return { userId: 1, username: data.username || "sahil", token: "dev-token", email: data.email };
    }
    // Local SQLite is the desktop source of truth for offline data
    const localRes = await invoke<AuthResponse>("register", { ...data });

    // Opportunistically register on cloud backend if reachable to get JWT
    try {
      const remoteRes = await this.httpRequest<AuthResponse>('POST', '/api/auth/register', data);
      if (remoteRes?.token) {
        localRes.token = remoteRes.token;
      }
    } catch {
      // Backend offline or unreachable — local SQLite registration succeeded
    }
    return localRes;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    if (!this.isTauri()) {
      return { userId: 1, username: data.username || "sahil", token: "dev-token" };
    }
    // Authenticate with local SQLite so offline mode works 100%
    const localRes = await invoke<AuthResponse>("login", { ...data });

    // Opportunistically obtain cloud JWT token if backend is running
    try {
      const remoteRes = await this.httpRequest<AuthResponse>('POST', '/api/auth/login', data);
      if (remoteRes?.token) {
        localRes.token = remoteRes.token;
        localRes.avatarUrl = remoteRes.avatarUrl;
        localRes.email = remoteRes.email;
      }
    } catch {
      // Backend offline or unreachable — local login succeeded
    }
    return localRes;
  }

  async googleLogin(idToken: string): Promise<AuthResponse> {
    if (!this.isTauri()) {
      return { userId: 1, username: "google-user", token: "dev-token", email: "dev@test.com", avatarUrl: "https://via.placeholder.com/40" };
    }
    // 1. Verify with Spring Boot backend
    const remoteRes = await this.httpRequest<AuthResponse>('POST', '/api/auth/google', { idToken });

    // 2. Ensure matching record in local SQLite so offline queries and FKs work
    try {
      const localUser = await invoke<AuthResponse>("ensure_oauth_user", {
        username: remoteRes.username,
        email: remoteRes.email || `${remoteRes.username}@google.oauth`,
      });
      return {
        ...remoteRes,
        userId: (localUser as any).user_id || localUser.userId || remoteRes.userId,
      };
    } catch (e) {
      console.warn("Could not sync Google OAuth user to local SQLite:", e);
      return remoteRes;
    }
  }

  // ─── Sync ──────────────────────────────────────────────────────────────────

  async syncPush(items: SyncItem[]): Promise<void> {
    return this.httpRequest("POST", "/api/sync/push", { items });
  }

  async syncPull(since?: string): Promise<SyncPullResponse> {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    return this.httpRequest("GET", `/api/sync/pull${query}`);
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  async getTasks(pendingOnly = false): Promise<Task[]> {
    if (!this.isTauri()) {
      const list = this.getMock<Task[]>("clarity_mock_tasks", []);
      return pendingOnly ? list.filter((t) => !t.completed) : list;
    }
    return invoke("get_tasks", { userId: this.getUserId(), pendingOnly });
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    if (!this.isTauri()) {
      const list = this.getMock<Task[]>("clarity_mock_tasks", []);
      const newTask: Task = {
        id: Date.now(),
        userId: this.getUserId(),
        title: task.title || "",
        description: task.description || null,
        completed: false,
        dueAt: task.dueAt || null,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newTask);
      this.setMock("clarity_mock_tasks", list);
      return newTask;
    }
    return invoke("create_task", {
      userId: this.getUserId(),
      title: task.title,
      description: task.description || null,
      dueAt: task.dueAt || null,
    });
  }

  async updateTask(id: number, patch: Partial<Task>): Promise<Task> {
    if (!this.isTauri()) {
      const list = this.getMock<Task[]>("clarity_mock_tasks", []);
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...patch };
        this.setMock("clarity_mock_tasks", list);
        return list[idx];
      }
      throw new Error("Task not found");
    }
    return invoke("update_task", {
      id,
      title: patch.title,
      description: patch.description,
      completed: patch.completed,
      dueAt: patch.dueAt,
    });
  }

  async deleteTask(id: number): Promise<void> {
    if (!this.isTauri()) {
      const list = this.getMock<Task[]>("clarity_mock_tasks", []);
      this.setMock("clarity_mock_tasks", list.filter((t) => t.id !== id));
      return;
    }
    return invoke("delete_task", { id });
  }

  // ─── Diary ─────────────────────────────────────────────────────────────────

  async checkDiaryPin(): Promise<boolean> {
    if (!this.isTauri()) {
      return !!this.getMock<string | null>("clarity_mock_pin", null);
    }
    return invoke("check_diary_pin", { userId: this.getUserId() });
  }

  async verifyDiaryPin(pin: string): Promise<boolean> {
    if (!this.isTauri()) {
      const saved = this.getMock<string | null>("clarity_mock_pin", null);
      return !saved || saved === pin;
    }
    return invoke("verify_diary_pin", { userId: this.getUserId(), pin });
  }

  async setDiaryPin(pin: string): Promise<void> {
    const clean = pin.trim();
    if (!this.isTauri()) {
      this.setMock("clarity_mock_pin", clean);
      return;
    }
    return invoke("set_diary_pin", { userId: this.getUserId(), pin: clean });
  }

  async resetDiaryPin(pin: string): Promise<void> {
    const clean = pin.trim();
    if (!this.isTauri()) {
      this.setMock("clarity_mock_pin", clean);
      return;
    }
    return invoke("reset_diary_pin", { userId: this.getUserId(), newPin: clean });
  }

  async removeDiaryPin(): Promise<void> {
    if (!this.isTauri()) {
      this.setMock("clarity_mock_pin", null);
      return;
    }
    return invoke("remove_diary_pin", { userId: this.getUserId() });
  }

  async getDiaryEntries(pin: string): Promise<DiaryEntry[]> {
    const ok = await this.verifyDiaryPin(pin);
    if (!ok) throw new Error("Invalid PIN");
    if (!this.isTauri()) {
      return this.getMock<DiaryEntry[]>("clarity_mock_diary", []);
    }
    return invoke("get_diary_entries", { userId: this.getUserId() });
  }

  async saveDiaryEntry(date: string, pin: string, body: Partial<DiaryEntry>): Promise<DiaryEntry> {
    const ok = await this.verifyDiaryPin(pin);
    if (!ok) throw new Error("Invalid PIN");
    if (!this.isTauri()) {
      const list = this.getMock<DiaryEntry[]>("clarity_mock_diary", []);
      const existing = list.findIndex((e) => e.date === date);
      const entry: DiaryEntry = {
        id: existing !== -1 ? list[existing].id : Date.now(),
        userId: this.getUserId(),
        date,
        body: body.body || "",
        mood: body.mood || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (existing !== -1) {
        list[existing] = entry;
      } else {
        list.push(entry);
      }
      this.setMock("clarity_mock_diary", list);
      return entry;
    }
    return invoke("save_diary_entry", {
      userId: this.getUserId(),
      date,
      body: body.body || "",
      mood: body.mood || null,
    });
  }

  // ─── Calendar ──────────────────────────────────────────────────────────────

  async getYearHeatmap(year: number): Promise<Record<number, number>> {
    if (!this.isTauri()) {
      return {};
    }
    return invoke("get_year_heatmap", { userId: this.getUserId(), year });
  }

  async getCalendarDay(date: string): Promise<CalendarEvent[]> {
    if (!this.isTauri()) {
      const list = this.getMock<CalendarEvent[]>("clarity_mock_calendar", []);
      return list.filter((e) => e.eventDate === date);
    }
    return invoke("get_calendar_day", { userId: this.getUserId(), date });
  }

  async getCalendarRange(from: string, to: string): Promise<CalendarEvent[]> {
    if (!this.isTauri()) {
      const list = this.getMock<CalendarEvent[]>("clarity_mock_calendar", []);
      return list.filter((e) => e.eventDate >= from && e.eventDate <= to);
    }
    return invoke("get_calendar_range", { userId: this.getUserId(), from, to });
  }

  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    if (!this.isTauri()) {
      const list = this.getMock<CalendarEvent[]>("clarity_mock_calendar", []);
      const newEvent: CalendarEvent = {
        id: Date.now(),
        userId: this.getUserId(),
        title: event.title || "",
        description: event.description || null,
        eventDate: event.eventDate || new Date().toISOString().split("T")[0],
        startAt: event.startAt || null,
        endAt: event.endAt || null,
        type: event.type || "TASK",
        createdAt: new Date().toISOString(),
      };
      list.push(newEvent);
      this.setMock("clarity_mock_calendar", list);
      return newEvent;
    }
    return invoke("create_calendar_event", {
      userId: this.getUserId(),
      title: event.title,
      description: event.description || null,
      eventDate: event.eventDate,
      startAt: event.startAt || null,
      endAt: event.endAt || null,
      eventType: event.type,
    });
  }

  async updateCalendarEvent(id: number, title: string): Promise<void> {
    if (!this.isTauri()) {
      const list = this.getMock<CalendarEvent[]>("clarity_mock_calendar", []);
      const idx = list.findIndex((e) => e.id === id);
      if (idx !== -1) {
        list[idx].title = title;
        this.setMock("clarity_mock_calendar", list);
      }
      return;
    }
    return invoke("update_calendar_event", { id, title });
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    if (!this.isTauri()) {
      const list = this.getMock<CalendarEvent[]>("clarity_mock_calendar", []);
      this.setMock("clarity_mock_calendar", list.filter((e) => e.id !== id));
      return;
    }
    return invoke("delete_calendar_event", { id });
  }

  // ─── Expenses ──────────────────────────────────────────────────────────────

  async getExpenses(): Promise<Expense[]> {
    if (!this.isTauri()) {
      return this.getMock<Expense[]>("clarity_mock_expenses", []);
    }
    return invoke("get_expenses", { userId: this.getUserId() });
  }

  async createExpense(expense: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
    if (!this.isTauri()) {
      const list = this.getMock<Expense[]>("clarity_mock_expenses", []);
      const newExpense: Expense = {
        id: Date.now(),
        userId: this.getUserId(),
        amount: expense.amount,
        category: expense.category,
        description: expense.description || null,
        date: expense.date,
        expenseType: expense.expenseType,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newExpense);
      this.setMock("clarity_mock_expenses", list);
      return newExpense;
    }
    return invoke("create_expense", {
      userId: this.getUserId(),
      amount: expense.amount,
      category: expense.category,
      description: expense.description || null,
      date: expense.date,
      expenseType: expense.expenseType,
    });
  }

  async deleteExpense(id: number): Promise<void> {
    if (!this.isTauri()) {
      const list = this.getMock<Expense[]>("clarity_mock_expenses", []);
      this.setMock("clarity_mock_expenses", list.filter((e) => e.id !== id));
      return;
    }
    return invoke("delete_expense", { id });
  }

  // ─── Projects ──────────────────────────────────────────────────────────────

  async getProjects(): Promise<Project[]> {
    if (!this.isTauri()) {
      return this.getMock<Project[]>("clarity_mock_projects", []);
    }
    return invoke("get_projects", { userId: this.getUserId() });
  }

  async createProject(project: Pick<Project, "title"> & { description?: string }): Promise<Project> {
    if (!this.isTauri()) {
      const list = this.getMock<Project[]>("clarity_mock_projects", []);
      const newProj: Project = {
        id: Date.now(),
        userId: this.getUserId(),
        title: project.title,
        description: project.description || null,
        createdAt: new Date().toISOString(),
      };
      list.push(newProj);
      this.setMock("clarity_mock_projects", list);
      return newProj;
    }
    return invoke("create_project", {
      userId: this.getUserId(),
      title: project.title,
      description: project.description || null,
    });
  }

  async deleteProject(id: number): Promise<void> {
    if (!this.isTauri()) {
      const list = this.getMock<Project[]>("clarity_mock_projects", []);
      this.setMock("clarity_mock_projects", list.filter((p) => p.id !== id));
      return;
    }
    return invoke("delete_project", { id });
  }

  async getProjectTasks(projectId: number): Promise<ProjectTask[]> {
    if (!this.isTauri()) {
      const list = this.getMock<ProjectTask[]>("clarity_mock_project_tasks", []);
      return list.filter((t) => t.projectId === projectId);
    }
    return invoke("get_project_tasks", { projectId });
  }

  async createProjectTask(
    task: Pick<ProjectTask, "title" | "projectId"> & { description?: string; status?: ProjectTaskStatus }
  ): Promise<ProjectTask> {
    if (!this.isTauri()) {
      const list = this.getMock<ProjectTask[]>("clarity_mock_project_tasks", []);
      const newTask: ProjectTask = {
        id: Date.now(),
        projectId: task.projectId,
        title: task.title,
        description: task.description || null,
        status: task.status ?? "TODO",
        createdAt: new Date().toISOString(),
      };
      list.push(newTask);
      this.setMock("clarity_mock_project_tasks", list);
      return newTask;
    }
    return invoke("create_project_task", {
      projectId: task.projectId,
      title: task.title,
      description: task.description || null,
      status: task.status ?? "TODO",
    });
  }

  async updateProjectTaskStatus(id: number, status: ProjectTaskStatus): Promise<void> {
    if (!this.isTauri()) {
      const list = this.getMock<ProjectTask[]>("clarity_mock_project_tasks", []);
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx].status = status;
        this.setMock("clarity_mock_project_tasks", list);
      }
      return;
    }
    return invoke("update_project_task_status", { id, status });
  }

  async deleteProjectTask(id: number): Promise<void> {
    if (!this.isTauri()) {
      const list = this.getMock<ProjectTask[]>("clarity_mock_project_tasks", []);
      this.setMock("clarity_mock_project_tasks", list.filter((t) => t.id !== id));
      return;
    }
    return invoke("delete_project_task", { id });
  }

  // ─── Sync Helpers ──────────────────────────────────────────────────────────

  async ensureSupabaseUser(supabaseId: string, email: string, username: string): Promise<AuthResponse> {
    if (!this.isTauri()) {
      return { userId: 1, username };
    }
    return invoke("ensure_supabase_user", { supabaseId, email, username });
  }

  async getPendingTasks(): Promise<any[]> {
    if (!this.isTauri()) return [];
    return invoke("get_pending_tasks", { userId: this.getUserId() });
  }

  async getPendingDiaryEntries(): Promise<any[]> {
    if (!this.isTauri()) return [];
    return invoke("get_pending_diary_entries", { userId: this.getUserId() });
  }

  async getPendingCalendarEvents(): Promise<any[]> {
    if (!this.isTauri()) return [];
    return invoke("get_pending_calendar_events", { userId: this.getUserId() });
  }

  async getPendingExpenses(): Promise<any[]> {
    if (!this.isTauri()) return [];
    return invoke("get_pending_expenses", { userId: this.getUserId() });
  }

  async getPendingProjects(): Promise<any[]> {
    if (!this.isTauri()) return [];
    return invoke("get_pending_projects", { userId: this.getUserId() });
  }

  async getPendingProjectTasks(projectId: number): Promise<any[]> {
    if (!this.isTauri()) return [];
    return invoke("get_pending_project_tasks", { projectId });
  }

  async markSynced(table: string, id: number): Promise<void> {
    if (!this.isTauri()) return;
    return invoke("mark_synced", { table, id });
  }

  async setServerId(table: string, id: number, serverId: string): Promise<void> {
    if (!this.isTauri()) return;
    return invoke("set_server_id", { table, id, serverId });
  }

  async upsertFromServer(table: string, userId: number, serverId: string, data: any): Promise<void> {
    if (!this.isTauri()) return;
    return invoke("upsert_from_server", { table, userId, serverId, data });
  }

  async deleteFromServer(table: string, serverId: string): Promise<void> {
    if (!this.isTauri()) return;
    return invoke("delete_from_server", { table, serverId });
  }

  async getLastSyncTime(): Promise<string | null> {
    if (!this.isTauri()) return null;
    return invoke("get_last_sync_time");
  }

  async setLastSyncTime(time: string): Promise<void> {
    if (!this.isTauri()) return;
    return invoke("set_last_sync_time", { time });
  }
}

export const api = new ApiClient();
