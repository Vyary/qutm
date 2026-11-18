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

function App() {
  createShortcut("overlay", "F3", true, togglePassthrough);

  onSettled(() => {
    trayIcon();
    initFileWatch();
    enablePassthrough();
    getCurrentWindow().maximize();
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
    </main>
  );
}

export default App;
