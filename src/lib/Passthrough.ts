import { getCurrentWindow } from "@tauri-apps/api/window";
import { createSignal } from "solid-js";

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

export {
  passthrough,
  setPassthrough,
  enablePassthrough,
  disblePassthrough,
  togglePassthrough,
};
