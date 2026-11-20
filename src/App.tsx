import { onSettled, Show } from "solid-js";
import "./App.css";
import {
  enablePassthrough,
  passthrough,
  togglePassthrough,
} from "./lib/Passthrough";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createShortcut } from "./lib/Shortcut";
import { trayIcon } from "./lib/TrayIcon";
import { initFileWatch } from "./lib/File";
import { Guard } from "./components/Guard";
import { autoUpdate } from "./components/Updater/UpdaterSettings";
import { Updater } from "./components/Updater/Updater";
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

function App() {
  createShortcut("overlay", "F3", true, togglePassthrough);

  onSettled(() => {
    trayIcon();
    initFileWatch();
    initShowOverlay();
    enablePassthrough();
    getCurrentWindow().maximize();

    return () => {
      stopShowOverlay();
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
      </div>
    </main>
  );
}

export default App;
