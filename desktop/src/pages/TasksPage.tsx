import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, X, CalendarDays, AlignLeft,
  Loader2, CheckCircle2, Circle, CheckSquare, Clock,
  CornerDownLeft, Tag, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { clsx } from "clsx";
import dayjs from "dayjs";

// ─── Priority & Tag Helper ───────────────────────────────────────────────────
function getTaskMeta(task: Task) {
  const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now() && !task.completed;
  const isToday = task.dueAt && dayjs(task.dueAt).isSame(dayjs(), "day");
  
  // Extract tags like #Studio, #Finance from title or description
  const combined = `${task.title} ${task.description || ""}`;
  const tagMatches = combined.match(/#[a-zA-Z0-9_-]+/g);
  const tags = tagMatches ? Array.from(new Set(tagMatches)) : [];

  let priority: { label: string; colorClass: string; dotClass: string } = {
    label: "Standard",
    colorClass: "bg-[#F2EFE9] text-[#524B45] border-black/[0.06]",
    dotClass: "bg-[#827A72]",
  };

  if (isOverdue) {
    priority = {
      label: "Overdue",
      colorClass: "bg-[#FDF2F4] text-[#BE1239] border-[#FECDD3]",
      dotClass: "bg-[#BE1239]",
    };
  } else if (isToday || task.title.toLowerCase().includes("urgent") || task.title.includes("!")) {
    priority = {
      label: "High Priority",
      colorClass: "bg-[#D98A7E]/15 text-[#C87467] border-[#C87467]/25",
      dotClass: "bg-[#C87467]",
    };
  } else if (task.dueAt) {
    priority = {
      label: "Scheduled",
      colorClass: "bg-[#F8F3E8] text-[#D97706] border-[#D97706]/20",
      dotClass: "bg-[#D97706]",
    };
  }

  return { isOverdue, isToday, tags, priority };
}

// ─── New Task Modal ──────────────────────────────────────────────────────────
function NewTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (t: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    try {
      const task = await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });

      // SYNC to Calendar: if the task has a due date, create a matching Calendar Event
      if (dueAt) {
        try {
          const datePart = dueAt.split("T")[0];
          const timePart = dueAt.includes("T") ? dueAt.split("T")[1] : undefined;
          await api.createCalendarEvent({
            title: title.trim(),
            description: description.trim() || undefined,
            eventDate: datePart,
            startAt: timePart ? `${datePart}T${timePart}:00` : undefined,
            type: "TASK",
          });
        } catch (syncErr) {
          console.warn("Could not sync task to calendar:", syncErr);
        }
      }

      onCreated(task);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md morning-card-elevated overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4.5 bg-[#FAF8F5] border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D98A7E]/15 flex items-center justify-center text-[#C87467] shadow-sm">
              <CheckSquare className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#24211E] font-serif">Create New Task</h2>
              <p className="text-xs text-[#827A72]">Add an action item with optional deadline</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#827A72] hover:text-[#24211E] hover:bg-black/[0.04] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#524B45] uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              ref={ref}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done? (e.g. Draft proposal #Studio)"
              className="morning-input"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#524B45] uppercase tracking-wider mb-1.5">
              <AlignLeft className="w-3.5 h-3.5" /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, references, or notes..."
              rows={3}
              className="morning-input resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#524B45] uppercase tracking-wider mb-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Due Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="morning-input"
            />
          </div>

          {error && (
            <p className="text-xs text-[#C87467] font-semibold bg-[#C87467]/10 p-2.5 rounded-lg border border-[#C87467]/20">
              {error}
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-sm font-semibold text-[#6E6862] hover:bg-black/[0.04] hover:text-[#24211E] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 morning-btn-accent clay-button"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[2.2]" />}
              Create Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => { loadTasks(); }, [pendingOnly]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks(pendingOnly);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (task: Task) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    try {
      await api.updateTask(task.id, { completed: !task.completed });
      if (pendingOnly) {
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
        }, 300);
      }
    } catch {
      // Revert
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || quickSaving) return;
    setQuickSaving(true);
    try {
      const created = await api.createTask({
        title: quickTitle.trim(),
      });
      setTasks((prev) => [created, ...prev]);
      setQuickTitle("");
    } catch (err) {
      console.error("Failed to quick add task:", err);
    } finally {
      setQuickSaving(false);
    }
  };

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="h-full flex flex-col bg-transparent">
      <AnimatePresence>
        {showModal && (
          <NewTaskModal onClose={() => setShowModal(false)} onCreated={(t) => setTasks((p) => [t, ...p])} />
        )}
      </AnimatePresence>

      {/* Desk Top Bar */}
      <div className="shrink-0 bg-[#F5F2EC]/90 backdrop-blur-md border-b border-[#DDD7CE] px-8 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#24211E] tracking-tight font-serif">
              Task Ledger
            </h1>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-black/[0.08] text-[#827A72]">
              {pendingCount} active
            </span>
          </div>
          <p className="text-[#827A72] text-xs font-medium mt-0.5">
            {dayjs().format("dddd, MMMM D")} · Structured action items and ledger commitments
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="morning-btn-accent clay-button cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" /> New Task
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 relative">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Quick Task Inline Ledger Input */}
          <form
            onSubmit={handleQuickAdd}
            className="clay-card rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-sm border border-black/[0.07]"
          >
            <Plus className="w-4 h-4 text-[#827A72] flex-shrink-0" />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Quick capture to ledger... (e.g. Reconcile invoices #Finance, press Enter)"
              className="flex-1 bg-transparent text-sm text-[#24211E] placeholder:text-[#A39B92] outline-none font-medium"
            />
            <button
              type="submit"
              disabled={!quickTitle.trim() || quickSaving}
              className="font-mono text-xs text-white bg-[#C87467] hover:bg-[#B86356] disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl clay-button flex items-center gap-1 cursor-pointer"
            >
              {quickSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Add</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Filter Switcher & Counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#EAE5DE] p-1 rounded-xl border border-black/[0.06] shadow-2xs">
              {(["Pending", "All"] as const).map((lbl) => {
                const active = lbl === "Pending" ? pendingOnly : !pendingOnly;
                return (
                  <button
                    key={lbl}
                    onClick={() => setPendingOnly(lbl === "Pending")}
                    className={clsx(
                      "relative z-10 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 select-none cursor-pointer",
                      active
                        ? "bg-[#FAF8F5] text-[#24211E] shadow-xs border border-black/[0.04]"
                        : "text-[#6E6862] hover:text-[#24211E]"
                    )}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-[#827A72] font-medium font-mono">
              {tasks.length} total entries
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#827A72] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#C87467]" />
              <span className="text-xs font-medium">Loading ledger entries...</span>
            </div>
          ) : tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 clay-card p-8 border border-black/[0.07]"
            >
              <div className="w-12 h-12 bg-[#F2EFE9] rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#6B8065] border border-black/[0.06]">
                <CheckSquare className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="text-base font-bold text-[#24211E] font-serif">All caught up!</h3>
              <p className="text-[#827A72] text-xs mt-1">
                {pendingOnly ? "No pending tasks remaining. Your desk is clear!" : "No tasks found in your workspace."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {tasks.map((task) => {
                  const { isOverdue, tags, priority } = getTaskMeta(task);
                  return (
                    <motion.article
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
                      className={clsx(
                        "group clay-card rounded-2xl p-4.5 transition-all duration-150 hover:shadow-md border border-black/[0.07]",
                        task.completed && "opacity-75 bg-[#FAF8F5]/60"
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() => toggleComplete(task)}
                          className="mt-0.5 flex-shrink-0 transition-colors cursor-pointer text-[#827A72] hover:text-[#6B8065]"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-[#6B8065] stroke-[2.2]" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#A39B92] hover:text-[#6B8065] stroke-[1.8] transition-colors" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3
                              className={clsx(
                                "text-[14.5px] font-bold transition-colors leading-snug",
                                task.completed ? "text-[#A39B92] line-through" : "text-[#24211E]"
                              )}
                            >
                              {task.title}
                            </h3>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-[#827A72] hover:text-[#C87467] hover:bg-[#C87467]/10 rounded-lg transition cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4 stroke-[1.8]" />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-xs text-[#6E6862] mt-1.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-2.5">
                            {/* Priority badge */}
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border",
                                priority.colorClass
                              )}
                            >
                              <span className={clsx("w-1.5 h-1.5 rounded-full", priority.dotClass)} />
                              {priority.label}
                            </span>

                            {/* Due date badge */}
                            {task.dueAt && (
                              <span
                                className={clsx(
                                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold font-mono border",
                                  isOverdue
                                    ? "bg-[#FDF2F4] text-[#BE1239] border-[#FECDD3]"
                                    : "bg-[#F2EFE9] text-[#524B45] border-black/[0.06]"
                                )}
                              >
                                <Clock className="w-3 h-3 stroke-[2]" />
                                {dayjs(task.dueAt).format("MMM D, h:mm A")}
                              </span>
                            )}

                            {/* Tags */}
                            {tags.map((tg) => (
                              <span
                                key={tg}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#827A72] bg-[#FAF8F5] border border-black/[0.06] px-2 py-0.5 rounded-md"
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {tg}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

