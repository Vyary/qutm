import { Show } from "solid-js";
import {
  createFormatForDisplay,
  createHotkeyRecorder,
} from "@tanstack/solid-hotkeys";

export function ShortcutRecorder() {
  const formatForDisplay = createFormatForDisplay();
  const recorder = createHotkeyRecorder({
    onRecord: (hotkey) => console.log("Recorded:", hotkey), // e.g. 'Mod+Shift+S'
  });

  const label = () => {
    if (recorder.isRecording()) return "Press a key combination...";
    const hotkey = recorder.recordedHotkey();
    return hotkey ? formatForDisplay(hotkey) : "Click to record";
  };

  return (
    <div>
      <button onClick={recorder.startRecording}>{label()}</button>
      <Show when={recorder.isRecording()}>
        <button onClick={recorder.cancelRecording}>Cancel</button>
      </Show>
    </div>
  );
}
