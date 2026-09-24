import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, X,
  Loader2, Popcorn, Key, ShoppingBag,
  Utensils, Coffee, ShoppingCart, Car, Zap, Film, Pill, Tag,
  Receipt
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { clsx } from "clsx";
import dayjs from "dayjs";

// ─── Category Configuration ──────────────────────────────────────────────────
export const CATEGORIES = [
  { label: "Snacks", icon: Popcorn },
  { label: "Rent", icon: Key },
  { label: "Buying / Shopping", icon: ShoppingBag },
  { label: "Food & Meals", icon: Utensils },
  { label: "Chai & Coffee", icon: Coffee },
  { label: "Groceries", icon: ShoppingCart },
  { label: "Transport & Fuel", icon: Car },
  { label: "Bills & Utilities", icon: Zap },
  { label: "Entertainment", icon: Film },
  { label: "Health & Meds", icon: Pill },
  { label: "Other", icon: Tag },
];

function categoryMeta(label: string) {
  if (!label) return CATEGORIES[CATEGORIES.length - 1];
  const exact = CATEGORIES.find((c) => c.label.toLowerCase() === label.toLowerCase());
  if (exact) return exact;

  const partial = CATEGORIES.find(
    (c) =>
      c.label.toLowerCase().includes(label.toLowerCase()) ||
      label.toLowerCase().includes(c.label.toLowerCase().split(" ")[0])
  );
  return partial ?? CATEGORIES[CATEGORIES.length - 1];
}

function formatDayGroupHeader(dateStr: string) {
  const d = dayjs(dateStr);
  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

  if (dateStr === today) {
    return { label: "Today", formattedDate: d.format("D MMM YYYY") };
  } else if (dateStr === yesterday) {
    return { label: "Yesterday", formattedDate: d.format("D MMM YYYY") };
  } else {
    return { label: d.format("dddd"), formattedDate: d.format("D MMM YYYY") };
  }
}

// ─── Add Expense Modal (Disciplined Ledger Entry Slip) ───────────────────────
// Sharp 0px corners, 1px rules, zero fuzzy drop shadows, vermilion top rule
function AddExpenseModal({
  initialData,
  onClose,
  onCreated,
}: {
  initialData?: { amount?: string; category?: string; description?: string };
  onClose: () => void;
  onCreated: (e: any) => void;
}) {
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [category, setCategory] = useState(initialData?.category || "Chai & Coffee");
  const [description, setDescription] = useState(initialData?.description || "");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError("Enter a valid expense amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const item = await api.createExpense({
        amount: amt,
        category,
        description: description.trim() || undefined,
        date,
        expense_type: "EXPENSE",
      });
      sound.pop();
      onCreated(item);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save expense.");
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
        {/* Top Vermilion Margin Line (Bahi Khata margin rule) */}
        <div className="h-0.5 bg-accent w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface border-b border-rule">
          <div>
            <h2 className="text-base font-bold text-ink tracking-tight font-serif">
              Log Ledger Entry
            </h2>
            <p className="text-[11px] text-ink-faint font-mono uppercase tracking-wider mt-0.5">
              Debit entry · account voucher
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
          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider">
                Amount (₹) *
              </label>
              <span className="text-[10px] font-mono text-ink-faint">Debit column</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-mono text-xl">
                ₹
              </span>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 rounded-none border border-rule bg-ground text-ink placeholder:text-ink-faint outline-none focus:border-accent text-2xl font-bold font-mono tabular-nums tracking-tight transition shadow-none"
              />
            </div>
          </div>

          {/* Quick-Select Category Grid (Ruled Ledger Grid) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider">
                Category Head
              </label>
              <span className="text-[10px] font-mono text-ink-faint">{category}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={clsx(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-none text-xs transition-colors border text-left cursor-pointer",
                      isSelected
                        ? "border-accent bg-raised text-ink font-semibold"
                        : "border-rule bg-surface hover:bg-raised text-ink-soft hover:text-ink"
                    )}
                  >
                    <Icon className={clsx("w-3 h-3 shrink-0", isSelected ? "text-accent" : "text-ink-faint")} />
                    <span className="truncate text-[11px] leading-tight font-sans">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider mb-1">
              Particulars / Note (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Chai, canteen, Metro card top-up, PG rent"
              className="w-full px-3 py-1.5 rounded-none border border-rule bg-ground text-ink placeholder:text-ink-faint text-xs outline-none focus:border-accent transition font-sans shadow-none"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-ink-soft uppercase tracking-wider mb-1">
              Entry Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-none border border-rule bg-ground text-ink text-xs font-mono outline-none focus:border-accent transition shadow-none"
            />
          </div>

          {error && (
            <p className="text-xs text-danger font-medium bg-danger/10 p-2 rounded-none border border-danger/20 font-mono">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-none border border-rule text-xs font-mono font-medium text-ink-soft hover:bg-raised hover:text-ink transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-none bg-accent text-white text-xs font-mono font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-none"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 stroke-[2.2]" />}
              Record Entry
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page (Ruled Ledger Pilot) ─────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalInitial, setModalInitial] = useState<{ amount?: string; category?: string; description?: string } | undefined>(undefined);
  const [filterMonth, setFilterMonth] = useState(dayjs().format("YYYY-MM"));
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.deleteExpense(id);
      setExpenses((p) => p.filter((e) => e.id !== id));
      sound.pop();
    } catch {}
  };

  const handleCreated = (item: any) => {
    setExpenses((p) => [item, ...p]);
    setNewlyAddedId(item.id);
    setTimeout(() => setNewlyAddedId(null), 1600);
  };

  const openAddWithPreset = (preset: { amount: string; category: string; description: string }) => {
    setModalInitial(preset);
    setShowModal(true);
  };

  // Filter expenses by selected month
  const monthFiltered = useMemo(() => {
    return expenses.filter((e) => e.date?.startsWith(filterMonth));
  }, [expenses, filterMonth]);

  // Sort chronological for accurate running balance calculations
  const chronologicalMonthExpenses = useMemo(() => {
    return [...monthFiltered]
      .filter((e) => e.expense_type !== "INCOME")
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.id.localeCompare(b.id);
      });
  }, [monthFiltered]);

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("clarity_monthly_budget");
      return stored ? parseFloat(stored) || 20000 : 20000;
    } catch {
      return 20000;
    }
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState("");

  const handleSaveBudget = (newVal: number) => {
    if (newVal > 0) {
      setMonthlyBudget(newVal);
      try {
        localStorage.setItem("clarity_monthly_budget", String(newVal));
      } catch {}
    }
    setEditingBudget(false);
  };

  // Pre-calculate running cumulative spend and balance for every expense
  const expenseBalanceMap = useMemo(() => {
    const map = new Map<string, { cumulativeSpent: number; remainingBudget: number }>();
    let runningTotal = 0;
    for (const exp of chronologicalMonthExpenses) {
      runningTotal += exp.amount;
      map.set(exp.id, {
        cumulativeSpent: runningTotal,
        remainingBudget: monthlyBudget - runningTotal,
      });
    }
    return map;
  }, [chronologicalMonthExpenses, monthlyBudget]);

  // Expense-only metrics
  const totalSpentThisMonth = useMemo(() => {
    return monthFiltered
      .filter((e) => e.expense_type !== "INCOME")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [monthFiltered]);

  // Pacing calculations
  const isCurrentMonth = filterMonth === dayjs().format("YYYY-MM");
  const daysInMonth = dayjs(filterMonth).daysInMonth() || 30;
  const currentDay = isCurrentMonth
    ? Math.min(daysInMonth, Math.max(1, dayjs().date()))
    : (dayjs(filterMonth).isBefore(dayjs(), "month") ? daysInMonth : 1);

  const safeBudget = monthlyBudget > 0 ? monthlyBudget : 1;
  const safeDays = daysInMonth > 0 ? daysInMonth : 30;
  const dailyAverage = currentDay > 0 ? totalSpentThisMonth / currentDay : 0;
  const expectedPaceSpend = (safeBudget / safeDays) * currentDay;
  const paceDiff = totalSpentThisMonth - expectedPaceSpend; // negative = under pace (good), positive = over pace
  const isUnderPace = paceDiff <= 0;

  const spendPct = Math.min(100, (totalSpentThisMonth / safeBudget) * 100);
  const pacePct = Math.min(100, Math.max(0, (currentDay / safeDays) * 100));
  const budgetUtilization = Math.round((totalSpentThisMonth / safeBudget) * 100);

  // Real-state reactivity: pace tick & track colors reflect state (moss, brass, danger)
  const paceState = useMemo<"moss" | "brass" | "danger">(() => {
    if (isUnderPace) return "moss";
    if (spendPct >= 80 || paceDiff > expectedPaceSpend * 0.35) return "danger";
    return "brass";
  }, [isUnderPace, spendPct, paceDiff, expectedPaceSpend]);

  const paceColors = {
    moss: {
      bar: "bg-done",
      tick: "bg-done",
      text: "text-done",
      label: "under pace",
    },
    brass: {
      bar: "bg-warn",
      tick: "bg-warn",
      text: "text-warn",
      label: "approaching pace",
    },
    danger: {
      bar: "bg-danger",
      tick: "bg-danger",
      text: "text-danger",
      label: "over pace",
    },
  }[paceState];

  // Group filtered expenses day-by-day (newest date first for display)
  const groupedByDate = useMemo(() => {
    return monthFiltered.reduce<Record<string, typeof expenses>>((acc, item) => {
      const dateKey = item.date || "Unknown Date";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [monthFiltered]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => (b > a ? 1 : -1));
  }, [groupedByDate]);

  // Category breakdown
  const categoryTotals = useMemo(() => {
    return monthFiltered
      .filter((e) => e.expense_type !== "INCOME")
      .reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});
  }, [monthFiltered]);

  const topCategories = useMemo(() => {
    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);
  }, [categoryTotals]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      dayjs().subtract(i, "month").format("YYYY-MM")
    );
  }, []);

  const quickPresets = [
    { label: "Chai, canteen", amount: "30", category: "Chai & Coffee", description: "Evening tea & snack" },
    { label: "Metro card top-up", amount: "200", category: "Transport & Fuel", description: "Transit recharge" },
    { label: "Daily Groceries", amount: "350", category: "Groceries", description: "Fresh supplies" },
    { label: "PG Rent", amount: "6500", category: "Rent", description: "Monthly room rent" },
  ];

  return (
    <div className="h-full flex flex-col bg-ground">
      <AnimatePresence>
        {showModal && (
          <AddExpenseModal
            initialData={modalInitial}
            onClose={() => {
              setShowModal(false);
              setModalInitial(undefined);
            }}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>

      {/* Desk Top Bar (Ledger Navigation) */}
      <div className="shrink-0 bg-surface border-b border-rule px-8 py-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-ink tracking-tight font-serif">
              Ledger
            </h1>
            <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-none bg-ground border border-rule text-ink-soft">
              {monthFiltered.length} entries
            </span>
          </div>
          <p className="text-ink-faint text-xs mt-0.5 font-sans">
            {dayjs(filterMonth).format("MMMM YYYY")} · Ruled personal expenditure &amp; budget pacing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 rounded-none border border-rule bg-surface text-xs font-mono text-ink outline-none focus:border-accent transition cursor-pointer"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {dayjs(m).format("MMM YYYY")}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setModalInitial(undefined);
              setShowModal(true);
            }}
            className="px-3.5 py-1.5 rounded-none bg-accent text-white text-xs font-mono font-semibold hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer shadow-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2]" /> Log Entry
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ─── Hero Summary: The Paced Spending Track ───────────────────────── */}
          {/* Replaces 4 redundant cards with one disciplined bahi khata header */}
          <div className="bg-surface rounded-none border border-rule p-6 space-y-4 shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-rule/60 pb-3.5">
              <div>
                <span className="text-[11px] font-mono font-medium text-ink-faint uppercase tracking-wider block">
                  Ledger · {dayjs(filterMonth).format("MMM YYYY")}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono text-ink tabular-nums tracking-tight">
                    ₹{totalSpentThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {editingBudget ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const v = parseFloat(tempBudgetInput);
                        if (v > 0) handleSaveBudget(v);
                        else setEditingBudget(false);
                      }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <input
                        type="number"
                        autoFocus
                        value={tempBudgetInput}
                        onChange={(e) => setTempBudgetInput(e.target.value)}
                        onBlur={() => {
                          const v = parseFloat(tempBudgetInput);
                          if (v > 0) handleSaveBudget(v);
                          else setEditingBudget(false);
                        }}
                        className="w-24 px-1 py-0.5 text-xs font-mono bg-ground border border-accent text-ink outline-none"
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setTempBudgetInput(String(monthlyBudget));
                        setEditingBudget(true);
                      }}
                      title="Click to customize monthly budget cap"
                      className="text-xs font-mono text-ink-faint hover:text-accent transition cursor-pointer underline decoration-dashed underline-offset-2"
                    >
                      of ₹{monthlyBudget.toLocaleString("en-IN")} cap
                    </button>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-sm font-mono font-bold text-ink tabular-nums">
                  ₹{dailyAverage.toFixed(0)}/day
                </div>
                <div className="text-xs font-mono text-ink-faint">
                  day {currentDay} of {daysInMonth}
                </div>
              </div>
            </div>

            {/* Paced Track Metaphor: Reactive tick marks day pace, fill bar marks actual spend */}
            <div className="space-y-2 pt-1">
              <div className="relative w-full h-2.5 bg-ground border border-rule rounded-none">
                {/* Spend fill bar with spring-grow animation and real-state color */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spendPct}%` }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className={clsx(
                    "h-full rounded-none transition-colors duration-300",
                    paceColors.bar
                  )}
                  title={`${spendPct.toFixed(1)}% of budget spent (${paceColors.label})`}
                />

                {/* Day pace tick marker - real-state color reactive */}
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className={clsx(
                    "absolute -top-1 bottom-1 w-[2px] h-4.5 z-10 -translate-x-1/2 pointer-events-none transition-colors duration-300",
                    paceColors.tick
                  )}
                  style={{ left: `${pacePct}%` }}
                  title={`Day ${currentDay} pace tick (${pacePct.toFixed(0)}%) · ${paceColors.label}`}
                >
                  <div className={clsx(
                    "absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap font-medium transition-colors duration-300",
                    paceColors.text
                  )}>
                    day {currentDay}
                  </div>
                </motion.div>
              </div>

              {/* Status & Legend */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-ink-faint">
                <span>₹0</span>
                <div>
                  {totalSpentThisMonth === 0 ? (
                    <span className="text-ink-soft">Nothing logged yet for {dayjs(filterMonth).format("MMM YYYY")}</span>
                  ) : (
                    <span className={clsx("font-medium transition-colors duration-300", paceColors.text)}>
                      {isUnderPace
                        ? `₹${Math.abs(paceDiff).toLocaleString("en-IN", { maximumFractionDigits: 0 })} under pace (${budgetUtilization}% spent)`
                        : `₹${paceDiff.toLocaleString("en-IN", { maximumFractionDigits: 0 })} over pace (${budgetUtilization}% spent)`}
                    </span>
                  )}
                </div>
                <span>₹{monthlyBudget.toLocaleString("en-IN")} cap</span>
              </div>
            </div>

            {/* Ruled category pace strip */}
            {topCategories.length > 0 && (
              <div className="pt-3 border-t border-rule/50 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono">
                <span className="text-[11px] text-ink-faint">Top Categories:</span>
                {topCategories.map(([cat, total]) => {
                  const pct = totalSpentThisMonth > 0 ? (total / totalSpentThisMonth) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-1.5 text-ink-soft">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-soft/60" />
                      <span className="font-sans text-ink">{cat}</span>
                      <span className="tabular-nums text-ink-faint">₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── The Ruled Ledger Sheet (Bahi Khata Table) ────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-ink font-serif tracking-tight">
                Account Entries ({monthFiltered.length})
              </h2>
              <span className="text-[11px] font-mono text-ink-faint">
                Ruled balance running down right edge
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-ink-faint gap-2 bg-surface border border-rule rounded-none">
                <Loader2 className="w-4 h-4 animate-spin text-ink-soft" />
                <span className="text-xs font-mono">Auditing ledger...</span>
              </div>
            ) : sortedDates.length === 0 ? (
              /* Actionable empty state per Opus 5 audit */
              <div className="bg-surface rounded-none border border-rule p-8 text-center shadow-none">
                <div className="w-10 h-10 rounded-none bg-raised border border-rule flex items-center justify-center mx-auto mb-3 text-ink-soft">
                  <Receipt className="w-5 h-5 stroke-[1.8]" />
                </div>
                <h3 className="text-base font-bold text-ink font-serif">
                  No entries recorded for {dayjs(filterMonth).format("MMMM YYYY")}
                </h3>
                <p className="text-xs text-ink-soft max-w-sm mx-auto mt-1 mb-5 font-sans">
                  The ledger sheet is clear. Open this month's account by logging your first expense.
                </p>

                <button
                  onClick={() => {
                    setModalInitial(undefined);
                    setShowModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-none bg-accent text-white text-xs font-mono font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer shadow-none"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.2]" /> Log First Entry
                </button>

                {/* Quick entries shelf */}
                <div className="mt-8 pt-6 border-t border-rule/50 max-w-md mx-auto">
                  <p className="text-[11px] font-mono text-ink-faint mb-2.5 uppercase tracking-wider">
                    Quick ledger templates
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickPresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => openAddWithPreset(preset)}
                        className="px-2.5 py-1 text-xs font-mono border border-rule rounded-none bg-raised hover:border-accent text-ink-soft hover:text-ink transition cursor-pointer"
                      >
                        {preset.label} · ₹{preset.amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Ruled Ledger Table Structure */
              <div className="bg-surface rounded-none border border-rule overflow-hidden shadow-none">
                {/* Master Column Header */}
                <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-ground/60 border-b border-rule text-[11px] font-mono font-semibold text-ink-soft uppercase tracking-wider">
                  <div className="col-span-2">Date &amp; Ref</div>
                  <div className="col-span-4">Description / Note</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2 text-right">Debit</div>
                  <div className="col-span-2 text-right">Running Total</div>
                </div>

                {/* Day-Wise Ruled Section */}
                <div className="divide-y divide-rule">
                  {sortedDates.map((dateKey) => {
                    const dayItems = groupedByDate[dateKey];
                    const dayTotal = dayItems.reduce((sum, item) => sum + item.amount, 0);
                    const { label, formattedDate } = formatDayGroupHeader(dateKey);

                    return (
                      <div key={dateKey} className="border-b border-rule last:border-b-0">
                        {/* Day Rule Divider */}
                        <div className="flex items-center justify-between px-4 py-1.5 bg-ground/30 border-b border-rule/50 text-xs font-mono text-ink-soft">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{label}</span>
                            <span className="text-ink-faint">· {formattedDate}</span>
                          </div>
                          <div className="text-ink-soft tabular-nums">
                            Day total: <span className="font-bold text-ink">₹{dayTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {/* Transactions for this Day */}
                        <div className="divide-y divide-rule/40">
                          {dayItems.map((expense) => {
                            const meta = categoryMeta(expense.category);
                            const Icon = meta.icon;
                            const balanceInfo = expenseBalanceMap.get(expense.id);
                            const isNew = newlyAddedId === expense.id;

                            const cumSpent = balanceInfo?.cumulativeSpent ?? expense.amount;
                            const remBudget = Math.max(0, balanceInfo?.remainingBudget ?? (monthlyBudget - expense.amount));
                            const utilPct = (cumSpent / monthlyBudget) * 100;

                            // Real-state reactivity: visual tightening as budget cap approaches
                            let balanceColor = "text-ink";
                            let remColor = "text-ink-faint";
                            if (utilPct >= 90) {
                              balanceColor = "text-danger font-bold";
                              remColor = "text-danger/90 font-semibold";
                            } else if (utilPct >= 70) {
                              balanceColor = "text-warn font-semibold";
                              remColor = "text-warn/90";
                            }

                            return (
                              <motion.div
                                key={expense.id}
                                initial={isNew ? { clipPath: "inset(0 100% 0 0)", backgroundColor: "var(--c-raised)" } : false}
                                animate={isNew ? { clipPath: "inset(0 0% 0 0)", backgroundColor: "transparent" } : {}}
                                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                                className="group grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-4 py-2.5 hover:bg-raised transition-all duration-150 items-center text-xs border-l-2 border-l-transparent hover:border-l-ink-soft cursor-default"
                              >
                                {/* Date / Ref (Col 1-2) */}
                                <div className="sm:col-span-2 flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-none bg-raised border border-rule flex items-center justify-center text-ink-faint shrink-0">
                                    <Icon className="w-3 h-3 stroke-[2]" />
                                  </div>
                                  <span className="font-mono text-ink-faint text-[11px] truncate">
                                    #{expense.id.toString().slice(-4)} · {dayjs(expense.date).format("D MMM")}
                                  </span>
                                </div>

                                {/* Description / Note (Col 3-6) */}
                                <div className="sm:col-span-4 min-w-0">
                                  <div className="font-sans font-medium text-ink truncate text-sm">
                                    {expense.description || expense.category}
                                  </div>
                                </div>

                                {/* Category (Col 7-8) */}
                                <div className="sm:col-span-2 flex items-center gap-1.5 text-ink-soft">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rule shrink-0" />
                                  <span className="truncate text-[11px] font-sans">{expense.category}</span>
                                </div>

                                {/* Debit Amount (Col 9-10) */}
                                <div className="sm:col-span-2 text-right font-mono font-semibold text-ink tabular-nums text-sm whitespace-nowrap">
                                  -₹{expense.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>

                                {/* Running Total & Actions (Col 11-12) */}
                                <div className="sm:col-span-2 flex items-center justify-end gap-3 text-right">
                                  <div className="font-mono tabular-nums whitespace-nowrap">
                                    <div className={clsx("font-medium text-xs transition-colors duration-200", balanceColor)}>
                                      ₹{cumSpent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className={clsx("text-[10px] leading-tight transition-colors duration-200", remColor)}>
                                      ₹{remBudget.toLocaleString("en-IN", { maximumFractionDigits: 0 })} rem.
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => deleteExpense(expense.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-ink-faint hover:text-accent rounded-none transition-all active:scale-90 cursor-pointer border border-transparent hover:border-rule"
                                    title="Delete entry"
                                    aria-label="Delete entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
