import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, CalendarDays, Bell, FolderKanban,
  Check, AlertCircle, X
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { dataCache } from "@/lib/dataCache";
import type { Task, Project, TaskStatus } from "@/lib/types";
import { clsx } from "clsx";
import dayjs from "dayjs";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    return dataCache.get<Task[]>("tasks") || [];
  });
  const [loading, setLoading] = useState(() => !dataCache.get<Task[]>("tasks"));
  const [error, setError] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  
  // Master-Detail selection
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(() => {
    return dataCache.get<Project[]>("projects") || [];
  });

  // Inspector form state
  const [inspectorTitle, setInspectorTitle] = useState("");
  const [inspectorDesc, setInspectorDesc] = useState("");
  const [inspectorDue, setInspectorDue] = useState("");
  const [inspectorRemind, setInspectorRemind] = useState("");
  const [inspectorProject, setInspectorProject] = useState<string>("");
  const [inspectorStatus, setInspectorStatus] = useState<TaskStatus>("TODO");
  const [inspectorSaving, setInspectorSaving] = useState(false);

  const quickInputRef = useRef<HTMLInputElement>(null);

  // Fetch with SWR
  const fetchTasks = async (silent = false) => {
    if (!silent && !dataCache.get<Task[]>("tasks")) {
      setLoading(true);
    }
    try {
      const [fetchedTasks, fetchedProjects] = await Promise.all([
        api.getTasks(),
        api.getProjects().catch(() => []),
      ]);
      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
      dataCache.set("tasks", fetchedTasks);
      dataCache.set("projects", fetchedProjects);
      setError("");
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(tasks.length > 0);
  }, []);

  // Keyboard shortcut 'N' focuses inline input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        sound.click();
        quickInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync inspector when selected task changes
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  useEffect(() => {
    if (selectedTask) {
      setInspectorTitle(selectedTask.title);
      setInspectorDesc(selectedTask.description || "");
      setInspectorDue(selectedTask.due_at ? dayjs(selectedTask.due_at).format("YYYY-MM-DD") : "");
      setInspectorRemind(selectedTask.remind_at ? dayjs(selectedTask.remind_at).format("YYYY-MM-DDTHH:mm") : "");
      setInspectorProject(selectedTask.project_id || "");
      setInspectorStatus((selectedTask.status as TaskStatus) || (selectedTask.completed ? "DONE" : "TODO"));
    }
  }, [selectedTaskId]);

  const toggleComplete = async (task: Task) => {
    const nextCompleted = !task.completed;
    const nextStatus: TaskStatus = nextCompleted ? "DONE" : "TODO";

    if (nextCompleted) {
      sound.chime();
    } else {
      sound.pop();
    }

    // Optimistic local update
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, completed: nextCompleted, status: nextStatus } : t
    );
    setTasks(updated);
    dataCache.set("tasks", updated);

    try {
      await api.updateTask(task.id, { completed: nextCompleted, status: nextStatus });
    } catch {
      // Rollback on network failure
      setTasks(tasks);
      dataCache.set("tasks", tasks);
      setError("Failed to update task state.");
    }
  };

  const deleteTask = async (id: string) => {
    sound.click();
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    dataCache.set("tasks", updated);
    if (selectedTaskId === id) setSelectedTaskId(null);

    try {
      await api.deleteTask(id);
    } catch {
      setTasks(tasks);
      dataCache.set("tasks", tasks);
      setError("Failed to delete task.");
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || quickSaving) return;
    setQuickSaving(true);
    sound.click();

    try {
      const created = await api.createTask({
        title: quickTitle.trim(),
        completed: false,
        status: "TODO",
      });
      const next = [created, ...tasks];
      setTasks(next);
      dataCache.set("tasks", next);
      setNewlyAddedId(created.id);
      setSelectedTaskId(created.id);
      setQuickTitle("");
      sound.pop();
      setTimeout(() => setNewlyAddedId(null), 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to inscribe task.");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleSaveInspector = async () => {
    if (!selectedTask || inspectorSaving) return;
    setInspectorSaving(true);
    sound.click();

    const formattedDue = inspectorDue
      ? dayjs(inspectorDue).startOf("day").toISOString()
      : null;
    const formattedRemind = inspectorRemind
      ? dayjs(inspectorRemind).toISOString()
      : null;
    const isDone = inspectorStatus === "DONE";

    try {
      const updated = await api.updateTask(selectedTask.id, {
        title: inspectorTitle.trim() || selectedTask.title,
        description: inspectorDesc.trim() || null,
        due_at: formattedDue,
        remind_at: formattedRemind,
        reminder_sent: false,
        project_id: inspectorProject || null,
        status: inspectorStatus,
        completed: isDone,
      });

      const next = tasks.map((t) => (t.id === updated.id ? updated : t));
      setTasks(next);
      dataCache.set("tasks", next);
      sound.chime();
    } catch (err: any) {
      setError(err?.message || "Failed to save task docket.");
    } finally {
      setInspectorSaving(false);
    }
  };

  const filteredTasks = pendingOnly ? tasks.filter((t) => !t.completed) : tasks;
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-ground">
      {/* ── Subheader / Editorial Folio Header ───────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-rule flex items-center justify-between shrink-0 bg-surface/50 backdrop-blur-xs">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight font-serif flex items-center gap-2">
            Tasks Ledger
            <span className="font-mono text-xs font-normal text-ink-faint px-2 py-0.5 rounded border border-rule bg-surface">
              {pendingCount} Pending
            </span>
          </h1>
          <p className="text-xs text-ink-faint font-sans mt-0.5">
            Personal action dockets & initiative ledger
          </p>
        </div>

        {/* Status completion ratio */}
        <div className="flex items-center gap-3 text-right">
          <div className="hidden sm:block">
            <span className="font-mono text-xs font-semibold text-ink">
              {completedCount} of {totalCount} completed ({completionPercentage}%)
            </span>
            <div className="w-36 h-1 bg-surface border border-rule rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-Column Responsive Master-Detail Layout ────────────────────────────── */}
      <div className="flex-1 min-h-0 p-6 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column: Master Task List (7 cols) ────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col min-h-0 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded bg-danger/10 border border-danger/20 text-danger text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </span>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-xs underline hover:opacity-80"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Inscribe Input Bar */}
          <form
            onSubmit={handleQuickAdd}
            className="bg-surface border border-rule rounded-xl p-2 px-3.5 flex items-center gap-2.5 shadow-2xs"
          >
            <Plus className="w-4 h-4 text-accent shrink-0 stroke-[2.5]" />
            <input
              ref={quickInputRef}
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Inscribe task... (Press 'N' to focus, Enter to save)"
              className="flex-1 bg-transparent text-xs text-ink placeholder:text-ink-faint outline-none font-sans"
            />
            <button
              type="submit"
              disabled={quickSaving || !quickTitle.trim()}
              className="px-2.5 py-1 rounded-lg bg-accent text-white hover:bg-accent/90 text-xs font-mono font-medium transition-all active:scale-[0.97] disabled:opacity-40 cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { sound.pop(); setPendingOnly(false); }}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border",
                  !pendingOnly
                    ? "bg-ink text-ground border-ink font-semibold"
                    : "bg-surface text-ink-soft hover:text-ink border-rule"
                )}
              >
                All Tasks ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => { sound.pop(); setPendingOnly(true); }}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border",
                  pendingOnly
                    ? "bg-ink text-ground border-ink font-semibold"
                    : "bg-surface text-ink-soft hover:text-ink border-rule"
                )}
              >
                Pending ({pendingCount})
              </button>
            </div>
          </div>

          {/* Ruled Task List */}
          <div className="flex-1 min-h-0 bg-surface border border-rule rounded-xl overflow-y-auto shadow-2xs divide-y divide-rule">
            {loading && tasks.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-ink-faint gap-2 font-mono text-xs">
                <span>Auditing tasks...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-ink-faint p-6">
                <p className="text-sm font-serif italic text-ink-soft">No tasks recorded in your ledger.</p>
                <p className="text-xs mt-1 text-ink-faint font-sans">Inscribe an action item above to begin your day.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                const isNew = newlyAddedId === task.id;

                return (
                  <motion.div
                    key={task.id}
                    onClick={() => {
                      sound.pop();
                      setSelectedTaskId(task.id);
                    }}
                    initial={isNew ? { clipPath: "inset(0 100% 0 0)", backgroundColor: "var(--c-raised)" } : false}
                    animate={isNew ? { clipPath: "inset(0 0% 0 0)", backgroundColor: "transparent" } : {}}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={clsx(
                      "group flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-raised/70 transition-all cursor-pointer text-xs border-l-2",
                      isSelected
                        ? "bg-raised border-l-accent"
                        : "border-l-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(task);
                        }}
                        className="cursor-pointer shrink-0"
                        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        <div
                          className={clsx(
                            "w-4 h-4 rounded flex items-center justify-center transition-colors duration-150 border",
                            task.completed
                              ? "bg-accent border-accent text-white"
                              : "border-rule bg-ground hover:border-ink-soft"
                          )}
                        >
                          {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>

                      {/* Title & Notes */}
                      <div className="min-w-0 flex-1 relative">
                        <div className="relative inline-block max-w-full">
                          <span
                            className={clsx(
                              "font-sans text-xs block truncate",
                              task.completed ? "text-ink-faint" : "text-ink font-medium"
                            )}
                          >
                            {task.title}
                          </span>
                          {task.completed && (
                            <motion.span
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-ink-faint w-full origin-left pointer-events-none"
                            />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-ink-faint truncate font-sans">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata Badges & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      {task.project_id && (
                        <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 flex items-center gap-1">
                          <FolderKanban className="w-3 h-3" />
                          Docket
                        </span>
                      )}

                      {task.due_at && (
                        <span className="text-[10px] font-mono text-ink-faint flex items-center gap-1 bg-ground px-1.5 py-0.5 rounded border border-rule">
                          <CalendarDays className="w-3 h-3 text-ink-soft" />
                          {dayjs(task.due_at).format("D MMM")}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-danger text-ink-faint transition-all cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Column: Task Docket Inspector (5 cols) ────────────────────── */}
        <div className="lg:col-span-5 flex flex-col min-h-0 bg-surface border border-rule rounded-xl p-4 shadow-2xs">
          {selectedTask ? (
            <div className="flex flex-col h-full space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-rule shrink-0">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint font-semibold flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-accent" /> Task Docket Inspector
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(null)}
                  className="p-1 rounded text-ink-faint hover:text-ink hover:bg-raised transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-ink-faint uppercase tracking-wider">
                  Docket Title
                </label>
                <input
                  type="text"
                  value={inspectorTitle}
                  onChange={(e) => setInspectorTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-ground border border-rule text-xs font-semibold text-ink focus:outline-none focus:border-accent font-sans"
                />
              </div>

              {/* Description / Notes */}
              <div className="space-y-1 flex-1 min-h-[120px] flex flex-col">
                <label className="text-[11px] font-mono text-ink-faint uppercase tracking-wider">
                  Notes & Details
                </label>
                <textarea
                  value={inspectorDesc}
                  onChange={(e) => setInspectorDesc(e.target.value)}
                  placeholder="Record additional context, links, or notes..."
                  className="w-full flex-1 p-3 rounded-lg bg-ground border border-rule text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent resize-none font-sans"
                />
              </div>

              {/* Project Docket Binding & Kanban Stage */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-ink-faint uppercase tracking-wider">
                    Project Docket
                  </label>
                  <select
                    value={inspectorProject}
                    onChange={(e) => setInspectorProject(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-ground border border-rule text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="">No Project Docket</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-ink-faint uppercase tracking-wider">
                    Kanban Stage
                  </label>
                  <select
                    value={inspectorStatus}
                    onChange={(e) => setInspectorStatus(e.target.value as TaskStatus)}
                    className="w-full px-2.5 py-2 rounded-lg bg-ground border border-rule text-xs text-ink focus:outline-none focus:border-accent font-mono"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Native Reminder */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-ink-faint uppercase tracking-wider flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-ink-soft" /> Deadline
                  </label>
                  <input
                    type="date"
                    value={inspectorDue}
                    onChange={(e) => setInspectorDue(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-ground border border-rule text-xs text-ink font-mono focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-ink-faint uppercase tracking-wider flex items-center gap-1">
                    <Bell className="w-3 h-3 text-ink-soft" /> Native Reminder
                  </label>
                  <input
                    type="datetime-local"
                    value={inspectorRemind}
                    onChange={(e) => setInspectorRemind(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-ground border border-rule text-xs text-ink font-mono focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-rule flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => deleteTask(selectedTask.id)}
                  className="px-3 py-1.5 rounded-lg text-danger hover:bg-danger/10 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>

                <button
                  type="button"
                  onClick={handleSaveInspector}
                  disabled={inspectorSaving}
                  className="px-4 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {inspectorSaving ? "Saving..." : "Save Docket"}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-faint">
              <FolderKanban className="w-8 h-8 text-ink-soft/40 mb-2 stroke-[1.5]" />
              <p className="text-sm font-serif italic text-ink-soft">No Task Selected</p>
              <p className="text-xs text-ink-faint font-sans mt-1 max-w-[220px]">
                Click any task from your ruled ledger to inspect its docket, set reminders, or bind to a project.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
