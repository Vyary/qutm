use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Window};
use tauri_plugin_log::log::info;
use tokio::fs::File;
use tokio::io::{AsyncBufReadExt, AsyncSeekExt, BufReader, SeekFrom};

// --- LINUX SPECIFIC IMPORTS ---
#[cfg(target_os = "linux")]
use evdev::{uinput::VirtualDevice, AttributeSet, KeyCode, InputId, InputEvent, EventType};

// --- NON-LINUX SPECIFIC IMPORTS ---
#[cfg(not(target_os = "linux"))]
use enigo::{
    Direction::{Press, Release},
    Enigo, Keyboard, Key as EnigoKey, Settings,
};


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
fn os_copy() -> Result<(), String> {
    // --- LINUX IMPLEMENTATION (Wayland/Gamescope Compatible) ---
    #[cfg(target_os = "linux")]
    {
        let mut keys = AttributeSet::<KeyCode>::new();
        keys.insert(KeyCode::KEY_LEFTCTRL);
        keys.insert(KeyCode::KEY_C);

        let mut device = VirtualDevice::builder()
            .map_err(|e| e.to_string())?
            .name("CachyOS Tauri Virtual Input")
            .input_id(InputId::new(evdev::BusType::BUS_USB, 0x1234, 0x5678, 0x01))
            .with_keys(&keys)
            .map_err(|e| e.to_string())?
            .build()
            .map_err(|e| e.to_string())?;

        // Allow kernel to initialize the device node
        thread::sleep(Duration::from_millis(100));

        let key_type = EventType::KEY.0;

        // Press Ctrl + C (Value 1 = Down)
        device.emit(&[
            InputEvent::new(key_type, KeyCode::KEY_LEFTCTRL.code(), 1),
            InputEvent::new(key_type, KeyCode::KEY_C.code(), 1),
        ]).map_err(|e| e.to_string())?;
        
        // Polling delay for the game engine
        thread::sleep(Duration::from_millis(30)); 

        // Release Ctrl + C (Value 0 = Up)
        device.emit(&[
            InputEvent::new(key_type, KeyCode::KEY_C.code(), 0),
            InputEvent::new(key_type, KeyCode::KEY_LEFTCTRL.code(), 0),
        ]).map_err(|e| e.to_string())?;
    }

    // --- NON-LINUX IMPLEMENTATION (Windows / macOS via Enigo) ---
    #[cfg(not(target_os = "linux"))]
    {
        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
        let _ = enigo.key(EnigoKey::Control, Press);
        let _ = enigo.key(EnigoKey::Unicode('c'), Press); 
        let _ = enigo.key(EnigoKey::Unicode('c'), Release);
        let _ = enigo.key(EnigoKey::Control, Release);
    }

    Ok(())
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
        .invoke_handler(tauri::generate_handler![tail_file, os_copy])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
