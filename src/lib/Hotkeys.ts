import { createSignal, onSettled } from "solid-js";
import {
  HotkeyRecorder,
  type Hotkey,
  type HotkeyChord,
  type HotkeyChordRecorderOptions,
  type HotkeyRecorderActions,
  type HotkeyRecorderOptions,
  type HotkeyRecorderState,
  type HotkeySequence,
  type HotkeySequenceRecorderOptions,
} from "@tanstack/hotkeys";

export interface SolidHotkeyRecorder<
  THotkey extends Hotkey = Hotkey,
> extends HotkeyRecorderActions {
  /** Whether recording is currently active */
  isRecording: () => boolean;
  /** Chords recorded so far in a multi-step recording (for live preview) */
  steps: () => HotkeySequence;
  /** The last committed hotkey */
  recordedHotkey: () => THotkey | null;
}

/**
 * Solid primitive around the framework-agnostic `HotkeyRecorder` from
 * `@tanstack/hotkeys`. The core store is subscribed with a signal, and the
 * listener is cleaned up with the owner.
 */
export function createHotkeyRecorder(
  options: HotkeyChordRecorderOptions,
): SolidHotkeyRecorder<HotkeyChord>;
export function createHotkeyRecorder(
  options: HotkeySequenceRecorderOptions,
): SolidHotkeyRecorder;
export function createHotkeyRecorder(
  options: HotkeyRecorderOptions,
): SolidHotkeyRecorder {
  // The overloads already checked the options.
  const recorder = new HotkeyRecorder(options as HotkeyChordRecorderOptions);
  const [state, setState] = createSignal<HotkeyRecorderState>(
    recorder.store.get(),
    { ownedWrite: true },
  );

  onSettled(() => {
    const { unsubscribe } = recorder.store.subscribe((next) => setState(next));
    return () => {
      unsubscribe();
      recorder.destroy();
    };
  });

  return {
    isRecording: () => state().isRecording,
    steps: () => state().steps,
    recordedHotkey: () => state().recordedHotkey,
    startRecording: () => recorder.start(),
    stopRecording: () => recorder.stop(),
    cancelRecording: () => recorder.cancel(),
    commitRecording: () => recorder.commit(),
  };
}
