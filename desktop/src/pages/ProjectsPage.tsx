import { useState, useEffect } from "react";
import {
  Plus, Trash2, X, LayoutGrid,
  CheckCircle2, Loader2, FolderOpen,
  ChevronRight, ArrowRight, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { clsx } from "clsx";
import dayjs from "dayjs";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

const COLUMNS: { id: TaskStatus; label: string; code: string; dotColor: string }[] = [
  { id: "TODO",        label: "To Do",       code: "01", dotColor: "bg-ink-soft" },
  { id: "IN_PROGRESS", label: "In Progress", code: "02", dotColor: "bg-warn" },
  { id: "DONE",        label: "Done",        code: "03", dotColor: "bg-done" },
];

const PROJECT_PALETTES = [
  { label: "Ink Soft", bg: "bg-ink-soft", text: "text-ink-soft" },
  { label: "Moss",     bg: "bg-done",     text: "text-done" },
  { label: "Brass",    bg: "bg-warn",     text: "text-warn" },
  { label: "Rule",     bg: "bg-rule",     text: "text-ink-faint" },
];

// ─── New Project Modal (Disciplined Ledger Voucher) ──────────────────────────
function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Docket title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const project = await api.createProject({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      sound.pop();
      onCreated({ ...project, colorIdx, tasks: [] });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create project docket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-surface rounded-none border border-rule shadow-none overflow-hidden"
      >
        {/* Top Vermilion Voucher Rule */}
        <div className="h-0.5 bg-accent w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface border-b border-rule">
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight font-serif">
              New Project Docket
            </h2>
            <p className="text-[11px] text-ink-faint font-mono uppercase tracking-wider mt-0.5">
              Docket voucher · kanban ledger
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-none text-ink-faint hover:text-ink hover:bg-raised transition cursor-pointer border border-rule hover:border-ink-soft"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider mb-1">
              Docket Title *
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Financial Audit, Site Migration"
              className="w-full px-3 py-2 rounded-none border border-rule bg-ground text-ink placeholder:text-ink-faint text-xs outline-none focus:border-accent transition font-sans shadow-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider mb-1">
              Scope / Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objectives, deliverables, and timeline notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-none border border-rule bg-ground text-ink placeholder:text-ink-faint text-xs outline-none focus:border-accent transition font-sans resize-none shadow-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider mb-1.5">
              Color Tag
            </label>
            <div className="flex gap-2">
              {PROJECT_PALETTES.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  className={clsx(
                    "w-5 h-5 rounded-none border transition-all flex items-center justify-center cursor-pointer",
                    c.bg,
                    colorIdx === i
                      ? "border-ink ring-1 ring-ink ring-offset-1 ring-offset-surface"
                      : "border-rule opacity-60 hover:opacity-100"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger font-medium bg-danger/10 p-2 rounded-none border border-danger/20 font-mono">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-none border border-rule text-xs font-mono font-medium text-ink-soft hover:bg-raised hover:text-ink transition active:scale-[0.98] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-none bg-accent text-white text-xs font-mono font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-none"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 stroke-[2.2]" />}
              Inscribe Docket
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Inline Quick-Add Task in Column ─────────────────────────────────────────
function InlineAddTask({
  projectId,
  status,
  onCreated,
}: {
  projectId: string;
  status: TaskStatus;
  onCreated: (t: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const task = await api.createProjectTask({
        project_id: projectId,
        title: title.trim(),
        status,
      });
      sound.pop();
      onCreated(task);
      setTitle("");
      setOpen(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-mono font-medium text-ink-soft hover:text-ink bg-ground/40 hover:bg-ground border-t border-rule transition cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 text-ink-faint" />
        <span>Inscribe Task</span>
      </button>
    );
  }

  return (
    <div className="p-3 bg-ground border-t border-rule space-y-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setOpen(false);
            setTitle("");
          }
        }}
        placeholder="Task description... (Enter to save)"
        className="w-full px-2.5 py-1.5 rounded-none border border-rule bg-surface text-ink placeholder:text-ink-faint text-xs outline-none focus:border-accent font-sans shadow-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            setOpen(false);
            setTitle("");
          }}
          className="flex-1 py-1 text-xs font-mono rounded-none border border-rule text-ink-soft hover:bg-raised hover:text-ink transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex-1 py-1 text-xs font-mono font-medium rounded-none bg-ink text-ground hover:opacity-90 transition active:scale-[0.98] disabled:opacity-40 cursor-pointer"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Projects Page (Ruled Kanban Board) ─────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newlyAddedTaskId, setNewlyAddedTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      const withColors = data.map((p: any, i: number) => ({
        ...p,
        colorIdx: i % PROJECT_PALETTES.length,
      }));
      setProjects(withColors);
      if (withColors.length > 0) setActiveProjectId(withColors[0].id);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadTasksForProject = async (projectId: string) => {
    try {
      const data = await api.getProjectTasks(projectId);
      setTasks((p) => ({ ...p, [projectId]: data }));
    } catch {}
  };

  useEffect(() => {
    if (activeProjectId != null) loadTasksForProject(activeProjectId);
  }, [activeProjectId]);

  const currentTasks = activeProjectId != null ? tasks[activeProjectId] || [] : [];

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    if (activeProjectId == null) return;
    sound.pop();
    setTasks((prev) => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
    }));
    try {
      await api.updateProjectTaskStatus(taskId, newStatus);
    } catch {}
  };

  const deleteTask = async (taskId: string) => {
    if (activeProjectId == null) return;
    sound.pop();
    setTasks((prev) => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).filter((t) => t.id !== taskId),
    }));
    try {
      await api.deleteProjectTask(taskId);
    } catch {}
  };

  const deleteProject = async (projectId: string) => {
    sound.pop();
    setProjects((p) => p.filter((pr) => pr.id !== projectId));
    if (activeProjectId === projectId) {
      const remaining = projects.filter((pr) => pr.id !== projectId);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
    try {
      await api.deleteProject(projectId);
    } catch {}
  };

  const advanceStatus = (current: TaskStatus): TaskStatus => {
    if (current === "TODO") return "IN_PROGRESS";
    if (current === "IN_PROGRESS") return "DONE";
    return "TODO";
  };

  const retreatStatus = (current: TaskStatus): TaskStatus => {
    if (current === "DONE") return "IN_PROGRESS";
    if (current === "IN_PROGRESS") return "TODO";
    return "DONE";
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const color = activeProject ? PROJECT_PALETTES[activeProject.colorIdx] : PROJECT_PALETTES[0];

  const handleTaskCreated = (t: any) => {
    if (activeProjectId == null) return;
    setTasks((prev) => ({
      ...prev,
      [activeProjectId]: [...(prev[activeProjectId] || []), t],
    }));
    setNewlyAddedTaskId(t.id);
    setTimeout(() => setNewlyAddedTaskId(null), 1600);
  };

  return (
    <div className="h-full flex flex-col bg-ground">
      <AnimatePresence>
        {showNewProject && (
          <NewProjectModal
            onClose={() => setShowNewProject(false)}
            onCreated={(p) => {
              setProjects((prev) => [p, ...prev]);
              setTasks((prev) => ({ ...prev, [p.id]: [] }));
              setActiveProjectId(p.id);
            }}
          />
        )}
      </AnimatePresence>

      {/* Desk Top Bar (Ruled Navigation) */}
      <div className="shrink-0 bg-surface border-b border-rule px-8 py-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-ink tracking-tight font-serif">
              Projects &amp; Workflows
            </h1>
            <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-none bg-ground border border-rule text-ink-soft">
              {projects.length} dockets
            </span>
          </div>
          <p className="text-ink-faint text-xs mt-0.5 font-sans">
            Ruled kanban workflows &amp; staged execution
          </p>
        </div>

        <button
          onClick={() => setShowNewProject(true)}
          className="px-3.5 py-1.5 rounded-none bg-accent text-white text-xs font-mono font-semibold hover:opacity-90 transition flex items-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-none"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.2]" /> New Docket
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-ink-faint gap-2 font-mono text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-ink-soft" />
          <span>Auditing project dockets...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 bg-surface rounded-none border border-rule flex items-center justify-center mb-3 text-ink-soft">
            <FolderOpen className="w-5 h-5 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-bold text-ink font-serif mb-1">
            No dockets inscribed
          </h3>
          <p className="text-ink-faint text-xs mb-5 max-w-xs font-sans">
            Inscribe your first project docket to begin staging multi-phase execution.
          </p>
          <button
            onClick={() => setShowNewProject(true)}
            className="px-3.5 py-1.5 rounded-none bg-accent text-white text-xs font-mono font-semibold hover:opacity-90 transition flex items-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2]" /> Inscribe Docket
          </button>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── Project Dockets Sidebar ───────────────────────────────────── */}
          <aside className="w-60 flex-shrink-0 border-r border-rule flex flex-col bg-surface">
            <div className="px-4 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-ink-faint border-b border-rule flex items-center justify-between">
              <span>Dockets</span>
              <span>({projects.length})</span>
            </div>
            <nav className="flex-1 overflow-y-auto divide-y divide-rule/60">
              {projects.map((project) => {
                const projectTasks = tasks[project.id] || [];
                const done = projectTasks.filter((t: any) => t.status === "DONE").length;
                const total = projectTasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const isActive = project.id === activeProjectId;
                const pColor = PROJECT_PALETTES[project.colorIdx];

                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      sound.pop();
                      setActiveProjectId(project.id);
                    }}
                    className={clsx(
                      "w-full flex flex-col gap-1.5 px-4 py-3 text-left transition-all cursor-pointer border-l-2",
                      isActive
                        ? "bg-raised border-l-accent text-ink"
                        : "border-l-transparent hover:bg-raised/60 hover:border-l-ink-soft text-ink-soft"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={clsx("w-2 h-2 rounded-none shrink-0", pColor.bg)} />
                        <span className={clsx("text-xs truncate font-sans", isActive ? "font-bold text-ink" : "font-medium text-ink-soft")}>
                          {project.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-ink-faint tabular-nums shrink-0">
                        {done}/{total}
                      </span>
                    </div>

                    {total > 0 && (
                      <div className="w-full h-1 bg-ground border border-rule/50 rounded-none overflow-hidden">
                        <div
                          className="h-full bg-done transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Kanban Ruled Ledger Board ──────────────────────────────────── */}
          <div className="flex-1 overflow-auto p-6 sm:p-8">
            {activeProject && (
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Project Header Bar */}
                <div className="bg-surface rounded-none border border-rule p-4 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx("w-3 h-3 rounded-none shrink-0", color.bg)} />
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-ink font-serif truncate">
                        {activeProject.title}
                      </h2>
                      {activeProject.description ? (
                        <p className="text-xs text-ink-faint font-sans truncate mt-0.5">
                          {activeProject.description}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-faint font-mono mt-0.5">
                          Ruled stages · {currentTasks.length} total tasks
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Column Counters */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      {COLUMNS.map((col) => {
                        const count = currentTasks.filter((t: any) => t.status === col.id).length;
                        return (
                          <span
                            key={col.id}
                            className="px-2 py-0.5 rounded-none bg-ground border border-rule text-ink-soft"
                          >
                            {col.label}: <strong className="text-ink">{count}</strong>
                          </span>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => deleteProject(activeProject.id)}
                      title="Delete docket"
                      className="p-1.5 rounded-none text-ink-faint hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition cursor-pointer"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                    </button>
                  </div>
                </div>

                {/* Kanban Columns Grid (Sized to Content, Content-Responsive) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                  {COLUMNS.map((column) => {
                    const colTasks = currentTasks.filter((t: any) => t.status === column.id);

                    return (
                      <div
                        key={column.id}
                        className="bg-surface rounded-none border border-rule flex flex-col overflow-hidden shadow-none"
                      >
                        {/* Column Ruled Header */}
                        <div className="px-4 py-2.5 bg-ground/50 border-b border-rule flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className={clsx("w-2 h-2 rounded-none", column.dotColor)} />
                            <span className="font-bold text-ink uppercase tracking-wider">
                              {column.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-ink-soft font-semibold px-1.5 py-0.2 rounded-none bg-surface border border-rule">
                            {colTasks.length}
                          </span>
                        </div>

                        {/* Cards List with 420ms Signature Ink Reveal */}
                        <div className="p-3 space-y-2.5 min-h-[140px] max-h-[620px] overflow-y-auto">
                          <AnimatePresence initial={false}>
                            {colTasks.map((task: any) => {
                              const isNew = newlyAddedTaskId === task.id;
                              const isDone = column.id === "DONE";

                              return (
                                <motion.div
                                  key={task.id}
                                  layout
                                  initial={
                                    isNew
                                      ? { clipPath: "inset(0 100% 0 0)", backgroundColor: "var(--c-raised)" }
                                      : { opacity: 0, y: 4 }
                                  }
                                  animate={
                                    isNew
                                      ? { clipPath: "inset(0 0% 0 0)", backgroundColor: "var(--c-surface)" }
                                      : { opacity: 1, y: 0 }
                                  }
                                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
                                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                                  className="group bg-surface rounded-none border border-rule p-3 shadow-none transition-all duration-150 border-l-2 border-l-transparent hover:border-l-ink-soft hover:bg-raised/50 cursor-default"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={clsx(
                                        "text-xs font-sans leading-snug flex-1",
                                        isDone ? "text-ink-faint line-through" : "font-semibold text-ink"
                                      )}
                                    >
                                      {task.title}
                                    </p>

                                    {/* Column Advance / Retreat controls */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {column.id !== "TODO" && (
                                        <button
                                          onClick={() => moveTask(task.id, retreatStatus(task.status))}
                                          className="p-1 rounded-none border border-rule bg-ground hover:bg-surface text-ink-soft hover:text-ink transition cursor-pointer"
                                          title="Move to previous stage"
                                        >
                                          <ArrowLeft className="w-3 h-3" />
                                        </button>
                                      )}
                                      {column.id !== "DONE" && (
                                        <button
                                          onClick={() => moveTask(task.id, advanceStatus(task.status))}
                                          className="p-1 rounded-none border border-rule bg-ground hover:bg-surface text-ink-soft hover:text-ink transition cursor-pointer"
                                          title="Move to next stage"
                                        >
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {task.description && (
                                    <p className="text-[11px] text-ink-faint mt-1 line-clamp-2 font-sans">
                                      {task.description}
                                    </p>
                                  )}

                                  <div className="mt-2.5 pt-2 border-t border-rule/50 flex items-center justify-between text-[10px] font-mono text-ink-faint">
                                    <span>
                                      {dayjs(task.created_at || undefined).isValid()
                                        ? dayjs(task.created_at).format("D MMM")
                                        : "—"}
                                    </span>

                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-ink-faint hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-none transition cursor-pointer"
                                      title="Delete task"
                                      aria-label="Delete task"
                                    >
                                      <Trash2 className="w-3 h-3 stroke-[1.8]" />
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>

                          {colTasks.length === 0 && (
                            <div className="py-8 text-center text-ink-faint font-mono text-[11px]">
                              <p className="italic">No tasks staged</p>
                            </div>
                          )}
                        </div>

                        {/* Inline Task Inscription */}
                        {activeProjectId != null && (
                          <InlineAddTask
                            projectId={activeProjectId}
                            status={column.id}
                            onCreated={handleTaskCreated}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
