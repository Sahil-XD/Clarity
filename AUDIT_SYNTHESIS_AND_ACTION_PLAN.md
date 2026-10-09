# Clarity — Comprehensive Multi-Agent Audit Analysis & Action Plan

> **Date:** October 9, 2026  
> **Purpose:** Plain-English breakdown of all findings from the multi-agent code audits, separating critical bug risks from unnecessary distractions, and presenting clear choices before making code changes.
> **Design Stance:** Clarity is a **sleek, modern executive personal workspace & second brain**. All archaic "bahi khata" / ledger concepts are permanently abandoned.

---

## 1. Plain-English Summary of What the Audits Discovered

The audit from Copilot GPT-5.6 was remarkably sharp. It analyzed the actual running code in `desktop/src` and caught **4 real runtime traps** that could cause silent data loss or bugs if left unfixed.

Here is what they mean in plain, non-technical English:

---

### Issue 1: The "Duplicate Task / Delete by Name" Trap
* **Where it happens:** `TasksPage.tsx` and `CalendarPage.tsx`
* **What happens right now:** 
  When you create a task with a due date, the app saves it **twice**: once in the `tasks` table and once in the `calendar_events` table. Later, if you delete or complete a task, the app searches your calendar for any event that has the **same text title**.
* **Why it's dangerous:** 
  - If you have two tasks with the same name (e.g. *"Call Mom"* or *"Pay Rent"*), deleting one can delete the other!
  - If you edit a task's title, it loses connection to the calendar event completely.
* **The Recommended Fix:** 
  Stop making two separate copies! A task with a date is just a task. The Calendar should simply display tasks that have dates directly from the `tasks` table. **One single source of truth.**

---

### Issue 2: The Diary Auto-Save "Time Machine" Overwrite
* **Where it happens:** `DiaryPage.tsx` (lines 769–775)
* **What happens right now:** 
  When you type in the diary, the app waits 1.5 seconds before auto-saving to your database. If you type today's reflection on October 9th, and then click on October 8th in the sidebar within that 1.5 seconds, the timer fires with **today's text into yesterday's entry**!
* **Why it's dangerous:** 
  It silently overwrites and destroys previous diary entries.
* **The Recommended Fix:** 
  The moment you click another date, immediately cancel any pending auto-save timer and flush-save the current text to the *correct* date before switching.

---

### Issue 3: The Midnight Timezone Shift
* **Where it happens:** `CalendarPage.tsx` (line 50)
* **What happens right now:** 
  The code uses `new Date(eventDate).toISOString()` to format dates. In JavaScript, converting `"2026-10-09"` to UTC midnight can shift the date to the previous day (`2026-10-08T18:30:00Z`) depending on local timezones.
* **Why it's dangerous:** 
  A task or note you set for Friday shows up on Thursday on your calendar.
* **The Recommended Fix:** 
  Keep calendar dates as strict local calendar strings (`YYYY-MM-DD`), never convert date-only strings through UTC timestamps.

---

### Issue 4: The Zombie Auth State
* **Where it happens:** `store.ts` (lines 94–116)
* **What happens right now:** 
  The app saves `isAuthenticated: true` inside your browser's local storage. If your Supabase cloud session expires while you are away, the app boots up thinking you are still logged in, displays stale cached screens, and then throws errors when you click anything.
* **The Recommended Fix:** 
  Keep the app in a clean loading state until `supabase.auth.getSession()` actively confirms that your login token is still valid.

---

### Issue 5: Google OAuth Preflight Fetch (ALREADY FIXED!)
* **Where it happened:** `supabase.ts`
* **What it was:** A client-side `fetch()` call before redirecting to Google was getting blocked by Windows WebView2 CORS policies.
* **Current Status:** **ALREADY RESOLVED** in commit `1b9be2d`. We removed the preflight fetch and wired a direct redirect, which is why your Google login works smoothly now!

---

## 2. What Is Secondary / Safe to Ignore for Now

Not everything in the audit needs immediate action. Here is what we should **NOT** waste time on today:

1. **Rewriting the Rust SQLite Sync Engine:**
   - The audit noted that Clarity has an idle SQLite database in Rust while the React app talks directly to Supabase.
   - *Verdict:* Supabase is fast, working, and has Row-Level Security enabled. Building a complex bidirectional offline sync engine in Rust is a heavy multi-week task. Keep direct Supabase as our primary engine for now.
2. **Deleting the Java `backend/` Folder:**
   - The old Spring Boot folder is dormant. We can delete it with a single command whenever we want clean folders, but it does not affect the running desktop app.
3. **Linter / Pedantic Code Style:**
   - Micro-discussions about triple dots vs Unicode ellipses (`...` vs `…`) or input modes do not impact daily usage.

---

## 3. Recommended Action Plan (Decide Before We Code)

| Priority | Issue | Action to Take | Effort |
| :---: | :--- | :--- | :---: |
| **P0** | **Diary Auto-Save Overwrite** | Clear debounce timer and flush-save on date change in `DiaryPage.tsx` | 10 mins |
| **P0** | **Timezone Date Shift** | Remove `new Date().toISOString()` and keep strict `YYYY-MM-DD` | 5 mins |
| **P1** | **Tasks ↔ Calendar Sync** | Unify tasks so Calendar displays tasks directly without title-matching duplicates | 20 mins |
| **P1** | **Zombie Auth Session** | Validate Supabase session token before marking app as fully loaded | 10 mins |
| **P2** | **Delete Dead `backend/`** | Remove legacy Spring Boot folder to keep the repository clean | 1 min |

---

## 4. Decision for You

Take a look at the 5 issues above:
* **Should we go ahead and fix the 4 real runtime traps (P0 & P1: Diary race condition, Timezone shift, Tasks calendar sync, and Auth validation)?**
* Once these stability foundations are bulletproof, we will turn 100% of our focus to the **UI Experience and the Cinematic Opening Animation**!
