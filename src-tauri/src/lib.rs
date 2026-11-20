use enigo::{
    Button, Coordinate, Direction,
    Direction::{Press, Release},
    Enigo, Key, Keyboard, Mouse, Settings,
};
use serde::Serialize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri::{Emitter, Window};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_log::log::{info, warn};
use tokio::fs::File;
use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader, SeekFrom};

// ---------------------------------------------------------------------------
// tail_file: track Client.txt and emit signals
// ---------------------------------------------------------------------------

#[derive(Clone, Serialize)]
struct AreaInfo {
    level: u32,
    code: String,
}

fn parse_area(line: &str) -> Option<AreaInfo> {
    let rest = line.split_once("Generating level ")?.1;
    let (level, rest) = rest.split_once(" area \"")?;
    let code = rest.split_once('"')?.0;

    if code.is_empty() || code.to_ascii_lowercase().contains("hideout") {
        return None;
    }

    Some(AreaInfo {
        level: level.parse().ok()?,
        code: code.to_string(),
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

// ---------------------------------------------------------------------------
// os_copy: auto-tuning copy
// ---------------------------------------------------------------------------

static SCALE_PCT: AtomicU64 = AtomicU64::new(100);

const MIN_SCALE: u64 = 10;
const MAX_SCALE: u64 = 800;
const MAX_ATTEMPTS: u32 = 3;

#[cfg(target_os = "macos")]
const MODIFIER: Key = Key::Meta;
#[cfg(not(target_os = "macos"))]
const MODIFIER: Key = Key::Control;

fn scaled(base_us: u64, scale: u64) -> Duration {
    Duration::from_micros(base_us * scale / 100)
}

fn ms(d: Duration) -> f64 {
    d.as_secs_f64() * 1000.0
}

fn send_copy(enigo: &mut Enigo, scale: u64) -> Result<(), String> {
    let pre = scaled(50_000, scale);
    let mid = scaled(50_000, scale);

    info!(
        "os_copy: sending copy (scale {scale}%, pre {:.1}ms, mid {:.1}ms)",
        ms(pre),
        ms(mid)
    );

    enigo
        .key(MODIFIER, Direction::Press)
        .map_err(|e| e.to_string())?;
    thread::sleep(pre);

    let pressed_c = (|| {
        enigo.key(Key::Unicode('c'), Direction::Press)?;
        thread::sleep(mid);
        enigo.key(Key::Unicode('c'), Direction::Release)
    })();

    let released = enigo.key(MODIFIER, Direction::Release);

    pressed_c.map_err(|e| e.to_string())?;
    released.map_err(|e| e.to_string())
}

fn wait_for_copy(app: &AppHandle, sentinel: &str, timeout: Duration) -> Option<(String, Duration)> {
    let start = Instant::now();
    let mut poll = Duration::from_millis(5);

    while start.elapsed() < timeout {
        if let Ok(text) = app.clipboard().read_text() {
            if !text.is_empty() && text != sentinel {
                return Some((text, start.elapsed()));
            }
        }
        thread::sleep(poll);
        poll = (poll * 2).min(Duration::from_millis(40));
    }
    None
}

#[tauri::command(async)]
fn os_copy(app: AppHandle) -> Result<String, String> {
    let total_start = Instant::now();
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let clipboard = app.clipboard();

    let original = clipboard.read_text().ok();
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let sentinel = format!("__os_copy_sentinel_{nanos}__");

    let mut scale = SCALE_PCT.load(Ordering::Relaxed);
    info!("os_copy: start, learned scale {scale}%");

    for attempt in 0..MAX_ATTEMPTS {
        clipboard
            .write_text(sentinel.clone())
            .map_err(|e| e.to_string())?;

        send_copy(&mut enigo, scale)?;

        let timeout = scaled(200_000, scale);
        match wait_for_copy(&app, &sentinel, timeout) {
            Some((text, waited)) => {
                let learned = if attempt == 0 {
                    (scale * 90 / 100).max(MIN_SCALE)
                } else {
                    scale
                };
                SCALE_PCT.store(learned, Ordering::Relaxed);

                info!(
                    "os_copy: ok on attempt {} | clipboard changed after {:.1}ms | total {:.1}ms | scale {scale}% -> {learned}%",
                    attempt + 1,
                    ms(waited),
                    ms(total_start.elapsed())
                );
                return Ok(text);
            }
            None => {
                let next = (scale * 2).min(MAX_SCALE);
                warn!(
                    "os_copy: attempt {} timed out after {:.1}ms | scale {scale}% -> {next}%",
                    attempt + 1,
                    ms(timeout)
                );
                scale = next;
            }
        }
    }

    if let Some(orig) = original {
        let _ = clipboard.write_text(orig);
    }
    warn!(
        "os_copy: gave up after {MAX_ATTEMPTS} attempts, total {:.1}ms",
        ms(total_start.elapsed())
    );
    Err("Copy didn't register (nothing selected, or the app is too slow)".into())
}

// ---------------------------------------------------------------------------
// alt_tab: automate alt+tab
// ---------------------------------------------------------------------------

#[tauri::command]
async fn alt_tab() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(|| -> Result<(), String> {
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

        #[cfg(target_os = "macos")]
        let modifier = Key::Meta; // Cmd
        #[cfg(not(target_os = "macos"))]
        let modifier = Key::Alt;

        let err = |e: enigo::InputError| e.to_string();

        enigo.key(modifier, Direction::Press).map_err(err)?;

        let result = enigo.key(Key::Tab, Direction::Click).map_err(err);

        thread::sleep(Duration::from_millis(5));
        let _ = enigo.key(modifier, Direction::Release);

        result
    })
    .await
    .map_err(|e| e.to_string())?
}

// ---------------------------------------------------------------------------
// get_global_mouse_position, mouse_move, mouse_click: general mouse functions
// ---------------------------------------------------------------------------

#[tauri::command]
fn get_global_mouse_position() -> Option<(i32, i32)> {
    if let Ok(enigo) = Enigo::new(&Settings::default()) {
        if let Ok(pos) = enigo.location() {
            return Some(pos);
        }
    }
    None
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

// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
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
        .invoke_handler(tauri::generate_handler![
            tail_file,
            os_copy,
            alt_tab,
            get_global_mouse_position,
            mouse_move,
            mouse_click
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
