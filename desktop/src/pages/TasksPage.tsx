import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, X, CalendarDays, AlignLeft,
  Loader2, CheckCircle2, Circle, CheckSquare, Sparkles, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import type { Task } from "@/lib/types";
import { clsx } from "clsx";
import dayjs from "dayjs";

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
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#827A72] hover:text-[#24211E] hover:bg-black/[0.04] transition-colors cursor-pointer">
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
              placeholder="What needs to be done? (e.g. 5km run, buy groceries)"
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
              placeholder="Add details or notes..."
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

// ─── Main Tasks Page ─────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingOnly, setPendingOnly] = useState(false);
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
    sound.pop();
    const willBeCompleted = !task.completed;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: willBeCompleted } : t))
    );

    try {
      await api.updateTask(task.id, { completed: willBeCompleted });

      // Check if all tasks are completed now
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
      setQuickTitle("");
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
    <div className="h-full flex flex-col bg-transparent">
      <AnimatePresence>
        {showModal && (
          <NewTaskModal onClose={() => setShowModal(false)} onCreated={(t) => setTasks((p) => [t, ...p])} />
        )}
      </AnimatePresence>

      {/* Desk Top Bar */}
      <div className="shrink-0 bg-[#F5F2EC]/90 backdrop-blur-md border-b border-[#DDD7CE] px-8 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#24211E] tracking-tight font-serif">
              Personal To-Dos
            </h1>
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-black/[0.08] text-[#827A72]">
              {pendingCount} remaining
            </span>
          </div>
          <p className="text-[#827A72] text-xs font-medium mt-0.5">
            {dayjs().format("dddd, MMMM D")} · Daily intentions and habits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { sound.pop(); setShowModal(true); }}
            className="morning-btn-accent clay-button cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" /> New Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 relative">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Daily Progress Completion Bar */}
          {totalCount > 0 && (
            <div className="clay-card rounded-2xl p-4 px-5 border border-black/[0.06] shadow-xs flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                  <span className="text-[#524B45]">
                    {progressPercent === 100 ? (
                      <span className="text-[#6B8065] font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> All clear for today! Great momentum.
                      </span>
                    ) : (
                      <span>{completedCount} of {totalCount} completed</span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-[#24211E]">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE5DE] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#D98A7E] to-[#C87467]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Task Inline Input */}
          <form
            onSubmit={handleQuickAdd}
            className="clay-card rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-sm border border-black/[0.07]"
          >
            <Plus className="w-4 h-4 text-[#827A72] flex-shrink-0" />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Add a task... (e.g. 5km run, buy groceries, press Enter)"
              className="flex-1 bg-transparent text-sm text-[#24211E] placeholder:text-[#A39B92] outline-none font-medium"
            />
            <button
              type="submit"
              disabled={quickSaving || !quickTitle.trim()}
              className="p-1 px-3 rounded-lg bg-[#FAF8F5] hover:bg-white text-xs font-bold text-[#C87467] border border-black/[0.06] transition-all disabled:opacity-40 cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { sound.pop(); setPendingOnly(false); }}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  !pendingOnly
                    ? "bg-[#24211E] text-white shadow-xs"
                    : "bg-[#FAF8F5] text-[#827A72] hover:text-[#24211E] border border-black/[0.06]"
                )}
              >
                All Tasks ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => { sound.pop(); setPendingOnly(true); }}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  pendingOnly
                    ? "bg-[#24211E] text-white shadow-xs"
                    : "bg-[#FAF8F5] text-[#827A72] hover:text-[#24211E] border border-black/[0.06]"
                )}
              >
                Pending Only ({pendingCount})
              </button>
            </div>
          </div>

          {/* Task List Items */}
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className={clsx(
                    "clay-card rounded-2xl p-4 flex items-center justify-between gap-4 border transition-all duration-150 group",
                    task.completed
                      ? "bg-[#FAF8F5]/60 border-black/[0.04]"
                      : "hover:border-[#C87467]/30 border-black/[0.07]"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Animated Checkbox with Ink-Pop */}
                    <button
                      type="button"
                      onClick={() => toggleComplete(task)}
                      className="cursor-pointer flex-shrink-0"
                    >
                      <motion.div
                        whileTap={{ scale: 0.85 }}
                        className={clsx(
                          "w-5 h-5 rounded-lg flex items-center justify-center transition-colors duration-200 border",
                          task.completed
                            ? "bg-[#C87467] border-[#C87467] text-white shadow-xs"
                            : "border-stone-300 bg-white hover:border-[#C87467]"
                        )}
                      >
                        {task.completed && (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 28 }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </motion.div>
                        )}
                      </motion.div>
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={clsx(
                          "text-sm font-medium transition-all duration-200 truncate",
                          task.completed
                            ? "line-through text-[#A39B92]"
                            : "text-[#24211E]"
                        )}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-[#827A72] truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {task.dueAt && (
                      <span className="text-[11px] font-mono text-[#827A72] flex items-center gap-1 bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-black/[0.05]">
                        <CalendarDays className="w-3 h-3 text-[#C87467]" />
                        {dayjs(task.dueAt).format("MMM D")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#C87467]/10 text-[#827A72] hover:text-[#C87467] transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {tasks.length === 0 && !loading && (
              <div className="text-center py-12 text-[#827A72] font-serif">
                <p className="text-base italic">No tasks in your ledger yet.</p>
                <p className="text-xs mt-1 text-[#A39B92]">Add a task above to plan your day.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
