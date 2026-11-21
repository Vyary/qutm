import { TrayIcon, TrayIconEvent } from "@tauri-apps/api/tray";
import { Menu, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { defaultWindowIcon } from "@tauri-apps/api/app";
import { error } from "@tauri-apps/plugin-log";
import { disablePassthrough, togglePassthrough } from "./Passthrough";
import { store } from "./Store";
import { exit, relaunch } from "@tauri-apps/plugin-process";
import { exportGuide, importGuide } from "@/components/Zone/utils/Guide";
import { importLayouts } from "@/components/Layout/LayoutState";
import { setShowSettings } from "@/components/Settings";

export async function trayIcon() {
  try {
    const sep = await PredefinedMenuItem.new({ item: "Separator" });

    const exportImportSubmenu = await Submenu.new({
      text: "Export/Import Options...",
      items: [
        {
          id: "export_guide",
          text: "Export Guide",
          action: exportGuide,
        },
        {
          id: "import_guide",
          text: "Import Guide",
          action: importGuide,
        },
        {
          id: "import_layouts",
          text: "Import Layouts",
          action: importLayouts,
        },
      ],
    });

    const dataSubmenu = await Submenu.new({
      text: "Advanced Storage Options...",
      items: [
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

    const menu = await Menu.new({
      items: [
        {
          id: "settings",
          text: "Settings",
          action: async () => {
            setShowSettings(true);
            disablePassthrough();
          },
        },
        exportImportSubmenu,
        sep,
        dataSubmenu,
        sep,
        {
          id: "quit",
          text: "Quit",
          action: async () => {
            await getCurrentWindow().close();
            await getCurrentWindow().minimize();
            await new Promise((r) => setTimeout(r, 800));
            await exit(0);
          },
        },
        {
          id: "",
          text: "",
        },
      ],
    });

    const options = {
      menu,
      menuOnLeftClick: true,
      icon: (await defaultWindowIcon()) ?? undefined,
      action: async (e: TrayIconEvent) => {
        if (e.type === "DoubleClick" && e.button === "Left")
          togglePassthrough();
      },
    };

    await TrayIcon.new(options);
  } catch (e) {
    error(`failed to initiate tray icon: ${e}`);
  }
}
