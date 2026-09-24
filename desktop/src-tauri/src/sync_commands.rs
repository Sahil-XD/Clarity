use rusqlite::params;
use serde::{Deserialize, Serialize};
use crate::db::get_db;

// ─── Sync Data Structs ──────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncableTask {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
    pub due_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub server_id: Option<String>,
    pub client_id: Option<String>,
    pub deleted_at: Option<String>,
    pub sync_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncableDiaryEntry {
    pub id: i64,
    pub date: String,
    pub body: String,
    pub mood: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub server_id: Option<String>,
    pub client_id: Option<String>,
    pub deleted_at: Option<String>,
    pub sync_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncableCalendarEvent {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub event_date: String,
    pub start_at: Option<String>,
    pub end_at: Option<String>,
    pub event_type: String,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub server_id: Option<String>,
    pub client_id: Option<String>,
    pub deleted_at: Option<String>,
    pub sync_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncableExpense {
    pub id: i64,
    pub amount: f64,
    pub category: String,
    pub description: Option<String>,
    pub date: String,
    pub expense_type: String,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub server_id: Option<String>,
    pub client_id: Option<String>,
    pub deleted_at: Option<String>,
    pub sync_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncableProject {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub server_id: Option<String>,
    pub client_id: Option<String>,
    pub deleted_at: Option<String>,
    pub sync_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncableProjectTask {
    pub id: i64,
    pub project_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub server_id: Option<String>,
    pub client_id: Option<String>,
    pub deleted_at: Option<String>,
    pub sync_status: Option<String>,
}

// ─── Get Pending Items (sync_status = 'pending') ────────────────────────────

#[tauri::command]
pub fn get_pending_tasks(user_id: i64) -> Result<Vec<SyncableTask>, String> {
    let db = get_db();
    let mut stmt = db.prepare(
        "SELECT id, title, description, completed, due_at, created_at, updated_at,
                server_id, client_id, deleted_at, sync_status
         FROM tasks WHERE user_id = ?1 AND sync_status = 'pending'"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([user_id], |row| {
        Ok(SyncableTask {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            completed: row.get::<_, i32>(3)? != 0,
            due_at: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
            server_id: row.get(7)?,
            client_id: row.get(8)?,
            deleted_at: row.get(9)?,
            sync_status: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_diary_entries(user_id: i64) -> Result<Vec<SyncableDiaryEntry>, String> {
    let db = get_db();
    let mut stmt = db.prepare(
        "SELECT id, date, body, mood, created_at, updated_at,
                server_id, client_id, deleted_at, sync_status
         FROM diary_entries WHERE user_id = ?1 AND sync_status = 'pending'"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([user_id], |row| {
        Ok(SyncableDiaryEntry {
            id: row.get(0)?,
            date: row.get(1)?,
            body: row.get(2)?,
            mood: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
            server_id: row.get(6)?,
            client_id: row.get(7)?,
            deleted_at: row.get(8)?,
            sync_status: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_calendar_events(user_id: i64) -> Result<Vec<SyncableCalendarEvent>, String> {
    let db = get_db();
    let mut stmt = db.prepare(
        "SELECT id, title, description, event_date, start_at, end_at, event_type, created_at, updated_at,
                server_id, client_id, deleted_at, sync_status
         FROM calendar_events WHERE user_id = ?1 AND sync_status = 'pending'"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([user_id], |row| {
        Ok(SyncableCalendarEvent {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            event_date: row.get(3)?,
            start_at: row.get(4)?,
            end_at: row.get(5)?,
            event_type: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
            server_id: row.get(9)?,
            client_id: row.get(10)?,
            deleted_at: row.get(11)?,
            sync_status: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_expenses(user_id: i64) -> Result<Vec<SyncableExpense>, String> {
    let db = get_db();
    let mut stmt = db.prepare(
        "SELECT id, amount, category, description, date, type, created_at, updated_at,
                server_id, client_id, deleted_at, sync_status
         FROM expenses WHERE user_id = ?1 AND sync_status = 'pending'"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([user_id], |row| {
        Ok(SyncableExpense {
            id: row.get(0)?,
            amount: row.get(1)?,
            category: row.get(2)?,
            description: row.get(3)?,
            date: row.get(4)?,
            expense_type: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
            server_id: row.get(8)?,
            client_id: row.get(9)?,
            deleted_at: row.get(10)?,
            sync_status: row.get(11)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_projects(user_id: i64) -> Result<Vec<SyncableProject>, String> {
    let db = get_db();
    let mut stmt = db.prepare(
        "SELECT id, title, description, created_at, updated_at,
                server_id, client_id, deleted_at, sync_status
         FROM projects WHERE user_id = ?1 AND sync_status = 'pending'"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([user_id], |row| {
        Ok(SyncableProject {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
            server_id: row.get(5)?,
            client_id: row.get(6)?,
            deleted_at: row.get(7)?,
            sync_status: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_pending_project_tasks(project_id: i64) -> Result<Vec<SyncableProjectTask>, String> {
    let db = get_db();
    let mut stmt = db.prepare(
        "SELECT id, project_id, title, description, status, created_at, updated_at,
                server_id, client_id, deleted_at, sync_status
         FROM project_tasks WHERE project_id = ?1 AND sync_status = 'pending'"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([project_id], |row| {
        Ok(SyncableProjectTask {
            id: row.get(0)?,
            project_id: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            status: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
            server_id: row.get(7)?,
            client_id: row.get(8)?,
            deleted_at: row.get(9)?,
            sync_status: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ─── Mark Items as Synced ───────────────────────────────────────────────────

#[tauri::command]
pub fn mark_synced(table: String, id: i64) -> Result<(), String> {
    let db = get_db();
    let valid_tables = ["tasks", "diary_entries", "calendar_events", "expenses", "projects", "project_tasks"];
    if !valid_tables.contains(&table.as_str()) {
        return Err(format!("Invalid table: {}", table));
    }
    let sql = format!("UPDATE {} SET sync_status = 'synced' WHERE id = ?1", table);
    db.execute(&sql, [id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Set Server ID After Push ───────────────────────────────────────────────

#[tauri::command]
pub fn set_server_id(table: String, id: i64, server_id: String) -> Result<(), String> {
    let db = get_db();
    let valid_tables = ["tasks", "diary_entries", "calendar_events", "expenses", "projects", "project_tasks"];
    if !valid_tables.contains(&table.as_str()) {
        return Err(format!("Invalid table: {}", table));
    }
    let sql = format!("UPDATE {} SET server_id = ?1, sync_status = 'synced' WHERE id = ?2", table);
    db.execute(&sql, params![server_id, id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Upsert from Server (Pull) ─────────────────────────────────────────────

#[tauri::command]
pub fn upsert_from_server(
    table: String,
    user_id: i64,
    server_id: String,
    data: serde_json::Value,
) -> Result<(), String> {
    let db = get_db();

    match table.as_str() {
        "tasks" => {
            let exists: bool = db.query_row(
                "SELECT COUNT(*) FROM tasks WHERE server_id = ?1",
                [&server_id],
                |row| row.get::<_, i32>(0).map(|c| c > 0)
            ).unwrap_or(false);

            let title = data["title"].as_str().unwrap_or("");
            let description = data["description"].as_str();
            let completed = data["completed"].as_bool().unwrap_or(false);
            let due_at = data["due_at"].as_str();
            let updated_at = data["updated_at"].as_str().unwrap_or("");
            let deleted_at = data["deleted_at"].as_str();

            if let Some(del) = deleted_at {
                // Server says deleted — soft-delete locally too
                db.execute(
                    "UPDATE tasks SET deleted_at = ?1, sync_status = 'synced' WHERE server_id = ?2",
                    params![del, server_id],
                ).map_err(|e| e.to_string())?;
            } else if exists {
                db.execute(
                    "UPDATE tasks SET title = ?1, description = ?2, completed = ?3, due_at = ?4,
                     updated_at = ?5, sync_status = 'synced' WHERE server_id = ?6",
                    params![title, description, if completed { 1 } else { 0 }, due_at, updated_at, server_id],
                ).map_err(|e| e.to_string())?;
            } else {
                let client_id = uuid::Uuid::new_v4().to_string();
                db.execute(
                    "INSERT INTO tasks (user_id, title, description, completed, due_at, created_at, updated_at,
                     server_id, client_id, sync_status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7, ?8, 'synced')",
                    params![user_id, title, description, if completed { 1 } else { 0 }, due_at, updated_at, server_id, client_id],
                ).map_err(|e| e.to_string())?;
            }
        },

        "diary_entries" => {
            let exists: bool = db.query_row(
                "SELECT COUNT(*) FROM diary_entries WHERE server_id = ?1",
                [&server_id],
                |row| row.get::<_, i32>(0).map(|c| c > 0)
            ).unwrap_or(false);

            let date = data["date"].as_str().unwrap_or("");
            let body = data["body"].as_str().unwrap_or("");
            let mood = data["mood"].as_str();
            let updated_at = data["updated_at"].as_str().unwrap_or("");
            let deleted_at = data["deleted_at"].as_str();

            if let Some(del) = deleted_at {
                db.execute(
                    "UPDATE diary_entries SET deleted_at = ?1, sync_status = 'synced' WHERE server_id = ?2",
                    params![del, server_id],
                ).map_err(|e| e.to_string())?;
            } else if exists {
                db.execute(
                    "UPDATE diary_entries SET date = ?1, body = ?2, mood = ?3, updated_at = ?4,
                     sync_status = 'synced' WHERE server_id = ?5",
                    params![date, body, mood, updated_at, server_id],
                ).map_err(|e| e.to_string())?;
            } else {
                let client_id = uuid::Uuid::new_v4().to_string();
                db.execute(
                    "INSERT OR IGNORE INTO diary_entries (user_id, date, body, mood, created_at, updated_at,
                     server_id, client_id, sync_status) VALUES (?1, ?2, ?3, ?4, ?5, ?5, ?6, ?7, 'synced')",
                    params![user_id, date, body, mood, updated_at, server_id, client_id],
                ).map_err(|e| e.to_string())?;
            }
        },

        "calendar_events" => {
            let exists: bool = db.query_row(
                "SELECT COUNT(*) FROM calendar_events WHERE server_id = ?1",
                [&server_id],
                |row| row.get::<_, i32>(0).map(|c| c > 0)
            ).unwrap_or(false);

            let title = data["title"].as_str().unwrap_or("");
            let description = data["description"].as_str();
            let event_date = data["event_date"].as_str().unwrap_or("");
            let start_at = data["start_at"].as_str();
            let end_at = data["end_at"].as_str();
            let event_type = data["event_type"].as_str().unwrap_or("NOTE");
            let updated_at = data["updated_at"].as_str().unwrap_or("");
            let deleted_at = data["deleted_at"].as_str();

            if let Some(del) = deleted_at {
                db.execute(
                    "UPDATE calendar_events SET deleted_at = ?1, sync_status = 'synced' WHERE server_id = ?2",
                    params![del, server_id],
                ).map_err(|e| e.to_string())?;
            } else if exists {
                db.execute(
                    "UPDATE calendar_events SET title = ?1, description = ?2, event_date = ?3,
                     start_at = ?4, end_at = ?5, event_type = ?6, updated_at = ?7,
                     sync_status = 'synced' WHERE server_id = ?8",
                    params![title, description, event_date, start_at, end_at, event_type, updated_at, server_id],
                ).map_err(|e| e.to_string())?;
            } else {
                let client_id = uuid::Uuid::new_v4().to_string();
                db.execute(
                    "INSERT INTO calendar_events (user_id, title, description, event_date, start_at, end_at,
                     event_type, created_at, updated_at, server_id, client_id, sync_status)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8, ?9, ?10, 'synced')",
                    params![user_id, title, description, event_date, start_at, end_at, event_type,
                            updated_at, server_id, client_id],
                ).map_err(|e| e.to_string())?;
            }
        },

        "expenses" => {
            let exists: bool = db.query_row(
                "SELECT COUNT(*) FROM expenses WHERE server_id = ?1",
                [&server_id],
                |row| row.get::<_, i32>(0).map(|c| c > 0)
            ).unwrap_or(false);

            let amount: f64 = data["amount"].as_f64().unwrap_or(0.0);
            let category = data["category"].as_str().unwrap_or("");
            let description = data["description"].as_str();
            let date = data["date"].as_str().unwrap_or("");
            let expense_type = data["expense_type"].as_str().unwrap_or("EXPENSE");
            let updated_at = data["updated_at"].as_str().unwrap_or("");
            let deleted_at = data["deleted_at"].as_str();

            if let Some(del) = deleted_at {
                db.execute(
                    "UPDATE expenses SET deleted_at = ?1, sync_status = 'synced' WHERE server_id = ?2",
                    params![del, server_id],
                ).map_err(|e| e.to_string())?;
            } else if exists {
                db.execute(
                    "UPDATE expenses SET amount = ?1, category = ?2, description = ?3, date = ?4,
                     type = ?5, updated_at = ?6, sync_status = 'synced' WHERE server_id = ?7",
                    params![amount, category, description, date, expense_type, updated_at, server_id],
                ).map_err(|e| e.to_string())?;
            } else {
                let client_id = uuid::Uuid::new_v4().to_string();
                db.execute(
                    "INSERT INTO expenses (user_id, amount, category, description, date, type,
                     created_at, updated_at, server_id, client_id, sync_status)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, ?8, ?9, 'synced')",
                    params![user_id, amount, category, description, date, expense_type,
                            updated_at, server_id, client_id],
                ).map_err(|e| e.to_string())?;
            }
        },

        "projects" => {
            let exists: bool = db.query_row(
                "SELECT COUNT(*) FROM projects WHERE server_id = ?1",
                [&server_id],
                |row| row.get::<_, i32>(0).map(|c| c > 0)
            ).unwrap_or(false);

            let title = data["title"].as_str().unwrap_or("");
            let description = data["description"].as_str();
            let updated_at = data["updated_at"].as_str().unwrap_or("");
            let deleted_at = data["deleted_at"].as_str();

            if let Some(del) = deleted_at {
                db.execute(
                    "UPDATE projects SET deleted_at = ?1, sync_status = 'synced' WHERE server_id = ?2",
                    params![del, server_id],
                ).map_err(|e| e.to_string())?;
            } else if exists {
                db.execute(
                    "UPDATE projects SET title = ?1, description = ?2, updated_at = ?3,
                     sync_status = 'synced' WHERE server_id = ?4",
                    params![title, description, updated_at, server_id],
                ).map_err(|e| e.to_string())?;
            } else {
                let client_id = uuid::Uuid::new_v4().to_string();
                db.execute(
                    "INSERT INTO projects (user_id, title, description, created_at, updated_at,
                     server_id, client_id, sync_status)
                     VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?6, 'synced')",
                    params![user_id, title, description, updated_at, server_id, client_id],
                ).map_err(|e| e.to_string())?;
            }
        },

        "project_tasks" => {
            let exists: bool = db.query_row(
                "SELECT COUNT(*) FROM project_tasks WHERE server_id = ?1",
                [&server_id],
                |row| row.get::<_, i32>(0).map(|c| c > 0)
            ).unwrap_or(false);

            let project_id = data["project_id"].as_i64().unwrap_or(0);
            let title = data["title"].as_str().unwrap_or("");
            let description = data["description"].as_str();
            let status = data["status"].as_str().unwrap_or("TODO");
            let updated_at = data["updated_at"].as_str().unwrap_or("");
            let deleted_at = data["deleted_at"].as_str();

            if let Some(del) = deleted_at {
                db.execute(
                    "UPDATE project_tasks SET deleted_at = ?1, sync_status = 'synced' WHERE server_id = ?2",
                    params![del, server_id],
                ).map_err(|e| e.to_string())?;
            } else if exists {
                db.execute(
                    "UPDATE project_tasks SET title = ?1, description = ?2, status = ?3, updated_at = ?4,
                     sync_status = 'synced' WHERE server_id = ?5",
                    params![title, description, status, updated_at, server_id],
                ).map_err(|e| e.to_string())?;
            } else {
                let client_id = uuid::Uuid::new_v4().to_string();
                db.execute(
                    "INSERT INTO project_tasks (project_id, title, description, status, created_at, updated_at,
                     server_id, client_id, sync_status)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?5, ?6, ?7, 'synced')",
                    params![project_id, title, description, status, updated_at, server_id, client_id],
                ).map_err(|e| e.to_string())?;
            }
        },

        _ => return Err(format!("Unknown table: {}", table)),
    }

    Ok(())
}

// ─── Delete from Server (Real-time subscription) ────────────────────────────

#[tauri::command]
pub fn delete_from_server(table: String, server_id: String) -> Result<(), String> {
    let db = get_db();
    let valid_tables = ["tasks", "diary_entries", "calendar_events", "expenses", "projects", "project_tasks"];
    if !valid_tables.contains(&table.as_str()) {
        return Err(format!("Invalid table: {}", table));
    }
    let now = chrono::Utc::now().to_rfc3339();
    let sql = format!(
        "UPDATE {} SET deleted_at = ?1, sync_status = 'synced' WHERE server_id = ?2",
        table
    );
    db.execute(&sql, params![now, server_id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Sync Metadata ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_last_sync_time() -> Result<Option<String>, String> {
    let db = get_db();
    let result = db.query_row(
        "SELECT value FROM sync_meta WHERE key = 'last_sync_time'",
        [],
        |row| row.get(0),
    );

    match result {
        Ok(val) => Ok(Some(val)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_last_sync_time(time: String) -> Result<(), String> {
    let db = get_db();
    db.execute(
        "INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_sync_time', ?1)",
        [time],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
