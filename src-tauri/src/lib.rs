use serde::Serialize;
use std::io::SeekFrom;
use std::time::Duration;
use tauri::{Emitter, Window};
use tokio::fs::File;
use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader};

#[derive(Clone, Serialize)]
struct AreaInfo {
    level: u32,
    name: String,
}

fn parse_area(line: &str) -> Option<AreaInfo> {
    let rest = line.split_once("Generating level ")?.1;
    let (level, rest) = rest.split_once(" area \"")?;
    let name = rest.split_once('"')?.0;

    if name.is_empty() || name.to_ascii_lowercase().contains("hideout") {
        return None;
    }

    Some(AreaInfo {
        level: level.parse().ok()?,
        name: name.to_string(),
    })
}

#[derive(Clone, Serialize)]
struct LevelUp {
    name: String,
    class: String,
    level: u32,
}

fn parse_level_up(line: &str) -> Option<LevelUp> {
    let (before, after) = line.split_once(" is now level ")?;
    let who = before.rsplit_once(": ")?.1; // "Name (Class)"
    let (name, class) = who.split_once(" (")?;
    let class = class.strip_suffix(')')?;
    let level = after.split_whitespace().next()?.parse().ok()?;

    Some(LevelUp {
        name: name.to_string(),
        class: class.to_string(),
        level,
    })
}

fn parse_overlay(line: &str) -> Option<bool> {
    if line.contains("[STARTUP] Loading Start") || line.contains("[WINDOW] Gained focus") {
        Some(true)
    } else if line.contains("[WINDOW] Lost focus") || line.contains("Closing game gracefully") {
        Some(false)
    } else {
        None
    }
}

fn parse_quote(line: &str) -> Option<&str> {
    let quote = line.trim_end().rsplit_once(": ")?.1;
    (!quote.is_empty()).then_some(quote)
}

#[tauri::command]
async fn tail_file(window: Window, file_path: String) -> Result<(), String> {
    let mut reader = BufReader::new(File::open(&file_path).await.map_err(|e| e.to_string())?);
    reader
        .seek(SeekFrom::End(0))
        .await
        .map_err(|e| e.to_string())?;

    let mut line = String::new();
    loop {
        let n = reader
            .read_line(&mut line)
            .await
            .map_err(|e| e.to_string())?;

        // EOF or a half-written line: wait, then keep appending to `line`.
        if n == 0 || !line.ends_with('\n') {
            tokio::time::sleep(Duration::from_millis(50)).await;
            continue;
        }

        if let Some(show) = parse_overlay(&line) {
            let _ = window.emit("show-overlay", show);
        } else if let Some(level_up) = parse_level_up(&line) {
            let _ = window.emit("character-level-up", level_up);
        } else if let Some(area) = parse_area(&line) {
            let _ = window.emit("area-entered", area);
        } else if let Some(quote) = parse_quote(&line) {
            let _ = window.emit("log-quote", quote);
        }

        line.clear();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![tail_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
