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
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-center gap-2 py-1">
        <kbd class="kbd kbd-md">{shortcut()}</kbd>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="btn btn-primary btn-xs flex-1"
          onClick={recorder.startRecording}
          disabled={recorder.isRecording()}
        >
          {recorder.isRecording() ? "Listening..." : "Change shortcut"}
        </button>

        <Show when={recorder.isRecording()}>
          <button
            class="btn btn-ghost btn-xs"
            onClick={recorder.cancelRecording}
          >
            Cancel
          </button>
        </Show>
      </div>
    </div>
  );
}
