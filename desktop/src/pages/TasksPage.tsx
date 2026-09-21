import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, X, CalendarDays, AlignLeft,
  Loader2, CheckSquare, Sparkles, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import type { Task } from "@/lib/types";
import { clsx } from "clsx";
import dayjs from "dayjs";

// ─── New Task Modal (Disciplined Ledger Voucher) ──────────────────────────────
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
    if (!title.trim()) { setError("Task title is required."); return; }
    setSaving(true);
    setError("");
    try {
      const task = await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });

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

      sound.pop();
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
        {/* Top Vermilion Margin Rule */}
        <div className="h-0.5 bg-accent w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface border-b border-rule">
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight font-serif">
              New Action Item
            </h2>
            <p className="text-[11px] text-ink-faint font-mono uppercase tracking-wider mt-0.5">
              Task docket · ledger record
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
              Task Title *
            </label>
            <input
              ref={ref}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audit quarterly invoices, run 5km, draft memo"
              className="w-full px-3 py-2 rounded-none border border-rule bg-ground text-ink placeholder:text-ink-faint text-xs outline-none focus:border-accent transition font-sans shadow-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider mb-1">
              Particulars / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or instructions..."
              rows={2}
              className="w-full px-3 py-2 rounded-none border border-rule bg-ground text-ink placeholder:text-ink-faint text-xs outline-none focus:border-accent transition font-sans resize-none shadow-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider mb-1">
              Due Date &amp; Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full px-3 py-1.5 rounded-none border border-rule bg-ground text-ink text-xs font-mono outline-none focus:border-accent transition shadow-none"
            />
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
              Record Item
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Tasks Page (Tight Ruled List) ──────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<number | null>(null);

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
    sound.pop();
    const willBeCompleted = !task.completed;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: willBeCompleted } : t))
    );

    try {
      await api.updateTask(task.id, { completed: willBeCompleted });

      const updatedTotal = tasks.length;
      const updatedDone = tasks.filter((t) => (t.id === task.id ? willBeCompleted : t.completed)).length;
      if (willBeCompleted && updatedDone === updatedTotal && updatedTotal > 0) {
        sound.chime();
      }

      if (pendingOnly && willBeCompleted) {
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
        }, 300);
      }
    } catch {
      // Revert on failure
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  };

  const deleteTask = async (id: number) => {
    sound.pop();
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskCreated = (t: Task) => {
    setTasks((prev) => [t, ...prev]);
    setNewlyAddedId(t.id);
    setTimeout(() => setNewlyAddedId(null), 1600);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || quickSaving) return;
    setQuickSaving(true);
    try {
      const created = await api.createTask({
        title: quickTitle.trim(),
      });
      sound.pop();
      setTasks((prev) => [created, ...prev]);
      setNewlyAddedId(created.id);
      setQuickTitle("");
      setTimeout(() => setNewlyAddedId(null), 1600);
    } catch (err) {
      console.error("Failed to quick add task:", err);
    } finally {
      setQuickSaving(false);
    }
  };

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-ground">
      <AnimatePresence>
        {showModal && (
          <NewTaskModal onClose={() => setShowModal(false)} onCreated={handleTaskCreated} />
        )}
      </AnimatePresence>

      {/* Desk Top Bar (Ledger Navigation) */}
      <div className="shrink-0 bg-surface border-b border-rule px-8 py-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-ink tracking-tight font-serif">
              Tasks
            </h1>
            <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-none bg-ground border border-rule text-ink-soft">
              {pendingCount} remaining
            </span>
          </div>
          <p className="text-ink-faint text-xs mt-0.5 font-sans">
            {dayjs().format("dddd, D MMMM YYYY")} · Action items &amp; disciplined execution
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { sound.pop(); setShowModal(true); }}
            className="px-3.5 py-1.5 rounded-none bg-accent text-white text-xs font-mono font-semibold hover:opacity-90 transition flex items-center gap-1.5 active:scale-[0.97] active:translate-y-[0.5px] cursor-pointer shadow-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2]" /> New Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Progress Completion Rule */}
          {totalCount > 0 && (
            <div className="bg-surface rounded-none border border-rule p-4 px-5 shadow-none flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                  <span className="text-ink-soft font-sans">
                    {progressPercent === 100 ? (
                      <span className="text-done font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> All action items cleared for today.
                      </span>
                    ) : (
                      <span>{completedCount} of {totalCount} completed</span>
                    )}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-ink">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-none bg-ground border border-rule overflow-hidden">
                  <motion.div
                    className={clsx(
                      "h-full rounded-none transition-all duration-500",
                      progressPercent === 100 ? "bg-done" : "bg-done"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Task Inline Input (Sharp Ledger Row) */}
          <form
            onSubmit={handleQuickAdd}
            className="bg-surface rounded-none border border-rule p-2 px-3.5 flex items-center gap-2.5 shadow-none"
          >
            <Plus className="w-3.5 h-3.5 text-ink-faint shrink-0" />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Inscribe a new task... (press Enter)"
              className="flex-1 bg-transparent text-xs text-ink placeholder:text-ink-faint outline-none font-sans"
            />
            <button
              type="submit"
              disabled={quickSaving || !quickTitle.trim()}
              className="px-2.5 py-1 rounded-none bg-ink text-ground hover:opacity-90 text-xs font-mono font-medium transition-all active:scale-[0.97] disabled:opacity-40 cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Filter Bar */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { sound.pop(); setPendingOnly(false); }}
                className={clsx(
                  "px-2.5 py-1 rounded-none text-xs font-mono transition-all cursor-pointer border",
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
                  "px-2.5 py-1 rounded-none text-xs font-mono transition-all cursor-pointer border",
                  pendingOnly
                    ? "bg-ink text-ground border-ink font-semibold"
                    : "bg-surface text-ink-soft hover:text-ink border-rule"
                )}
              >
                Pending ({pendingCount})
              </button>
            </div>
          </div>

          {/* The Tight Ruled Task Sheet */}
          <div className="bg-surface rounded-none border border-rule overflow-hidden shadow-none">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-ink-faint gap-2 font-mono text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-ink-soft" />
                <span>Auditing tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-ink-faint p-6">
                <p className="text-sm font-serif italic text-ink-soft">No tasks recorded in your ledger.</p>
                <p className="text-xs mt-1 text-ink-faint font-sans">Inscribe an action item above to begin your day.</p>
              </div>
            ) : (
              <div className="divide-y divide-rule">
                {tasks.map((task) => {
                  const isNew = newlyAddedId === task.id;

                  return (
                    <motion.div
                      key={task.id}
                      initial={isNew ? { clipPath: "inset(0 100% 0 0)", backgroundColor: "var(--c-raised)" } : false}
                      animate={isNew ? { clipPath: "inset(0 0% 0 0)", backgroundColor: "transparent" } : {}}
                      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                      className="group flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-raised transition-all duration-150 border-l-2 border-l-transparent hover:border-l-ink-soft cursor-default text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Square Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleComplete(task)}
                          className="cursor-pointer shrink-0"
                          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          <div
                            className={clsx(
                              "w-4 h-4 rounded-none flex items-center justify-center transition-colors duration-150 border",
                              task.completed
                                ? "bg-done border-done text-white"
                                : "border-rule bg-ground hover:border-ink-soft"
                            )}
                          >
                            {task.completed && (
                              <Check className="w-3 h-3 stroke-[3]" />
                            )}
                          </div>
                        </button>

                        {/* Title with Literal Pen Strike-Through */}
                        <div className="min-w-0 flex-1 relative">
                          <div className="relative inline-block max-w-full">
                            <span
                              className={clsx(
                                "font-sans text-xs transition-colors duration-200 block truncate",
                                task.completed ? "text-ink-faint" : "text-ink font-medium"
                              )}
                            >
                              {task.title}
                            </span>

                            {/* Literal Pen Strike-Through Line */}
                            {task.completed && (
                              <motion.span
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-ink-soft/70 w-full origin-left pointer-events-none"
                              />
                            )}
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-ink-faint truncate mt-0.5 font-sans">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Due Date & Actions */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {task.dueAt && (
                          <span className="text-[10px] font-mono text-ink-faint flex items-center gap-1 bg-ground px-1.5 py-0.5 rounded-none border border-rule">
                            <CalendarDays className="w-3 h-3 text-ink-soft" />
                            {dayjs(task.dueAt).format("D MMM")}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-none hover:text-danger text-ink-faint transition-all active:scale-90 border border-transparent hover:border-rule cursor-pointer"
                          title="Delete task"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
