import { supabase } from "./supabase";
import type {
  Task,
  DiaryEntry,
  CalendarEvent,
  Expense,
  Project,
  ProjectTask,
  ProjectTaskStatus,
  Profile,
} from "./types";

/**
 * Get the current authenticated user's ID, or throw.
 */
async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;

  throw new Error("Not authenticated");
}

// ─── Profile ────────────────────────────────────────────────────────────────

async function getProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data;
}

async function upsertProfile(profile: Partial<Profile>): Promise<Profile> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...profile }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

async function getTasks(pendingOnly = false): Promise<Task[]> {
  const userId = await requireUserId();
  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (pendingOnly) {
    query = query.eq("completed", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function createTask(task: Partial<Task>): Promise<Task> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: task.title,
      description: task.description || null,
      due_at: task.due_at || null,
      completed: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.completed !== undefined) updates.completed = patch.completed;
  if (patch.due_at !== undefined) updates.due_at = patch.due_at;

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteTask(id: string): Promise<void> {
  // Soft delete
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Diary ──────────────────────────────────────────────────────────────────

/**
 * Hash PIN using SHA-256 with Web Crypto API so plaintext PIN is never stored
 */
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`clarity_vault_${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function checkDiaryPin(): Promise<boolean> {
  const profile = await getProfile();
  return !!profile?.diary_pin_hash;
}

async function verifyDiaryPin(pin: string): Promise<boolean> {
  const profile = await getProfile();
  if (!profile?.diary_pin_hash) return true; // No pin set
  const hashed = await hashPin(pin);
  // Compare against hashed PIN or legacy unhashed string for backward compatibility
  return profile.diary_pin_hash === hashed || profile.diary_pin_hash === pin.trim();
}

async function setDiaryPin(pin: string): Promise<void> {
  const hashed = await hashPin(pin);
  await upsertProfile({ diary_pin_hash: hashed });
}

async function resetDiaryPin(newPin: string): Promise<void> {
  const hashed = await hashPin(newPin);
  await upsertProfile({ diary_pin_hash: hashed });
}

async function removeDiaryPin(): Promise<void> {
  await upsertProfile({ diary_pin_hash: null });
}

async function getDiaryEntries(pin: string): Promise<DiaryEntry[]> {
  const hasPin = await checkDiaryPin();
  if (hasPin) {
    const ok = await verifyDiaryPin(pin);
    if (!ok) throw new Error("Invalid PIN");
  } else if (!pin) {
    throw new Error("Diary PIN not set");
  }

  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function saveDiaryEntry(
  date: string,
  pin: string,
  body: Partial<DiaryEntry>
): Promise<DiaryEntry> {
  const ok = await verifyDiaryPin(pin);
  if (!ok) throw new Error("Invalid PIN");

  const userId = await requireUserId();

  // Upsert by user_id + date (unique constraint)
  const { data, error } = await supabase
    .from("diary_entries")
    .upsert(
      {
        user_id: userId,
        date,
        body: body.body || "",
        mood: body.mood || null,
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Calendar ───────────────────────────────────────────────────────────────

async function getYearHeatmap(year: number): Promise<Record<number, number>> {
  const userId = await requireUserId();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const { data, error } = await supabase
    .from("calendar_events")
    .select("event_date")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("event_date", from)
    .lte("event_date", to);

  if (error) throw error;

  const heatmap: Record<number, number> = {};
  (data ?? []).forEach((row) => {
    const month = parseInt(row.event_date.split("-")[1], 10);
    heatmap[month] = (heatmap[month] || 0) + 1;
  });
  return heatmap;
}

async function getCalendarDay(date: string): Promise<CalendarEvent[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .eq("event_date", date)
    .is("deleted_at", null)
    .order("start_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getCalendarRange(
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function createCalendarEvent(
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: userId,
      title: event.title,
      description: event.description || null,
      event_date: event.event_date,
      start_at: event.start_at || null,
      end_at: event.end_at || null,
      event_type: event.event_type || "NOTE",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateCalendarEvent(
  id: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from("calendar_events")
    .update({ title })
    .eq("id", id);
  if (error) throw error;
}

async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("calendar_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Expenses ───────────────────────────────────────────────────────────────

async function getExpenses(): Promise<Expense[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function createExpense(
  expense: Omit<Expense, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id">
): Promise<Expense> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      amount: expense.amount,
      category: expense.category,
      description: expense.description || null,
      date: expense.date,
      expense_type: expense.expense_type,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Projects ───────────────────────────────────────────────────────────────

async function getProjects(): Promise<Project[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function createProject(
  project: Pick<Project, "title"> & { description?: string | null }
): Promise<Project> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      title: project.title,
      description: project.description || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { data, error } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function createProjectTask(
  task: Pick<ProjectTask, "title" | "project_id"> & {
    description?: string | null;
    status?: ProjectTaskStatus;
  }
): Promise<ProjectTask> {
  const { data, error } = await supabase
    .from("project_tasks")
    .insert({
      project_id: task.project_id,
      title: task.title,
      description: task.description || null,
      status: task.status ?? "TODO",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateProjectTaskStatus(
  id: string,
  status: ProjectTaskStatus
): Promise<void> {
  const { error } = await supabase
    .from("project_tasks")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

async function deleteProjectTask(id: string): Promise<void> {
  const { error } = await supabase
    .from("project_tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Export as api object ───────────────────────────────────────────────────

export const api = {
  // Profile
  getProfile,
  upsertProfile,
  // Tasks
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  // Diary
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
