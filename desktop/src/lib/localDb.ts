import type {
  Task,
  TaskStatus,
  Project,
  ProjectTask,
  ProjectTaskStatus,
  Expense,
  ExpenseType,
  CalendarEvent,
  DiaryEntry,
  DiaryMood,
  Profile,
} from './types';

const LOCAL_USER_ID = '1';

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[LocalDb] Failed to persist key:', key, e);
  }
}

function getSeedProjects(): Project[] {
  const now = new Date().toISOString();
  return [
    {
      id: '1',
      user_id: LOCAL_USER_ID,
      title: 'Clarity Ledger & Stationery Overhaul',
      description: 'Tactile editorial workspace refinement, hairline rules, zero-latency local operations',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '2',
      user_id: LOCAL_USER_ID,
      title: 'Writings & Philosophy Journal',
      description: 'Analog reflections, typography studies, and daily mindfulness dockets',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ];
}

function getSeedProjectTasks(): ProjectTask[] {
  const now = new Date().toISOString();
  return [
    {
      id: '101',
      project_id: '1',
      title: 'Calibrate terracotta accents & warm paper ground',
      description: 'Ensure warm editorial palette #F5F2EB and hairline rule borders',
      status: 'DONE',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '102',
      project_id: '1',
      title: 'Test tactile Web Audio transients on Enter key',
      description: 'Zero latency organic pops and paper clicks',
      status: 'IN_PROGRESS',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '103',
      project_id: '1',
      title: 'Verify frameless window minimize & maximize',
      description: 'Custom ruled header titlebar controls',
      status: 'TODO',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '104',
      project_id: '2',
      title: 'Draft chapter on mindful digital stationery',
      description: 'Analog craftsmanship translated into modern desktop tools',
      status: 'TODO',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ];
}

function getSeedTasks(): Task[] {
  const now = new Date().toISOString();
  return [
    {
      id: '1',
      user_id: LOCAL_USER_ID,
      title: 'Inscribe morning thoughts into leather-bound diary',
      description: 'Reflect on deliberate focus and analog craftsmanship',
      completed: true,
      status: 'DONE',
      project_id: null,
      due_at: null,
      remind_at: null,
      reminder_sent: false,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '2',
      user_id: LOCAL_USER_ID,
      title: 'Review monthly ledger and balance accounts',
      description: 'Ledger entries for ink, heavy paper, and workshop tools',
      completed: false,
      status: 'TODO',
      project_id: null,
      due_at: null,
      remind_at: null,
      reminder_sent: false,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '3',
      user_id: LOCAL_USER_ID,
      title: 'Curate typeface choices and analog paper palette',
      description: 'Editorial serifs and monospace numerals',
      completed: false,
      status: 'TODO',
      project_id: '1',
      due_at: null,
      remind_at: null,
      reminder_sent: false,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ];
}

function getSeedExpenses(): Expense[] {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: '1',
      user_id: LOCAL_USER_ID,
      amount: 45.0,
      category: 'Stationery',
      description: 'Fountain pen ink & heavy laid paper',
      date: today,
      expense_type: 'EXPENSE',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '2',
      user_id: LOCAL_USER_ID,
      amount: 120.0,
      category: 'Books',
      description: 'Typography & bookbinding monographs',
      date: today,
      expense_type: 'EXPENSE',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ];
}

function getSeedCalendarEvents(): CalendarEvent[] {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: '1',
      user_id: LOCAL_USER_ID,
      title: 'Desk Setup & Morning Docket',
      description: 'Calm organization of workspace and tasks',
      event_date: today,
      start_at: '09:00',
      end_at: '10:00',
      event_type: 'NOTE',
      remind_at: null,
      reminder_sent: false,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '2',
      user_id: LOCAL_USER_ID,
      title: 'Deep Focus: Analog Ledger Architecture',
      description: 'Refining local-first data model and zero-latency UI',
      event_date: today,
      start_at: '14:00',
      end_at: '17:00',
      event_type: 'TASK',
      remind_at: null,
      reminder_sent: false,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ];
}

export const localDb = {
  // Profiles
  getProfile(): Profile {
    const defaultProfile: Profile = {
      id: LOCAL_USER_ID,
      username: 'Sahil',
      email: 'sahil@clarity.local',
      avatar_url: null,
      diary_pin_hash: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return getItem('clarity_profile', defaultProfile);
  },

  upsertProfile(patch: Partial<Profile>): Profile {
    const cur = this.getProfile();
    const updated = { ...cur, ...patch, updated_at: new Date().toISOString() };
    setItem('clarity_profile', updated);
    return updated;
  },

  // Tasks
  getTasks(pendingOnly = false): Task[] {
    const tasks = getItem<Task[]>('clarity_tasks', getSeedTasks());
    const valid = tasks.filter((t) => !t.deleted_at);
    return pendingOnly ? valid.filter((t) => !t.completed) : valid;
  },

  createTask(task: Partial<Task>): Task {
    const tasks = getItem<Task[]>('clarity_tasks', getSeedTasks());
    const now = new Date().toISOString();
    const status: TaskStatus = task.status || (task.completed ? 'DONE' : 'TODO');
    const today = new Date().toISOString().split('T')[0];
    const created: Task = {
      id: String(Date.now()),
      user_id: LOCAL_USER_ID,
      title: task.title?.trim() || 'Untitled Task',
      description: task.description?.trim() || null,
      completed: Boolean(task.completed) || status === 'DONE',
      status,
      project_id: task.project_id || null,
      due_at: task.due_at !== undefined ? task.due_at : today,
      remind_at: task.remind_at || null,
      reminder_sent: false,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    tasks.unshift(created);
    setItem('clarity_tasks', tasks);
    return created;
  },

  updateTask(id: string, patch: Partial<Task>): Task {
    const tasks = getItem<Task[]>('clarity_tasks', getSeedTasks());
    const idx = tasks.findIndex((t) => t.id === id);
    const now = new Date().toISOString();
    if (idx === -1) {
      const created = this.createTask({ id, ...patch });
      return created;
    }
    const cur = tasks[idx];
    const completed = patch.completed !== undefined
      ? patch.completed
      : patch.status ? patch.status === 'DONE' : cur.completed;
    const status: TaskStatus = patch.status || (completed ? 'DONE' : 'TODO');

    const updated: Task = {
      ...cur,
      ...patch,
      completed,
      status,
      updated_at: now,
    };
    tasks[idx] = updated;
    setItem('clarity_tasks', tasks);
    return updated;
  },

  deleteTask(id: string): void {
    const tasks = getItem<Task[]>('clarity_tasks', getSeedTasks());
    const filtered = tasks.filter((t) => t.id !== id);
    setItem('clarity_tasks', filtered);
  },

  // Projects
  getProjects(): Project[] {
    const projects = getItem<Project[]>('clarity_projects', getSeedProjects());
    return projects.filter((p) => !p.deleted_at);
  },

  createProject(project: { title: string; description?: string | null }): Project {
    const projects = getItem<Project[]>('clarity_projects', getSeedProjects());
    const now = new Date().toISOString();
    const created: Project = {
      id: String(Date.now()),
      user_id: LOCAL_USER_ID,
      title: project.title.trim() || 'New Docket',
      description: project.description?.trim() || null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    projects.unshift(created);
    setItem('clarity_projects', projects);
    return created;
  },

  deleteProject(id: string): void {
    const projects = getItem<Project[]>('clarity_projects', getSeedProjects());
    const filtered = projects.filter((p) => p.id !== id);
    setItem('clarity_projects', filtered);

    const ptasks = getItem<ProjectTask[]>('clarity_project_tasks', getSeedProjectTasks());
    setItem(
      'clarity_project_tasks',
      ptasks.filter((t) => t.project_id !== id)
    );
  },

  // Project Tasks
  getProjectTasks(projectId: string): ProjectTask[] {
    const all = getItem<ProjectTask[]>('clarity_project_tasks', getSeedProjectTasks());
    return all.filter((t) => t.project_id === projectId && !t.deleted_at);
  },

  createProjectTask(task: {
    projectId: string;
    title: string;
    description?: string | null;
    status?: ProjectTaskStatus;
  }): ProjectTask {
    const all = getItem<ProjectTask[]>('clarity_project_tasks', getSeedProjectTasks());
    const now = new Date().toISOString();
    const created: ProjectTask = {
      id: String(Date.now()),
      project_id: task.projectId,
      title: task.title.trim() || 'Untitled Task',
      description: task.description?.trim() || null,
      status: task.status || 'TODO',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    all.push(created);
    setItem('clarity_project_tasks', all);
    return created;
  },

  updateProjectTaskStatus(id: string, status: ProjectTaskStatus): void {
    const all = getItem<ProjectTask[]>('clarity_project_tasks', getSeedProjectTasks());
    const idx = all.findIndex((t) => t.id === id);
    if (idx !== -1) {
      all[idx].status = status;
      all[idx].updated_at = new Date().toISOString();
      setItem('clarity_project_tasks', all);
    }
  },

  deleteProjectTask(id: string): void {
    const all = getItem<ProjectTask[]>('clarity_project_tasks', getSeedProjectTasks());
    setItem(
      'clarity_project_tasks',
      all.filter((t) => t.id !== id)
    );
  },

  // Expenses
  getExpenses(): Expense[] {
    const exp = getItem<Expense[]>('clarity_expenses', getSeedExpenses());
    return exp.filter((e) => !e.deleted_at);
  },

  createExpense(expense: {
    amount: number;
    category: string;
    description?: string | null;
    date: string;
    expense_type: ExpenseType;
  }): Expense {
    const exp = getItem<Expense[]>('clarity_expenses', getSeedExpenses());
    const now = new Date().toISOString();
    const created: Expense = {
      id: String(Date.now()),
      user_id: LOCAL_USER_ID,
      amount: Number(expense.amount),
      category: expense.category,
      description: expense.description || null,
      date: expense.date,
      expense_type: expense.expense_type,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    exp.unshift(created);
    setItem('clarity_expenses', exp);
    return created;
  },

  deleteExpense(id: string): void {
    const exp = getItem<Expense[]>('clarity_expenses', getSeedExpenses());
    setItem(
      'clarity_expenses',
      exp.filter((e) => e.id !== id)
    );
  },

  // Calendar
  getCalendarDay(date: string): CalendarEvent[] {
    const all = getItem<CalendarEvent[]>('clarity_calendar', getSeedCalendarEvents());
    return all.filter((c) => c.event_date === date && !c.deleted_at);
  },

  getCalendarRange(from: string, to: string): CalendarEvent[] {
    const all = getItem<CalendarEvent[]>('clarity_calendar', getSeedCalendarEvents());
    return all.filter((c) => c.event_date >= from && c.event_date <= to && !c.deleted_at);
  },

  getYearHeatmap(year: number): Record<number, number> {
    const from = year + '-01-01';
    const to = year + '-12-31';
    const events = this.getCalendarRange(from, to);
    const heatmap: Record<number, number> = {};
    for (const ev of events) {
      const dayOfYear =
        Math.floor(
          (new Date(ev.event_date).getTime() - new Date(year + '-01-01').getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      heatmap[dayOfYear] = (heatmap[dayOfYear] || 0) + 1;
    }
    return heatmap;
  },

  createCalendarEvent(event: {
    title: string;
    description?: string | null;
    event_date: string;
    start_at?: string | null;
    end_at?: string | null;
    event_type?: 'TASK' | 'NOTE';
    remind_at?: string | null;
    reminder_sent?: boolean;
  }): CalendarEvent {
    const all = getItem<CalendarEvent[]>('clarity_calendar', getSeedCalendarEvents());
    const now = new Date().toISOString();
    const created: CalendarEvent = {
      id: String(Date.now()),
      user_id: LOCAL_USER_ID,
      title: event.title.trim(),
      description: event.description || null,
      event_date: event.event_date,
      start_at: event.start_at || null,
      end_at: event.end_at || null,
      event_type: event.event_type || 'NOTE',
      remind_at: event.remind_at || null,
      reminder_sent: Boolean(event.reminder_sent),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    all.push(created);
    setItem('clarity_calendar', all);
    return created;
  },

  updateCalendarEvent(id: string, patch: Partial<CalendarEvent>): CalendarEvent {
    const all = getItem<CalendarEvent[]>('clarity_calendar', getSeedCalendarEvents());
    const idx = all.findIndex((c) => c.id === id);
    const now = new Date().toISOString();
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...patch, updated_at: now };
      setItem('clarity_calendar', all);
      return all[idx];
    }
    return this.createCalendarEvent({
      title: patch.title || 'Updated Note',
      description: patch.description || null,
      event_date: patch.event_date || new Date().toISOString().split('T')[0],
      start_at: patch.start_at || null,
      end_at: patch.end_at || null,
      event_type: patch.event_type || 'NOTE',
    });
  },

  deleteCalendarEvent(id: string): void {
    const all = getItem<CalendarEvent[]>('clarity_calendar', getSeedCalendarEvents());
    setItem(
      'clarity_calendar',
      all.filter((c) => c.id !== id)
    );
  },

  // Diary & Vault
  checkDiaryPin(): boolean {
    return Boolean(localStorage.getItem('clarity_diary_pin'));
  },

  verifyDiaryPin(pin: string): boolean {
    const saved = localStorage.getItem('clarity_diary_pin');
    if (!saved) return true;
    return saved === pin.trim();
  },

  setDiaryPin(pin: string): void {
    localStorage.setItem('clarity_diary_pin', pin.trim());
  },

  removeDiaryPin(): void {
    localStorage.removeItem('clarity_diary_pin');
  },

  getDiaryEntries(): DiaryEntry[] {
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    const defaultEntries: DiaryEntry[] = [
      {
        id: '1',
        user_id: LOCAL_USER_ID,
        date: today,
        body: 'The desk is quiet today. Clean lines, warm paper textures, and tactile feedback make all the difference. Building software that feels tangible and intentional.',
        mood: 'Productive',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ];
    return getItem<DiaryEntry[]>('clarity_diary_entries', defaultEntries);
  },

  saveDiaryEntry(date: string, body: Partial<DiaryEntry>): DiaryEntry {
    const entries = this.getDiaryEntries();
    const existingIdx = entries.findIndex((e) => e.date === date);
    const now = new Date().toISOString();

    const entry: DiaryEntry = {
      id: existingIdx >= 0 ? entries[existingIdx].id : String(Date.now()),
      user_id: LOCAL_USER_ID,
      date,
      body: body.body || '',
      mood: (body.mood as DiaryMood) || null,
      created_at: existingIdx >= 0 ? entries[existingIdx].created_at : now,
      updated_at: now,
      deleted_at: null,
    };

    if (existingIdx >= 0) {
      entries[existingIdx] = entry;
    } else {
      entries.unshift(entry);
    }
    setItem('clarity_diary_entries', entries);
    return entry;
  },
};