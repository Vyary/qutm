import { onSettled, Show } from "solid-js";
import "./App.css";
import {
  disablePassthrough,
  enablePassthrough,
  passthrough,
  togglePassthrough,
} from "./lib/Passthrough";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createShortcut } from "./lib/Shortcut";
import { trayIcon } from "./lib/TrayIcon";
import { initFileWatch } from "./lib/File";
import { Guard } from "./components/Guard";
import { autoUpdate, Updater } from "./components/Updater";
import {
  initShowOverlay,
  showOverlay,
  stopShowOverlay,
} from "./lib/ShowOverlay";
import { Zone, showZone } from "./components/Zone/Zone";
import { Layout, showLayout } from "./components/Layout/Layout";
import { Price, showPrice } from "./components/Price/Price";
import { closeOverlay } from "./lib/CloseOverlay";
import { invoke } from "@tauri-apps/api/core";
import { Inventory, showInventory } from "./components/Inventory/Inventory";
import { SetupFlow, showSetup } from "./components/Settings/SetupFlow";
import { loadSaved } from "./lib/Store";
import { Settings, showSettings } from "./components/Settings/Settings";
import { info } from "@tauri-apps/plugin-log";
import { activeTour } from "./components/Help/Tour";

function App() {
  createShortcut("overlay", "Control+Shift+F", true, togglePassthrough);

  const close = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (activeTour()) return;
    e.preventDefault();
    enablePassthrough();
  };

  onSettled(() => {
    info(`app render: ${Date.now().toString()}`);
    const s = performance.now();

    trayIcon();
    initFileWatch();
    initShowOverlay();
    enablePassthrough();
    getCurrentWindow().maximize();

    loadSaved();

    info(
      `finished loading initial state in ${(performance.now() - s).toFixed(2)}ms`,
    );

    window.addEventListener("keydown", close);
    return () => {
      stopShowOverlay();
      window.removeEventListener("keydown", close);
    };
  });

  return (
    <main
      class={[
        "min-h-dvh min-w-dvw flex items-center justify-center gap-2",
        { "bg-neutral-content/3": !passthrough() },
        {
          "bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_2px,transparent_3px,transparent_8px)]":
            !passthrough(),
        },
      ]}
    >
      <Show when={closeOverlay() && !passthrough()}>
        <div
          class="min-h-dvh min-w-dvw"
          onClick={() => {
            if (closeOverlay()) {
              invoke("alt_tab");
              enablePassthrough();
            }
          }}
        ></div>
      </Show>

      <Guard name="Update" show={autoUpdate()}>
        <Updater />
      </Guard>

      <Guard name="SetupFlow" show={showSetup()}>
        <SetupFlow />
      </Guard>

      <div
        class={{
          hidden: !showOverlay() && passthrough(),
        }}
      >
        <Guard name="Zone" show={showZone()}>
          <Zone />
        </Guard>

        <Guard name="Layout" show={showLayout()}>
          <Layout />
        </Guard>
      </div>

      <div
        class={{
          hidden: passthrough(),
        }}
      >
        <Guard name="Price" show={showInventory()}>
          <Inventory />
        </Guard>

        <Guard name="Price" show={showPrice()}>
          <Price />
        </Guard>

        <Guard name="Settings" show={showSettings()}>
          <Settings />
        </Guard>
      </div>
    </main>
  );
}

export default App;
