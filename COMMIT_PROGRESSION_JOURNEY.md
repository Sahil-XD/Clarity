# Clarity — Commit Progression Journey & Engineering Chronicles
*Generated: September 25, 2026 | Repository: Sahil-XD/Clarity | 35 Commit Milestones*

> A deep, chronological engineering retrospective detailing how Clarity evolved from a blank repository into an offline-capable, luxury personal productivity sanctuary.

---

## Epoch 1: Inception & The Initial Scaffold (August 28 – August 29, 2026)

### Commit `d11708f` — August 28, 2026: The Vision Document (`claude.md`)
* **What We Did First:** Documented the core motivation and requirements. Notion had become overwhelming and slow; Brite and TickTick charged excessive monthly subscriptions for simple features.
* **Core Requirements:**
  - Unified Calendar with instant toggle between Notes and Tasks.
  - PIN-locked private Diary.
  - Minimalist To-Do list with due dates.
  - Personal Expenses tracker with monthly pacing.
  - Lightweight Kanban Projects board.
  - Cross-platform synchronization (PC + Mobile) with zero subscription cost.

### Commit `86720ab` — August 29, 2026: Initial Scaffold (Spring Boot + Tauri + React)
* **What We Implemented:**
  - Backend: Java Spring Boot 3 with Spring Data JPA and PostgreSQL (`clarity` database). Created entities: `User`, `Task`, `DiaryEntry`, `CalendarEvent`.
  - Desktop: Tauri 2 framework running a React + Vite + TypeScript frontend.
  - Pages: Scaffolded `DiaryPage`, `TasksPage`, `CalendarPage`, `ExpensesPage`, `ProjectsPage`.
* **The Solution:** A hybrid client-server model where Tauri's webview communicated with `http://localhost:8080` via REST fetch calls.

### Commit `ee0b41f` — August 29, 2026: Session Notes & Build Toolchain Fixes
* **The Problem:** The Windows build failed. Cargo/Tauri attempted to link using Git's bundled `link.exe` instead of Microsoft Visual C++ Build Tools (`MSVC`), and the build threw errors due to missing default app icons.
* **How We Solved It:**
  - Created `run_tauri.bat` to invoke Microsoft's `vcvars64.bat`, exposing the genuine MSVC `cl.exe` and `link.exe` compiler environment to Cargo.
  - Generated placeholder icon assets (`icon.ico`, `icon.icns`) in `src-tauri/icons`.
  - Added slide-in modals for new tasks and events with optimistic frontend state updates.

---

## Epoch 2: The Local-First Pivot (August 30 – September 2, 2026)

### Commit `9d9cd41` — August 30, 2026: Architectural Pivot to Rust & Embedded SQLite
* **The Problem:** Requiring end-users to install the Java Runtime Environment (JRE) and maintain a PostgreSQL service locally was a massive barrier to entry, heavy on RAM, and fragile.
* **The Pivot:** Completely eliminated Spring Boot as a runtime requirement.
* **How We Solved It:**
  - Rewrote the local data layer into native Rust using `rusqlite`, embedded directly inside Tauri's binary.
  - Database file stored locally in `%APPDATA%/com.clarity.app/clarity.db`.
  - Replaced REST `fetch()` calls in `api.ts` with direct Tauri `@tauri-apps/api/core` `invoke()` calls.
  - Introduced pastel lavender/emerald themes with backdrop-blur glassmorphism.

### Commits `17cdc57`, `58ddb32`, `0d5549d` — September 1, 2026: Notes UI Overhaul & Micro-Diary Concept
* **What We Implemented:**
  - Redesigned the Calendar Notes view into a continuous vertical scrolling feed.
  - Simplified entry creation: Users can log a single-sentence thought for a day ("mini diary") without mandatory titles.
  - Added quick day picker, edit/delete actions, and non-empty day sorting.
  - Cleaned up temporary patch files.

### Commit `d43985d` — September 2, 2026: Connecting Expenses & Projects to Local SQLite
* **What We Implemented:**
  - Expanded Rust `db.rs` migrations and `commands.rs` to support `expenses`, `projects`, and `project_tasks` tables.
  - Implemented full CRUD handlers in `ExpensesPage.tsx` and `ProjectsPage.tsx`.

---

## Epoch 3: The Design Renaissance — From Void to Morning Stationery (September 2 – September 21, 2026)

### Commits `705db9a`, `9796365`, `dce5272` — September 2, 2026: Infinity Void Theme Exploration
* **What We Tried:** Implemented an ultra-dark "Infinity Void" aesthetic with glowing neon borders for Calendar and Diary.
* **Why It Failed:** While striking in screenshots, pitch black with glowing neon borders caused intense eye fatigue during extended writing sessions and felt like a gaming utility rather than a thoughtful personal sanctuary.

### Commits `bb16b95`, `b2b4000`, `ba657c5`, `2983ab6` — September 2 – September 9, 2026: Craft Morning Stationery Theme
* **The Shift:** Introduced the **Morning UI** design system inspired by physical engineering notebooks:
  - Engineering graph paper background (`morning-bg`).
  - Double-beveled clay chassis (`morning-chassis`) with ombre gradient borders.
  - Premium typography pairing: **Newsreader** (editorial serif) for headings and journal text, **Plus Jakarta Sans** for crisp UI chrome.
  - Notebook-ruled baseline lines (32px pitch) for the diary editor.
  - Updated `.gitignore` to prevent tracking build outputs and database files.

### Commits `a40a987`, `8ce36b6`, `78b62b3`, `fa0fc47`, `ecdc579` — September 19 – September 22, 2026: Tactile Sensory Audio & Ruled Ledger (Bahi Khata)
* **What We Implemented:**
  - **Sensory Audio Engine (`sound.ts`):** Synthesized physical clicks, pops, and slides using the Web Audio API, avoiding external audio file assets.
  - **Magnetic Glider Navigation:** Smooth sliding pill indicator tracking sidebar navigation.
  - **Geometric Clarity Logo & Icons:** High-res vector diamond mark integrated into Windows ICO, Mac ICNS, and Android/iOS asset bundles.
  - **Ruled Ledger Philosophy (`opus5.md`):** Replaced visual clutter and heavy card shadows with clean bahi khata ledger rules, tabular numerals (`tabular-nums`), and vermilion margin lines.
  - **Sync Fix:** Synchronized task deletion between the Tasks list and Calendar events.

---

## Epoch 4: The Cloud Sync & Google OAuth Struggle (September 23 – September 24, 2026)

### Commits `f43c035`, `cb35f42`, `fa1df27`, `92daf0b`, `e4044b8` — September 23, 2026: Google OAuth & The WebView2 CORS Barrier
* **What We Attempted:** Integrated Google Identity Services (GSI) and re-introduced Spring Boot endpoints for Google OAuth verification.
* **The Failure:**
  - Windows Tauri WebView2 strictly enforced CORS policies against `localhost:8080`, blocking token exchange.
  - Introducing Spring Boot again broke the offline-first SQLite promise, requiring two separate runtime processes.
  - Duplicate Google GSI initialization calls caused runtime exceptions in the browser context.
* **How We Solved It:**
  - Restored offline SQLite auth in `fa1df27`.
  - Added guards in `e4044b8` to prevent duplicate GSI script injection.

### Commits `acbca7b`, `c38e77a`, `cdeea89` — September 24, 2026: The Strategic Supabase Migration
* **The Epiphany:** Self-hosting a custom backend for cloud sync violated the user's strict ₹0 budget and zero-maintenance principle.
* **The Supabase Solution:**
  - Replaced the custom backend with Supabase's managed Postgres, Auth, and Storage.
  - Authored SQL schemas: `supabase-schema.sql` (tables & foreign keys), `supabase-rls.sql` (Row-Level Security policies tied to `auth.uid()`), and `supabase-profile-trigger.sql` (automatic user profile creation).
  - Centered and polished the Google Auth UI button in `AuthPage.tsx`.

---

## Epoch 5: Deep Audit, Bug Elimination & Hardening (September 24 – September 25, 2026)

### Commits `7435da5`, `77285a6`, `c421796`, `41e97a4`, `d4b0cb8`, `99d535d`, `272cca5` — September 24 – September 25, 2026: Bug Elimination & Production Hardening
An automated 1,700-line refactor transitioning data models to UUIDs and snake_case introduced several edge-case regressions. We systematically audited and resolved every single one:

1. **Kanban Crash on Fresh Projects (`7435da5`):**
   - *Problem:* Accessing an empty project triggered `TypeError: prev[activeProjectId].map is not a function`.
   - *Fix:* Injected defensive array fallbacks: `(prev[activeProjectId] || []).map(...)` and `filter(...)`.
2. **Diary Auto-Save Audio Spam & Blocking Alerts (`77285a6`):**
   - *Problem:* The 1.5-second auto-save debounce triggered an audible `sound.pop()` on every keystroke pause and popped an invasive browser `alert()` on network latency.
   - *Fix:* Silenced auto-save completely; replaced modal `alert()` with a quiet, non-blocking inline status indicator.
3. **Budget Target Customization & Division-by-Zero Protection (`c421796`):**
   - *Problem:* Monthly budget was hardcoded to ₹20,000, and pacing calculations failed on Day 0 or zero budgets.
   - *Fix:* Made the budget interactive and saved to `localStorage`; wrapped all pacing math in `safeBudget` and `safeDays` guards.
4. **Data Security & Offline Lockout Prevention (`41e97a4`):**
   - *Problem:* Diary PIN was stored in plain text, and network loss during startup caused an auth lockout.
   - *Fix:* Upgraded PIN storage to SHA-256 Web Crypto hashing with transparent backward-compatibility; configured `initAuth` to fallback to `getSession()` and preserved cached credentials.
5. **Calendar Deletion Ghosting & Field Synchronization (`d4b0cb8`):**
   - *Problem:* Deleting tasks inside the Calendar view only deleted the local state, causing tasks to reappear on reload.
   - *Fix:* Routed event deletion to `api.deleteTask(id)` and synchronized all component state with Supabase's snake_case fields.
6. **Micro-Interaction Cataloging (`99d535d`):**
   - Cataloged all planned sensory interactions in `upgrade-ui.md`.
7. **Google OAuth 403 & Pre-flight Diagnostics (`272cca5`):**
   - *Problem:* Google blocked logins inside Windows WebView2 (`403 disallowed_useragent`), and Supabase returned `400 validation_failed`.
   - *Fix:* Added a desktop Chrome `userAgent` to `tauri.conf.json`; live-probed Supabase to diagnose that the Google provider was disabled in the dashboard; added pre-flight validation.

---

## Commit-by-Commit Master Matrix

| Commit | Date | Area | Core Change & Significance |
| :--- | :--- | :--- | :--- |
| `d11708f` | 2026-08-28 | Vision | Initial `claude.md` user requirements specification. |
| `86720ab` | 2026-08-29 | Scaffold | Initial Spring Boot + Tauri desktop app scaffold. |
| `ee0b41f` | 2026-08-29 | Toolchain | Added MSVC environment wrapper (`run_tauri.bat`) and app icon stubs. |
| `9d9cd41` | 2026-08-30 | Architecture | Pivoted to local-first architecture using Rust and embedded SQLite. |
| `17cdc57` | 2026-09-01 | UI | Redesigned Calendar Notes into a continuous vertical feed. |
| `58ddb32` | 2026-09-01 | UI | Streamlined notes into single-sentence daily thought dockets. |
| `0d5549d` | 2026-09-01 | Hygiene | Cleaned up temporary patch files. |
| `d43985d` | 2026-09-02 | Backend | Connected Expenses and Projects to SQLite database. |
| `705db9a` | 2026-09-02 | UI | Day-wise feed overhaul across Auth, Diary, Tasks, and Expenses. |
| `9796365` | 2026-09-02 | UI | Tested dark "Infinity Void" theme on Calendar and Diary. |
| `dce5272` | 2026-09-02 | UI | Tuned void glow, fixed hollow notes layout and header styling. |
| `bb16b95` | 2026-09-02 | Design | Major redesign to **Craft Morning Stationery** theme. |
| `b2b4000` | 2026-09-03 | Git | Updated `.gitignore` to exclude build outputs and local database files. |
| `ba657c5` | 2026-09-03 | Types | Enforced strict TypeScript types in `api.ts`; documented `MORNING_UI.md`. |
| `2983ab6` | 2026-09-09 | Build | Updated UI pages and build scripts. |
| `a40a987` | 2026-09-19 | Branding | Upgraded tactile stationery UI; introduced geometric Clarity logo. |
| `8ce36b6` | 2026-09-20 | Sensory | Implemented magnetic glider nav, daily prompts, and Web Audio engine. |
| `78b62b3` | 2026-09-21 | Design | Implemented **Ruled Ledger (Bahi Khata)** design across all modules. |
| `fa0fc47` | 2026-09-21 | Bugfix | Synchronized task deletions between Tasks list and Calendar. |
| `ecdc579` | 2026-09-22 | Assets | Generated Windows ICO, Mac ICNS, and mobile app icons with new logo. |
| `f43c035` | 2026-09-23 | Auth | Implemented Google OAuth authentication in backend and desktop. |
| `cb35f42` | 2026-09-23 | Docs | Added session documentation for Google Auth and multi-device sync. |
| `fa1df27` | 2026-09-23 | Bugfix | Restored offline-first SQLite auth; resolved Windows Tauri CORS blocks. |
| `92daf0b` | 2026-09-23 | Sync | Scaffolded cloud sync data contracts and API endpoints. |
| `e4044b8` | 2026-09-23 | Bugfix | Prevented duplicate Google GSI initialize calls. |
| `acbca7b` | 2026-09-24 | Strategy | Documented Google OAuth post-mortem; migrated to Supabase. |
| `c38e77a` | 2026-09-24 | UI | Centered and balanced Google sign-in button in `AuthPage`. |
| `cdeea89` | 2026-09-24 | Supabase | Completed database migration schemas, RLS policies, and sync docs. |
| `7435da5` | 2026-09-25 | Bugfix | Added defensive array fallbacks for project tasks Kanban state. |
| `77285a6` | 2026-09-25 | Bugfix | Silenced diary auto-save audio clicks; replaced `alert()` with inline status. |
| `c421796` | 2026-09-25 | Feature | Made monthly budget customizable; protected pacing against division-by-zero. |
| `41e97a4` | 2026-09-25 | Security | Migrated to UUIDs, added offline session resilience and SHA-256 PIN hashing. |
| `d4b0cb8` | 2026-09-25 | Bugfix | Synchronized pages with Supabase schemas; fixed calendar task deletion. |
| `99d535d` | 2026-09-25 | Docs | Cataloged planned micro-interactions and sensory upgrade ideas. |
| `272cca5` | 2026-09-25 | Auth | Configured Chrome `userAgent` in `tauri.conf.json`; added provider preflight. |

---

## Current Status & Next Horizon

- **Compiles Cleanly:** `npm run build` (~850ms, 0 errors), `cargo check` (~1.1s, 0 errors).
- **Working Now:** Diary (PIN vault, auto-save, mood tracking), Tasks (priority filtering, optimistic completion), Calendar (heatmap, notes feed), Expenses (ledger vouchers, monthly budget pacing), Projects (Kanban board).
- **Immediate Next Steps:**
  1. Toggle Google Provider ON in Supabase Dashboard and run `supabase-profile-trigger.sql`.
  2. Implement isolated `<CinematicIntro />` sandbox per `masterplan.md`.
  3. Wire dynamic Lamp/Leaf dark-mode switching.
  4. Scaffold Expo React Native mobile companion.
