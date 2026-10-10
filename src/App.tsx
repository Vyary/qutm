import { onCleanup, onMount } from "solid-js";
import "./App.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { enablePassthrough, passthrough } from "./lib/Passthrough";
import { unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { loadFilePath, showOverlay } from "./lib/File";
import { info } from "@tauri-apps/plugin-log";
import { Layouts } from "./components/widgets/layout/Layouts";
import { Zone } from "./components/widgets/zone/Zone";
import initTrayIcon from "./lib/TrayIcon";
import { Settings } from "./components/widgets/settings/Settings";
import { Updater } from "./components/updater/Updater";
import { Inventory } from "./components/widgets/inventory/Inventory";
import { Price } from "./components/widgets/price/Price";
import { UnlistenFn } from "@tauri-apps/api/event";

function App() {
  let unlisten: UnlistenFn = () => info("app on close unlisten not updated");

  onMount(async () => {
    info(Date.now().toString());

    const initializeApp = async () => {
      const s = performance.now();

      initTrayIcon();
      enablePassthrough();
      getCurrentWindow().maximize();

      loadFilePath();

      info(
        `finished loading initial state in ${(performance.now() - s).toFixed(2)}ms`,
      );
    };

    initializeApp();

    unlisten = await getCurrentWindow().onCloseRequested(async () => {
      await unregisterAll();
    });
  });

  onCleanup(async () => {
    unlisten();
  });

  return (
    <main
      class="min-h-dvh min-w-dvw flex items-center justify-center gap-2"
      classList={{
        "bg-neutral-content/3": !passthrough(),
        "bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_2px,transparent_3px,transparent_8px)]":
          !passthrough(),
      }}
    >
      <Updater />

      <div
        classList={{
          hidden: passthrough(),
        }}
      >
        <Settings />
        <Inventory />
        <Price />
      </div>

      <div
        classList={{
          hidden: !showOverlay() && passthrough(),
        }}
      >
        <Zone />
        <Layouts />
      </div>
    </main>
  );
}

export default App;
