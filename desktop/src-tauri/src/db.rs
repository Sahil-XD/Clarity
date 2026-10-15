use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;

fn db_path() -> PathBuf {
    let mut dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    dir.push("com.clarity.app");
    std::fs::create_dir_all(&dir).ok();
    dir.push("clarity.db");
    dir
}

static DB: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let conn = Connection::open(db_path()).expect("Failed to open database");
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;").ok();
    init_tables(&conn);
    Mutex::new(conn)
});

pub fn get_db() -> std::sync::MutexGuard<'static, Connection> {
    DB.lock().expect("DB lock poisoned")
}

fn init_tables(conn: &Connection) {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT NOT NULL UNIQUE,
            email       TEXT NOT NULL UNIQUE,
            password    TEXT NOT NULL,
            diary_pin   TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id),
            title       TEXT NOT NULL,
            description TEXT,
            completed   INTEGER NOT NULL DEFAULT 0,
            due_at      TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS diary_entries (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id),
            date        TEXT NOT NULL,
            body        TEXT NOT NULL DEFAULT '',
            mood        TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(user_id, date)
        );

        CREATE TABLE IF NOT EXISTS calendar_events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id),
            title       TEXT NOT NULL,
            description TEXT,
            event_date  TEXT NOT NULL,
            start_at    TEXT,
            end_at      TEXT,
            event_type  TEXT NOT NULL DEFAULT 'NOTE',
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id),
            amount      REAL NOT NULL,
            category    TEXT NOT NULL,
            description TEXT,
            date        TEXT NOT NULL,
            type        TEXT NOT NULL DEFAULT 'EXPENSE',
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS projects (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id),
            title       TEXT NOT NULL,
            description TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS project_tasks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title       TEXT NOT NULL,
            description TEXT,
            status      TEXT NOT NULL DEFAULT 'TODO',
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Sync metadata table
        CREATE TABLE IF NOT EXISTS sync_meta (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    ").expect("Failed to create tables");

    // Add sync columns to all tables (safe to re-run — ALTERs silently fail if column exists)
    let sync_migrations = vec![
        // tasks
        "ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'TODO'",
        "ALTER TABLE tasks ADD COLUMN project_id TEXT",
        "ALTER TABLE tasks ADD COLUMN remind_at TEXT",
        "ALTER TABLE tasks ADD COLUMN reminder_sent INTEGER DEFAULT 0",
        "ALTER TABLE tasks ADD COLUMN server_id TEXT",
        "ALTER TABLE tasks ADD COLUMN client_id TEXT",
        "ALTER TABLE tasks ADD COLUMN deleted_at TEXT",
        "ALTER TABLE tasks ADD COLUMN sync_status TEXT DEFAULT 'pending'",
        // diary_entries
        "ALTER TABLE diary_entries ADD COLUMN server_id TEXT",
        "ALTER TABLE diary_entries ADD COLUMN client_id TEXT",
        "ALTER TABLE diary_entries ADD COLUMN deleted_at TEXT",
        "ALTER TABLE diary_entries ADD COLUMN sync_status TEXT DEFAULT 'pending'",
        // calendar_events
        "ALTER TABLE calendar_events ADD COLUMN remind_at TEXT",
        "ALTER TABLE calendar_events ADD COLUMN reminder_sent INTEGER DEFAULT 0",
        "ALTER TABLE calendar_events ADD COLUMN server_id TEXT",
        "ALTER TABLE calendar_events ADD COLUMN client_id TEXT",
        "ALTER TABLE calendar_events ADD COLUMN deleted_at TEXT",
        "ALTER TABLE calendar_events ADD COLUMN sync_status TEXT DEFAULT 'pending'",
        "ALTER TABLE calendar_events ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))",
        // expenses
        "ALTER TABLE expenses ADD COLUMN server_id TEXT",
        "ALTER TABLE expenses ADD COLUMN client_id TEXT",
        "ALTER TABLE expenses ADD COLUMN deleted_at TEXT",
        "ALTER TABLE expenses ADD COLUMN sync_status TEXT DEFAULT 'pending'",
        "ALTER TABLE expenses ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))",
        // projects
        "ALTER TABLE projects ADD COLUMN server_id TEXT",
        "ALTER TABLE projects ADD COLUMN client_id TEXT",
        "ALTER TABLE projects ADD COLUMN deleted_at TEXT",
        "ALTER TABLE projects ADD COLUMN sync_status TEXT DEFAULT 'pending'",
        "ALTER TABLE projects ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))",
        // project_tasks
        "ALTER TABLE project_tasks ADD COLUMN server_id TEXT",
        "ALTER TABLE project_tasks ADD COLUMN client_id TEXT",
        "ALTER TABLE project_tasks ADD COLUMN deleted_at TEXT",
        "ALTER TABLE project_tasks ADD COLUMN sync_status TEXT DEFAULT 'pending'",
        "ALTER TABLE project_tasks ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))",
    ];

    for migration in sync_migrations {
        // Ignore "duplicate column" errors — means migration already ran
        let _ = conn.execute(migration, []);
    }

    // Local SQLite indexes for instant <1ms queries
    let _ = conn.execute_batch("
        CREATE INDEX IF NOT EXISTS idx_local_tasks_user ON tasks(user_id, deleted_at);
        CREATE INDEX IF NOT EXISTS idx_local_expenses_user_date ON expenses(user_id, date, deleted_at);
        CREATE INDEX IF NOT EXISTS idx_local_calendar_user_date ON calendar_events(user_id, event_date, deleted_at);
        CREATE INDEX IF NOT EXISTS idx_local_diary_user_date ON diary_entries(user_id, date, deleted_at);
        CREATE INDEX IF NOT EXISTS idx_local_ptasks_proj ON project_tasks(project_id, deleted_at);
    ");

    // Ensure default local user exists for offline desktop operations
    let _ = conn.execute(
        "INSERT OR IGNORE INTO users (id, username, email, password) VALUES (1, 'Sahil', 'sahil@clarity.local', 'local_pass')",
        [],
    );
}
