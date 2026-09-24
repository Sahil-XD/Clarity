import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X,
  CalendarDays, Clock, Loader2, CheckSquare, StickyNote, AlertCircle, AlignLeft,
  Trash2, Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import type { CalendarEvent, Task } from "@/lib/types";
import dayjs from "dayjs";
import { clsx } from "clsx";

type ViewMode = "year" | "month" | "day";
type TabMode = "tasks" | "notes";

// ─── Add Task Modal ───────────────────────────────────────────────────────────
function AddTaskModal({
  defaultDate, onClose, onCreated,
}: {
  defaultDate: string;
  onClose: () => void;
  onCreated: (e: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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
      await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        due_at: eventDate ? new Date(eventDate).toISOString() : undefined
      });
      const created = await api.createCalendarEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        event_type: "TASK",
        start_at: startTime ? `${eventDate}T${startTime}:00` : undefined,
        end_at: endTime ? `${eventDate}T${endTime}:00` : undefined,
      });
      onCreated(created);
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
        className="w-full max-w-md bg-surface rounded-3xl border border-rule shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4.5 bg-surface border-b border-rule">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-raised border border-rule flex items-center justify-center text-ink shadow-xs">
              <CheckSquare className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink font-serif">New Calendar Task</h2>
              <p className="text-xs text-ink-faint">Add a scheduled item to your agenda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              ref={ref}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly product sync & sprint review"
              className="morning-input"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Scheduled Date *
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="morning-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                <Clock className="w-3.5 h-3.5" /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="morning-input"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                <Clock className="w-3.5 h-3.5" /> End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="morning-input"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              <AlignLeft className="w-3.5 h-3.5" /> Description & Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add agenda, links or context..."
              rows={3}
              className="morning-input resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-accent font-semibold bg-accent/10 p-2.5 rounded-lg border border-accent/20">
              {error}
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-rule text-sm font-semibold text-ink-soft hover:bg-raised hover:text-ink transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 morning-btn-accent  cursor-pointer"
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

// ─── Main CalendarPage ────────────────────────────────────────────────────────

// ─── Add Note Modal ─────────────────────────────────────────────────────────
function AddNoteModal({
  defaultDate, onClose, onCreated,
}: {
  defaultDate: string;
  onClose: () => void;
  onCreated: (e: CalendarEvent) => void;
}) {
  const [text, setText] = useState("");
  const [eventDate, setEventDate] = useState(defaultDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { setError("Note text is required."); return; }
    setSaving(true);
    setError("");
    try {
      const created = await api.createCalendarEvent({
        title: text.trim(),
        description: undefined,
        event_date: eventDate,
        event_type: "NOTE",
      });
      sound.chime();
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-xs p-4 select-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-surface rounded-3xl border border-rule shadow-2xl overflow-hidden bg-surface rounded-3xl border border-rule shadow-2xl"
      >
        <div className="px-6 py-4.5 bg-raised border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-raised border border-rule flex items-center justify-center text-ink shadow-xs">
              <StickyNote className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink font-serif">Add Note</h3>
              <p className="text-[11px] text-ink-faint">Quick note or reflection for your calendar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-faint hover:text-ink transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="morning-input text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              Note Content
            </label>
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind or scheduled for this day?"
              rows={4}
              className="morning-input resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-accent font-semibold bg-accent/10 p-2.5 rounded-lg border border-accent/20 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-rule text-sm font-semibold text-ink-soft hover:bg-raised hover:text-ink transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className="flex-1 morning-btn-accent  cursor-pointer justify-center"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[2.2]" />}
              Save Note
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("month");
  const [tab, setTab] = useState<TabMode>("tasks");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [yearHeatmap, setYearHeatmap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [view, currentDate, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const effectiveView = tab === "notes" ? "month" : view;

      if (effectiveView === "year") {
        const heatmap = await api.getYearHeatmap(currentDate.year());
        setYearHeatmap(heatmap);
      } else if (effectiveView === "month") {
        const from = tab === "notes"
          ? currentDate.subtract(1, "year").startOf("year").format("YYYY-MM-DD")
          : currentDate.startOf("month").format("YYYY-MM-DD");
        const to = tab === "notes"
          ? currentDate.add(1, "year").endOf("year").format("YYYY-MM-DD")
          : currentDate.endOf("month").format("YYYY-MM-DD");
        const [evts, taskList] = await Promise.all([
          api.getCalendarRange(from, to),
          api.getTasks(false),
        ]);
        setAllEvents(evts);
        setTasks(taskList);
      } else {
        const [evts, taskList] = await Promise.all([
          api.getCalendarDay(currentDate.format("YYYY-MM-DD")),
          api.getTasks(false),
        ]);
        setAllEvents(evts);
        setTasks(taskList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize calendar events with tasks:
  // Discard any task calendar events whose underlying task was deleted from tasks
  const validEvents = allEvents.filter((e) => {
    if (e.event_type !== "TASK") return true; // Notes always stay
    return tasks.some(
      (t) => t.title.trim().toLowerCase() === e.title.trim().toLowerCase()
    );
  });

  const mergedEvents: CalendarEvent[] = [
    ...validEvents.map((e) => {
      if (e.event_type === "TASK") {
        const matching = tasks.find(
          (t) => t.title.trim().toLowerCase() === e.title.trim().toLowerCase()
        );
        if (matching) {
          return {
            ...e,
            completed: matching.completed,
          };
        }
      }
      return e;
    }),
    ...tasks
      .filter((t) => t.due_at)
      .map((t): CalendarEvent => ({
        id: t.id,
        user_id: t.user_id,
        title: t.title,
        description: t.description,
        event_date: dayjs(t.due_at).format("YYYY-MM-DD"),
        event_type: "TASK",
        start_at: t.due_at,
        end_at: null,
        remind_at: t.remind_at,
        reminder_sent: t.reminder_sent,
        created_at: t.created_at,
        updated_at: t.updated_at,
        deleted_at: null,
        completed: t.completed,
      }))
      .filter(
        (synced) =>
          !validEvents.some(
            (e) =>
              e.event_type === "TASK" &&
              e.title.trim().toLowerCase() === synced.title.trim().toLowerCase() &&
              e.event_date === synced.event_date
          )
      ),
  ];

  const filteredEvents = mergedEvents.filter((e) =>
    tab === "tasks" ? e.event_type === "TASK" : e.event_type === "NOTE"
  );

  const navigate = (dir: "prev" | "next") => {
    const delta = dir === "next" ? 1 : -1;
    const unit = (tab === "tasks" && view === "year") ? "year" : (tab === "notes" || view === "month") ? "month" : "day";
    setCurrentDate(currentDate.add(delta, unit));
  };

  const defaultDate = currentDate.format("YYYY-MM-DD");

  return (
    <div className="h-full flex flex-col bg-transparent">
      <AnimatePresence>
        {showTaskModal && (
          <AddTaskModal
            defaultDate={defaultDate}
            onClose={() => setShowTaskModal(false)}
            onCreated={(e) => { setAllEvents((p) => [...p, e]); loadData(); }}
          />
        )}
        {showNoteModal && (
          <AddNoteModal
            defaultDate={defaultDate}
            onClose={() => setShowNoteModal(false)}
            onCreated={(e) => { setAllEvents((p) => [...p, e]); loadData(); }}
          />
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="shrink-0 bg-surface/85 backdrop-blur-md border-b border-rule">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Nav Arrows */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-rule shadow-xs">
              <button
                onClick={() => navigate("prev")}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-raised text-ink-soft hover:text-ink transition cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2]" />
              </button>
              <button
                onClick={() => navigate("next")}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-raised text-ink-soft hover:text-ink transition cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Current View Title */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-ink flex items-baseline gap-2 font-serif">
                {tab === "notes" || view === "month"
                  ? currentDate.format("MMMM")
                  : view === "year"
                    ? currentDate.format("YYYY")
                    : currentDate.format("dddd, MMM D")}
                {(tab === "notes" || view === "month") && (
                  <span className="text-ink-faint font-normal text-2xl">
                    {currentDate.format("YYYY")}
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Today Button */}
            <button
              onClick={() => setCurrentDate(dayjs())}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-rule bg-surface text-ink hover:bg-raised transition-all cursor-pointer"
            >
              Today
            </button>

            {/* Tasks / Notes Tab Pill Switcher */}
            <div className="flex items-center bg-ground rounded-xl p-1 border border-rule">
              {(["tasks", "notes"] as TabMode[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-180 cursor-pointer select-none",
                    tab === t
                      ? "bg-surface text-ink shadow-sm border border-rule"
                      : "text-ink-soft hover:text-ink border border-transparent"
                  )}
                >
                  {t === "tasks" ? (
                    <CheckSquare className={clsx("w-3.5 h-3.5 stroke-[2.2]", tab === t ? "text-ink" : "text-ink-faint")} />
                  ) : (
                    <StickyNote className={clsx("w-3.5 h-3.5 stroke-[2.2]", tab === t ? "text-ink" : "text-ink-faint")} />
                  )}
                  {t === "tasks" ? "Tasks" : "Notes"}
                </button>
              ))}
            </div>

            {/* Add Task Button (Tasks tab only) */}
            {tab === "tasks" && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="morning-btn-accent  cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
                Add Task
              </button>
            )}

            {/* Add Note Button (Notes tab only) */}
            {tab === "notes" && (
              <button
                onClick={() => setShowNoteModal(true)}
                className="morning-btn-accent  cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
                Add Note
              </button>
            )}
          </div>
        </div>

        {/* View Mode Switcher (Year / Month / Day - Only for Tasks) */}
        {tab === "tasks" && (
          <div className="px-6 pb-3 flex items-center gap-1.5">
            {(["year", "month", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all duration-150 cursor-pointer",
                  view === v
                    ? "bg-surface text-ink border border-rule shadow-xs"
                    : "text-ink-faint hover:bg-raised hover:text-ink"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content Body ───────────────────────────────────────── */}
      <div className="flex-1 overflow-auto relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-ink-faint gap-2.5">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-sm font-medium">Loading agenda...</span>
          </div>
        ) : tab === "notes" ? (
          <NotesFeed
            events={filteredEvents}
            onCreated={(e) => setAllEvents((p) => [...p, e])}
            onReload={loadData}
          />
        ) : view === "year" ? (
          <div className="max-w-6xl mx-auto p-8">
            <YearView heatmap={yearHeatmap} year={currentDate.year()} />
          </div>
        ) : view === "month" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`month-${tab}-${currentDate.format("YYYY-MM")}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="max-w-7xl mx-auto p-6"
            >
              <MonthView
                events={filteredEvents}
                month={currentDate}
                tab={tab}
                onDayClick={(date) => { setCurrentDate(date); setView("day"); }}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`day-${tab}-${currentDate.format("YYYY-MM-DD")}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="max-w-3xl mx-auto p-6"
            >
              <DayView events={filteredEvents} tab={tab} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Notes Feed ───────────────────────────────────────────────────────────────
function NotesFeed({
  events, onCreated, onReload,
}: {
  events: CalendarEvent[];
  onCreated: (e: CalendarEvent) => void;
  onReload: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [manualDates, setManualDates] = useState<string[]>([]);

  const byDate: Record<string, CalendarEvent[]> = {};
  const defaultRecentDays = Array.from({ length: 7 }, (_, i) =>
    dayjs().subtract(i, "day").format("YYYY-MM-DD")
  );
  const allDateStrings = new Set<string>(defaultRecentDays);

  events.forEach((e) => {
    if (!byDate[e.event_date]) byDate[e.event_date] = [];
    byDate[e.event_date].push(e);
    allDateStrings.add(e.event_date);
  });
  manualDates.forEach(d => allDateStrings.add(d));

  // Always show all dates that have notes, plus the recent 7 days
  let days = Array.from(allDateStrings).sort((a, b) => b.localeCompare(a));
  if (!showAll && days.length > 14) {
    days = days.slice(0, 14);
  }

  const handleAddedDay = (date: string) => {
    if (!manualDates.includes(date)) setManualDates(p => [...p, date]);
    setAddingDate(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {days.map((date) => (
        <DiaryDayCard
          key={date}
          date={date}
          notes={byDate[date] || []}
          onCreated={onCreated}
          onReload={onReload}
        />
      ))}

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-6 pb-12 border-t border-rule">
        {!showAll && allDateStrings.size > 7 ? (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-bold text-accent hover:text-accent-soft transition cursor-pointer"
          >
            Show earlier notes ({allDateStrings.size - 7} more days) →
          </button>
        ) : showAll && allDateStrings.size > 7 ? (
          <button
            onClick={() => setShowAll(false)}
            className="text-xs font-semibold text-ink-faint hover:text-ink transition cursor-pointer"
          >
            ← Show recent 7 days only
          </button>
        ) : <div />}

        <button
          onClick={() => setAddingDate(dayjs().format("YYYY-MM-DD"))}
          className="morning-btn-primary"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
          Add Specific Date
        </button>
      </div>

      {/* Quick Add Day Modal */}
      <AnimatePresence>
        {addingDate && (
          <QuickAddNoteModal
            date={addingDate}
            onClose={() => setAddingDate(null)}
            onAdded={handleAddedDay}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Single Day Note Card ─────────────────────────────────────────────────────
function DiaryDayCard({
  date, notes, onCreated, onReload,
}: {
  date: string;
  notes: CalendarEvent[];
  onCreated: (e: CalendarEvent) => void;
  onReload: () => void;
}) {
  const d = dayjs(date);
  const isToday = d.isSame(dayjs(), "day");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleEdit = (note: CalendarEvent) => {
    setEditId(note.id);
    setEditText(note.title);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    await api.updateCalendarEvent(editId, editText.trim());
    setEditId(null);
    onReload();
  };

  const handleDelete = async (note: CalendarEvent) => {
    if (confirmDeleteId !== note.id) {
      setConfirmDeleteId(note.id);
      setTimeout(() => setConfirmDeleteId((cur) => (cur === note.id ? null : cur)), 3500);
      return;
    }
    setConfirmDeleteId(null);
    if (note.event_type === "TASK") {
      await api.deleteTask(note.id);
    } else {
      await api.deleteCalendarEvent(note.id);
    }
    onReload();
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    setSaveError("");
    try {
      const created = await api.createCalendarEvent({
        title: trimmed,
        description: undefined,
        event_date: date,
        event_type: "NOTE",
      });
      sound.pop();
      onCreated(created);
      onReload();
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.value = "";
      }
    } catch (err: any) {
      sound.pop();
      setSaveError(err?.message || "Failed to save note. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 240) + "px";
  };

  return (
    <div className={clsx(
      "rounded-2xl border overflow-hidden transition-all bg-surface rounded-xl border border-rule",
      isToday
        ? "border-accent/60 ring-1 ring-accent/30"
        : "border-rule hover:border-black/[0.12] hover:shadow-sm"
    )}>
      {/* Date Header Strip */}
      <div className="px-5 py-3.5 bg-surface border-b border-rule flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base font-serif",
            isToday
              ? "bg-raised text-accent font-bold border border-accent ring-1 ring-accent"
              : "bg-raised text-ink border border-rule"
          )}>
            {d.format("DD")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink font-serif">
                {d.format("dddd")}
              </span>
              {isToday && (
                <span className="px-1.5 py-0.5 rounded-md bg-raised text-ink-soft text-[10px] font-bold uppercase tracking-wide border border-rule">
                  Today
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-faint font-medium">
              {d.format("MMMM D, YYYY")}
            </p>
          </div>
        </div>

        {notes.length > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-raised text-ink-soft border border-rule">
            {notes.length} note{notes.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Note Items & Writing Area */}
      <div className="p-5 space-y-3.5">
        {/* Existing Note List */}
        {notes.length > 0 && (
          <div className="space-y-2.5">
            {notes.map((note) => (
              <div key={note.id} className="group relative rounded-xl transition-all">
                {editId === note.id ? (
                  <div className="p-3 bg-surface rounded-xl border border-accent/40 space-y-2 shadow-xs">
                    <textarea
                      rows={2}
                      className="w-full bg-transparent text-sm text-ink outline-none resize-none font-medium leading-relaxed"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleSaveEdit();
                        } else if (e.key === "Escape") {
                          setEditId(null);
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-rule">
                      <span className="text-[10px] text-ink-faint">Ctrl+Enter to save • Esc to cancel</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditId(null)}
                          className="px-2.5 py-1 text-xs font-semibold text-ink-faint hover:text-ink transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-accent hover:bg-accent-soft text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl hover:bg-black/[0.03] transition group/row">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-ink-faint flex-shrink-0" />
                      <p className="text-[14px] font-medium text-ink leading-snug whitespace-pre-wrap flex-1">
                        {note.title}
                      </p>
                    </div>
                    {confirmDeleteId === note.id ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 flex-shrink-0 pl-2"
                      >
                        <span className="text-[11px] font-bold text-accent">Delete?</span>
                        <button
                          onClick={() => handleDelete(note)}
                          className="px-2 py-0.5 text-[11px] font-bold text-white morning-btn-primary rounded-md transition cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-ink-soft hover:text-ink hover:bg-black/[0.05] rounded-md transition cursor-pointer"
                        >
                          No
                        </button>
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => handleEdit(note)}
                          title="Edit note"
                          className="p-1 rounded-lg text-ink-faint hover:text-ink hover:bg-black/[0.05] transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note)}
                          title="Delete note"
                          className="p-1 rounded-lg text-ink-faint hover:text-accent hover:bg-accent/10 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inline Note Entry Box */}
        <div className="pt-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={`Add a quick note for ${d.format("MMM D")}...`}
            rows={1}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-rule text-ink placeholder:text-ink-faint text-sm leading-relaxed outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition resize-none pr-24 shadow-xs"
            style={{ minHeight: "44px" }}
          />
          {!text.trim() && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-raised border border-rule text-[10px] font-bold text-ink-faint leading-none">Ctrl+Enter ↵</kbd>
            </span>
          )}

          {text.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mt-2 px-1"
            >
              <span className="text-[11px] text-ink-faint">Enter to save • Shift+Enter for new line</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="morning-btn-accent"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 stroke-[2.2]" />}
                Save Note
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Add Note Modal ─────────────────────────────────────────────────────
function QuickAddNoteModal({
  date, onClose, onAdded,
}: {
  date: string;
  onClose: () => void;
  onAdded: (date: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(date);

  const handleSave = () => {
    onAdded(selectedDate);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        className="w-full max-w-sm bg-surface rounded-3xl border border-rule shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4.5 bg-surface border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-raised border border-rule flex items-center justify-center text-ink shadow-xs">
              <StickyNote className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink font-serif">Add Date Note</h3>
              <p className="text-[11px] text-ink-faint">Pick any date for the notes feed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-raised transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="morning-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-rule">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-rule text-xs font-semibold text-ink-soft hover:bg-raised hover:text-ink transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="morning-btn-accent"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
              Add Day Card
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Year View (Task Activity Heatmap) ─────────────────────────────────────────
function YearView({ heatmap, year }: { heatmap: Record<number, number>; year: number }) {
  const months = Array.from({ length: 12 }, (_, i) => dayjs().year(year).month(i));
  const maxCount = Math.max(...Object.values(heatmap), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {months.map((m) => {
        const monthNum = m.month() + 1;
        const count = heatmap[monthNum] || 0;
        const intensity = count / maxCount;
        return (
          <motion.div
            key={monthNum}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.12 }}
            className="rounded-2xl p-5 bg-surface rounded-xl border border-rule border border-rule hover:border-black/[0.12] transition-all relative overflow-hidden group shadow-xs"
          >
            <div className="relative z-10 flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-ink font-serif">
                {m.format("MMMM")}
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-raised text-ink-soft border border-rule">
                {count} {count === 1 ? "task" : "tasks"}
              </span>
            </div>
            <div className="relative z-10 w-full bg-ground h-1.5 rounded-full overflow-hidden mt-4">
              <div
                className="bg-accent h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(8, intensity * 100))}%` }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Month View (Grid) ────────────────────────────────────────────────────────
function MonthView({
  events, month, tab, onDayClick,
}: {
  events: CalendarEvent[];
  month: dayjs.Dayjs;
  tab: TabMode;
  onDayClick: (date: dayjs.Dayjs) => void;
}) {
  const startDay = month.startOf("month").day();
  const daysInMonth = month.daysInMonth();
  const blanks = Array.from({ length: startDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const byDate = events.reduce((acc, e) => {
    const k = e.event_date;
    if (!acc[k]) acc[k] = [];
    acc[k].push(e);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="bg-surface rounded-2xl border border-rule p-4 overflow-hidden">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-2 mb-2.5 px-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[11.5px] font-bold font-mono text-ink-faint uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {blanks.map((_, i) => (
            <div key={`b${i}`} className="min-h-[105px] rounded-xl bg-ground/40 border border-rule/30" />
          ))}
          {days.map((day) => {
            const date = month.date(day);
            const dateStr = date.format("YYYY-MM-DD");
            const dayEvents = byDate[dateStr] || [];
            const isToday = date.isSame(dayjs(), "day");

            return (
              <motion.div
                key={day}
                onClick={() => onDayClick(date)}
                whileHover={{ scale: 1.015, y: -1 }}
                transition={{ duration: 0.12 }}
                className={clsx(
                  "rounded-xl p-2.5 min-h-[105px] cursor-pointer border transition-all flex flex-col group relative overflow-hidden bg-raised hover:bg-surface",
                  isToday
                    ? "morning-today"
                    : "border-rule hover:border-rule/80"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={clsx(
                    "text-[12.5px] font-mono",
                    isToday
                      ? "text-accent font-bold"
                      : "text-ink-soft group-hover:text-ink font-semibold"
                  )}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className={clsx(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      tab === "tasks" ? "bg-done" : "bg-ink-soft"
                    )} />
                  )}
                </div>

                {/* Event Chips — Crisp Stationery Pills */}
                <div className="mt-auto space-y-1.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={clsx(
                        "text-[11px] px-2.5 py-1 rounded-lg truncate font-semibold border-l-[3px] shadow-xs",
                        tab === "tasks"
                          ? "bg-raised text-ink border-done"
                          : "bg-raised text-ink border-accent"
                      )}
                    >
                      {e.completed ? "✓ " : ""}{e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-ink-faint font-semibold pl-1 font-mono">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
    </div>
  );
}

// ─── Day View (Timeline Agenda) ───────────────────────────────────────────────
function DayView({ events }: { events: CalendarEvent[]; tab: TabMode }) {
  const allDay = events.filter((e) => !e.start_at);
  const timed = events.filter((e) => !!e.start_at);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (events.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-rule p-10 text-center">
        <div className="w-12 h-12 bg-raised rounded-2xl flex items-center justify-center mx-auto mb-3 text-accent border border-rule">
          <CalendarDays className="w-6 h-6 stroke-[1.8]" />
        </div>
        <h3 className="text-base font-bold text-ink font-serif">A clear day</h3>
        <p className="text-ink-faint text-xs mt-1">
          Nothing scheduled — enjoy the open hours, or add a task above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* All-day Section */}
      {allDay.length > 0 && (
        <div className="bg-surface rounded-xl border border-rule p-5">
          <div className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-3">All Day Tasks</div>
          <div className="space-y-2">
            {allDay.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-3.5 py-2.5 rounded-xl bg-raised text-ink border-l-[3px] border-done shadow-xs"
              >
                <div className="font-bold text-sm">{e.completed ? "✓ " : ""}{e.title}</div>
                {e.description && <div className="text-xs mt-0.5 text-ink-soft">{e.description}</div>}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Timeline */}
      <div className="bg-surface rounded-xl border border-rule overflow-hidden">
        {hours.map((hour) => {
          const hourEvents = timed.filter((e) => e.start_at && dayjs(e.start_at).hour() === hour);
          const label = hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
          return (
            <div
              key={hour}
              className={clsx(
                "flex gap-4 px-5 py-2 min-h-[48px] items-start",
                hour < 23 && "border-b border-rule"
              )}
            >
              <div className="w-14 text-xs font-bold text-ink-faint pt-1 text-right flex-shrink-0 font-mono">
                {label}
              </div>
              <div className="flex-1 py-0.5 space-y-1.5 border-l border-dashed border-rule pl-4 min-h-[36px]">
                {hourEvents.map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-3 py-2 rounded-xl text-xs bg-raised text-ink border-l-[3px] border-accent shadow-xs"
                  >
                    <div className="font-bold text-sm">{e.title}</div>
                    {e.description && <div className="text-ink-faint mt-0.5 text-xs">{e.description}</div>}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
