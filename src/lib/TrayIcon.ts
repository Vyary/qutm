import { TrayIcon, TrayIconEvent } from "@tauri-apps/api/tray";
import { Menu } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { defaultWindowIcon, exit } from "@tauri-apps/api/app";
import { error } from "@tauri-apps/plugin-log";
import { togglePassthrough } from "./Passthrough";

export async function trayIcon() {
  try {
    const menu = await Menu.new({
      items: [
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
