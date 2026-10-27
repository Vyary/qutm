import { onCleanup, onMount } from "solid-js";
import "./App.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { enablePassthrough, passthrough } from "./lib/Passthrough";
import { unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { loadFilePath, showOverlay } from "./lib/File";
import { info } from "@tauri-apps/plugin-log";
import { Zone } from "./components/widgets/zone/Zone";
import initTrayIcon from "./lib/TrayIcon";
import { Settings } from "./components/widgets/settings/Settings";
import { Updater } from "./components/updater/Updater";
import { Inventory } from "./components/widgets/inventory/Inventory";
import { Price } from "./components/widgets/price/Price";
import { UnlistenFn } from "@tauri-apps/api/event";
import { SetupFlow } from "./components/SetupFlow";
import { Layouts } from "./components/widgets/layout/Layouts";
import { Guard } from "./components/Guard";
import { autoUpdate } from "./components/updater/UpdaterSettings";
import { showInventory } from "./components/widgets/inventory/InventorySettings";
import { showPrice } from "./components/widgets/price/PriceSettings";
import { showZone } from "./components/widgets/zone/ZoneSettings";
import { showLayout } from "./components/widgets/layout/LayoutSettings";

function App() {
  let unlisten: UnlistenFn = () => info("app on close unlisten not updated");

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      info("Escape triggered");
      enablePassthrough();
    }
  };

  onMount(async () => {
    info(Date.now().toString());

    const initializeApp = async () => {
      const s = performance.now();

      initTrayIcon();
      enablePassthrough();
      getCurrentWindow().maximize();

      loadFilePath();

      window.addEventListener("keydown", handleEsc);

      info(
        `finished loading initial state in ${(performance.now() - s).toFixed(2)}ms`,
      );
    };

    initializeApp();

    unlisten = await getCurrentWindow().onCloseRequested(async () => {
      window.removeEventListener("keydown", handleEsc);
      await unregisterAll();
    });
  });

  onCleanup(async () => {
    window.removeEventListener("keydown", handleEsc);
    await unregisterAll();
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
      <Guard name="Update" show={autoUpdate()}>
        <Updater />
      </Guard>

      <Guard name="SetupFlow" show={true}>
        <SetupFlow />
      </Guard>

      <div
        classList={{
          hidden: passthrough(),
        }}
      >
        <Guard name="Settings" show={true}>
          <Settings />
        </Guard>

        <Guard name="inventory" show={showInventory()}>
          <Inventory />
        </Guard>

        <Guard name="Price" show={showPrice()}>
          <Price />
        </Guard>
      </div>

      <div
        classList={{
          hidden: !showOverlay() && passthrough(),
        }}
      >
        <Guard name="Zone" show={showZone()}>
          <Zone />
        </Guard>

        <Guard name="Layout" show={showLayout()}>
          <Layouts />
        </Guard>
      </div>
    </main>
  );
}

export default App;
