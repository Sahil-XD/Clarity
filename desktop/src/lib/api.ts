import { invoke } from "@tauri-apps/api/core";
import { dataCache } from "./dataCache";
import { localDb } from "./localDb";
import { encryptVaultText, decryptVaultText } from "./encryption";
import type {
  Task,
  TaskStatus,
  DiaryEntry,
  DiaryMood,
  CalendarEvent,
  Expense,
  ExpenseType,
  Project,
  ProjectTask,
  ProjectTaskStatus,
  Profile,
} from "./types";

/**
 * Checks whether the application is currently running inside Tauri v2 desktop shell.
 */
export const isTauri = (): boolean =>
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

const LOCAL_USER_ID = "1";

// ==============================================================================
// Profiles
// ==============================================================================

async function getProfile(): Promise<Profile | null> {
  return localDb.getProfile();
}

async function upsertProfile(profile: Partial<Profile>): Promise<Profile> {
  return localDb.upsertProfile(profile);
}

// ==============================================================================
// Tasks (Local-First via Tauri SQLite, with graceful offline localDb fallback)
// ==============================================================================

async function getTasks(pendingOnly = false): Promise<Task[]> {
  if (isTauri()) {
    try {
      const list = await invoke<any[]>("get_tasks", {
        userId: 1,
        pendingOnly,
      });
      const mapped: Task[] = list.map((t) => ({
        id: String(t.id),
        user_id: LOCAL_USER_ID,
        title: t.title,
        description: t.description || null,
        completed: Boolean(t.completed),
        status: (t.status as TaskStatus) || (t.completed ? "DONE" : "TODO"),
        project_id: t.projectId ? String(t.projectId) : null,
        due_at: t.dueAt || null,
        remind_at: t.remindAt || null,
        reminder_sent: Boolean(t.reminderSent),
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString(),
        deleted_at: null,
      }));
      dataCache.set("tasks", mapped);
      return mapped;
    } catch (e) {
      console.warn("[Tauri IPC] get_tasks error, falling back to localDb:", e);
    }
  }

  // LocalDb (0ms response, persists in localStorage)
  const tasks = localDb.getTasks(pendingOnly);
  dataCache.set("tasks", tasks);
  return tasks;
}

async function createTask(task: Partial<Task>): Promise<Task> {
  const title = task.title?.trim() || "Untitled Task";
  const desc = task.description?.trim() || null;
  const status: TaskStatus = task.status || (task.completed ? "DONE" : "TODO");
  const today = new Date().toISOString().split("T")[0];
  const targetDue = task.due_at !== undefined ? task.due_at : today;

  if (isTauri()) {
    try {
      const t = await invoke<any>("create_task", {
        userId: 1,
        title,
        description: desc,
        dueAt: targetDue || null,
        status,
        projectId: task.project_id || null,
        remindAt: task.remind_at || null,
        reminderSent: task.reminder_sent || false,
      });

      if (task.completed || status === "DONE") {
        await invoke("update_task", { id: t.id, completed: true }).catch(() => {});
      }

      const created: Task = {
        id: String(t.id),
        user_id: LOCAL_USER_ID,
        title: t.title,
        description: t.description || null,
        completed: Boolean(task.completed) || status === "DONE",
        status,
        project_id: task.project_id || null,
        due_at: t.dueAt || null,
        remind_at: task.remind_at || null,
        reminder_sent: false,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString(),
        deleted_at: null,
      };

      dataCache.invalidate("tasks");
      return created;
    } catch (e) {
      console.warn("[Tauri IPC] create_task error, falling back to localDb:", e);
    }
  }

  const created = localDb.createTask({
    title,
    description: desc,
    completed: task.completed,
    status,
    project_id: task.project_id || null,
    due_at: targetDue || null,
    remind_at: task.remind_at || null,
  });
  dataCache.invalidate("tasks");
  return created;
}

async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const numericId = parseInt(id, 10);

  if (isTauri() && !isNaN(numericId)) {
    try {
      const completedVal =
        patch.completed !== undefined
          ? patch.completed
          : patch.status
          ? patch.status === "DONE"
          : null;

      const t = await invoke<any>("update_task", {
        id: numericId,
        title: patch.title !== undefined ? patch.title : null,
        description: patch.description !== undefined ? patch.description : null,
        completed: completedVal,
        dueAt: patch.due_at !== undefined ? patch.due_at : null,
        status: patch.status !== undefined ? patch.status : null,
        projectId: patch.project_id !== undefined ? patch.project_id : null,
        remindAt: patch.remind_at !== undefined ? patch.remind_at : null,
        reminderSent: patch.reminder_sent !== undefined ? patch.reminder_sent : null,
      });

      dataCache.invalidate("tasks");
      return {
        id: String(t.id),
        user_id: LOCAL_USER_ID,
        title: t.title,
        description: t.description || null,
        completed: Boolean(t.completed),
        status: (t.status as TaskStatus) || (t.completed ? "DONE" : "TODO"),
        project_id:
          patch.project_id !== undefined
            ? patch.project_id
            : t.projectId
            ? String(t.projectId)
            : null,
        due_at: t.dueAt || null,
        remind_at: patch.remind_at !== undefined ? patch.remind_at : null,
        reminder_sent: patch.reminder_sent !== undefined ? patch.reminder_sent : false,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString(),
        deleted_at: null,
      };
    } catch (e) {
      console.warn("[Tauri IPC] update_task error, falling back to localDb:", e);
    }
  }

  const updated = localDb.updateTask(id, patch);
  dataCache.invalidate("tasks");
  return updated;
}

async function deleteTask(id: string): Promise<void> {
  const numericId = parseInt(id, 10);
  if (isTauri() && !isNaN(numericId)) {
    try {
      await invoke("delete_task", { id: numericId });
      dataCache.invalidate("tasks");
      return;
    } catch (e) {
      console.warn("[Tauri IPC] delete_task error, falling back to localDb:", e);
    }
  }

  localDb.deleteTask(id);
  dataCache.invalidate("tasks");
}

// ==============================================================================
// Projects & Project Tasks
// ==============================================================================

async function getProjects(): Promise<Project[]> {
  if (isTauri()) {
    try {
      const list = await invoke<any[]>("get_projects", { userId: 1 });
      const mapped = list.map((p) => ({
        id: String(p.id),
        user_id: LOCAL_USER_ID,
        title: p.title,
        description: p.description || null,
        created_at: p.createdAt || new Date().toISOString(),
        updated_at: p.createdAt || new Date().toISOString(),
        deleted_at: null,
      }));
      dataCache.set("projects", mapped);
      return mapped;
    } catch (e) {
      console.warn("[Tauri IPC] get_projects error, falling back to localDb:", e);
    }
  }

  const projects = localDb.getProjects();
  dataCache.set("projects", projects);
  return projects;
}

async function createProject(
  project: Pick<Project, "title"> & { description?: string | null }
): Promise<Project> {
  if (isTauri()) {
    try {
      const p = await invoke<any>("create_project", {
        userId: 1,
        title: project.title.trim(),
        description: project.description?.trim() || null,
      });
      dataCache.invalidate("projects");
      return {
        id: String(p.id),
        user_id: LOCAL_USER_ID,
        title: p.title,
        description: p.description || null,
        created_at: p.createdAt || new Date().toISOString(),
        updated_at: p.createdAt || new Date().toISOString(),
        deleted_at: null,
      };
    } catch (e) {
      console.warn("[Tauri IPC] create_project error, falling back to localDb:", e);
    }
  }

  const created = localDb.createProject(project);
  dataCache.invalidate("projects");
  return created;
}

async function deleteProject(id: string): Promise<void> {
  const numericId = parseInt(id, 10);
  if (isTauri() && !isNaN(numericId)) {
    try {
      await invoke("delete_project", { id: numericId });
      dataCache.invalidate("projects");
      return;
    } catch (e) {
      console.warn("[Tauri IPC] delete_project error, falling back to localDb:", e);
    }
  }

  localDb.deleteProject(id);
  dataCache.invalidate("projects");
}

async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const numericProjId = parseInt(projectId, 10);
  if (isTauri() && !isNaN(numericProjId)) {
    try {
      const list = await invoke<any[]>("get_project_tasks", { projectId: numericProjId });
      return list.map((t) => ({
        id: String(t.id),
        project_id: projectId,
        title: t.title,
        description: t.description || null,
        status: (t.status as ProjectTaskStatus) || "TODO",
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.createdAt || new Date().toISOString(),
        deleted_at: null,
      }));
    } catch (e) {
      console.warn("[Tauri IPC] get_project_tasks error, falling back to localDb:", e);
    }
  }

  return localDb.getProjectTasks(projectId);
}

async function createProjectTask(
  task: Pick<ProjectTask, "title" | "project_id"> & {
    description?: string | null;
    status?: ProjectTaskStatus;
  }
): Promise<ProjectTask> {
  const numericProjId = parseInt(task.project_id, 10);
  if (isTauri() && !isNaN(numericProjId)) {
    try {
      const t = await invoke<any>("create_project_task", {
        projectId: numericProjId,
        title: task.title,
        description: task.description || null,
        status: task.status || "TODO",
      });
      return {
        id: String(t.id),
        project_id: task.project_id,
        title: t.title,
        description: t.description || null,
        status: (t.status as ProjectTaskStatus) || "TODO",
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.createdAt || new Date().toISOString(),
        deleted_at: null,
      };
    } catch (e) {
      console.warn("[Tauri IPC] create_project_task error, falling back to localDb:", e);
    }
  }

  return localDb.createProjectTask({
    projectId: task.project_id,
    title: task.title,
    description: task.description || null,
    status: task.status || "TODO",
  });
}

async function updateProjectTaskStatus(id: string, status: ProjectTaskStatus): Promise<void> {
  const numericId = parseInt(id, 10);
  if (isTauri() && !isNaN(numericId)) {
    try {
      await invoke("update_project_task_status", { id: numericId, status });
      return;
    } catch (e) {
      console.warn("[Tauri IPC] update_project_task_status error, falling back to localDb:", e);
    }
  }

  localDb.updateProjectTaskStatus(id, status);
}

async function deleteProjectTask(id: string): Promise<void> {
  const numericId = parseInt(id, 10);
  if (isTauri() && !isNaN(numericId)) {
    try {
      await invoke("delete_project_task", { id: numericId });
      return;
    } catch (e) {
      console.warn("[Tauri IPC] delete_project_task error, falling back to localDb:", e);
    }
  }

  localDb.deleteProjectTask(id);
}

// ==============================================================================
// Expenses
// ==============================================================================

async function getExpenses(): Promise<Expense[]> {
  if (isTauri()) {
    try {
      const list = await invoke<any[]>("get_expenses", { userId: 1 });
      const mapped = list.map((e) => ({
        id: String(e.id),
        user_id: LOCAL_USER_ID,
        amount: Number(e.amount),
        category: e.category,
        description: e.description || null,
        date: e.date,
        expense_type: (e.expenseType as ExpenseType) || "EXPENSE",
        created_at: e.createdAt || new Date().toISOString(),
        updated_at: e.createdAt || new Date().toISOString(),
        deleted_at: null,
      }));
      dataCache.set("expenses", mapped);
      return mapped;
    } catch (e) {
      console.warn("[Tauri IPC] get_expenses error, falling back to localDb:", e);
    }
  }

  const exp = localDb.getExpenses();
  dataCache.set("expenses", exp);
  return exp;
}

async function createExpense(
  expense: Omit<Expense, "id" | "user_id" | "created_at" | "updated_at" | "deleted_at">
): Promise<Expense> {
  if (isTauri()) {
    try {
      const e = await invoke<any>("create_expense", {
        userId: 1,
        amount: Number(expense.amount),
        category: expense.category,
        description: expense.description || null,
        date: expense.date,
        expenseType: expense.expense_type,
      });
      dataCache.invalidate("expenses");
      return {
        id: String(e.id),
        user_id: LOCAL_USER_ID,
        amount: Number(e.amount),
        category: e.category,
        description: e.description || null,
        date: e.date,
        expense_type: (e.expenseType as ExpenseType) || "EXPENSE",
        created_at: e.createdAt || new Date().toISOString(),
        updated_at: e.createdAt || new Date().toISOString(),
        deleted_at: null,
      };
    } catch (err) {
      console.warn("[Tauri IPC] create_expense error, falling back to localDb:", err);
    }
  }

  const created = localDb.createExpense(expense);
  dataCache.invalidate("expenses");
  return created;
}

async function deleteExpense(id: string): Promise<void> {
  const numericId = parseInt(id, 10);
  if (isTauri() && !isNaN(numericId)) {
    try {
      await invoke("delete_expense", { id: numericId });
      dataCache.invalidate("expenses");
      return;
    } catch (e) {
      console.warn("[Tauri IPC] delete_expense error, falling back to localDb:", e);
    }
  }

  localDb.deleteExpense(id);
  dataCache.invalidate("expenses");
}

// ==============================================================================
// Calendar
// ==============================================================================

async function getCalendarDay(date: string): Promise<CalendarEvent[]> {
  if (isTauri()) {
    try {
      const list = await invoke<any[]>("get_calendar_day", { userId: 1, date });
      return list.map((c) => ({
        id: String(c.id),
        user_id: LOCAL_USER_ID,
        title: c.title,
        description: c.description || null,
        event_date: c.eventDate || date,
        start_at: c.startAt || null,
        end_at: c.endAt || null,
        event_type: (c.type as "TASK" | "NOTE") || "NOTE",
        remind_at: c.remindAt || null,
        reminder_sent: Boolean(c.reminderSent),
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: c.createdAt || new Date().toISOString(),
        deleted_at: null,
      }));
    } catch (e) {
      console.warn("[Tauri IPC] get_calendar_day error, falling back to localDb:", e);
    }
  }

  return localDb.getCalendarDay(date);
}

async function getCalendarRange(from: string, to: string): Promise<CalendarEvent[]> {
  if (isTauri()) {
    try {
      const list = await invoke<any[]>("get_calendar_range", { userId: 1, from, to });
      return list.map((c) => ({
        id: String(c.id),
        user_id: LOCAL_USER_ID,
        title: c.title,
        description: c.description || null,
        event_date: c.eventDate,
        start_at: c.startAt || null,
        end_at: c.endAt || null,
        event_type: (c.type as "TASK" | "NOTE") || "NOTE",
        remind_at: c.remindAt || null,
        reminder_sent: Boolean(c.reminderSent),
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: c.createdAt || new Date().toISOString(),
        deleted_at: null,
      }));
    } catch (e) {
      console.warn("[Tauri IPC] get_calendar_range error, falling back to localDb:", e);
    }
  }

  return localDb.getCalendarRange(from, to);
}

async function getYearHeatmap(year: number): Promise<Record<number, number>> {
  if (isTauri()) {
    try {
      const map = await invoke<Record<number, number>>("get_year_heatmap", { userId: 1, year });
      return map || {};
    } catch (e) {
      console.warn("[Tauri IPC] get_year_heatmap error, falling back to localDb:", e);
    }
  }

  return localDb.getYearHeatmap(year);
}

async function createCalendarEvent(
  event: Partial<CalendarEvent> & Pick<CalendarEvent, "title" | "event_date">
): Promise<CalendarEvent> {
  if (isTauri()) {
    try {
      const c = await invoke<any>("create_calendar_event", {
        userId: 1,
        title: event.title,
        description: event.description || null,
        eventDate: event.event_date,
        startAt: event.start_at || null,
        endAt: event.end_at || null,
        eventType: event.event_type || "NOTE",
        remindAt: event.remind_at || null,
        reminderSent: event.reminder_sent || false,
      });
      return {
        id: String(c.id),
        user_id: LOCAL_USER_ID,
        title: c.title,
        description: c.description || null,
        event_date: c.eventDate,
        start_at: c.startAt || null,
        end_at: c.endAt || null,
        event_type: (c.type as "TASK" | "NOTE") || "NOTE",
        remind_at: c.remindAt || null,
        reminder_sent: Boolean(c.reminderSent),
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: c.createdAt || new Date().toISOString(),
        deleted_at: null,
      };
    } catch (e) {
      console.warn("[Tauri IPC] create_calendar_event error, falling back to localDb:", e);
    }
  }

  return localDb.createCalendarEvent({
    title: event.title,
    description: event.description || null,
    event_date: event.event_date,
    start_at: event.start_at || null,
    end_at: event.end_at || null,
    event_type: event.event_type || "NOTE",
  });
}

async function updateCalendarEvent(
  id: string,
  patch: Partial<
    Omit<
      CalendarEvent,
      "id" | "user_id" | "created_at" | "updated_at" | "deleted_at" | "completed"
    >
  >
): Promise<CalendarEvent> {
  const numericId = parseInt(id, 10);
  if (isTauri() && !isNaN(numericId)) {
    try {
      await invoke("update_calendar_event", {
        id: numericId,
        title: patch.title !== undefined ? patch.title : null,
        description: patch.description !== undefined ? patch.description : null,
        remindAt: patch.remind_at !== undefined ? patch.remind_at : null,
        reminderSent: patch.reminder_sent !== undefined ? patch.reminder_sent : null,
      });
    } catch (e) {
      console.warn("[Tauri IPC] update_calendar_event error:", e);
    }
  }

  return localDb.updateCalendarEvent(id, patch);
}

async function deleteCalendarEvent(id: string): Promise<void> {
  const numericId = parseInt(id, 10);
  if (isTauri() && !isNaN(numericId)) {
    try {
      await invoke("delete_calendar_event", { id: numericId });
      return;
    } catch (e) {
      console.warn("[Tauri IPC] delete_calendar_event error:", e);
    }
  }

  localDb.deleteCalendarEvent(id);
}

// ==============================================================================
// Diary & Vault (AES-256-GCM Encrypted)
// ==============================================================================

async function checkDiaryPin(): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invoke<boolean>("check_diary_pin", { userId: 1 });
    } catch (e) {
      console.warn("[Tauri IPC] check_diary_pin error:", e);
    }
  }

  return localDb.checkDiaryPin();
}

async function verifyDiaryPin(pin: string): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invoke<boolean>("verify_diary_pin", { userId: 1, pin: pin.trim() });
    } catch (e) {
      console.warn("[Tauri IPC] verify_diary_pin error:", e);
    }
  }

  return localDb.verifyDiaryPin(pin);
}

async function setDiaryPin(pin: string): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("set_diary_pin", { userId: 1, pin: pin.trim() });
    } catch (e) {
      console.warn("[Tauri IPC] set_diary_pin error:", e);
    }
  }
  localDb.setDiaryPin(pin);
}

async function resetDiaryPin(newPin: string): Promise<void> {
  return setDiaryPin(newPin);
}

async function removeDiaryPin(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("remove_diary_pin", { userId: 1 });
    } catch (e) {
      console.warn("[Tauri IPC] remove_diary_pin error:", e);
    }
  }
  localDb.removeDiaryPin();
}

async function getDiaryEntries(pin: string): Promise<DiaryEntry[]> {
  if (isTauri()) {
    try {
      const list = await invoke<any[]>("get_diary_entries", { userId: 1 });
      const entries: DiaryEntry[] = [];
      for (const entry of list) {
        let decryptedBody = entry.body || "";
        if (pin) {
          try {
            decryptedBody = await decryptVaultText(entry.body || "", pin, LOCAL_USER_ID);
          } catch (e) {
            console.warn("Vault decrypt warning:", e);
          }
        }
        entries.push({
          id: String(entry.id),
          user_id: LOCAL_USER_ID,
          date: entry.date,
          body: decryptedBody,
          mood: (entry.mood as DiaryMood) || null,
          created_at: entry.createdAt || new Date().toISOString(),
          updated_at: entry.updatedAt || new Date().toISOString(),
          deleted_at: null,
        });
      }
      return entries;
    } catch (e) {
      console.warn("[Tauri IPC] get_diary_entries error:", e);
    }
  }

  const entries = localDb.getDiaryEntries();
  const decrypted: DiaryEntry[] = [];
  for (const entry of entries) {
    let body = entry.body || "";
    if (pin) {
      try {
        body = await decryptVaultText(entry.body || "", pin, LOCAL_USER_ID);
      } catch {}
    }
    decrypted.push({ ...entry, body });
  }
  return decrypted;
}

async function saveDiaryEntry(
  date: string,
  pin: string,
  body: Partial<DiaryEntry>
): Promise<DiaryEntry> {
  const rawBody = body.body || "";
  let encryptedBody = rawBody;

  if (pin) {
    try {
      encryptedBody = await encryptVaultText(rawBody, pin, LOCAL_USER_ID);
    } catch (e) {
      console.warn("Vault encrypt error:", e);
    }
  }

  if (isTauri()) {
    try {
      const entry = await invoke<any>("save_diary_entry", {
        userId: 1,
        date,
        body: encryptedBody,
        mood: body.mood || null,
      });

      return {
        id: String(entry.id),
        user_id: LOCAL_USER_ID,
        date: entry.date,
        body: rawBody,
        mood: (entry.mood as DiaryMood) || null,
        created_at: entry.createdAt || new Date().toISOString(),
        updated_at: entry.updatedAt || new Date().toISOString(),
        deleted_at: null,
      };
    } catch (e) {
      console.warn("[Tauri IPC] save_diary_entry error:", e);
    }
  }

  // Local storage save
  localDb.saveDiaryEntry(date, { ...body, body: encryptedBody });
  return {
    id: String(Date.now()),
    user_id: LOCAL_USER_ID,
    date,
    body: rawBody,
    mood: body.mood || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };
}

// ==============================================================================
// Public API Export
// ==============================================================================

export const api = {
  // Profiles
  getProfile,
  upsertProfile,
  // Tasks
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  // Diary & Vault
  checkDiaryPin,
  verifyDiaryPin,
  setDiaryPin,
  resetDiaryPin,
  removeDiaryPin,
  getDiaryEntries,
  saveDiaryEntry,
  // Calendar
  getYearHeatmap,
  getCalendarDay,
  getCalendarRange,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  // Expenses
  getExpenses,
  createExpense,
  deleteExpense,
  // Projects
  getProjects,
  createProject,
  deleteProject,
  getProjectTasks,
  createProjectTask,
  updateProjectTaskStatus,
  deleteProjectTask,
};
