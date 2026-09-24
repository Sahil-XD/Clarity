export interface Profile {
  id: string; // UUID, matches auth.users.id
  username: string;
  email: string;
  avatar_url: string | null;
  diary_pin_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_at: string | null;
  remind_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  body: string;
  mood: "HAPPY" | "NEUTRAL" | "SAD" | "ANXIOUS" | "EXCITED" | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string; // YYYY-MM-DD
  start_at: string | null;
  end_at: string | null;
  event_type: "TASK" | "NOTE";
  remind_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Virtual field populated from tasks (not in DB)
  completed?: boolean;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  expense_type: "EXPENSE" | "INCOME";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type ExpenseType = "EXPENSE" | "INCOME";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type ProjectTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
