import { TrayIcon } from "@tauri-apps/api/tray";
import { Menu, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
import { relaunch } from "@tauri-apps/plugin-process";
import { defaultWindowIcon } from "@tauri-apps/api/app";
import { getAllWindows, getCurrentWindow } from "@tauri-apps/api/window";
import { togglePassthrough } from "../state/Passthrough";
import { exportGuide, importGuide } from "../state/Guide";
import { store } from "../state/Store";
import { exportLayouts, importLayouts } from "../state/Layouts";
import { exportTowns } from "../state/Towns";
import { info } from "@tauri-apps/plugin-log";

async function initTrayIcon() {
  try {
    const sep = await PredefinedMenuItem.new({ item: "Separator" });

    const dataSubmenu = await Submenu.new({
      text: "Advanced Storage Options...",
      items: [
        {
          id: "reset_file_path",
          text: "Reset File Path",
          action: async () => {
            store.delete("filePath");
            await relaunch();
          },
        },
        sep,
        {
          id: "clear_all_data",
          text: "Factory Reset All Data",
          action: async () => {
            store.clear();
            await relaunch();
          },
        },
      ],
    });

    const exportImportSubmenu = await Submenu.new({
      text: "Export/Import Options...",
      items: [
        {
          id: "export_guide",
          text: "Export Guide",
          action: async () => exportGuide(),
        },
        {
          id: "import_guide",
          text: "Import Guide",
          action: async () => importGuide(),
        },
        {
          id: "export_layouts",
          text: "Export Layouts",
          action: async () => exportLayouts(),
        },
        {
          id: "import_layouts",
          text: "Import Layouts",
          action: async () => importLayouts(),
        },
        {
          id: "export_towns",
          text: "Export Towns",
          action: async () => exportTowns(),
        },
      ],
    });

    const menu = await Menu.new({
      items: [
        {
          id: "settings",
          text: "Settings",
          action: async () => togglePassthrough(),
        },
        sep,
        exportImportSubmenu,
        sep,
        {
          id: "clear_tracker",
          text: "Clear Progression",
          action: async () => {
            store.delete("tracker");
            store.delete("char")
            await relaunch();
          },
        },
        dataSubmenu,
        sep,
        {
          id: "quit",
          text: "Quit Application",
          action: async () => {
            const windows = await getAllWindows();
            for (const win of windows) {
              await win.close();
            }
          },
        },
        {
          id: "",
          text: "",
        },
      ],
    });

    await TrayIcon.new({
      menu,
      menuOnLeftClick: false,
      icon: (await defaultWindowIcon()) ?? undefined,
      action: async (event) => {
        if (event.type === "DoubleClick" && event.button === "Left") {
          togglePassthrough();
        }
      },
    });
  } catch (error) {
    console.error("Failed to initialize system tray:", error);
  }
}

export default initTrayIcon;
