import { getCurrentWindow } from "@tauri-apps/api/window";
import { createSignal } from "solid-js";

const appWindow = getCurrentWindow();
const [passthrough, setPassthrough] = createSignal(false);

const enablePassthrough = () => {
  setPassthrough(true);
  appWindow.setIgnoreCursorEvents(true);
};

const disablePassthrough = () => {
  setPassthrough(false);
  appWindow.setIgnoreCursorEvents(false);
};

const togglePassthrough = () =>
  setPassthrough((s) => {
    appWindow.setIgnoreCursorEvents(!s);
    return !s;
  });

export {
  passthrough,
  setPassthrough,
  enablePassthrough,
  disablePassthrough,
  togglePassthrough,
};
