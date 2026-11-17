import { onSettled } from "solid-js";
import "./App.css";
import { enablePassthrough, passthrough } from "./lib/Passthrough";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ShortcutRecorder } from "./components/Shortcut";

function App() {
  onSettled(() => {
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
      <ShortcutRecorder />
    </main>
  );
}

export default App;
