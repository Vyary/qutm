import { listen } from "@tauri-apps/api/event";
import { error } from "@tauri-apps/plugin-log";
import { createSignal } from "solid-js";

export const [showOverlay, setShowOverlay] = createSignal(false);

let listening: Promise<() => void> | undefined;

export const initShowOverlay = () => {
  listening ??= listen<boolean>("show-overlay", (e) => {
    setShowOverlay(e.payload);
  }).catch((e) => {
    error(String(e));
    listening = undefined;
    return () => {};
  });
};

export const stopShowOverlay = () => {
  const p = listening;
  listening = undefined;
  p?.then((unlisten) => unlisten());
};
