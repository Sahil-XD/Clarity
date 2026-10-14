/**
 * Clarity Native Desktop Reminder Service
 * Periodically checks tasks and calendar events with remind_at <= now,
 * triggers native desktop notifications, plays an acoustic chime, and marks reminder_sent = true.
 */
import { api } from "./api";
import { sound } from "./sound";

let timerId: ReturnType<typeof setInterval> | null = null;
let isChecking = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    try {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    } catch {
      return false;
    }
  }
  return false;
}

export function startReminderService(): void {
  if (timerId) return;

  requestNotificationPermission().catch(() => {});

  // Initial check after 3 seconds, then check every 30 seconds
  setTimeout(checkDueReminders, 3000);
  timerId = setInterval(checkDueReminders, 30_000);
}

export function stopReminderService(): void {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

async function checkDueReminders(): Promise<void> {
  if (isChecking) return;
  isChecking = true;

  try {
    const now = new Date();

    // 1. Check pending tasks with due reminders
    const tasks = await api.getTasks(true).catch(() => []);
    for (const task of tasks) {
      if (!task.reminder_sent && task.remind_at && !task.completed) {
        const remindTime = new Date(task.remind_at);
        if (remindTime <= now) {
          triggerNotification("Task Reminder: " + task.title, task.description || "Task is due for completion.");
          await api.updateTask(task.id, { reminder_sent: true }).catch(() => {});
        }
      }
    }

    // 2. Check calendar events for today
    const todayStr = now.toISOString().split("T")[0];
    const events = await api.getCalendarDay(todayStr).catch(() => []);
    for (const ev of events) {
      if (!ev.reminder_sent && ev.remind_at) {
        const remindTime = new Date(ev.remind_at);
        if (remindTime <= now) {
          triggerNotification("Event Reminder: " + ev.title, ev.description || `Scheduled event on ${ev.event_date}.`);
          await api.updateCalendarEvent(ev.id, { reminder_sent: true } as any).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn("[Clarity Reminder] Check cycle encountered error:", err);
  } finally {
    isChecking = false;
  }
}

function triggerNotification(title: string, body: string): void {
  sound.pop();
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/icons/icon.ico",
      });
    } catch (e) {
      console.warn("Could not dispatch native notification:", e);
    }
  }
}
