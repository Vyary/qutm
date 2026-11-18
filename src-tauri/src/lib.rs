use std::io::SeekFrom;
use std::time::Duration;

use tauri::{Emitter, Window};
use tokio::fs::File;
use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader};

fn parse_zone(line: &str) -> Option<&str> {
    let zone = line
        .split_once("Generating level ")?
        .1
        .split_once("area \"")?
        .1
        .split_once('"')?
        .0;

    (!zone.is_empty() && !zone.to_ascii_lowercase().contains("hideout")).then_some(zone)
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

        if let Some(zone) = parse_zone(&line) {
            let _ = window.emit("area-entered", zone);
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
