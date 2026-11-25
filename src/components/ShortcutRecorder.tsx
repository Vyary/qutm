import { Show } from "solid-js";
import { formatForDisplay } from "@tanstack/hotkeys";
import { createHotkeyRecorder } from "@/lib/Hotkeys";
import { shortcuts, updateShortcut } from "@/lib/Shortcut";

export function ShortcutRecorder(props: { name: string; description: string }) {
  const shortcut = () => shortcuts[props.name];
  const recorder = createHotkeyRecorder({
    onRecord: (hotkey) => updateShortcut(props.name, formatForDisplay(hotkey)),
  });

  return (
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <kbd class="kbd kbd-md w-fit font-mono">{shortcut()}</kbd>
        <span class="text-xs text-base-content/50">{props.description}</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="btn btn-primary btn-xs"
          onClick={recorder.startRecording}
          disabled={recorder.isRecording()}
        >
          {recorder.isRecording() ? "Listening..." : "Change"}
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
