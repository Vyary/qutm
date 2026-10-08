use enigo::{
    Button, Coordinate, Direction,
    Direction::{Press, Release},
    Enigo, Key, Keyboard, Mouse, Settings,
};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri::{Emitter, Window};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_log::log::info;
use tokio::fs::File;
use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader, SeekFrom};

#[tauri::command]
async fn tail_file(window: Window, file_path: String) -> Result<(), String> {
    let file = File::open(&file_path).await.map_err(|e| e.to_string())?;
    let mut reader = BufReader::new(file);

    reader
        .seek(SeekFrom::End(0))
        .await
        .map_err(|e| e.to_string())?;

    loop {
        let mut line = String::new();
        match reader.read_line(&mut line).await {
            Ok(0) => {} // No new data
            Ok(_) => {
                let trimmed = line.trim();
                if !trimmed.is_empty() {
                    let _ = window.emit("tail-line", trimmed);
                }
            }
            Err(e) => return Err(e.to_string()),
        }

        tokio::time::sleep(Duration::from_millis(50)).await;
    }
}

#[tauri::command]
fn os_copy(app: AppHandle) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    let (pre, mid, post) = (100, 30, 40);
    #[cfg(not(target_os = "linux"))]
    let (pre, mid, post) = (20, 20, 20);

    enigo
        .key(Key::Control, Direction::Press)
        .map_err(|e| e.to_string())?;
    thread::sleep(Duration::from_millis(pre));
    enigo
        .key(Key::Unicode('c'), Direction::Press)
        .map_err(|e| e.to_string())?;
    thread::sleep(Duration::from_millis(mid));
    enigo
        .key(Key::Unicode('c'), Direction::Release)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::Control, Direction::Release)
        .map_err(|e| e.to_string())?;

    thread::sleep(Duration::from_millis(post));

    app.clipboard().read_text().map_err(|e| e.to_string())
}

#[tauri::command]
async fn mouse_move(x: i32, y: i32) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    enigo.move_mouse(x, y, Coordinate::Abs).unwrap();
    Ok(())
}

#[tauri::command]
async fn mouse_click() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    enigo.button(Button::Left, Press).unwrap();
    enigo.button(Button::Left, Release).unwrap();
    Ok(())
}

#[tauri::command]
fn get_global_mouse_position() -> Option<(i32, i32)> {
    // Initialize the Enigo input manager
    if let Ok(enigo) = Enigo::new(&Settings::default()) {
        // Enigo's location tracking returns Result<(i32, i32), InputError>
        if let Ok(pos) = enigo.location() {
            return Some(pos);
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .setup(|_| {
            if let Ok(duration) = SystemTime::now().duration_since(UNIX_EPOCH) {
                info!("{}", duration.as_millis());
            }
            Ok(())
        })
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            tail_file,
            os_copy,
            mouse_move,
            mouse_click,
            get_global_mouse_position,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
