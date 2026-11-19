import { onSettled } from "solid-js";
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
      <Guard name="Update" show={autoUpdate()}>
        <Updater />
      </Guard>

      <div
        class={{
          hidden: !showOverlay() && passthrough(),
        }}
      >
        <Guard name="Layout" show={showLayout()}>
          <Layout />
        </Guard>
      </div>
    </main>
  );
}

export default App;
