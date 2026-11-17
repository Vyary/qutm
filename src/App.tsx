import { createSignal, onSettled, Show } from "solid-js";
import "./App.css";
import {
  enablePassthrough,
  passthrough,
  togglePassthrough,
} from "./lib/Passthrough";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ShortcutRecorder } from "./components/ShortcutRecorder";
import { createShortcut } from "./lib/Shortcut";
import { WidgetBase } from "./components/WidgetBase";
import { trayIcon } from "./lib/TrayIcon";

const [show, setShow] = createSignal(false);

function App() {
  createShortcut("overlay", "F3", true, togglePassthrough);

  onSettled(() => {
    void trayIcon();
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
      <button class="btn btn-primary" onClick={() => setShow((s) => !s)}>
        Show/Hide
      </button>
      <Show when={show()}>
        <WidgetBase
          name="shortcut"
          defaultPos={{ x: 10, y: 10 }}
          defaultTransparency={95}
          transparencySlider
        >
          <div class="p-10">
            <ShortcutRecorder name="overlay" />
          </div>
        </WidgetBase>
      </Show>
    </main>
  );
}

export default App;
