import { Show } from "solid-js";
import { formatForDisplay } from "@tanstack/hotkeys";
import { createHotkeyRecorder } from "@/lib/Hotkeys";
import { shortcuts, updateShortcut } from "@/lib/Shortcut";

export function ShortcutRecorder(props: { name: string }) {
  const shortcut = () => shortcuts[props.name];
  const recorder = createHotkeyRecorder({
    onRecord: (hotkey) => updateShortcut(props.name, formatForDisplay(hotkey)),
  });

  return (
    <div>
      <button class="btn" onClick={recorder.startRecording}>
        {shortcut()}
      </button>
      <Show when={recorder.isRecording()}>
        <button class="btn" onClick={recorder.cancelRecording}>
          Cancel
        </button>
      </Show>
    </div>
  );
}
