use enigo::{
    Button, Coordinate, Direction,
    Direction::{Press, Release},
    Enigo, Key, Keyboard, Mouse, Settings,
};
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri::{Emitter, Window};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_log::log::{info, warn};
use tokio::fs::File;
use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader, SeekFrom};

const MAX_BATCH: usize = 200;
const POLL_INTERVAL: Duration = Duration::from_millis(50);

#[tauri::command]
async fn tail_file(window: Window, file_path: String) -> Result<(), String> {
    let file = File::open(&file_path).await.map_err(|e| e.to_string())?;
    let mut reader = BufReader::new(file);

    reader
        .seek(SeekFrom::End(0))
        .await
        .map_err(|e| e.to_string())?;

    let mut batch: Vec<String> = Vec::with_capacity(MAX_BATCH);
    let mut line = String::new();

    loop {
        // Drain whatever is available right now, up to MAX_BATCH lines
        while batch.len() < MAX_BATCH {
            let n = reader
                .read_line(&mut line)
                .await
                .map_err(|e| e.to_string())?;

            if n == 0 {
                break; // EOF: nothing new yet
            }
            if !line.ends_with('\n') {
                break; // partial line; keep it, read_line will append the rest next time
            }

            let trimmed = line.trim();
            if !trimmed.is_empty() {
                batch.push(trimmed.to_owned());
            }
            line.clear();
        }

        let was_full = batch.len() == MAX_BATCH;

        if !batch.is_empty() {
            let _ = window.emit("tail-lines", &batch);
            batch.clear();
        }

        // Only sleep when we've caught up. If the batch was full, more is probably waiting.
        if !was_full {
            tokio::time::sleep(POLL_INTERVAL).await;
        }
    }
}

// ---------------------------------------------------------------------------
// os_copy: auto-tuning copy
// ---------------------------------------------------------------------------

/// Learned slowness factor in percent (100 = base timings). Persists across calls.
static SCALE_PCT: AtomicU64 = AtomicU64::new(100);

const MIN_SCALE: u64 = 50;
const MAX_SCALE: u64 = 800;
const MAX_ATTEMPTS: u32 = 3;

#[cfg(target_os = "macos")]
const MODIFIER: Key = Key::Meta; // Cmd
#[cfg(not(target_os = "macos"))]
const MODIFIER: Key = Key::Control;

fn scaled(base_us: u64, scale: u64) -> Duration {
    Duration::from_micros(base_us * scale / 100)
}

fn ms(d: Duration) -> f64 {
    d.as_secs_f64() * 1000.0
}

fn send_copy(enigo: &mut Enigo, scale: u64) -> Result<(), String> {
    let pre = scaled(5_000, scale);
    let mid = scaled(5_000, scale);

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

    // Always release the modifier, even if the 'c' press failed,
    // otherwise Ctrl/Cmd can get stuck down.
    let released = enigo.key(MODIFIER, Direction::Release);

    pressed_c.map_err(|e| e.to_string())?;
    released.map_err(|e| e.to_string())
}

/// Polls until the clipboard holds something other than the sentinel.
/// Returns the copied text and how long the clipboard took to change.
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
                // First-try success: slowly speed up.
                // Needed a retry: keep the slower value.
                let learned = if attempt == 0 {
                    (scale * 98 / 100).max(MIN_SCALE)
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

    // Nothing arrived. Restore the clipboard, and don't persist the slower
    // scale, since "nothing selected" isn't necessarily a timing problem.
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

fn short_target(target: &str) -> &str {
    target.rsplit_once('/').map_or(target, |(_, file)| file)
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
                .format(|out, message, record| {
                    out.finish(format_args!(
                        "[{}][{}][{}][{}] {}",
                        chrono::Local::now().format("%Y-%m-%d"),
                        chrono::Local::now().format("%H:%M:%S"),
                        short_target(record.target()),
                        record.level(),
                        message
                    ))
                })
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .max_file_size(50_000_000)
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
