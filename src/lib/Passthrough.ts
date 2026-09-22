import { getCurrentWindow } from "@tauri-apps/api/window";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { error } from "@tauri-apps/plugin-log";
import { store } from "./Store";

const [passthrough, setPassthrough] = createSignal(false);

const enablePassthrough = () => {
  setPassthrough(true);
  getCurrentWindow().setIgnoreCursorEvents(true);
};

const disblePassthrough = () => {
  setPassthrough(false);
  getCurrentWindow().setIgnoreCursorEvents(false);
};

const togglePassthrough = () => {
  setPassthrough(!passthrough());
  getCurrentWindow().setIgnoreCursorEvents(passthrough());
};

const buildShortcutString = (state: Record<string, any>) => {
  const mods = Object.entries(state)
    .filter(([k, v]) => v === true && k !== "Key")
    .map(([k]) => (k === "Ctrl" ? "CommandOrControl" : k));

  if (state.Key) {
    mods.push(state.Key);
  }
  return mods.join("+");
};

const [PtSc, setPtSc] = createStore({
  Ctrl: true,
  Shift: true,
  Alt: false,
  Key: "F",
});

const registerPasstroughShortcut = async () => {
  const sc = await store.get("OverlayToggle");
  if (sc) setPtSc(sc);

  try {
    await register(buildShortcutString(PtSc), (e) => {
      if (e.state === "Pressed") {
        togglePassthrough();
      }
    });
  } catch (e) {
    error("failed to register passthrough toggle shortcut: " + e);
    return false;
  }
};

const updatePasstroughShortcut = async (e: any, input: boolean = false) => {
  try {
    await unregister(buildShortcutString(PtSc));
  } catch (e) {
    error("failed to unregister passthrough toggle shortcut: " + e);
  }

  setPtSc(e.target.value, e.target.checked);

  if (input) {
    setPtSc(e.target.placeholder, e.target.value.toUpperCase());
  }

  await store.set("OverlayToggle", PtSc);
  await store.save();

  registerPasstroughShortcut();
};

export {
  passthrough,
  setPassthrough,
  enablePassthrough,
  disblePassthrough,
  togglePassthrough,
  PtSc,
  registerPasstroughShortcut,
  updatePasstroughShortcut,
};
